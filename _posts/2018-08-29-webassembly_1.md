---
layout: post
title: WebAssembly 浅度介绍
published: false
categories: 技术文章
tags: WebAssembly
---

# WebAssembly 浅度介绍

<img src="/img/wa/img0.jpg" style="width: 200px;"/>

## 背景

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

## wasm 在目前能做什么

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

## 语言支持

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

语法编写上不再介绍，从源码的编写，到最后使用在浏览器中，需要进行以下的过程：

1. 编译，每种语言都有自己的一套编译环境和工具，将源码编译成字节码文件；
2. 胶水 js 代码，通过它来帮助控制 wasm 在 js 环境中运行所必要的环境支持、内存控制、方法传递等；
2. [JS API](https://webassembly.org/getting-started/js-api/)，通过此 jsapi，可以直接引用 wasm Module，调用其中的方法。

<img src="/img/wa/img2.jpg" style="width: 200px;"/>

下面用 C 和 Assemblyscript 两种语言实际体验一下 WebAssembly 的编写和编译过程

## C 编写 WebAssembly 

以一个最简单的加法方法为例，编写 main.cpp 文件：

```c
int add (int x, int y) {
   int res = x + y;
   return res;
}
```

### 编译

[安装emscripten](https://kripken.github.io/emscripten-site/docs/getting_started/downloads.html)。

成功安装后，主要使用其中的 `emcc` 工具对上面编写的 main.cpp 文件进行编译：

```bash
$ CPP_FUNCS="['add']"
$ emcc ./main.cpp -o ./main_c.js -s WASM=1 \
  -s EXPORTED_FUNCTIONS="$CPP_FUNCS"
```

执行成功后，就会生成一个 `main_c.wasm` 文件和 `main_c.js` 脱水文件。

### 胶水 js 文件

### 在页面中执行

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






