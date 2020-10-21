---
layout: post
title: 另辟蹊径优化 js：Worker
published: ture
categories: 技术文章
tags: css
---

在之前的一篇文章中提到 js 动画一个弊端：**js 逻辑可能会阻碍 js 动画的流畅性**。
我们再来回顾一下这个典型的例子：[js动画的卡顿](https://sergeche.github.io/gpu-article-assets/examples/js-vs-css.html)

## 1. 背景原因

先来看看浏览器的基本构成，以 chrome(webkit) 为例，其它浏览器大同小异：

!(浏览器)[https://oalipay-dl-django.alicdn.com/rest/1.0/image?fileIds=hysfceyWRRyS-LxCvmx5NAAAACMAAQED]

其中，负责渲染界面的 `GUI` 和负责 JS 解释和运行的 `V8` 引擎，虽然在不同的线上运行的，但是两者不能并行，导致整体上呈现一种“单线程”的状态。

在 js 的表现上，`requestAnimationFrame` 的存在也是为了浏览器在下次重绘之前调用指定的方法，将执行结果(也就是界面的变更内容)与每帧的渲染时机对齐。也使得渲染线程和 JS 线程能良好的交错执行。

![](https://dev.opera.com/articles/better-performance-with-requestanimationframe/figure2.png)

但是一个逻辑块在执行时占用的时间如果过长，也就是大于传统60帧/秒的标准下，两帧间的时间间隔大约是16.7ms的时间。`GUI` 就无法及时插入运行，更新界面，导致视觉上的丢帧卡顿。

对于这种问题的处理，除了在开发过程中去对照 `Performance` 面板比对帧的生成时间，在业务逻辑层面进行调整，目前还没有一个系统性的解决方法。

### 1.1 Demo 分析

以上 Demo 的主要逻辑部分：

```js
/**
 * 动画控制部分
 */
var start = Date.now();
var duration = 5000; // 动画的持续时间
var animLoop = function() {
  // 计算出元素每一帧的运动位置
  // ....将元素移到这一帧的位置
  if (Date.now() > start <= 5000) {
    // 执行下一帧的计算
    requestAnimationFrame(animLoop);
  }
}
// 开始动画
requestAnimationFrame(animLoop);


// 模拟一个持续执行一段时间的方法
var heavyJS = function (duration) {
  console.log('>>>>>>开始工作');
  var start = Date.now();
  setTimeout(function() {
    while (true) {
      if (Date.now() - start >= duration) {
        console.log('累死我了');
        break;
      }
    }
  }, 1);
}
// 两块重逻辑阻塞线程
setTimeout(function() {
  heavyJS(1000);
}, 1000);
setTimeout(function() {
  heavyJS(1000);
}, 3500);
```

在第 1000ms 和 3500ms 时间点，开始了两段长达 1s 的 JS “重”逻辑执行，期间会中断 `requestAnimationFrame`，导致明显的丢帧。

要解决以上问题，目前看只能从两个角度出发： 

1. 减少 js 逻辑块的执行时间，某是拆成几个异步过程后与 `requestAnimationFrame` 分批对齐执行；
2. 让 JS 执行与 GUI 渲染彻底异步多线程。

方法 1 在具体操作上不具有通用性，要针对业务逻辑进行细致优化，不过这几乎是实践中解决这类问题的唯一方法。

方法 2 在浏览器的机制上是不成立的，直到 WebWorker 的产生。

## 2. Worker 多线程的尝试

WebWorker 是彻底脱离浏览器页面环境运行的，自身没有 GUI 线程，也不会占用任何一个页面的 JS 线程。
这样在运行上就能达到真正的多线程。按此思路，我们来对以上的例子进行改造。

### 2.1 建造一个 Worker

`index.html` 逻辑部分：

```js
/**
 * >>> 动画控制部分还是和 demo 保持一致
 */
// var animLoop = ...
requestAnimationFrame(animLoop);
// <<< 此部分和 demo 一致

const worker = new Worker("./work.js");
worker.onmessage = function (e) {
  if (e.data.action === 'heavyJs_end') {
    console.log('累死我了');
  }
};

var postHeavyJS = function (duration) {
  console.log('>>>>>>开始工作');
  worker.postMessage({action: 'heavyJs', duration});
}

// 两块重逻辑阻塞线程
setTimeout(function() {
  postHeavyJS(1000);
}, 1000);
setTimeout(function() {
  postHeavyJS(1000);
}, 3500);
```

`worker.js` 逻辑部分，将原 demo 中“重”逻辑的转移到这里：

```js
// 模拟一个持续执行一段时间的方法
var heavyJS = function (duration) {
  var start = Date.now();
  while (true) {
    if (Date.now() - start >= duration) {
      break;
    }
  }
}

self.onmessage = function(e) {
  console.time();
  if (e.data.action === 'heavyJs') {
    heavyJS(e.data.duration || 1000);
    postMessage({action: 'heavyJs_end'});
  }
  console.timeEnd();
};
```

我们再来执行一下这个改造后的 demo，是不是又变的如丝般顺滑了，heavyJS 的逻辑也没减少。

### 2.2 多线程通信在时间上的损耗

demo2 在表现上看是非常符合预期的，不过就能表明这是一个完美的方案吗？

从原理上分析，利用 worker 来进行逻辑运算可能会在以下两方面会有多余的消耗：

* 真的多线程，与页面线程进行线程间的通信，会消耗时间；
* 执行环境与页面线程彻底隔离，数据通信是通过“副本”的形式进行传递，数据复制也会带来时间和内存上的消耗。
  
对以上两点，我们再通过 demo 进行实验。

#### 2.2.1 通信时间

我们将 `worker.js` 中逻辑运行部分去掉：

```js
self.onmessage = function(e) {
  console.time();
  if (e.data.action === 'heavyJs') {
    // heavyJS(e.data.duration || 1000);
    postMessage({action: 'heavyJs_end'});
  }
  console.timeEnd(); // 计时1
};
```

在 `index.html` 对应的地方增加计时点：

```js
worker.onmessage = function (e) {
  if (e.data.action === 'heavyJs_end') {
    console.timeEnd(); // 计时2
  }
};

var postHeavyJS = function (duration) {
  console.time();
  worker.postMessage({action: 'heavyJs', duration});
}
```

其中

* `计时1` 是 worker 中实际逻辑执行的时间；
* `计时2` 是从页面发出执行的指令，到最后接收到执行完毕的时间；

`计时2 = 计时1 + 线程间的通信时间(包含一来一回)`

在 pc 上实际测试：

```js
// 第一次
>>>>>>开始工作
计时1: 0.074951171875ms
计时2: 0.56787109375ms
<<<<<<累死我了
// 第二次
>>>>>>开始工作
计时1: 0.085205078125ms
计时2: 0.26806640625ms
<<<<<<累死我了
```

从结果上看，线程间的通信时间虽然每次差距较大，但也都没有超过 1ms，在实际业务中的影响可以忽略。

#### 2.2.1 数据复制

上面的 demo 中，与 worker 来回传递的都只是一个 string 的简单类型数据，在数据复制上和给一个变量赋值是一样的，并不存在“副本”传递的消耗。我们在 demo 时理加点料。

```js
self.onmessage = function(e) {
  console.time();
  if (e.data.action === 'heavyJs') {
    // heavyJS(e.data.duration || 1000);
    const datas = e.data.datas.map(d => d++);
    postMessage({action: 'heavyJs_end', datas});
  }
  console.timeEnd(); // 计时1
};
```

在 `index.html` 对应的地方增加计时点：

```js
worker.onmessage = function (e) {
  if (e.data.action === 'heavyJs_end') {
    console.log(e.data.datas);
    console.timeEnd(); // 计时2
  }
};

var postHeavyJS = function (duration) {
  console.time();
  const datas = [1,2,3,4,5,.....,10000]; // 10000 个结点数组
  worker.postMessage({action: 'heavyJs', duration, datas: datas});
}
```

此时在再看，`计时2` 比 `计时1` 明显**多了 7ms ** 左右，这个时间在逻辑执行上已经算非常长，在某些场景上会影响到页面体验，如果存在数据上前后依赖，就更需要谨慎对待了。

> 笔者在后续又模拟了一个在页面 canvas 绘制图像的场景，在 750 * 1344 标准页面下，把渲染逻辑全部移到 `Worker` 中去执行，再将结果以 `imgData` 的形式传回页面中，此时在传输上的消耗已经明显超过1帧(16ms)，甚至接近2帧的时间，不再适用此场景。  
> 硬件条件:
> MacBook Pro
> CPU：2.2 GHz Intel Core i7
> 内存：1600 MHz DDR3

## 结论

`Worker` 的使用上要注意“扬长避短”，充分利用**真•多线程**的优势，将一些被弱依赖的、允许异步返回的数据用 Worker 执行。也要注意尽量避开较大的非基本类型数据传输所带来的不必要的消耗。

总之就是，引用一个广告词： `worker 虽好，可不能贪杯哦~~~`。

## To Be Continue

在第1节最后，提到两个解决问题的角度，方法1 `减少 js 逻辑块的执行时间` 似乎也找到了具有一定通用性的途径，下一篇中进行尝试。
