---
title: Agent Skills 双端发布实战
pubDatetime: 2026-09-28T00:00:00+08:00
description: 把同一份 SKILL.md 同时发布到 Claude Code 和 Codex 两个插件市场：一份内容、两份清单、两个 marketplace.json，不搞超集单文件。附模板仓库与四步上新流程。
featured: true
tags:
  - Claude Code
  - Codex
  - Agent Skills
  - 插件开发
---

用 Agent CLI 用到第三个星期，你就会发现一件事：**同样的指令在反复说**。「把这段内容整理成演示文稿」「把这个格式的文件转成那个格式」——每换一个会话就要重新教一遍。

这该沉淀成技能。于是我把自己常用的几个能力做成了插件，并且做了一个约束：**同一份内容，同时发布到 Claude Code 和 Codex 两个插件市场**。这就是 [yj-skills](https://github.com/yj1438/skills)。

## 1. Agent Skills 成了开放标准

这个约束在今天可行，是因为底座变了：Agent Skills 已经是开放标准（agentskills.io），核心就是「一个目录 + 一份 SKILL.md（前置元数据 + Markdown 正文）+ 随附脚本」。Claude Code 和 Codex 都原生支持这个格式——不是各自搞私有插件体系，而是共同读同一份 skill 内容。

这对独立开发者是个罕见的好局面：**写一次，两端可装**。要做的事只剩下处理「安装分发」这一层的差异。

## 2. 先砍后立

仓库的 git 历史值得先讲，因为演进方向可能和直觉相反：

```
b82c1a6  Initial commit
fd3f755  feat: add git-diff-to-master-analyzer skill
db739cb  feat: add multi-agent orchestrator skill and harness agents
f6768c2  feat: add bilibili-restore skill
c257643  feat: add html-slides skill
e11c659  chore: remove low-value skills and their harness agents   ← 砍
93c77a3  chore: remove harness skill (brittle scaffold, ...)      ← 再砍
8981620  feat: restructure as dual-target plugin marketplace       ← 重构
e5ed409  feat: add tmux-agent plugin (migrated from resession)     ← 迁入
```

中间有两个 remove 提交：早期堆的几个 skill——编排器、harness 脚手架之类——被我主动删了。砍的理由写在提交信息里：**brittle scaffold, redundant with native workflow**。原生工作流已经覆盖的东西，做成 skill 只会多一层脆皮。

留下的三个，都是「原生工作流没有、且我每周真在用」的：

| 插件 | 解决什么 |
| --- | --- |
| [bilibili-restore](https://github.com/yj1438/skills/tree/main/plugins/bilibili-restore) | B 站客户端离线缓存的 `video.m4s` + `audio.m4s` 无损合并为 MP4，支持归集与清单 |
| [html-slides](https://github.com/yj1438/skills/tree/main/plugins/html-slides) | 把 URL/文件/粘贴文本提炼成叙事弧线，渲染单文件 HTML 演示文稿 |
| [tmux-agent](https://github.com/yj1438/skills/tree/main/plugins/tmux-agent) | 通过 tmux 与本地 Claude Code / Codex 会话协作（原理见下篇） |

## 3. 设计决策：一份内容，两份清单

双端发布最容易想到的路线是把差异抹平成一个文件。我选了相反的路：

- **skill 内容只有一份**。`SKILL.md` + `scripts/` + `references/` 平铺在插件根目录，两个工具读同一份，没有副本、没有同步问题。
- **清单两份，各端读各的**。`.claude-plugin/plugin.json` 给 Claude Code，根目录 `plugin.json` 给 Codex，各约 15 行，字段几乎相同。
- **marketplace 两份，各自遵循本端规范**。Claude 官方格式放 `.claude-plugin/marketplace.json`，Codex 的 agent-plugins 格式放 `.agents/plugins/marketplace.json`。

为什么不做超集单文件？因为两份清单的差异小到不值得抽象，而合并意味着要赌两个解析器对未知字段的容忍度永远不变。**15 行的重复是便宜的，解析器兼容性赌博是贵的。**

对照一下两份 marketplace 里同一个插件条目：

```jsonc
// .claude-plugin/marketplace.json（Claude 官方格式）
{
  "name": "bilibili-restore",
  "source": "./plugins/bilibili-restore",
  "description": "还原 bilibili 客户端离线缓存视频为 MP4",
  "version": "1.0.0",
  "author": { "name": "yinjie", "url": "https://github.com/yj1438" },
  "category": "media",
  "keywords": ["bilibili", "video", "ffmpeg"]
}

// .agents/plugins/marketplace.json（agent-plugins 格式）
{
  "name": "bilibili-restore",
  "source": "./plugins/bilibili-restore",
  "category": "media",
  "policy": {
    "installation": "AVAILABLE",
    "authentication": "ON_INSTALL"
  }
}
```

差异一目了然：Claude 端要 `description`/`version`/`author`/`keywords` 这些展示元数据；Codex 端关心的则是 `policy`——安装策略和认证时机。各端读各的，互不将就。

插件级的两份清单同理：Claude 版多一个 `displayName`，Codex 版多一个 `$schema` 指向 [agent-plugins.org](https://agent-plugins.org) 的 schema，其余字段一字不差。

## 4. 仓库结构与上新流程

```
├── .claude-plugin/marketplace.json   # Claude 市场
├── .agents/plugins/marketplace.json  # Codex 市场
├── plugins/
│   ├── bilibili-restore/
│   │   ├── .claude-plugin/plugin.json
│   │   ├── plugin.json               # Codex 清单
│   │   ├── SKILL.md                  # ← 两端共享的唯一内容
│   │   └── scripts/
│   └── html-slides/ ...
└── template/                         # 完整插件模板（不进市场，复制用）
```

新增一个插件的完整流程，四步：

1. `cp -r template/ plugins/<你的插件名>/`
2. 按模板里的「复制后必改清单」改两份 `plugin.json` 和 skill 内容
3. 在两个 `marketplace.json` 里各加一条目
4. `claude plugin validate .` 验证

安装侧则是各一行命令：

```
# Claude Code
/plugin marketplace add yj1438/skills
/plugin install bilibili-restore@yj-skills

# Codex CLI
codex plugin marketplace add yj1438/skills
```

模板里除了 skill 骨架，还带了 `commands/`、`agents/`、`mcp.json` 的示例位——如果插件需要斜杠命令、子 agent 或 MCP 服务器，位置都留好了。

## 5. 验证状态与取舍

诚实交代：Claude Code 端 `claude plugin validate .` 通过，三个插件均已实测可用；Codex 端按 agent-plugins.org 规范与 OpenAI 官方文档编写，**CLI 实测还在待办上**。这也是选「两份清单、各守各的规范」路线的原因之一——某端没跟上时，另一端完全不受牵连，补测随时可以做。

这套结构的维护成本大概就是：每新增一个插件，多写 15 行 JSON。换来的是两端用户都能 `marketplace add` 一条命令装上。如果你的 skill 也想跨端分发，模板在 [github.com/yj1438/skills](https://github.com/yj1438/skills) 的 `template/` 里，复制就能用。

下一篇[《tmux 桥接本地 Claude Code/Codex 会话》](/posts/tmux-agent-design/)拆其中最复杂的插件：传输层为什么选 tmux，以及为什么整个脚本里到处都是 `refusing`。
