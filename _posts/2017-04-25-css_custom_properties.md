---
layout: post
title: 是时候开始用 CSS 自定义属性了
published: true
categories: 翻译 CSS
tags: css
---

# 是时候开始用 CSS 自定义属性了


> 原文地址：[It’s Time To Start Using CSS Custom Properties](https://www.smashingmagazine.com/2017/04/start-using-css-custom-properties/)

目前，css 的预处理几乎已经成为 web (前端)开发的标准。css 预处理的好处之一就是可以使用变量。
这样很大程度上避免了 `ctrl + c / ctrl + v`，也简化了开发和重构。

我们通常用预处理来定义存储颜色、字体表现、布局细节等，几乎可以用在任意地方。

但是预处理的变量存在一定的限制：

* 你不能动态的改变它
* 它不会顾及 DOM 结构
* 不能从 javascript 中读取或更改数据

作为解决这类问题的“银弹”，社区发明了 **css 自定义属性** 这一技术。本质上看，它运行机制像是 css 变量，工作方式就体现在它的名字上： `properties`。

自定义属性为 web 开发开辟了一块新天地。

## 声明和使用自定义属性的语法

通常，使用一个新的预处理程序或框架，都得从它的语法开始学起。

每一个预处理语言都有自己定义变量的方式，通常都由一个保留字符开始，比如 sass 中的 `$` 和 less 中的 `@`。

自定义属性的 css 也使用同样的方法： `--` 申明变量，当然它有一个好处：学习使用一次后，在各浏览器中复用它。

你也许会问：『为什么不用再用的语法？』

[There is a reason](http://www.xanthir.com/blog/b4KT0). 简单来说，就是提供一种自定义属性的方法，可以在任何预处理语言中使用它。
这样，我们提供并使用的自定义属性，预处理器并不会编译它们，这些自定义属性会直接生成 css，而且你可以在原生环境下利用这些自定义的变量。
这些我会在接下来说明。

（关于这个名称需要解释一下：因为想法和目的都非常相似，一些自定义属性也被称作是 css 变量，虽然它的正确名字应该是 css 自定义属性，进一步的阅读此篇文章，你就会明白这个名称是最恰当的。）

声明一个变量来代替常规的 css 属性，如 `color` 和 `padding`，仅需要一个 `--` 开关的自定义属性：

~~~javascript
.box{
  --box-color: #4d4e53;
  --box-padding: 0 10px;
}
~~~

属性的值可以是 颜色值、字符串、布局的类型、甚至是一个表达式。

eg:

~~~javascript
:root{
  --main-color: #4d4e53;
  --main-bg: rgb(255, 255, 255);
  --logo-border-color: rebeccapurple;

  --header-height: 68px;
  --content-padding: 10px 20px;

  --base-line-height: 1.428571429;
  --transition-duration: .35s;
  --external-link: "external link";
  --margin-top: calc(2vh + 20px);

  /* Valid CSS custom properties can be reused later in, say, JavaScript. */
  --foo: if(x > 5) this.width = 10;
}
~~~

这个例子中你可以不太明白什么是 `:root`，它实际和 `html` 一致，只是有更高的优先级。

自定义属性的级联方式与 css 属性一样，而且是动态的，这意味着你可以随时更改，并且根据不同的浏览器做针对性的处理。

要使用一个变量，你需要使用 `var()`，此 css function 接收一个自定义的属性：

~~~javascript
.box{
  --box-color:#4d4e53;
  --box-padding: 0 10px;

  padding: var(--box-padding);
}

.box div{
  color: var(--box-color);
}
~~~

### 声明和使用

`var()` 方法也可以设计参数的默认值。当你不确定是否某个自定义变量已经被定义，又想给一个未定义时的值时，你应该会用到这种方法。
非常简单，给它传入第二个参数就行。

~~~javascript
.box{
  --box-color:#4d4e53;
  --box-padding: 0 10px;

  /* 10px is used because --box-margin is not defined. */
  margin: var(--box-margin, 10px);
}
~~~

当然，你可以复用另一个变量来声明一个新的变量：

~~~javascript
.box{
  /* The --main-padding variable is used if --box-padding is not defined. */
  padding: var(--box-padding, var(--main-padding));

  --box-text: 'This is my box';

  /* Equal to --box-highlight-text:'This is my box with highlight'; */
  --box-highlight-text: var(--box-text)' with highlight';
}
~~~

## 运算符 +, -, *, /

在预处理语言中，我们都习惯用基本的运算符来进行计算，为此，css 提供了一个 `calc()` 函数，
这样在某一个自定义属性变化后，浏览器就会重新得到表达式的值。

~~~javascript
:root{
  --indent-size: 10px;

  --indent-xl: calc(2*var(--indent-size));
  --indent-l: calc(var(--indent-size) + 2px);
  --indent-s: calc(var(--indent-size) - 2px);
  --indent-xs: calc(var(--indent-size)/2);
}
~~~

注意的是，在此类表达式中使用不带单位的变量时就会出现问题。

~~~javascript
:root{
  --spacer: 10;
}

.box{
  padding: var(--spacer)px 0; /* DOESN'T work */
  padding: calc(var(--spacer)*1px) 0; /* WORKS */
}
~~~

## 作用域和继承

在说 css 自定义属性(变量)的作用域前，让我们先回顾一下 js 预处理的作用域，这有利于我人更好的理解和比较。

我们知道，js `var` 的变量的作用域被限制在它所在的 function 中。

`let` 和 `const` 性质也是类似的，不过它拉都是块级变量。

js 中的闭包可以对外暴露一个 function 的变量/属性 --- 作用域链。js 闭包有三个作用域链：

* 自己内部的作用域变量
* 外部方法的变量
* 全局变量

~[img1](https://www.smashingmagazine.com/wp-content/uploads/2017/03/closure-780w-opt.png)

这意味着，在 sass 中，变量的作用域很大程度上依赖于代码的上下文结构。

但 css 自定义属性默认是继承的，和 css 一样，也是级联的。

你不需要在一个选择器外用全局变量声明一个自定义属性，这不是有效的 css，css 自定义属性的全局作用域实际上是 `:root`，因此这个属性是全局可用的。

用我们现有的语法知识，将一个 sass 的例子适用于 html 和 css。搞一个使用原生 css 自定义属性的例子：

html:

~~~html
global
<div class="enclosing">
  enclosing
  <div class="closure">
    closure
  </div>
</div>
~~~

css:

~~~css
:root {
  --globalVar: 10px;
}

.enclosing {
  --enclosingVar: 20px;
}

.enclosing .closure {
  --closureVar: 30px;

  font-size: calc(var(--closureVar) + var(--enclosingVar) + var(--globalVar));
  /* 60px for now */
}
~~~

呈现结果：

[http://codepen.io/malyw/pen/MJmebz](http://codepen.io/malyw/pen/MJmebz)

(好，大家首次直观感觉到 css 自定义属性的能力，下周继续...)


