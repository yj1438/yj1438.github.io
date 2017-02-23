---
layout: post
title: js 异步代码同步化处理之 generator
---

# js 异步代码同步化处理之 generator

> generator 用来处理 JS 的异步已经不是什么新奇的事物了。但是我第一次认识的 generator 的时候是没有想到它会有这个功能。
> 我也查了一些资料，也都只是说 generator 只是一个循环（迭代）输出的语法，想必大家第一个想到的就是 **自增式ID生成器** 了，其它语言中也有这类语法。 
> 所以说语言只是人们表达自己逻辑、处理复杂问题的文字，具体能用它来干什么，那就看使用者了。

## generator 基础

本篇文章不再对 generator 的基础进行详细说明。它的基础知识也相对比较“单一”。提供一个 `mozila` 官方的链接，篇幅很短，认真看一下。

[https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Generator)

## 引深知识点

看完了上面的基础知识，在这里来检测一下你是否真正了解其着急知识点：

### 代码运行分隔

~~~javascript
function* eg1(a, b) {
	console.log(a + b);
	yield a + b;
	console.log(a * b);
	yield a + b;
	console.log(a - b);
	yield a + b;
};

var eg_1 = eg1(10, 2);
eg_1.next();
eg_1.next();
eg_1.next();
~~~

问: 以上代码会输出什么？如果你回答对了，再看下一题。

### yield 参数

~~~javascript
function* eg2(a, b) {
	console.log(a + b);
	var x = yield a + b;
	console.log(x);
	var y = yield a * b;
	console.log(y);
	var z = yield a - b;
};

var eg_2 = eg2(10, 2);
eg_2.next();
eg_2.next();
eg_2.next();
~~~

这个回答对了，那才是说明认真看过上面的基础知识了。如果弄错了，再回去看看基础。

### next() 参数传递

~~~javascript
function* eg2(a, b) {
	console.log(a + b);
	var x = yield a + b;
	console.log(x);
	var y = yield a * b;
	console.log(y);
	var z = yield a - b;
};

var eg_2 = eg2(10, 2);
eg_2.next(1);
eg_2.next(2);
eg_2.next(3);
~~~

这个问题体现了 generator 的基础特性，也是 generator 用来进行异步控制的基础。

### 特征点



