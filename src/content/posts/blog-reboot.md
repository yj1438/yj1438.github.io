---
title: 博客重启：从 Jekyll 到 Astro
pubDatetime: 2026-09-23T00:00:00+08:00
description: 停更快十年，把博客推倒重建。旧文归档，新篇从这里开始。
tags:
  - 随笔
---

停更快十年，博客重启了。

上一次更新还停在 2018 年 9 月，那时在写 WebAssembly 和渲染优化。这十年间技术换了好几茬，博客一直躺在 GitHub Pages 上吃灰。与其让 60 篇旧文继续挂着，不如推倒重来。

于是有了这次重建：

- **旧文下线归档**：2015–2018 年的 60 篇文章全部移到仓库的 `archive-2015-2018` 分支，不再对外展示，但随时可以找回。
- **框架换代**：从手写的 Jekyll 主题换到 [Astro](https://astro.build) + [AstroPaper](https://github.com/satnaing/astro-paper)，暗色模式、全文搜索、标签、归档、RSS 都开箱即用。
- **写作流程不变**：本质还是往目录里丢 Markdown，push 即发布。

以后写什么？大概率还是前端与工程化，加上最近在折腾的东西。频率不保证，但这次先把摊子支起来。

> 旧文传送门：`git clone` 本仓库后 `git checkout archive-2015-2018`，`_posts/` 目录里都在。
