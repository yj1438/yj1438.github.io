---
layout: post
title: WebAssembly 浅度介绍 --- 基础介绍
published: false
categories: 技术文章
tags: WebAssembly
---

# WebAssembly 浅度介绍

<img src="/img/wa/img0.jpg" style="width: 200px;"/>

## 一. 背景

> web 技术又来搞事情了~

近些年来 web 搞的风生水起，不断“突破”自己，衍生出的技术在服务端、桌面端、移动端开发中都有涉足。随着一些大大小小的成果产出，受到了一定的认可。

但随着业务、环境复杂度不断增长，软件系统在广度和深度上都异常庞大，js 语言本身存在的一些缺陷也越发突显，比如：

1. 性能较差，这里有两方面原因：
   * 动态脚本型语言的体质问题，(性能：编译型语言 >> 解释型语言 > 脚本型语言，有兴趣自查，这里不再赘述)；
   * 执行环境，单线程和 loop event 机制，在密集逻辑运行中会有一定的瓶颈。
2. 平台支持能力，虽然 js 在各端都的体现，但都运行在浏览器或浏览器引擎上，对系统底层的涉及还是空白，而且 js 语言本身的兼容性问题严重，依赖源不稳定，也多平台支持的阻碍。

WebAssembly 的出现就是为了解决以上问题，突破语言边界，在实际应用、技术框架上都给予了强力又灵活的支撑。

