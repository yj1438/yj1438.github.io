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

`let` 和 `const` 性质也是类似的，不过它们都是块级变量。

js 中的闭包可以对外暴露一个 function 的变量/属性 --- 作用域链。js 闭包有三个作用域链：

* 自己内部的作用域变量
* 外部方法的变量
* 全局变量

![img1](https://www.smashingmagazine.com/wp-content/uploads/2017/03/closure-780w-opt.png)

预处理器在这类情况大多是一致的，在这里用 sass 举例，是因为它应该是目前最受欢迎的 css 预处理器。

sass 中，有两类变量：local and global。

一个全局变量可以被声明在任意选择器区块的外面，否则，这个变量就是本地的。

任何一个嵌套的代码块都可以访问闭包作用域内的变量（同 javascript）;

![img2](https://www.smashingmagazine.com/wp-content/uploads/2017/03/closure-scss-780w-opt.png)

一个全局的变量可以被定义在选择器块作用域的

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

### 预处理器不会知道 dom 的结构

假设我们想使用 `default` 的 font-size，如果有 `highlighted` 类，就用它的默认字体来突出显示。

html:

~~~html
<div class="default">
  default
</div>

<div class="default highlighted">
  default highlighted
</div>
~~~

css: 

~~~css
.highlighted {
  --highlighted-size: 30px;
}

.default {
  --default-size: 10px;

  /* Use default-size, except when highlighted-size is provided. */
  font-size: var(--highlighted-size, var(--default-size));
}
~~~

因为第二段 html 的 `default` 携带着 `highlighted`，其中的 `highlighted` properties 就可以通过 var 表达式应用在 element 中。

在这个例子中，`--highlighted-size: 30px;` 是生效的，这样反过来可以将设定好的某一个值(如: `--highlighted-size`)应用在 `font-size` 上。

这些都是那么的直接了当：

[http://codepen.io/malyw/pen/ggWMvG](http://codepen.io/malyw/pen/ggWMvG)

~~~css
.highlighted {
  $highlighted-size: 30px;
}

.default {
  $default-size: 10px;

  /* Use default-size, except when highlighted-size is provided. */
  @if variable-exists(highlighted-size) {
    font-size: $highlighted-size;
  }
  @else {
    font-size: $default-size;
  }
}
~~~

再来看 sass 的这个例子：

[http://codepen.io/malyw/pen/PWmzQO](http://codepen.io/malyw/pen/PWmzQO)

出现这种情况，是因为所有的 Sass 计算和处理都在编译时发生，当然，它完全不依赖于代码的结构，也不了解DOM的结构。

这样看来，“自定义属性” 有一个更高级的变量作用域，给通常的 css 级联属性增加了一种情况，它会自行识别 dom 的结构并遵循 css 应用的规则。

**css 自定义属性可以识别 dom 结构，并且是动态的**

## CSS-WIDE 关键字和 `all` 属性

css 自定义属性遵循和传统的 css 属性一样的规则。这意味着你可以给它定义任意常规的 css 属性关键字：

* `inherit` 继承其父元素某一属性值的关键字
* `initial` 应用某一属性的初始值，（可能是一空值、或是其它 css 属性默认的值）
* `unset` 当一个属性默认是继承父元素的属性值时，它使用继承的值；如是属性不继承的话，就使用其默认的值
* `revert` 它可以将一属性值重置为用户 stylesheet 样式表中的值，(在 css 自定义属性中一般是空值)

eg:

~~~css
.common-values{
  --border: inherit;
  --bgcolor: initial;
  --padding: unset;
  --animation: revert;
}
~~~

我们再设想一种情况，你想要做一个 css 组件，来确认一下某一元素有没有其它的属性、或是是否无意中将一些自定义属性应用到上面了。(这种情况下，通常会使用一个模块化的解决方案)

现在我们有了另一种方法：使用 `all` [CSS property](https://developer.mozilla.org/en/docs/Web/CSS/all)。这是将全部属性都 `reset` 的一种简写。

这样，我们可以这样写了：

~~~css
.my-wonderful-clean-component{
  all: initial;
}
~~~

这样可以将 component 的全部样式进行重置。

不幸的是，`all` 关键字不能重置**自定义属性**，是否需要加一个前缀 `--` 来重置所有的常规 css 属性 --- 这个讨论还在进行中。

如此的话，在将来，我们可以这样重置“所有”属性：

~~~css
.my-wonderful-clean-component{
  --: initial; /* reset all CSS custom properties */
  all: initial; /* reset all other CSS styles */
}
~~~

## 使用例子

这里有一些 css 自定义属性的使用例子，给大家展示一下它有意思的地方。

### 模拟一个不存在的 css rules

这些 css 变量的名称是“自定义属性”，那么为什么不使用它们模拟不存在的属性呢？

这类属性有很多：`translateX/Y/Z`，`background-repeat-x/y`，`box-shadow-color`...

我们试着来实现最后一个，在我们的例子中，要改变 `hover` 状态下的 `box-shadow` 的颜色。
需要用纯粹的 css rule 来控制，所以我们不建议在 `:hover` 选择器中完全复写 `box-shadow`。
使用常规的 css 属性，如下：

~~~css
.test {
  --box-shadow-color: yellow;
  box-shadow: 0 0 30px var(--box-shadow-color);
}

.test:hover {
  --box-shadow-color: orange;
  /* Instead of: box-shadow: 0 0 30px orange; */
}
~~~

[http://codepen.io/malyw/pen/KzZXRq](http://codepen.io/malyw/pen/KzZXRq)

### 颜色主题

css 自定义属性中一个很大众的用例就是给一个应用设置颜色主题。感觉 css 自定义属性设计的初衷就是来解决这类问题的。
这里提供一个很简单的颜色主题组件。

看这里[code for our button component](https://codepen.io/malyw/pen/XpRjNK);

~~~css
.btn {
  background-image: linear-gradient(to bottom, #3498db, #2980b9);
  text-shadow: 1px 1px 3px #777;
  box-shadow: 0px 1px 3px #777;
  border-radius: 28px;
  color: #ffffff;
  padding: 10px 20px 10px 20px;
}
~~~

假设我们要反转颜色主题。

第一步是将所有颜色变量，扩展成CSS自定义属性并重写我们的组件。结果会是一样的：

~~~css
.btn {
  --shadow-color: #777;
  --gradient-from-color: #3498db;
  --gradient-to-color: #2980b9;
  --color: #ffffff;

  background-image: linear-gradient(
    to bottom,
    var(--gradient-from-color),
    var(--gradient-to-color)
  );
  text-shadow: 1px 1px 3px var(--shadow-color);
  box-shadow: 0px 1px 3px var(--shadow-color);
  border-radius: 28px;
  color: var(--color);
  padding: 10px 20px 10px 20px;
}
~~~

这里有我们需要的一切内容。在需要的时候 override 颜色变量来反转颜色。
我们可以这样，举个栗子，给 `body` 加一个 `inverted` 类，来改变所应用的颜色变量。

~~~css
body.inverted .btn{
  --shadow-color: #888888;
  --gradient-from-color: #CB6724;
  --gradient-to-color: #D67F46;
  --color: #000000;
}
~~~

如下的例子中，通过点击 `button` 来切换 `body` 的 `inverted` 类。

[http://codepen.io/malyw/pen/dNWpRd](http://codepen.io/malyw/pen/dNWpRd)

普通的 css 预处理器不可能在不用“重复” override 代码的前提下做到这种情况。
一般只能通过覆盖已有的 css 属性 rules 的方法，新添加一个 css 规则来实现它。

用了 css 自定义属性，解决方案就非常优雅了，复制/粘贴代码情况也会避免，仅需要重新定义变量的值。

## 结合 javascript 使用 css 自定义属性

以前，我们想要从 css 向 javascript 传输数据，我们经常需要使用一些[技巧](https://blog.hospodarets.com/passing_data_from_sass_to_js)。通过输出 css 形式的 json 值来编写 css 属性，然后从 javascript 中读取它们。

现在，我们可以轻松地使用 JavaScript 中的 CSS 变量进行交互，使用大家熟悉的 `.getPropertyValue()` 和 `.setProperty()` 方法读取和写入它们，这些方法都用于常规 CSS 属性：

~~~javascript
/**
* Gives a CSS custom property value applied at the element
* element {Element}
* varName {String} without '--'
*
* For example:
* readCssVar(document.querySelector('.box'), 'color');
*/
function readCssVar(element, varName){
  const elementStyles = getComputedStyle(element);
  return elementStyles.getPropertyValue(`--${varName}`).trim();
}

/**
* Writes a CSS custom property value at the element
* element {Element}
* varName {String} without '--'
*
* For example:
* readCssVar(document.querySelector('.box'), 'color', 'white');
*/
function writeCssVar(element, varName, value){
  return element.style.setProperty(`--${varName}`, value);
}
~~~

假设我们有一个媒体查询的值如下：

~~~css
.breakpoints-data {
  --phone: 480px;
  --tablet: 800px;
}
~~~

因为我们只是想在 js 中复用它，比如在 `Window.matchMedia()` 方法中 --- 我们可以很轻松的获得它的值：

~~~javascript
const breakpointsData = document.querySelector('.breakpoints-data');

// GET
const phoneBreakpoint = getComputedStyle(breakpointsData)
  .getPropertyValue('--phone');
~~~

为了展示如何在 js 中调用一个 css 自定义值。在这里，我创建了一个 3d css 的正方形来响应用户的操作。

这个并不是非常困难，我们只需要加一个简单的背景，再通过调节 `translateZ()`, `translateY()`, `rotateX()` and `rotateY()` 这几个 `transform` 属性来放置剩下的 5 个面，就可以搞定了。

为了提供正确的透视点，我们将以下内空放在一个 `wrapper` 中。

剩下的就只是交互性了，将鼠标移动时，demo 会变换 X 和 Y 轴的角度 `(--rotateX and --rotateY)`，当鼠标滚动时，会对图形进行放大和缩小 `(--translateZ)`。

方法如下：

~~~javascript
// Events
onMouseMove(e) {
  this.worldXAngle = (.5 - (e.clientY / window.innerHeight)) * 180;
  this.worldYAngle = -(.5 - (e.clientX / window.innerWidth)) * 180;
  this.updateView();
};

onMouseWheel(e) {
  /*…*/

  this.worldZ += delta * 5;
  this.updateView();
};

// JavaScript -> CSS
updateView() {
  this.worldEl.style.setProperty('--translateZ', this.worldZ);
  this.worldEl.style.setProperty('--rotateX', this.worldXAngle);
  this.worldEl.style.setProperty('--rotateY', this.worldYAngle);
};
~~~

用户移动鼠标时，demo 会改变视角，也可以通过鼠标滑轮来进行放大和缩小。

[demo](http://codepen.io/malyw/pen/xgdEQp)

实质上，我们只是改变了 css 自定义属性的值，其它的 (the rotating and zooming in and out) 则是通过 css 完成的。

> 提示：调试 css 自定义属性的一个简单方法之一就是在 **[CSS generated content](https://developer.mozilla.org/en-US/docs/Web/CSS/content)** 中直接显示其内容（比如一般情况下都是字符串），这样的话，浏览器就会自动显示出当前应用的值。

~~~css
body:after {
  content: '--screen-category : 'var(--screen-category);
}
~~~

(篇幅过长，下周继续。。。)


