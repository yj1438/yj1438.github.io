---
title: AI 视频流水线
pubDatetime: 2026-10-25T23:30:00+08:00
description: 一篇博客怎样变成一支视频？以鹈鹕与黑洞横评片为例，记录从改编文稿、分句配音、按声音排镜头，到 SVG 与 WebGL 素材编排、程序配乐和成片交付的完整过程。
featured: true
tags:
  - Codex
  - AI Agent
  - 视频工程
  - 工作流
---

最近，我把博客里的三篇文章做成了视频，发到了[我的 B 站](https://space.bilibili.com/269363886)。文稿和演示素材已经有了，但配音、画面编排、字幕、封面和导出，每次都要重新走一遍。于是，我把这些步骤整理成了一条由 Agent 驱动的本地流水线，叫 FrameCraft（帧匠）。

这篇就拿其中一支拆开讲：**一篇有文字、有 SVG、有 WebGL 演示的博客，怎样变成一支有旁白、字幕和配乐的视频。**

## 1. 先看成片

这支《GLM-5.3 在不同 Harness 下的表现》，改编自[同一模型、三个 harness 的横评文章](/posts/glm-53-flash-three-harnesses/)。三只骑车的鹈鹕、三套黑洞作品，本来就是文章里的演示素材。视频把它们重新编排成了约 92 秒、12 个镜头的横屏短片，输出规格是 1920×1080、24fps（每秒 24 帧）。

<iframe src="https://player.bilibili.com/player.html?bvid=BV1ednW6yEQ5&autoplay=0&danmaku=0" title="GLM-5.3 在不同 Harness 下的表现：成片" loading="lazy" scrolling="no" frameborder="no" allowfullscreen="true" class="bilibili-embed"></iframe>

这里面，Agent 负责改编文稿、编写场景代码和调用工具；我先审文稿与分镜，再看 Studio 预览、提出修改。声音合成、时间测量、字幕生成和视频导出，则交给脚本执行。

整个过程可以沿着一条线看：

```text
博客与原始演示 → 口语文稿与分镜 → 分句配音
                                    ↓
                              测量时长、安排镜头
                                    ↓
                          编排画面、字幕、配乐
                                    ↓
                           Studio 预览 → 渲染成片
```

## 2. 先把文章改成能听懂的文稿

文章可以停下来反复看，视频却要一边播放一边让人理解。直接把原文送去朗读，观众很可能还在读上一张图，旁白已经讲到下一段。

所以第一步是重新组织叙事。原文按两道任务逐项对比，视频先用作品制造悬念，再揭晓「同一个模型、三种应用」，最后回到我的个人选择。

开场的旁白是：

> 三只鹈鹕，三个黑洞。你猜，背后是不是三个模型？

这比先解释 harness 是什么，更容易带着观众往下看。后面的镜头围绕几件具体的事推进：看三只鸟交卷，放大眨眼、蹬腿和飘云，再从浅色骑行画面切入深色宇宙，最后投票、回到开场的鸟。

文稿与分镜先经过确认，我又提出「画面更充实」的要求，再进入第一版制作。**先决定这一段要讲什么、给观众看什么，再写场景代码。**

文字旁白保存在 `script.json`，分镜落实在 `scene.js`。这支片子最终有 12 句旁白，对应 12 个镜头。原文里的耗时和结论范围也一起保留：这是我当时两道题的试玩，不因为换成视频，就扩大成通用性能排名。

## 3. 先做声音，再决定镜头有多长

音画对齐是第一个关键技术点：**先合成每句旁白，测出实际长度，再安排字幕和镜头。**

旁白通过 edge-tts 做文本转语音（TTS），使用中文声音 `zh-CN-XiaoxiaoNeural`，语速设为 `-2%`。每句话单独生成 MP3，解码成统一采样率的音频，修剪首尾过长的静音，再计算有效时长。

但镜头长度也不能只等于说话长度。观众还得看清三份作品、计时数字和局部细节。工程里的排时逻辑可以概括为：

```text
镜头时长 = max(该镜头的最短展示时间,
               开场留白 + 实测旁白时长 + 收尾留白)
```

随后把时长向上对齐到视频帧。这样既不会为了凑固定秒数截断旁白，也能在讲完之后，给作品留一点观看时间。重新排好的旁白起止点写进 `timeline.json`，片内字幕和导出的 SRT 都从这份时间轴生成，减少手动对齐的工作。

### 改一句话，不必重新合成所有旁白

配音按句缓存，每句的签名包含**实际配音文字、声音、语速和音高**，同时用 SHA-256 内容指纹校验音频文件是否改变。改稿后只重新请求失效的句子，匹配的声音直接复用；时间轴、字幕和成片再按新输入重建。

已有匹配缓存时可以离线复现。离线模式碰到改稿或损坏的音频会明确报错，避免拿旧声音配新字幕。

当前的文稿格式还支持把显示文字 `text` 和配音读法 `say` 分开：字幕保留正确写法，读音另行调整。这对技术视频里的英文名称和数字尤其有用，不必为了修发音，把字幕也改成同音字。

## 4. 画面是怎样被编排出来的

这支视频的画面由 HTML、Canvas、SVG 和已有视频片段组合，整片使用 [HyperFrames](https://github.com/heygen-com/hyperframes) 编排与渲染。Agent 编写的是场景代码：作品放在哪里、什么时候放大、计时贴纸怎样出现、哪一刻切换背景，再由浏览器绘制、渲染器输出视频。

下面是最终 MP4 的 12 个镜头中点抽帧。从三只鸟到黑洞，再回到选票，同一份原始作品会用在全景、特写和对照画面中。

![鹈鹕与黑洞横评视频的十二个镜头中点抽帧](../../assets/images/framecraft-scene-midpoints.jpg)

### SVG 直接按时间播放，WebGL 先采集为片段

鹈鹕原稿是 SVG 矢量图，用 SMIL 描述动画，可以直接嵌入页面。工程先暂停它们的自主播放，再通过 `setCurrentTime(t)` 指定动画时间。眨眼、车轮和云仍然来自原作品，外层代码负责布局、裁切与放大。

黑洞原稿是运行在浏览器里的 WebGL 演示。这里先从三份原始 HTML 各采集一段 10 秒、1280×720、24fps 的本地 MP4，再放入整片时间轴。

采集时接管浏览器的逐帧回调 `requestAnimationFrame` 和计时接口 `performance.now()`，按固定的 `1/24` 秒推进模拟时间，每一步绘制后截图、交给 FFmpeg 编码。**即使某一帧计算得慢，也不会因为真实时间继续流逝，跳过中间的动画状态。**

片段准备好后，后续剪辑不必每次重新运行三套 WebGL。这里采集的是演示画面，视频中引用的任务耗时仍来自原文章，采集过程没有重新测性能。

### 整个画面由同一个时间点驱动

场景实现的核心是一种可以按时间寻址的写法。简化后是：

```javascript
function render(t) {
  const scene = locateScene(t);
  const localTime = t - scene.start;
  drawScene(scene, localTime);
  seekSvgAnimations(t);
  showCaptionAt(t);
}
```

这段代码只说明思路：给定时间 `t`，找到对应镜头，算出镜头内部时间，再绘制该时刻的状态。原生视频片段的取帧由渲染器按时间轴处理。

它不依赖「之前播放过哪些帧」来累加位置。Studio 跳到某一秒，或者导出时直接请求某一帧，都能从同一套输入计算画面。工程还做了一个实际检查：跳到某个镜头、跳走、再跳回来，比较两次截图的像素是否一致。

**旁白、字幕、SVG 和视频片段都跟随总时间轴，避免每种素材各跑一只时钟。** 字体也随工程保存，渲染前等待字体与资源就绪，减少预览和导出时的排版差异。

## 5. 配乐也跟着镜头走

这支片子的声音有三部分：TTS 旁白、程序配乐、少量拟音。它们单独制作，再进入总混音。

配乐由 `score.py` 用 NumPy 合成波形。骑车段用 104 BPM（每分钟 104 拍）的稀疏拨弦和轻打击音；进入黑洞段后，转成低音与缓慢变化的氛围声；开场、段落和收尾加了几声类似车铃的短音。音乐切换点直接读取镜头起点，所以改了旁白、重新排时之后，配乐也会跟着重建。

混音时降低配乐音量，并在约 1.8kHz 附近做衰减，为人声留出位置；最终导出再统一处理响度。声音是否清楚、笑点前后的停顿是否舒服，仍然要听实际成片。

这里使用的是程序合成配乐，没有外部音乐样本。旁白则需要在线 TTS，只有匹配的已缓存音频能离线复用。声音来源和制作方式在工程里分别记录。

## 6. 在 Studio 里看，再导出真正的成片

到这一步，先打开 Studio 预览，检查作品有没有被挡住、字幕能否读完、转场是否突兀，以及某个镜头有没有停得太久。这一轮反馈可能同时改文稿、分镜和声音，随后重新构建。

这次在本地工程中使用的命令是：

```powershell
# 已有匹配配音缓存时，离线构建并打开预览
npm run preview -- --video pelican-blackhole-review --offline

# 正式导出；修改了配音文字时，需要在线生成失效句子
npm run render -- --video pelican-blackhole-review --quality delivery

# 文案和双封面齐备后，整理交付文件
npm run package -- --video pelican-blackhole-review
```

正式导出会重新构建和检查页面，渲染 MP4，再用 FFmpeg 处理音频响度、用 ffprobe 核对画幅、帧率、音轨和时长，并做全片解码、生成抽帧图。新文件通过技术检查后，才替换上一个有效成片。

这是这支片子的实际 `qa/verification.json` 节选，记录了输出文件、实测时长和验收状态：

```json
{
  "output": "out/pelican-blackhole-review.mp4",
  "duration": 91.6,
  "fps": 24,
  "full_decode": "passed",
  "check": "passed",
  "human_listening": "not performed"
}
```

技术检查回答的是文件能否正常交付。画面叙事、发音和听感还需要人工验收。这支片子留有 Studio 用户反馈、最终抽帧和技术检查记录，尚未记录完整人工试听；这些状态分别保留，不把抽帧检查写成全片看过、听过。

最后还要准备标题、简介和两张封面。4:3 与 16:9 分别调整构图，检查缩小后的文字可读性，避免只把同一张图裁成两个比例。封面需要制作和审看，打包脚本只负责校验与整理。

Agent 可以提出文稿、分镜和封面方案，最终取舍由我审定。制作链结束在本地文件交付，B 站投稿不包含在 `render` 和 `package` 命令里。

最终交付是七个文件：**MP4、文稿 TXT、SRT 字幕、标题、简介、两张封面**。输入与输出的哈希另存为生产记录，方便之后确认这支视频用了哪版文稿和素材。

## 7. 这套做法，也用在另外两支片子里

**《tmux桥接Claude与Codex》**，改编自[tmux-agent 原理篇](/posts/tmux-agent-design/)。这支片子从 29 句技术旁白增补到 42 句，复用原来的 29 条配音，只合成新增的 13 条；代码展示段还单独保留了阅读时间。片中的终端交互是流程示意：

<iframe src="https://player.bilibili.com/player.html?bvid=BV1LXHT6iEEn&autoplay=0&danmaku=0" title="tmux 桥接 Claude 与 Codex：成片" loading="lazy" scrolling="no" frameborder="no" allowfullscreen="true" class="bilibili-embed"></iframe>

**《pbcopy 在 MacOS 下的复制问题》**，改编自[pbcopy 排查记](/posts/macos-pbcopy-utf8-pitfall/)：

<iframe src="https://player.bilibili.com/player.html?bvid=BV1sxJo6nEM3&autoplay=0&danmaku=0" title="pbcopy 在 macOS 下的复制问题：成片" loading="lazy" scrolling="no" frameborder="no" allowfullscreen="true" class="bilibili-embed"></iframe>

这些制作步骤已经整理进 [FrameCraft 开源仓库](https://github.com/yj1438/framecraft)，以 [Agent Skills](/posts/dual-marketplace-agent-skills/) 作为制作入口。Codex 和 ZCode 都参与过片子制作；换用其他支持 Skills 的 Agent 时，还需要准备项目要求的运行环境和工具。

## 8. 想自己做一支，先跑通模板

公开仓库提供框架与模板，不附带本文的个人视频工程。先准备 Git、Node.js 22+、uv、Python 3.12 和 FFmpeg/ffprobe，再创建自己的工程：

```powershell
git clone --branch main https://github.com/yj1438/framecraft.git
cd framecraft
npm ci
npm run setup
npm run new -- --video first-video --title "我的第一支视频" --no-narration
npm run render -- --video first-video --offline
```

这条路径先生成无旁白、带配乐的基础模板视频，输出到 `videos/first-video/out/first-video.mp4`，用于确认本机能完成渲染。之后再修改文稿和场景，按需开启旁白、联网合成声音；正式制作仍需设计画面并补齐发布素材。

基础渲染通过 npm 安装 HyperFrames，专项工具的源码子模块按需初始化。首次安装需要联网下载依赖与浏览器；`--offline` 只作用于后面的制作步骤。当前有完整出片记录的平台是 Windows，其他系统仍需实际验证；依赖与浏览器配置见[环境说明](https://github.com/yj1438/framecraft/blob/main/docs/ENVIRONMENT.md)。

对我来说，这条流水线省下的是反复配音、对字幕、合成与导出的操作。文章怎样改成能听懂的文稿、镜头该展示什么、哪里应该留白，仍然要在一次次预览里做决定。

<style>
  .bilibili-embed {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 9;
    border: 0;
    border-radius: 8px;
    margin: 0.5rem 0 1.5rem;
  }
</style>
