import { defineAstroPaperConfig } from "./src/types/config";

export default defineAstroPaperConfig({
  site: {
    url: "https://yj1438.github.io",
    title: "Yinjie 的博客",
    description: "前端 / 工程化 / 随笔，记录与思考。",
    author: "Yinjie",
    profile: "https://github.com/yj1438",
    ogImage: "default-og.jpg",
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
    // satori 生成动态 OG 图的默认字体不含中文字形，先关闭，后续可换字体再开
    dynamicOgImage: false,
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
