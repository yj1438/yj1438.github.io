---
title: Claude Code「内置工具全部消失」排查记：ENABLE_TOOL_SEARCH 与第三方网关的坑
pubDatetime: 2026-10-07T00:00:00+08:00
description: '~/.claude/settings.json 一行 "ENABLE_TOOL_SEARCH": "true"，叠加 ANTHROPIC_BASE_URL 指向第三方网关，导致 Bash/Read/Write 等内置工具全部静默消失。官方本为第三方端点做了自动关闭的安全回退，显式 true 等于亲手拆掉保护。附完整排查路径与取值速查表。'
featured: true
tags:
  - Claude Code
  - GLM
  - 踩坑
  - 排查
---

> 记录时间：2026-09-30 ｜ 环境：macOS + Claude Code（CodeFuse 托管版 2.1.258）+ 智谱 GLM 网关

**TL;DR**：`~/.claude/settings.json` 里一行 `"ENABLE_TOOL_SEARCH": "true"`，叠加 `ANTHROPIC_BASE_URL` 指向第三方网关（智谱 GLM），导致会话中 Bash、Read、Write 等内置工具全部消失。删除该变量即恢复，无需重开会话。官方本来针对第三方端点做了**自动关闭 tool search 的安全回退**，显式 `true` 会把它覆盖掉——等于亲手拆掉保护。

## 一、问题表现

### 1.1 现象概述

1. 系统提示中只有 ToolSearch 一个检索工具 + 各 MCP 服务器的工具，没有任何内置工具（正常应同时存在 Bash/Read/Write/Edit/Glob/Grep 等）；
2. 用 ToolSearch 检索任何与本地命令/文件相关的关键词，全部返回 `No matching deferred tools found`——不是"没搜到"，是延迟工具池里**真的没有**；
3. MCP 工具本身正常在列；
4. 模型完全无法执行本地命令，只能引导用户用 `!` 前缀手动跑命令。

### 1.2 问题现场实录

**现场 1：ToolSearch 连续 4 次检索全部落空**

```text
ToolSearch("^(Bash|Read|Write|Edit)$")
→ No matching deferred tools found. Note: these configured MCP servers
  failed to connect, so their tools are unavailable for this session: ...

ToolSearch("shell|command|execute|terminal")
→ No matching deferred tools found. ...

ToolSearch("bash|file|write|read|edit|uv|install")
→ No matching deferred tools found. ...

ToolSearch("fetch|web|http|url")
→ No matching deferred tools found. ...
```

连 bash、file、fetch 这类高频词都搜不到，说明核心工具根本不在延迟工具池里——排除"检索词不巧"的可能。

**现场 2：会话工具清单形态异常**

延迟工具池里只有 CronCreate / TaskCreate / WebFetch / WebSearch / EnterWorktree 等外围工具和大量 MCP 工具，核心六件套（Bash/Read/Write/Edit/Glob/Grep）整体缺席。作为对照，延迟列表里那些外围工具通过 ToolSearch 一次就能搜到并加载成功——**机制本身在工作，只是核心工具没进池子**。

**现场 3：模型行为退化**

模型被迫在回复中输出"这个会话里我没有可用的 shell/文件工具"，并让用户以 `!` 前缀代跑命令、再把输出贴回来。整个会话退化成"人肉 shell 中转"。

## 二、排查过程和结论

### 2.1 排查思路

按「启动参数 → 用户/项目 settings → 企业 managed settings → 接入层」逐层排除，核心问题是回答："工具是被谁、在哪一层拿掉的？"

### 2.2 排除项（现场记录）

**排查 1：启动参数是否裁剪了工具？——排除**

```text
$ ps aux | grep -iE "claude" | grep -v grep
yinjie  82447  ... /Users/yinjie/.codefuse/fuse/engine/bin/claude/2.1.258/claude
yinjie  61255  ... claude --permission-mode bypassPermissions --session-id ...
yinjie  97322  ... /Users/yinjie/.local/bin/claude --permission-mode bypassPermissions ...
yinjie  24999  ... claude --settings {"env":{"ANTHROPIC_BASE_URL":"http://127.0.0.1:9877", ...}}
```