从官方的长远目标([High-Level Goals](https://webassembly.org/docs/high-level-goals/))看，它可以：

1. 定义一种可移植的、运行效高的二进制格式作为编译目标，通过利用各平台(包括移动平台和物联网平台)上的通用硬件功能直接执行；
2. 逐步实现和 [asmjs](http://asmjs.org/) 基本功能一致的最低可行产品(MVP)标准，主要针对 C/C++；其它特性关注线程、零成本异常、SIMD 等等，支持多语言；
3. 在现有的 web 平台上很好的执行和集成；
4. 支持非依赖浏览器的嵌入；
5. 做一个伟大的平台。

简单点说：

* wa 为 js 环境提供了直接调用(执行)字节码程序的能力，能够触达的领域更加广泛。
* wa 不仅是一项具体技术，更是一个技术标准，它约定了最后产出的字节码编码规范 --- wasm，对于生成这类字节码的语言不做限制。
* 这种字节码类似汇编语言的机器码，在 wa 引擎中可以直接执行，省去了翻译、编译等主要影响性能的过程，所以在性能上几乎等同于编译型语言，也有很好的平台通用性。

## 二. wasm 在目前能做什么

看了上面官方的 High-Level Goals，有点高远，还是有点不大明白。在实际的 web 前端业务中，它有什么优势呢。

首页我们要转变一下思维。

在 web 端，我们写 js 主要只有一个目的：实现页面功能。说白了就是不管 js 写的多复杂，最终也要反应在页面 dom 上。这是 web 端 js 的使命，也是浏览器环境赋予它的能力。

wasm 虽然也是在浏览器环境中执行，但没有任何 DOM 控制能力，BOM 就更别提了，当然它的能力体现也不在这里。

wasm 作为一种底层码，运行效率和底层支持是优势，从目前的应用场景来看主要有两个：

1. 作为纯逻辑运算库，和很多 c/c++ 用来作底层库的目的一样，凭借其最接近机器码的体质，有着超快的运行效率，对于逻辑运算，是不二选择;
2. 在 web 端运行客户端程序，这算是官方的一个大目标，目前也能看到极少的测试案例，随着 wasm 的不断完善，应该不久就能看到成熟应用。

本文只围绕 wasm 作为逻辑运算的情况进行介绍，这也是目前的主要应用场景。

要扬长避短，和任何一个系统的划分思路一样，抽象出**纯逻辑实现**模块和**页面业务控制**，逻辑运算部分交给 wasm，页面功能还是 js。
借助 wasm 的优势对 js 业务进行优化。

## 三. 性能对比

性能是 wa 目前最大的优势，这也引起不少人的好奇心，下面通过一个笔者的 demo 具体看一下。

### demo 设计

demo 要突出 wasm 在逻辑运算上的优势，也要保证最终成果是落在 web 页面上：图片滤镜处理的场景非常适合。

选一张尺寸足够大的图片，对超高的分辨率的每个像素点进行计算可以放大两者间的差距。最终将计算结果在页面里通过 canvas 写入图片中。

* 图片尺寸：3840 * 2160，共用 8294400 个像素点；
* 滤镜算法：灰度滤镜(不存在运算，只有内存赋值)，卡通画滤镜(运算复杂度 3n)；
* 直接修改像素列表元素值，不产生新的列表(内存))。

#### 灰度

| 平台|wasm|js|性能提升|
| - | - | - | - |
| pc chrome v72| 125ms | 1280ms | 10x |
| android chrome v68 | 275ms | 7195ms | 26x |
| ios v11.4 | 158ms | 2320ms | 14.68x |

#### 卡通画

| 平台|wasm|js|性能提升|
| - | - | - | - |
| pc chrome v69| 48ms | 1461ms | 30x |
| pc chrome v72| 125ms | 1280ms | 10x |
| android chrome v68 | 425ms | 7280ms | 17x |
| ios v11.4 | 190ms | 2350ms | 12x |

### 结论

如上数据统计，wa 的性能因根本体质的改变，在运行效率上有非常大的提升。
在性能越好的平台优势越大，充分利用了平台的硬件性能，包括内存存取和逻辑运算上。

> 完整 demo 代码会在最后给出。

## 四. 语言支持

上面有提到，wasm 实际是一套编译后字节码标准，具体编写的语言不限，目前除了官方主推的 C/C++ 语言外，Rust、Kotlin、go、Assemblyscript 都可以开发 wasm。

笔者试用过 C/C++、Kotlin 和 Assemblyscript，各有优劣：
1. [C/C++ 体系](https://webassembly.org/getting-started/developers-guide/)更加成熟完善些，是目前编写 wasm 最优的方式；
2. [Kotlin](https://kotlinlang.org/docs/reference/js-overview.html) 的语法和体系都很像 JAVA，也比较成熟，JAVA 开发者首选；
3. [Assemblyscript](https://github.com/AssemblyScript/assemblyscript) 出现的比较晚，语法上采用 TypeScript，前端同学学习成本较低，而且可以搭配前端构建环境使用，但在编译和数据传递上存在问题。

一段 C++ 编译后 wasm 反编译代码示例：

```js
int factorial(int n) {
  if (n == 0)
    return 1;
  else
    return n * factorial(n-1);
}
```

```
// 这里的代码不是 wasm 文件内容，是反编译成 wast 的内容
get_local 0
i64.const 0
i64.eq
if i64
    i64.const 1
else
    get_local 0
    get_local 0
    i64.const 1
    i64.sub
    call 0
    i64.mul
end
```

看起来也很像汇编，下一篇中，以 C、Assemblyscript 两种语言为例，具体介绍一下 wa 的实现，和其中的不少问题。

（完）













语法编写上不再介绍，从源码的编写，到最后使用在浏览器中，需要进行以下的过程：

1. 编译，每种语言都有自己的一套编译环境和工具，将源码编译成字节码文件；
2. 胶水 js 代码，通过它来帮助控制 wasm 在 js 环境中运行所必要的环境支持、内存控制、方法传递等，这个不必需的，除非你对 wasm 内容控制比较熟悉；
2. [JS API](https://webassembly.org/getting-started/js-api/)，通过此 jsapi，可以直接引用 wasm Module，调用其中的方法。

<img src="/img/wa/img2.jpg" style="width: 200px;"/>

下面用 C 和 Assemblyscript 两种语言实际体验一下 WebAssembly 的编写和编译过程

## 五. C 编写 WebAssembly 

以一个最简单的加法方法为例，编写 main.cpp 文件：

```C
#include <stdio.h>

extern "C" {
  int add (int x, int y) {
    int res = x + y;
    return res;
  }
}
```

### 编译

目前 C/C++ 配套的编译工具是 emscripten，在本地[安装编译环境](https://kripken.github.io/emscripten-site/docs/getting_started/downloads.html)后。使用其中的 `emcc` 工具对上面编写的 main.cpp 文件进行编译：

```bash
$ CPP_FUNCS="['add']"
$ emcc ./main.cpp -o ./main_c.js -s WASM=1 \
  -s EXPORTED_FUNCTIONS="$CPP_FUNCS"
```

执行成功后，就会生成一个 `main_c.wasm` 文件和 `main_c.js` 脱水文件。

> 这里需要注意的是，wasm 是编译后的产生，编译时的参数会直接影响结果，尤其重要，以上示例的参数不是一定的，而且 emcc 的参数繁多，针对特定的源码模块和使用场景都不一样，所以在使用之前一定即时查阅，这里就不再多说。

### 胶水 js 代码

先说一下为什么要用胶水代码。

虽然 js 已经有 api 可以直接调用 wasm，但奈何 wasm 和 js 的体质相差太大，一个是很原始的二进制码，一个是明文的脚本，互相调用上存在不少的差异需要抹平，主要表现在内存控制上。

js 没有能力去控制内存，是运行环境(如 V8 引擎)去管理。但 C/C++ 的内存管理需要去手动控制，包括申请、使用、释放等。还要支持与 js 的相互调用就需要两者的共享内存。

被编译的 wasm 模块，对外暴露的不仅仅是你编写 `add` 方法，还包括一些如 _malloc、_memcpy、_free 基础内存控制方法。什么时候会用到这些方法呢？举个例子：

在 js 中我们使用 object 等构造对象，可以很方便进行数据的读写操作，但是在如 C 的 low-level 语言中，只有基本类型可以直接操作，其它的高级类型因为是地址引用，无法直接操作，是通过指针(内存地址)操作。因为有这个差异，我们在 js 和 wasm 的相互调用中，对于引用类型的参数，不能直接使用，需要通过内存进行存取。

这是一个比较繁杂的事，而且很容易出错，还好 emscripten 已经在编译产出中提供了一个胶水 js 代码，里面包含内存存取的 js 方法，具体的使用在下文中会介绍。

### 页面中使用

#### JSAPI

加载 wasm 模块主要通过两个 JSAPI: 

* `wa.instantiate(binary, deps)`：
  * `binary` wasm 文件的二进制码，可以通过读取文件的 arrayBuffer 获取；
* `wa.instantiateStreaming(response, deps)`
  * `response` http response 对象，可以通过 fetch 接口获取，注意拉取的 wasm `Content-Type` 必须是 `application/wasm`，否则浏览器会直接拦截；

返回标准 Promise 实例，resolve 一个 wasm module。

#### 简单调用 wasm

以 instantiateStreaming 为例：

```js
wa.instantiateStreaming(fetch("../out/main.wasm"), deps)
  .then(res => {
    const asmModule = res.instance.exports;
    // 使用 add 方法
    const val = asmModule.add(19, 23);
    console.log(val);
  }))
  .catch(err => {});
```
#### 引用类型

示例中的 `add (a: int, b: int): int` 传参和返回都是基本类型，如换成


(未完待续)
























### 在页面中执行
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WebAssembly/Table
### wasm 调用 js

### js 调用 wasm

## Assemblyscript 编写 WebAssembly

### 结合 webpack

两种方式

## 哪些 web 场景适用


就目前来看，简单说，wa 算是一个 Bridge 技术。

当然，wa 虽好，也是有自己的规范和限制，主要是在各自的运行环境和语言特性上，在语言实现和功能上还是有一定的差异，这个概念在 wasm 模块的划分和整体设计上非常重要，扬长避短、充分发挥自己领域特长才是每一个 Bridge 要解决的重心。

## 使用

在 非 js 环境、node、webworker 中都可以使用

...

## 性能对比

## 目前的问题

1. wa 相关文档非常少，没有成熟案例参考，不好排坑；
2. 上手难度较大，除编写 wasm 语言语法外，还要了解底层内存控制、相互调用地址计算等；
3. 兼容性问题，




