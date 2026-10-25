import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://yj1438.github.io",
    title: "Yinjie 的博客",
    description: "记录 AI Coding 的实践与思考：Agent CLI、工具链与工作流。",
    author: "Yinjie",
    profile: "https://github.com/yj1438",
    ogImage: "default-og.jpg",
    // Google Search Console 验证（HTML 文件 + meta 双保险）
    googleVerification: "bm2-E96Z7TCGi4hubaC2jgtVCo1-BzgO0oftZ3lZT3k",
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
      url: "https://github.com/yj1438/yj1438.github.io/edit/master/",
    },
    search: "pagefind",
  },
  socials: [
    { name: "github", url: "https://github.com/yj1438" },
    {
      name: "bilibili",
      url: "https://space.bilibili.com/269363886",
      linkTitle: "Yinjie 的哔哩哔哩主页",
    },
  ],
  shareLinks: [
    { name: "x", url: "https://x.com/intent/post?url=" },
    { name: "telegram", url: "https://t.me/share/url?url=" },
    { name: "mail", url: "mailto:?subject=See%20this%20post&body=" },
  ],
});
