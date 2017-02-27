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

看完了上面的基础知识，在这里来检测一下你是否真正了解到关键知识点：

### 代码运行分隔

~~~javascript
function* eg1(a) {
	console.log(a + 1);
	yield a + 1;
	console.log(a + 2);
	yield a + 2;
	console.log(a + 3);
	yield a + 3;
};

var eg_1 = eg1(10);
eg_1.next();
eg_1.next();
eg_1.next();
~~~

问: 以上代码会输出什么？如果你回答对了，再看下一题。

### yield 参数

~~~javascript
function* eg2(a) {
	var x = yield a + 1;
	console.log(x);
	var y = yield a + 2;
	console.log(y);
	var z = yield a + 3;
};

var eg_2 = eg2(10);
eg_2.next();
eg_2.next();
eg_2.next();
~~~

这个回答对了，那才是说明认真看过上面的基础知识了。如果弄错了，再回去看看基础。

### next() 参数

~~~javascript
function* eg2(a) {
	var x = yield a + 1;
	console.log(x);
	var y = yield a + 2;
	console.log(y);
	var z = yield a + 3;
};

var eg_2 = eg2(10);
eg_2.next(1);
eg_2.next(2);
eg_2.next(3);
~~~

这个问题体现了 generator 的基础特性，也是 generator 用来进行异步控制的基础。

### 特征点

个人觉得 `generator` 和异步控制有关的特性有以下几个：

* generator 函数内部的代码是通过 `yield` 关键字分隔的，每一次的 `next()`，代码就是运行到下一个 `yield`，这种分隔甚至会分隔一个表达式中的 `yield` 那一段，这是最基本的最重要的特征，也是通过它来控制代码流程的关键；
* `yield` 也有数据输出的功能，当然不像是 `return` 返回这个函数结果，而且返回到 `next().value` 中；
* `yield` 的返回在这里需要注意一下，它的返回值是由此次 `next(xxx)` 作为参数传入的。这个是代码流程上下文数据传递的关键。  

## generator 实现异步控制

generator 的异步处理方式很像“工作流”的数据处理模式，每一个 `yield` 都是数据处理结点，在 generator 函数中将互不相干的结点有次序的连接起来，下一步数据源是上一步的处理结果。

![1.png](/img/async/1.png)

在这里提到一个概念：**工作流**，其中又包含两个核心要素：**处理结点**、**工作流引擎**。 

**处理结点**话前已经有简要说明，**工作流引擎**对于 generator 异步处理机制来说就是一个核心难点了。

不着急，我们继续往下看。

### next()工作流模式

还是以上面第三个例子的基础上，我们改一下需求：“每次 next 都以上一次 next 的结果数据作为参数，进行`串行`的数据处理。”

因为像这样：

~~~javascript
function* eg2(a) {
	var x = yield a + 1;
	console.log(x);
	var y = yield x + 2;
	console.log(y);
	var z = yield y + 3;
};
~~~

`return`一个`yield`并不会返回 `a + 1` 的处理结果，所以不能像传统过程代码那样，直接接收上一步的处理结果，作为下一步处理的数据源。

但是可以通过 `next()` 传参，直接给下一步的 `x` 进行赋值。所以我们可以将上述代码进行改造：

~~~javascript
/* part 1*/
function* eg2(a) {
	var x = yield a + 1;
	console.log(x);
	var y = yield x + 2;
	console.log(y);
	var z = yield y + 3;
	console.log(z);
};

/* part 2*/
var eg_2 = eg2(10);
const result1 = eg_2.next();
console.log(result1);
const result2 = eg_2.next(result1.value);
console.log(result2);
const result3 = eg_2.next(result2.value);
console.log(result3);
~~~

这样的最终结果 `result3.value` 就是正确的值。多看看这个例子感受一下。

我们已经成功通过 `yield` 将和上下文处理过程连接在一块了，但是这一点都谈不上是 “工作流引擎”。
因为我们的几个处理结点都是预知固定的，而且数据传递还需要单独写过程（part 2 部分），如果是“异步处理的数量、上下文都不预知”也就是不能要用户再去自己写运行过程（part 2 部分），`function *` 函数会自动按语法顺序一一执行，这才是所谓的 **工作流引擎**。 

### generator 函数的工作流

我们接下来按上述的工作流要求写一个 **工作流引擎**。 

* 不知道异步操作过程有几步，一直执行到最终
* 这一次的处理结果作为一下步的源数据

凭这两个典型特性，我们应该在第一时间想到的是递归调用，递归天生就是解决上述两类问题的。

递归的元素肯定就是 generator 生成的 iteration(迭代) 对象了。每一次通过 `.next()` 拿到 `value` 和 `done` 两个值:

~~~json
{
	value: 11,
	done: false
}
~~~

`value` 是处理后的数据，`done` 是迭代结束的标识。如果还未结束，我们就把 `value` 传入下一步的运行代码；如果结束了，`value` 就是最终的处理结果。

按这个思路，我们就写出一个很简单的 **generator 工作流引擎**：

~~~javascript
/**
 * 一个简单的 generator 工作流引擎
 * @param {generator function} generator 方法
 * @param {any} 初始化参数
 */
function run(generator, param){
	var gen = generator(param);
	/**
	 * 迭代运行方法
	 */
	function next(data) {
		var ret = gen.next(data); 	// 执行一步
		if(ret.done)				// 是否结束
			return;
		var value = ret.value;		// 结果数据
		next(value);				// 进行下一步运行
		
	}
	next(); // 启动任务
}
~~~

用 `part 1` 代码试一试是不是你想要的结果。

## 结束 

到此，`generator` 异步处理的原理和技术要点说说完了。实际中，我们肯定会遇到比以上例子复杂很多的情况，但解决思路是不变的。

当然也有例如 **tj** 大神的经典 `co` 框架提供了一个很成熟的 `generator` 异步处理方案，有用到的可以去看一看。

js 异步处理过程用同步代码表达解决的只是开发者的需求，不用此类方案一样可以完成业务逻辑的实现。但是这就和代码写注释一样，它可以帮助开发者实现结构上的明确和代码逻辑的清晰，这也是从 **动手到动脑** 开发过程的一个转变。

笔者还是推荐 `async/await` 解决方案，它最贴切“正常”的同步思维，代码结构更加简单，“不带来技术负债、思考周全的情况下，用尽量简单直接的方式解决问题是最好的”。