发现两类事实：① 机器上官方 CLI 与 CodeFuse 托管二进制混用；② 所有会话都没有 `--disallowedTools` 之类的裁剪参数。一度怀疑是托管版裁剪了工具——后来证明**与二进制无关**。

**排查 2：各级 settings 是否 deny 了工具？——排除**

- 项目级 `.claude/settings.json` / `settings.local.json`：空；
- 企业级 `/Library/Application Support/ClaudeCode/managed-settings.json`：只有公司安全监控的 hooks，只监控、不裁剪；
- 用户级 `~/.claude/settings.json`：无 `permissions.deny`、无 `disallowedTools`——但 env 里发现了一个可疑开关（见下）。

### 2.3 锁定根因（现场）

用户级 settings.json 的关键片段：

```jsonc
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://open.bigmodel.cn/api/anthropic",   // 智谱 GLM 的 Anthropic 兼容网关
    "ANTHROPIC_MODEL": "glm-5.3-flash[1M]",
    "ENABLE_TOOL_SEARCH": "true",          // ← 根因就是这一行
  },
  "permissions": { "defaultMode": "auto" }
}
```

`ENABLE_TOOL_SEARCH=true` 的效果（工具全部延迟化、只剩 ToolSearch）与本会话形态完全吻合，且**删除后立即恢复**，因果关系闭环。

### 2.4 根因分析（附官方文档依据）

