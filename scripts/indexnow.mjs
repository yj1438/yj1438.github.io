// IndexNow 提交：把站点 URL 推送给 Bing/Yandex/Seznam 等搜索引擎。
// key 文件由本脚本生成（public/{key}.txt），部署后可通过
// https://yj1438.github.io/{key}.txt 访问，即所有权证明。
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";

const HOST = "yj1438.github.io";
const KEY = "400bc9db52f78c6d4384077fad226c9b";

// 保证 key 文件存在（本地与 CI 均可运行）
const keyFile = `public/${KEY}.txt`;
if (!existsSync(keyFile)) writeFileSync(keyFile, KEY);

const posts = readdirSync("src/content/posts")
  .filter(f => /\.(md|mdx)$/.test(f))
  .map(f => `https://${HOST}/posts/${f.replace(/\.(md|mdx)$/, "")}/`);

const statics = ["", "posts/", "tags/", "archives/", "about/"].map(
  p => `https://${HOST}/${p}`
);

const urlList = [...statics, ...posts];
const res = await fetch("https://api.indexnow.org/IndexNow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: `https://${HOST}/${KEY}.txt`,
    urlList,
  }),
});
console.log(`IndexNow: ${res.status} ${urlList.length} urls`);
if (!res.ok) console.log(await res.text().catch(() => ""));
process.exit(res.ok || res.status === 202 || res.status === 200 ? 0 : 1);
