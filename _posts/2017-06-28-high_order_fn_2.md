---
layout: post
title: 高阶函数简单应用
published: true
categories: 技术文章
tags: function js
---

# 高阶函数简单应用

上篇文章中我们介绍了什么是高阶函数。此章中，以例子中的实际场景，体验一下高阶函数能带给我们什么。
继续**由浅入深**。

## 场景

假设有一个页面，现在需求针以不同群体用户做一次页面主题的针对性改造，包括其中的样式、文案等等。

这个的确不是什么困难的事，当然方法也有千千万。至少手动找到变化的地方逐个条件变更总是可以的。

## 用高阶函数式解决

从利于以后维护、可扩展性出发，上面提到的方式显然不行，代码和可读性和易用性就差了一截，对原代码的改动也很大，容易出错。

高阶函数可更好的解决此类问题，它可以对一个函数的执行(环境)加入上下文，而上面提到的“手动变更”肯定也是一系列的代码执行来实现的，我们只需要变更这些数据源就可以了，不用在具体的语句上做大的修改。

假设此页面执行变量的代码有以下：

~~~javascript
document.body.classLise.add('xiaohong');                // xiaogang、xiaozhang、xiaoming......
document.getElementById('eleID').innerText = '小红';     // 小刚、小张、小明......
~~~

我们用上篇所提到的两种形式，可以做以下的改变:

### 作为回调

将以上业务代码包入一个回调中执行，通过执行回调参数的“父级”方法，来传递主题数据。

在这之前我们先定义一个简单的主题数据格式，相应的判断当前主题的一个方法：

~~~javascript
var ThemeData = {
  theme1: {
    clazz: 'xiaohong',
    name: '小红'
  },
  theme1: {
    clazz: 'xiaohong',
    name: '小红'
  },
  ...
};

/**
 * 获取当前主题
 * @param {obj} themes ThemeData
 * @return {obj} {class, name}
 */
function getCurrentTheme(themes) {
  ...
  return theme;
}
~~~

准备好后，我们开始改造

~~~javascript
function initTheme(businessCallback) {
  var themeData = getCurrentTheme(ThemeData);
  businessCallback(themeData);
}
//原有代码的改造
initTheme(function (themeData) {
  document.body.classLise.add(themeData.clazz);
  document.getElementById('eleID').innerText = themeData.name;
});
~~~

如此，我们对原有代码只是做了一些必要而精减的改动，主题的数据和判断都不会涉及到。这也应该是大家第一反应能想到的方法。

### 作为返回方法

再来换一下形式：

~~~javascript
function initTheme1() {
  var themeData = getCurrentTheme(ThemeData);
  return function (businessCallback) {
    businessCallback(themeData);
  }
}
//原有代码的改造
initTheme1()(function (themeData) {
  document.body.classLise.add(themeData.clazz);
  document.getElementById('eleID').innerText = themeData.name;
});
~~~

这个是不是有种‘脱了裤子放屁’的感脚...，实际还没有第一种方式简读。的确是，那我们再“稍”变一下：

~~~javascript
function initTheme2() {
  var themeData = getCurrentTheme(ThemeData);
  var _this = {};
  _this.themeData = themeData;
  return function (businessCallback) {
    businessCallback.call(_this);
  }
}
//原有代码的改造
initTheme2()(function () {
  document.body.classLise.add(this.clazz);
  document.getElementById('eleID').innerText = this.name;
});
~~~

作为回调的执行方法中不需要用一个参数传数据了，而是直接修改了 `this`，变得更优雅亲切一点。
这也是主要说明的一点，**高阶函数可以更深入的修改回调函数的属性执行环境**。

我们再把上面几种例子总结的“整齐”一点：

~~~javascript
// for example 1:
function Bussiness(themeData) {
  document.body.classLise.add(themeData.clazz);
  document.getElementById('eleID').innerText = themeData.name;
}

initTheme1()(Bussiness)
~~~

上面只是将例子1中的业务代码抽出去了，不过看着是不是有点眼熟。。。
下面对例子2做一次复杂点的改变，你可能会更眼熟一些：

假设我们的业务代码是一个 `class`，通过其中的 `render` 方法进行业务渲染:

~~~javascript
// for example 2:
class Bussiness {
  constructor() {
    this.bussinessDomain = 'userTheme';
  }
  render() {
    // 原有的其它业务代码
    // ...
  }
}

function initTheme2() {
  var themeData = getCurrentTheme(ThemeData);
  function makeClass(A) {
    function _A() {
      this.themeData = themeData;
      this.render = function () {
        A.prototype.render.call(this);
        document.body.classLise.add(this.themeData.clazz);
        document.getElementById('eleID').innerText = this.themeData.name;
      }
    }
    _A.prototype = A.prototype;
    _A.prototype.constructor = A;
    return function () {
      const _a = new _A();
      A.prototype.constructor.apply(_a, arguments);
      return _a;
    };
  }
  return makeClass;
}

export default initTheme2()(Bussiness);

// console.log(new Bussiness());
// console.log(new (initTheme2()(Bussiness))());
~~~

> 因篇幅有限，以上代码只用来演示，实际中坑很多，慎用。

上面的代码是通过高阶函数对一个构造类进行内容的改变，“透明”的传入一些参数和环境变量。这也是 `react-redux` 的基本原理之一，可能在原 `react` 代码几乎不变的情况下套用 `react-redux`，通过它来控制 `this.state` 和 `this.props`，达到最终的效果。
此种思想在进行代码重构、框架兼容性升级时非常值得借鉴。
