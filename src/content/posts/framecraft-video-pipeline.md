---
title: 用 Agent 造了一条视频流水线，把博客文章拍成了片子
pubDatetime: 2026-10-25T23:30:00+08:00
description: FrameCraft：一个由 Agent 驱动的本地视频制作库，制作入口是标准 Agent Skills，任何支持 SKILL.md 的 agent CLI 都能开这条流水线。从需求到成片、双封面与字幕七件套，六上游引擎以 submodule 集成，三支片子已发到 B 站。
featured: true
tags:
  - Codex
  - AI Agent
  - 视频工程
  - 工作流
---

博客写了十篇，注意力经济里图文终究打不过视频。但手搓剪辑这件事我一直没开始——直到某天意识到：**我在干的活本质是「把想法变成结构化交付物」，这恰恰是 Agent 擅长的**。于是让 Agent 自己搭一条流水线——当时在岗的是 Codex。一个多月迭代下来，它叫 FrameCraft（帧匠），三支片子已经发在[我的 B 站](https://space.bilibili.com/269363886)。

这篇文章讲它怎么搭的、片子怎么出的、以及哪些地方我刻意让它保持克制。

## 1. 它是什么

一句话：**描述需求，选择工具，编辑独立工程，在 Studio 预览，再检查与出片**。不是「输入一句话自动出片」的魔法，而是一条本地视频生产流水线，Codex 负责理解内容和选择工具，Python 负责生产编排，上游引擎提供画面能力。

架构分四层：

| 位置 | 职责 |
| --- | --- |
| `.agents/skills/framecraft-video/` | 制作入口 skill：理解需求、按需读上游 skill |
| `src/framecraft/` | 生产编排：工程发现、环境、声音、检查、渲染、交付 |
| `toolkits/` | 六个上游引擎，全部以 Git submodule 集成 |
| `videos/<id>/` | 独立视频工程：输入、素材、成片、QA 证据 |

六个上游里当前真正扛起整片渲染的是 [HyperFrames](https://github.com/scarsty/hyperframes)（HTML→帧→视频），其余引擎提供专项能力。**四套尚未通过完整出片验证的工具，不会因为注册成了 submodule 就自动拥有适配器**——注册和验证是两回事。

还要澄清一件事：这套流水线**不绑定 Codex**。制作入口不是私有协议，而是一份标准的 Agent Skills——[SKILL.md](/posts/dual-marketplace-agent-skills/)，仓库根部的 AGENTS.md 则自称「agent 在本仓库工作的运行逻辑总纲」。也就是说，任何支持 Agent Skills 的 CLI——Codex、Claude Code、ZCode——都能读着这份说明书开进流水线。日常生产放在 codex/personal 分支上，只是因为眼下在岗的是 Codex；换一个 agent 接手，读的是同一份文档、跑的是同一条检查链。

## 2. 一支片子的完整旅程

以最新一支为例，从想法到 B 站投稿：

1. `npm run new` 建工程，brief 自动归档到工程 docs
2. 写文稿（script.json：旁白 + 声音参数）
3. 旁白用 edge-tts 生成并**按句子签名缓存**——改稿后只有失效的句子需要重新合成，其余离线复现
4. 配乐不用外部素材：`score.py` 先按实际语音长度排时，再加留白，程序化生成本地配乐和拟音
5. 场景代码（scene.js）设计分镜，构建出单页 HTML 时间轴
6. `check` → 技术检查；`preview` → 打开 Studio 人工审看
7. `render --quality delivery` → 构建、检查、渲染、**响度处理、全片解码、抽帧**，新成片通过全部检查才替换旧文件
8. 制作标题、简介、4:3 与 16:9 双封面
9. `package` → out 整理为七个交付文件：成片、文稿、字幕、标题、简介、双封面；哈希存进 qa/delivery.json

这条流水线里我最看重的是**生成分层的纪律**：script/spec/code 是输入，timeline/index 是派生物，out 是交付，qa 是证据。改稿只改输入，派生物由构建重新生成——渲染后绝不手改中间产物，否则生产记录就失真了。

## 3. 三支片子

三支都取材自本博客的前几篇文章——内容先成文、再成片，这篇文章再回头看流水线本身，飞轮正好转一圈。

**《GLM-5.3 在不同 Harness 下的表现》**，对应[横评文](/posts/glm-53-flash-three-harnesses/)。91.5 秒、12 个微镜头：从三只骑车的鹈鹕切到三套黑洞作品，再回到选票。黑洞动态画面是用采集脚本从本地 HTML 里抓的——固定 rAF 步长、隐藏 FPS 诊断层，采集方法与源文件哈希都记录在案，**采集不等于重跑性能横评**，片中耗时仍引用原文。

<iframe src="//player.bilibili.com/player.html?bvid=BV1ednW6yEQ5&autoplay=0&danmaku=0" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" class="bilibili-embed"></iframe>

**《tmux桥接Claude与Codex》**，对应[tmux-agent 原理篇](/posts/tmux-agent-design/)：

<iframe src="//player.bilibili.com/player.html?bvid=BV1LXHT6iEEn&autoplay=0&danmaku=0" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" class="bilibili-embed"></iframe>

**《pbcopy 在 MacOS 下的复制问题》**，对应[pbcopy 排查记](/posts/macos-pbcopy-utf8-pitfall/)：

<iframe src="//player.bilibili.com/player.html?bvid=BV1sxJo6nEM3&autoplay=0&danmaku=0" scrolling="no" border="0" frameborder="no" framespacing="0" allowfullscreen="true" class="bilibili-embed"></iframe>

<style>
  .bilibili-embed { width: 100%; aspect-ratio: 16 / 9; border-radius: 8px; margin: 0.5rem 0 1.5rem; }
</style>

## 4. 几处克制的工程决定

这个项目让我满意的不是能出片，而是 Agent 在我反复纠偏后沉淀下来的几条判断，都写进了固化文档：

- **成片原子替换**。新 MP4 通过全部技术检查后才替换旧文件；检查失败时，上一个有效成片原样保留。渲染永远不会让交付状态比之前更差。
- **人工验收是独立维度**。技术检查通过 ≠ 看过 ≠ 听过。全片人工观看与试听的结果分别作为数据证据记入 qa/，没看过的项目老老实实标「待确认」，不标记为通过。
- **模板不是完整艺术片引擎**。原生模板只提供可运行的起点（可变句数、横竖画幅），正式画面的审美仍然来自工程自身的场景设计——文档里明说，防止未来误用。
- **来源隔离**。三支片子的原始素材（博客原文、demo 文件）按字节原样存进 assets，来源与哈希记录在 sources.json。视频里引用的数据不越过原稿的结论边界——横评片的验收边界一节专门写了「基于作者 9 月的两题试玩，不是新的通用性能排名」。

工程本身也有一层仓库纪律：公开框架在 main 维护，个人作品在独立分支的 worktree 里生产；通用增量经审查后 `cherry-pick -x` 回 main，再跑 `framework:check` 对基线验收。框架是框架，作品是作品。

## 5. 收尾

现在的工作流已经长这样：博客文章定稿 → FrameCraft 建工程出片 → Studio 审看 → B 站投稿 → 文章和视频互相引用。首页的小电视图标就是入口。

流水线还在迭代（渲染器的多引擎适配、竖屏模板、更多专项工具的验证），但核心判断已经立住：**视频制作里真正重复劳动的部分——合成、检查、封装、封面、字幕——全部值得交给流水线；创意和验收始终留在人这边。**

仓库开源在 [github.com/yj1438/frame-craft](https://github.com/yj1438/frame-craft)，上游引擎清单见 toolkits 注册表。下一支片子的选题已经在排了。
