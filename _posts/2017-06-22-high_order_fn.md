---
layout: post
title: 高阶函数简介
published: true
categories: 技术文章
tags: function js
---

# 高阶函数简介

> 打算连续几篇由浅入深介绍一套相关知识，不能算是系列吧，只是知识点层层相套

先用很官方的文字解释一下什么是高阶函数，大家应该在大学里有所接触，估计也忘的差不多了。

~~~text
高阶函数是至少满足下列一个条件的函数:
接受一个或多个函数作为输入
输出一个函数
~~~

这个定义应该还算明确，相比一个什么叫“闭包”的应该好太多了。
就是上面所说，以 js 为例，就是有这么一个 `function`:

* `function fn(a, b, ...c)` 如果 fn 中有一个参数的类型是 `function`；
* `function fn(a, b, ...c) {...; return newfn}` 返回的 `newfn` 类型也是一个 `function`。

满足以上任意一条件，那 `fn` 就算是一个高阶函数。

## 常见的适用场景

我们先不说它是作用和意义，在上面的解释下，我们先来看看这种函数的使用场景：

### 参数为 function 的

我们所说的 “**回调方法**” 应该是我们接触的最为典型的一类高阶函数了，它一般是对一个函数的执行加入上下文条件：
看以下几个例子：

#### 一般调用执行

~~~javascript
/**
 * 示例1
 * 执行一个方法
 * 在执行之前先进行判断
 * @param {any} fn
 * @param {array} params
 */
function execFunction(fn, ...params) {
  if (typeof fn === 'function') {
    return fn(...params);
  }
  return null;
}
~~~

~~~javascript
/**
 * 示例2
 * 执行一个方法
 * 添加第一位参数 'default param'
 * @param {function} fn
 * @param {array} params
 */
function execFunction(fn, ...params) {
  return fn('default param', ...params);
}
~~~

~~~javascript
/**
 * 示例3
 * 执行一个方法
 * 将执行结果转换成 string
 * @param {function} fn
 * @param {array} params
 */
function execFunctionToString(fn, ...params) {
  var result = fn('default param', ...params);
  return result.toString();
}
~~~

~~~javascript
function add(a, b) {
  return a + b;
}

/**
 * 示例4
 * 对字符串的数学运算
 * @param {string} str1
 * @param {string} str2
 * @param {function} typeFn
 * @return {int}
 */
function calculateFromStr(str1, str2, typeFn) {
  return typeFn(parseInt(str1), parseInt(str2));
}
~~~

看过以上简单例子大家应该很有共鸣，这类的使用场景也是经常见到的最为基础的用法。

#### 异步回调

~~~javascript
/**
 * 示例5
 * 200ms 后执行一个方法
 */
function asyncFn(fn, ...params) {
  setTimeout(() => {
    fn(...params);
  }, 200);
}

asyncFn(function (...params) {console.log(...params);}, 1,2,3)
~~~

这类回调一般是为了解决异步处理后数据结果的顺序执行问题。

#### 引用数据类型的原生处理方法

js 引用数据类型都会带有一些原生的 (prototype) 数据处理方法，很多也都高阶函数：

`Array.prototype` 下的 `forEach`、 `map`、`slice` 等等。
我们来选一个来自己简单实现一下，加深对此的印象：

~~~javascript
/**
 * Array forEach 方法实现
 */
Array.prototype.forEach = function (fn) {
  var i = 0;
  for (i; i < this.length; i++) {
    (function(index){
      fn(this[index], index, this)
    }.bind(this))(i)
  }
}

var arr = [1,2,3];

arr.forEach(function (item, index, list) {
  console.log(item, index, list);
})
~~~

### 执行返回结果为一个函数

这类高阶函数就没有上面一大类的场景那么多了，以上面 **示例4** 为例，我们换个角度来设计一下:

~~~javascript
function add(a, b) {
  return a + b;
}

function sub(a, b) {
  return a - b;
}

function calculateFor(typeFn) {
  var fn;
  switch (typeFn) {
    case 'add':
      fn = add;
      break;
    case 'sub':
      fn = sub;
      break;
    default:
      fn = function (...params) { console.log(...params); }
  }
  return fn;
}

//
calculateFor('add')(1, 2);
~~~

这种高阶函数像是换整个过程分成了两步，第一次按运算的类型来返回对应的运算方法，第二次再用返回的方法进行计算。

可能稍有点抽象，我们用以下几个盒子循序渐进一下：
可以自己先脑补下应该会输出什么...


~~~javascript
function twiceAdd(a, b) {
  var sum1 = a + b;
  return function (c) {
    return sum1 + c;
  }
}

var result = twiceAdd(1, 2)(3);
~~~

再抽象一下：

~~~javascript
function add(a) {
  return function (b) {
  	console.log(a + b);
    return add(a + b);
  }
}

var r = add(1)(2)(3)(4);
console.log(r)
~~~

再加上个“终点”

~~~javascript
function linkAdd(a) {
  if (a) {
    return function (b) {
      return b ? linkAdd(a + b) : a;
    }
  } else {
    return a;
  }
}

var r = linkAdd(1)(2)(3)(4)()
console.log(r)
~~~

可以运行一下，打印出来看看是些什么，想想怎么来的。

## 它的意义

笔者个人觉得，高阶函数是对一般“一阶函数 **输入 -> 输出简单数据类型**”的再度抽象，类似一个函数的“工厂模式”。

它可以拆分复杂方法，将方法中一致的部分进行高度复用，不一致的地方动态生成，利于代码的重构和扩展。

它也是有缺点的，降低了代码的可读性，某些情况下也会影响可维护性。

下一篇，我会找个具体场景简单介绍一下高阶函数可以解决的问题。
