import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://yj1438.github.io",
    title: "Yinjie 的博客",
    description: "前端 / 工程化 / 随笔，记录与思考。",
    author: "Yinjie",
    profile: "https://github.com/yj1438",
    ogImage: "default-og.jpg",
    // Google Search Console 验证（HTML 文件 + meta 双保险）
    googleVerification: "google6bfff8cdc7cee6a4",
    lang: "zh",
    timezone: "Asia/Shanghai",
    dir: "ltr",
  },
  posts: {
    perPage: 8,
    perIndex: 4,
    scheduledPostMargin: 15 * 60 * 1000,
  },
  features: {
    lightAndDarkMode: true,
    dynamicOgImage: true,
    showArchives: true,
    showBackButton: true,
    editPost: {
      enabled: true,
      url: "https://github.com/yj1438/yj1438.github.io/edit/master/src/content/posts/",
    },
    search: "pagefind",
  },
  socials: [{ name: "github", url: "https://github.com/yj1438" }],
  shareLinks: [
    { name: "x", url: "https://x.com/intent/post?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "mail", url: "mailto:?subject=See%20this%20post&body=" },
  ],
});
