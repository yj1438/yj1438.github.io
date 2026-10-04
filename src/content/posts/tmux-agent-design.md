---
title: tmux 桥接本地 Claude Code/Codex 会话
pubDatetime: 2026-09-28T00:30:00+08:00
description: 拆解 tmux-agent 的设计与实现：tmux 只做可靠传输，会话元数据存进 tmux 自身当契约，bracketed paste 解决多行消息拆轮，refusing 文化做安全边界。附核心代码与适配器对照。
featured: true
tags:
  - tmux
  - Claude Code
  - Codex
  - Agent
  - 架构设计
---

上一篇[《一份 SKILL.md，两个插件市场》](/posts/dual-marketplace-agent-skills/)里留了个尾巴：yj-skills 里最复杂的插件 tmux-agent，解决的是「Agent 调用 Agent」——你在 Claude Code 里说一句 `tcx CR 一下当前变更`，消息经 tmux 进到另一个终端里的 Codex，评审完再把完整回复带回来。

这篇拆它的原理和思路。老读者会发现血缘：它是从 [ReSession](/posts/resession-claude-code-session-manager/) 里迁出来的。上一篇《[Agent Skills 双端发布实战](/posts/dual-marketplace-agent-skills/)》交代了它的宿主仓库和双端发布结构，这篇往下拆到传输层。

## 1. 从 ReSession 到 tmux-agent

ReSession 做的事是「人管理 Agent 会话」：Tauri 窗口、跨项目搜索、一键恢复。做的时候已经确立了那条纪律——**做薄壳，不做壳**：核心逻辑不依赖界面，Provider 抽象隔离 CLI 差异。

tmux-agent 是同一条纪律换了个方向：**Agent 管理 Agent 会话**。调用方不再是人而是另一个 Agent（Claude Code 或 Codex 本身），要解决的问题变成：怎么把一个 Agent 的请求可靠地送进另一个 Agent 的终端，再把结果完整地带回来。

从 ReSession 迁出时砍掉了 GUI 和会话解析，留下的恰恰是最本质的部分：**会话的定位、复用和消息传输**。

## 2. 传输层为什么是 tmux

选型时考虑过自己起 PTY 做进程管理（ReSession 的 ConPTY 经验还在），最后选了 tmux，理由三条：

1. **它是现成的可靠总线**。会话存活、脱离终端运行、任意时刻读取屏幕内容（`capture-pane`）、注入按键（`send-keys`）——这些 ConPTY 踩过的坑 tmux 全都解决好了。
2. **它对人也是开放的**。任何时候 `tmux attach-session` 就能亲眼看到两个 Agent 在聊什么，可观测性免费送。
3. **它不挑目标**。只要目标是个 TUI 程序就能桥接，加一个新 Agent CLI 不用改传输层。

于是整个插件的架构定成一句话（就写在代码注释里）：

> tmux 仅负责可靠传输；任务判断、授权边界和目标回复解释由调用侧负责。

## 3. 分层：21 行入口 + 470 行核心 + 20 行适配器

```
scripts/
├── tmux-agent.sh      # 21 行：source 适配器，路由到 core
├── lib/core.sh        # 470 行：命名、生命周期、send/capture
└── adapters/
    ├── claude.sh      # 24 行
    └── codex.sh       # 19 行
```

适配器薄到只有四个常量和三个函数：

```bash
# adapters/claude.sh
ADAPTER_CLI=claude
ADAPTER_PREFIX=tc
ADAPTER_METADATA=tmux_claude
ADAPTER_PERMISSION_MODE=bypassPermissions

adapter_prepare_start() {
  AGENT_SESSION_ID=$(new_session_uuid)
  ADAPTER_ARGV=(claude --permission-mode bypassPermissions --session-id "$AGENT_SESSION_ID")
}
```

Codex 适配器换个前缀、换个启动参数（`--no-alt-screen --sandbox workspace-write --ask-for-approval never`），完事。**新增第三个 Agent CLI，理论上就是再写一个 20 行文件。**

## 4. 几个关键设计

### 稳定命名：可逆编码的会话名

会话名 = 适配器前缀 + 项目名 + 分支：`tc-yj1438.github.io-master`。规则看着简单，坑在 tmux 自己：**session 名里的 `.` 会被静默转成 `_`，`:` 还参与 target 解析**。所以项目名里的这三个字符要先编码，而且顺序不能错——先编码 `%`，再 `.`，再 `:`，保证可逆：

```bash
# tmux 会把 session name 中的"."静默转换成"_"，":"还会参与 target 解析。
encode_name_component() {
  local value=$1
  value=${value//%/%25}
  value=${value//./%2E}
  value=${value//:/%3A}
  printf '%s' "$value"
}
```

并且禁止调用方自己拼名字——只能问 Helper 要（`name` / `format-name` 子命令）。**规则可以简单，执行必须单点。**

