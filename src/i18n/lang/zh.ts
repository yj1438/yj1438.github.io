import type { UIStrings } from "../types";

export default {
  nav: {
    home: "首页",
    posts: "文章",
    tags: "标签",
    about: "关于",
    archives: "归档",
    search: "搜索",
  },
  post: {
    publishedAt: "发布于",
    updatedAt: "更新于",
    sharePostIntro: "分享这篇文章：",
    sharePostOn: "分享到 {{platform}}",
    sharePostViaEmail: "通过邮件分享",
    tagLabel: "标签",
    backToTop: "回到顶部",
    goBack: "返回",
    editPage: "编辑此页",
    previousPost: "上一篇",
    nextPost: "下一篇",
  },
  pagination: {
    prev: "上一页",
    next: "下一页",
    page: "第",
  },
  home: {
    socialLinks: "社交链接",
    featured: "精选",
    recentPosts: "最新文章",
    allPosts: "全部文章",
  },
  footer: {
    copyright: "版权",
    allRightsReserved: "保留所有权利。",
  },
  pages: {
    tagTitle: "标签",
    tagDesc: "标签「{{tag}}」下的全部文章。",

    tagsTitle: "标签",
    tagsDesc: "按标签浏览全部文章：Claude Code、Rust、Tauri、终端、AI Agent 等主题。",

    postsTitle: "文章",
    postsDesc: "全部文章列表：前端、工程化、AI Agent、Rust、桌面开发的技术实践与踩坑记录。",

    archivesTitle: "归档",
    archivesDesc: "全部文章的时间线归档，按年份浏览所有发布过的内容。",

    searchTitle: "搜索",
    searchDesc: "搜索任意文章……",
  },
  a11y: {
    skipToContent: "跳到内容",
    openMenu: "打开菜单",
    closeMenu: "关闭菜单",
    toggleTheme: "切换主题",
    searchPlaceholder: "搜索文章…",
    noResults: "没有找到结果",
    goToPreviousPage: "上一页",
    goToNextPage: "下一页",
  },
  notFound: {
    title: "404 Not Found",
    message: "页面不存在",
    goHome: "回到首页",
  },
} satisfies UIStrings;
