# yj1438.github.io

个人博客，基于 [Astro](https://astro.build) + [AstroPaper](https://github.com/satnaing/astro-paper) 主题，push 到 master 后由 GitHub Actions 自动构建并发布到 GitHub Pages。

## 常用命令

```bash
npm install        # 安装依赖
npm run dev        # 本地开发 http://localhost:4321
npm run build      # 构建到 dist/
npm run preview    # 预览构建产物
```

## 写文章

在 `src/content/posts/` 下新建 Markdown 文件：

```yaml
---
title: 文章标题
pubDatetime: 2026-09-23T12:00:00+08:00
description: 摘要
tags:
  - 前端
---
```

push 到 master 即自动发布。

## 历史

- 2015–2018：Jekyll 旧站，60 篇文章归档在 `archive-2015-2018` 分支。
- 2026-09：基于 Astro 重建。