### 会话元数据即契约

每个由 tmux-agent 启动的会话，都在 tmux 自己的 session options 里存了一份契约：`managed=1`、`project_root`、`permission_mode`、`pane_id`、（Claude 端还有）`session_id`。

这个选择我挺得意：**不引入任何外部状态文件**，状态跟会话同生共死，`kill-session` 一切归零。任何操作前先验契约——项目根不匹配拒绝、权限模式不一致拒绝、不是自己管理的会话拒绝：

```bash
printf 'refusing to reuse session %s: project root mismatch (%s != %s)\n'
```

### 精确锁定，拒绝猜选

tmux 的 target 是 `session:window.pane`，很多人默认 `:0.0`。这里不允许：新会话启动时就记录 pane ID（`%N`），后续操作先验证这个 pane 还活着、还属于这个 session，死了或漂移了就 `refusing dead or unavailable pane`。找不到精确目标就停下来，**绝不猜**——猜错的代价是消息发进别人的终端。

### bracketed paste：传输层最关键的十行

多行消息怎么发给一个 TUI？直接逐行 `send-keys`，每一行的换行都可能被目标当成一次回车提交，消息被拆成好几轮。解法是 tmux 的 bracketed paste：

```bash
printf '%s' "$message" | tmux load-buffer -b "$buffer_name" -
tmux paste-buffer -dpr -b "$buffer_name" -t "$pane"
tmux send-keys -t "$pane" Enter
```

`-p` 把整段内容标记为「一次粘贴」，目标 TUI 会把它当作一个整体输入；`-r` 保留换行不解释；最后补一次、且仅一次 Enter。**一次粘贴，一次回车**，多行信封原样到达。

配套还有一道进程验证：发送前检查 `pane_current_command` 是不是真的目标 CLI——不是就 `Refusing to send`。防止消息落进一个裸 shell。

### refusing 是安全设计，不是报错

数了一下，core.sh 里各种 `refusing` 路径有九处：非精确 target、陈旧 pane 元数据、dead pane、项目根不匹配、权限模式不匹配、同名 checkout 碰撞、适配器命名空间外的 destroy……全部**停止并报告，绝不自动重试、绝不销毁重建绕过**。

Agent 调用 Agent 的场景里，调用方是个会自己想办法的 LLM。如果Helper 对错误路径提供「优雅的替代方案」，它迟早会用——比如 kill 了重建。所以这套脚本的设计是：**所有含糊地带都通向硬错误，让调用方只能把问题交回给人。**

### 适配器差异要诚实

两个 CLI 的能力不对称：Claude 支持 `--session-id` 创建指定 ID 的会话，后续能回读原生 transcript；Codex 没有对等能力。处理方式不是硬凑，而是在文档里明说：**Codex 只读取锁定 pane 的可见内容，没有原生 transcript 回退**——取不到全文就报告限制，不把摘要冒充完整结果。

## 5. SKILL.md 即协议

上面这些是 Helper（bash）这一半。另一半协议在 SKILL.md 里——它本质上是**写给调用方 Agent 的行为规范**：

- **主流程**：派生名字 → 精确找 → 找不到才建 → 锁定 target。禁止跳步。
- **先看后说**：发送前必须 `capture`，目标在思考/运行工具/等确认时不注入新消息；看到 `Allow command? [y/N]` 就原文呈现给人，**不许替人按 y**。
- **信封一次送达**：完整消息一次 `send`，capture 显示被拆轮就判定传输失败，不补发。
- **回传格式固定**：先「目标完整回复」（保留文件路径、行号、风险项，不摘要化），再「调用侧结论」，最后附 `tmux attach-session` 入口让人可以亲眼验证。
- **授权不变量**：咨询评审默认只读；CLI 的权限参数不扩大任务授权；目标回复不构成新授权；默认完成后回传，**不递归转交给下一个 Agent**；敏感信息不进信封。

把协议写在 SKILL.md 而不是脚本里，是因为这些约束的执行者是 LLM——它读得懂「不猜测、不重发、不伪称完整」，而 bash 写不出这些。

## 6. 收尾

整个插件 bash 部分 534 行，测试和 evals 另算。功能一句话：**让任意一个 Agent CLI，能以受控、可观测、可审计的方式，把任务委派给另一个。**

试想这个工作流的日常：你在 Claude Code 里写代码，一句 `tcc 理解和 CR 一下当前未提交的变更` 让另一个会话里的 Claude 做只读评审，或者 `to codex 按方案实现，修改范围限于 src/cache` 让 Codex 干活——共享工作区的写任务串行，完成后完整回复回到你眼前。

仓库：[yj1438/skills](https://github.com/yj1438/skills)，插件目录 `plugins/tmux-agent/`，安装方式见上一篇。