**① Tool Search 机制本身**（[MCP 官方文档](https://code.claude.com/docs/en/mcp#scale-with-mcp-tool-search)）：

> Tool search keeps MCP context usage low by deferring tool definitions until Claude needs them. Only tool names and server instructions load at session start...

工具定义不再常驻上下文，只保留名称摘要，模型需要时通过 ToolSearch 按需装回。省 token，但依赖 API 层的 tool_reference blocks 支持。

**② 官方对第三方网关有安全回退，`true` 会覆盖它**（同文档 [Configure tool search](https://code.claude.com/docs/en/mcp#configure-tool-search)）：

> Tool search is enabled by default: MCP tools are deferred and discovered on demand. Claude Code disables it when `ANTHROPIC_BASE_URL` points to a non-first-party host, since most proxies don't forward tool_reference blocks. Set `ENABLE_TOOL_SEARCH` explicitly to override that fallback.

翻译：检测到第三方端点时，Claude Code 本来会自动关闭 tool search 自保；显式写 `true` 就是亲手关掉这个保护。

**③ 模型兼容性有硬性要求**（同文档）：

> Tool search requires a model that supports tool_reference blocks: Claude Sonnet 4.5, Claude Haiku 4.5, Claude Opus 4.5, and later models.

GLM 系列不在支持列表（完整表见 API 文档 [Tool search tool 的 Model compatibility](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool#model-compatibility)）。官方取值表对 `true` 的描述也直接点名后果：

> true: All MCP tools deferred... Claude Code sends the beta header through proxies, and requests fail on proxies that don't support tool_reference blocks.

**④ 为什么是"静默消失"而非报错**：defer_loading / tool_reference 需要网关和模型双方配合。GLM 网关按 Anthropic 协议格式收请求，但不处理这些扩展字段——延迟化的工具定义既无法按需装回，ToolSearch 的检索结果也落不了地，于是核心工具无声蒸发。（"网关具体如何吞掉延迟定义"无官方逐字说明，此为基于官方文档的推断，但 CHANGELOG 修复史可作佐证。）

### 2.5 官方 CHANGELOG 佐证：这是高发坑区

摘自 [anthropics/claude-code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)：

| 版本 | 条目 |
|---|---|
| v2.1.7 | MCP tool search auto 模式默认开启（工具描述超上下文 10% 时自动延迟化，改用 MCPSearch） |
| v2.1.9 | 新增 auto:N 阈值语法 |
| v2.1.50 | 修复：tool search 开启时命令行传入 prompt 导致 MCP 工具发现不了 |
| v2.1.70 | 修复：`ANTHROPIC_BASE_URL` 接第三方网关时 API 400——tool search 现在会正确检测代理并禁用 tool_reference blocks；修复 ToolSearch 调用后模型空响应 |
| v2.1.72 | 修复：只要设置了 `ENABLE_TOOL_SEARCH`，即使走 `ANTHROPIC_BASE_URL` 也会激活 tool search（显式配置可强行穿透网关保护） |
| v2.1.119 | Vertex AI 上默认关闭 tool search，需 `ENABLE_TOOL_SEARCH` 显式开启 |
| v2.1.271 | 修复：裸名搜 MCP 工具搜不到；修复提示词在 ToolSearch 不可用时仍引导模型调用它 |
| v2.1.281 | 修复：代理/网关后 MCP 断连导致 prompt cache 丢失 |

**v2.1.70 / v2.1.72 正是「显式 true + 第三方网关」组合的坑源**。

### 2.6 结论

根因：`ENABLE_TOOL_SEARCH=true` 强制在智谱 GLM 网关上开启 tool search，覆盖了官方"检测到第三方端点自动关闭"的安全回退；GLM 网关/模型不支持 tool_reference blocks，延迟化的工具定义无法装回，导致内置核心工具全部静默消失。**与 Claude Code 二进制（官方/托管版）无关，与权限配置无关。**

## 三、修复

### 3.1 修复步骤（现场）

```bash
# 备份后删除该环境变量
cp ~/.claude/settings.json ~/.claude/settings.json.bak
python3 -c "import json,os; p=os.path.expanduser('~/.claude/settings.json'); d=json.load(open(p)); print('removed:', d['env'].pop('ENABLE_TOOL_SEARCH', None)); json.dump(d, open(p,'w'), ensure_ascii=False, indent=2)"
```

执行输出：

```text
removed: true
```

### 3.2 修复验证（现场）

删除后**不重开会话**，直接让模型执行本地命令：

```text
Bash: pwd
→ /Users/yinjie/Documents/git-workspace/temp    ✅
```

工具全部恢复，问题闭环。若个别环境删除后未立即生效，重开会话即可（工具清单在会话启动时装配）。

### 3.3 如果确实需要 Tool Search

1. 走官方 API 直连（不做 `BASE_URL` 替换）；
2. 或改用阈值模式 `auto` / `auto:N`（如 `auto:5`），并确认网关与模型都支持 tool_reference；
3. 兜底开关：`CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS=1` 可强制关闭 tool search，且优先级高于 `ENABLE_TOOL_SEARCH`（见 [LLM gateway 文档](https://code.claude.com/docs/en/llm-gateway)）。

### 3.4 ENABLE_TOOL_SEARCH 取值速查（译自官方）

| 值 | 行为 |
|---|---|
| （不设置） | MCP 工具全部延迟加载；检测到第三方端点等场景**自动回退**为全量加载 |
| `true` | 强制延迟加载；beta header 会穿过代理，不支持 tool_reference 的代理上会出问题 |
| `auto` | 阈值模式：工具定义 < 上下文窗口 10% 时全量加载，超过则全部延迟 |
| `auto:N` | 自定义阈值百分比（0-100），如 `auto:5` |
| `false` | 全量加载，不延迟 |

### 3.5 经验教训

1. 官方为第三方网关做的安全回退**不是 bug，是保护**——别用显式 `true` 覆盖它；
2. **实验性开关 × 非官方模型网关 = 高危组合**，故障形态是"静默降级"而非报错，极难察觉；
3. 排查心法：先搞清"工具从哪来"（常驻 vs 延迟加载），再逐层排除——启动参数 → 用户/项目 settings → 企业 managed settings → 接入层（网关/二进制）；
4. `settings.json` 的 env 里藏着大量行为开关，工具异常时**优先检查**；
5. **CHANGELOG 是排查 Claude Code 玄学问题的第一手资料**——v2.1.70/72 两条记录直接对上了本案。

## 参考

- Claude Code 文档：[Scale with MCP tool search](https://code.claude.com/docs/en/mcp#scale-with-mcp-tool-search) / [Configure tool search](https://code.claude.com/docs/en/mcp#configure-tool-search)
- API 文档：[Tool search tool](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool)（模型兼容表、defer_loading、原理）
- LLM gateway 文档：[beta 字段配对与 CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS](https://code.claude.com/docs/en/llm-gateway)
- [Claude Code CHANGELOG](https://github.com/anthropics/claude-code/blob/main/CHANGELOG.md)
