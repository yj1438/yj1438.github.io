---
layout: post
title: WebAssembly 浅度介绍 --- 实践篇:C
published: false
categories: 技术文章
tags: WebAssembly
---

C/C++ 是官方唯一推荐的开发 wasm 语言，在语言特性上也最接近 wasm，也要成熟的编译体系，是目前的最优选择。

但除基础使用外，文档和参考实例很少，实用中也存在的一些问题和坑点，在下文中会说明：

从 C 源码，到在页面中使用，主要包括以下过程：

1. 编译，每种语言都有自己的一套编译环境和工具，将源码编译成字节码文件；
2. 胶水 js 代码，通过它来帮助控制 wasm 在 js 环境中运行所必要的环境支持、内存控制、方法传递等，这个不必需的，除非你对 wasm 内容控制比较熟悉；
2. [JS API](https://webassembly.org/getting-started/js-api/)，通过此 jsapi，可以直接引用 wasm Module，调用其中的方法。

<img src="/img/wa/img2.jpg" style="width: 200px;"/>

## 编写 C 程序

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

> 这里需要着重说一下“简单”的地方：
> 1. 是一个纯函数；
> 2. 输入和输出就是基本 int 类型；
> 对于不满足以上两点的方法，在调用上存在较大的差异，在最后会有介绍。

## 编译

C/C++ to wasm 编译工具: emscripten。

本地[安装编译环境](https://kripken.github.io/emscripten-site/docs/getting_started/downloads.html)。使用 `emcc` 工具对上面写的 main.cpp 文件进行编译：

```bash
$ CPP_FUNCS="['add']"
$ emcc ./main.cpp -o ./main_c.js -s WASM=1 \
  -s EXPORTED_FUNCTIONS="$CPP_FUNCS"
```

执行成功后，会生成一个 `main_c.wasm` 文件和 `main_c.js` 胶水文件。

> 这里需要注意，wasm 是编译后的产物，编译时的参数会直接影响结果，尤其重要，以上示例的参数不是一定的。emcc 参数繁多，针对特定的源码模块和使用场景都不一样，所以在使用之前一定即时查阅，这里就不再多说。

## JSAPI 调用

加载 wasm 模块主要通过两个 JSAPI: 

* `wa.instantiate(binary, deps)`：
  * `binary` wasm 文件的二进制码，可以通过读取文件的 arrayBuffer 获取；
* `wa.instantiateStreaming(response, deps)`
  * `response` http response 对象，可以通过 fetch 接口获取，注意拉取的 wasm `Content-Type` 必须是 `application/wasm`，否则浏览器会直接拦截；

返回标准 Promise 实例，resolve 一个 wasm module。

以 instantiateStreaming 为例：

```js
wa.instantiateStreaming(fetch("../out/main_c.wasm"), {})
  .then(res => {
    const asmModule = res.instance.exports;
    // 使用 add 方法
    const val = asmModule.add(19, 23);
    console.log(val);
  }))
  .catch(err => {});
```

## 非基本类型数据传递

以上例子给出了 wasm 从生成到使用的过程，但并不完整，对于参数类型是结构体、(数组)指针的情况，情况就变的比较复杂了。

### 示例代码

```c
#include <stdio.h>

extern "C" {
  void everyAddOne (unsigned char* data, len) {
    for (int i = 0; i < len; i++) {
      int r = data[i];
      data[i] = r + 1;
    }
  }
}
```

### 编译

```bash
$ CPP_FUNCS="['everyAddOne']"
$ emcc ./assembly/main.cpp -o ./out/web_c.js -lm -O2 \
  -s WASM=1 \
  -s BINARYEN_TRAP_MODE='allow' \
  -s EXPORTED_FUNCTIONS="$CPP_FUNCS" \
  -s ALLOW_MEMORY_GROWTH=1 \
```

> 注意这里和之前和相比有参数的不同。

### 胶水代码

在上面的编译过程中，产物中除了 `main_c.wasm`，还有一个 `main_c.js`，其中包含了 js 环境调用 wasm 的胶水代码。
为什么要用胶水代码？

虽然 js 已经有 api 可以直接调用 wasm，但奈何 wasm 和 js 的体质相差太大，一个是很原始的二进制码，一个是明文的脚本，互相调用上存在不少的差异需要抹平，主要表现在内存控制上。

js 没有能力去控制内存，是运行环境(如 V8 引擎)去管理。但 C/C++ 的内存管理需要去手动控制，包括申请、使用、释放等。还要支持与 js 的相互调用时两者的共享内存。

被编译的 wasm 模块，对外暴露的不仅仅是你编写 `add` 方法，还包括一些如 _malloc、_memcpy、_free 基础内存控制方法。什么时候会用到这些方法？举个例子：

在 js 中我们使用 Object、Array 等构造对象，可以很方便进行数据的读写操作，但是在如 C 的 low-level 语言中，只有基本类型可以直接操作，其它的高级类型因为是地址引用，无法直接操作，是通过指针(内存地址)操作。因为有这个差异，我们在 js 和 wasm 的相互调用中，对于引用类型的参数，不能直接使用，需要通过内存进行存取。

这是一个比较繁杂的事，而且很容易出错，还好 emscripten 已经在编译产出中提供了一个胶水 js 代码，里面包含内存存取的 js 方法。

以后续的文章中，会对胶水文件逻辑做详细分析，熟悉后可以自己编写胶水 js 代码。

### 通过胶水 js 调用

emcc 生成的胶水文件已经包含 wasm module 调用部分，我们可以省去上面给出的 WebAssembly.instantiate 手动调用过程，只需直接引入 `main_c.js`即可。也支持通过全局变量 `Module` 预先装载配置：

```js
var Module = {
  postRun: function () {
    console.log('wasm init success');
    console.log(window.Module);
  },
  print: window.console.log,
  printErr: window.console.error
};
// 可以完全通过 js 控制加载顺序
const script = document.createElement('script');
script.src = '/js/web_c.js';
document.body.appendChild(script);
```

加载成功，可以看到控制台输入的信息：

(图)

在 `Module` 的一大堆属性/方法中，我们可以看到 `_everyAddOne` 方法，这就是我们在 C 文件中写的 `everyAddOne` 方法，只是被加上了一个 `_`。


