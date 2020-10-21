---
layout: post
title: 另辟蹊径优化 js：WebAssembly
published: ture
categories: 技术文章
tags: css
---

接上文[另辟蹊径优化 js：Worker]()，还是围绕前面一篇文章中提到 js 动画卡顿的问题。
我们再回顾一下这个例子：[js动画的卡顿](https://sergeche.github.io/gpu-article-assets/examples/js-vs-css.html)

至于背景原因和例子 demo 分析也在上一篇有大致的说明，这里不再重复。

上一篇中尝试的异步多线程方式，在 worker 通信的数据量不是很大的情况下，优化效果还是较理想的。
按上文提出的另一个角度：**加快 JS 的执行速度**，执行速度快了，独占线程耗时少，留给 GUI 线程充足的渲染时间，自然不会再有卡顿。

“加快 JS 的执行速度” JS 无法直接实现，可以借助“WebAssembly”的能力。

## 1. 背景

> 以下 `WebAssembly` 也称 `wa`

JS 执行慢是所有脚本语言的通病，运行过程中实时编译成机器码，再去执行，另外还有内存的动态规划等，这些过程都消耗了不少的硬件资源，相当于你是拿打折后的 CPU 和内存去运行 JS 程序，自然无法和编译型语言(如 C++/Object-C)在速度上相后并论，和产物是字节码的解释型语言(如 JAVA)也存在差距。这是 JS 先天体质问题。

然后 `WebAssembly` 就出生了，突破了语言边界，可以给予 JS 强力支撑。

从官方的长远目标([High-Level Goals](https://webassembly.org/docs/high-level-goals/))看 WebAssembly：

1. 定义一种可移植的、运行效高的二进制格式作为编译目标，通过利用各平台(包括移动平台和物联网平台)上的通用硬件功能直接执行；
2. 逐步实现和 [asmjs](http://asmjs.org/) 基本功能一致的最低可行产品(MVP)标准，主要针对 C/C++；其它特性关注线程、零成本异常、SIMD 等等，支持多语言；
3. 在现有的 web 平台上很好的执行和集成；
4. 支持非依赖浏览器的嵌入。

简单点说：

* wa 为 js 环境提供了直接调用(执行)字节码程序的能力，能够触达的领域更加广泛。
* wa 不仅是一项具体技术，更是一个技术标准，它约定了最后产出的字节码编码规范 --- wasm，对于生成这类字节码的语言不做限制。
* 这种字节码类似汇编语言的机器码，在 wa 引擎中可以直接执行，省去了翻译、编译等主要影响性能的过程，所以在性能上几乎等同于编译型语言，也有很好的平台通用性。

## 2. 能做什么

上面说有点虚，WebAssembly 具体能帮 JS 做什么，在这里大概说一下。

从目前狭义的使用看，实际就是一个 JS 和 C/C++ 互相调用的 Bridge 技术(不太严谨，姑且这么理解)，但是在执行环境上存在很大的差异，像 Web 页面中 JS 的 DOM/BOM 接口，WebAssembly 自然是没有的。但任何一个语言都共通的基础逻辑运算是可以相互调用的，这也是 WebAssembly 的强项。

(补充一张图)

聚焦到那个 `优化 js 动画` DEMO 上，就是借助 WebAssembly 优势将每一帧间的逻辑运算耗时减少到每帧间隔的范围内，也就达到了优化的目的。

## 3. Demo 设计

为了更场景化，突出 wa 的能力，不再使用之前的 Demo，假设以下场景：

“页面 canvas 需要实现一个大尺寸的帧动画，一共有 N 帧。还需求动画支持各种滤镜，用户可以选择自己喜欢的效果”。
(PS：这个需求笔者是真实遇到过😂，最后在稍差点的机器上，硬是把帧动画搞成了幻灯片，一直心怀怨念~)

具体逻辑大概如下：

```js
const N = 100; // 一共 100 帧
let i = 1;

const Fiilter = {
  grayScale(){...}, // 灰度图滤镜
  ...
};

function frameHandle() {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  img.onload = () => {
    const imgData = ctx.getImageData(0, 0, img.width, img.height);
    console.log(width + 'px * ' + height + 'px, 总共计算象素: ' + pixelData.length);
    console.time();
    const pixelData = imgData.data;
    Fiilter.grayScale(pixelData); // 实现一个最简单的灰度图滤镜的效果
    ctx.putImageData(imgData , 0 , 0 , 0 , 0 , width , height);
    console.timeEnd();
    i++;
    if (i <= N) {
      window.requestAnimationFrame(frameHandle); // 走下一帧
    }
  });
  img.src = './img_frame_' + i + '.png'; // 图片 img_frame_X.png
}

frameHandle();
```

实现起来并不复杂，但需求里有关键字“大尺寸”，当每一帧图片尺寸很大时，比如一张 4K 图 3840px * 2160px，总共计算象素 33177600，而且要对 RGBA 通道分开计算，就是 4*33177600 次基础运算。
这种高密度的逻辑运算耗时肯定远超一帧的时间，帧动画就变成了“幻灯片”。

```
3840px * 2160px, 总共计算象素: 33177600
default: 1094.31103515625ms // 一帧渲染时间
```

## 4. WebAssembly 优化成果

我们将`Fiilter.grayScale`的算法用 c/c++ 改写：

```js
void grayScale (unsigned char* data, int len) {
  for (int i = 0; i < len; i += 4) {
    int r = data[i];
    int g = data[i+1];
    int b = data[i+2];
    int a = data[i+3];
    data[i] = r;
    data[i+1] = r;
    data[i+2] = r;
    data[i+3] = a;
  }
}
```

经由 `emscripten` 编译成 `wasm` 文件，再用 JS 接口 `WebAssembly` 调用 `grayScale` 方法，完成滤镜的计算。

> (整个 asm 编译环境和工具使用，以及页面调用过程上手有些许复杂，这里主题篇幅有限，只给出结果，后面会补充完整的使用方法)

再来看结果：

```
3840px * 2160px, 总共计算象素: 33177600
default: 115.52880859375ms // 一帧渲染时间
```

直接提升了 10 倍有余....！

## 5. 性能对比

以上 demo 执行在 pc 端(2.2 GHz Intel Core i7)，因为编译后的机器码受硬件条件的影响较大，继续在多平台/设备上用以上 demo 进行测试。统计如下：

| 平台 | wasm | js | 性能提升 |
| --- | --- | --- | --- |
| pc chrome v69| 48ms | 1461ms | 30x |
| pc chrome v72| 125ms | 1280ms | 10x |
| android chrome v68 | 425ms | 7280ms | 17x |
| ios v11.4 | 190ms | 2350ms | 12x |

从以上实验结果可以直观的感受到 ws 性能的强大。受设备硬件条件影响明显，目测在性能越好的平台优势越大，充分利用了平台的硬件性能，包括内存存取和 CPU 运算上。（设备影响大，此数据不作为业务评估参考）

## 6. 适用场景

目前对于 web 应用来说，高密度的纯逻辑运算，是非常适合使用 ws 的。
高密度运算目前最适合的场景集中在多媒体处理方面，比如图像渲染、音频处理等。像非常流行的 html 3D 引擎库 `ThreeJS`、白鹭，在社区已经有人尝试进行 `WebAssembly` 化改造。

在 nodejs 环境中，也支持 WebAssembly 的调用。相比 web 应用，nodejs 应用的纯逻辑运算更多。可以帮助 nodejs 突破性能瓶颈、提高硬件利用率。

（To Be Continue)
