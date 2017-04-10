---
layout: post
title: 【翻译】CSS 加载新方式
---

# CSS 加载新方式 [翻译]

> 原文地址：https://jakearchibald.com/2016/link-in-body/

Chrome 有意改变 `<link rel="stylesheet">` 的加载行为，尤其是在 `<body>` 中出现时。
由此带来的好处和一些 blink 引擎不明确的地方，笔者将在这里进行详细的说明。

## 目前加载 css 的方式

~~~html
<head>
  <link rel="stylesheet" href="/all-of-my-styles.css">
</head>
<body>
  …content…
</body>
~~~

CSS 会阻塞页面渲染，直到 `all-of-my-styles.css` 加载完成前，留给用户的只是“白屏”。

通常我们会将整个站点的 CSS 打包成一到两个资源文件，这意味着用户在某一个页面会加载大量“用不着的”样式规则。
这是因为一个站点中包括了引入许多“页面模块”的页面，如果将 css 文件按一个一个的模块进行分离，这些分隔的 css 文件会严重影响到 http/1 的性能。

补充一下，这个情况不会出现在 spdy/http2 协议的情况下，在这类协议下，许多小的资源文件（并行）传输代价很小，也可以被浏览器独立缓存。如下

~~~html
<head>
  <link rel="stylesheet" href="/site-header.css">
  <link rel="stylesheet" href="/article.css">
  <link rel="stylesheet" href="/comment.css">
  <link rel="stylesheet" href="/about-me.css">
  <link rel="stylesheet" href="/site-footer.css">
</head>
<body>
  …content…
</body>
~~~

这解决了冗余问题，但是这需要你在页面输出 `<head>` 时知道这个页面里包括什么内容，从面防止 steaming。
同时，浏览器仍然需要在开始渲染页面前下载所有的 `css` 文件。
其中一个 `site-footer.css` 的下载缓慢将会延时整个页面的渲染。

## 目前最先进的 css 加载方式

~~~html
<head>
  <script>
    // https://github.com/filamentgroup/loadCSS
    !function(e){"use strict"
    var n=function(n,t,o){function i(e){return f.body?e():void setTimeout(function(){i(e)})}var d,r,a,l,f=e.document,s=f.createElement("link"),u=o||"all"
    return t?d=t:(r=(f.body||f.getElementsByTagName("head")[0]).childNodes,d=r[r.length-1]),a=f.styleSheets,s.rel="stylesheet",s.href=n,s.media="only x",i(function(){d.parentNode.insertBefore(s,t?d:d.nextSibling)}),l=function(e){for(var n=s.href,t=a.length;t--;)if(a[t].href===n)return e()
    setTimeout(function(){l(e)})},s.addEventListener&&s.addEventListener("load",function(){this.media=u}),s.onloadcssdefined=l,l(function(){s.media!==u&&(s.media=u)}),s}
    "undefined"!=typeof exports?exports.loadCSS=n:e.loadCSS=n}("undefined"!=typeof global?global:this)
  </script>
  <style>
    /* The styles for the site header, plus: */
    .main-article,
    .comments,
    .about-me,
    footer {
      display: none;
    }
  </style>
  <script>
    loadCSS("/the-rest-of-the-styles.css");
  </script>
</head>
<body>
</body>
~~~

以上代码中，我们使用了一些内联样式来保证快速渲染页面的初始内容。同时，也会将那些样式没有加载完的组件进行隐藏，并通过 javascript 进行异步加载。
剩余的 css 加载完后会覆盖原有 `.main-article` 等组件的 `display: none;`;

这个方法的确是一种更快渲染首屏的方法，并已经受到了一些相关专家的推荐。

[View demo](https://jakearchibald-demos.herokuapp.com/progressive-css/two-phase.html)

但是也存在一些不足之处。

### 它需要一个小的 javascript 库

不幸的是，这是由 webkit 的实现方式造成的。一但有 `<link rel="stylesheet">` 添加到页面中，就会立刻阻塞页面渲染，直到样式文件下载加载完毕，即使它是由 javascript 添加的。

在 firefox 和 IE/edge 中，js 加载的样式表完全是异步的。目前稳定版的 chrome 中还是以 webkit 的方式加载的，在 Canary 版本中，已经切换成 Firefox/Edge 的模式。

### 必须经过两个阶段的加载过程

在上述的例子中，inline CSS 通过 `display: none;` 隐藏了还没有样式的页面部分，直到异步加载完 css 后再显示它。
如果你将这些分别装载在两个甚至多个 css 文件中，它们很有可能不是“顺序加载”的，从面导致页面内容的错乱。

[View demo](https://jakearchibald-demos.herokuapp.com/progressive-css/naive.html)

随着右上角弹出广告出现后，页面内容的错乱真让人很无语，我们必须消灭它。

自从你将加载分为两个部分，你就必须决定哪些是需要最先加载的，哪些是在接入来要加载的。
你当然需要 “关键内容” 部分先加载，但是这块部分依赖屏幕的大小。
好吧，问题来了，你需要找到一个万能的解决方案。

> 如果你真想把这些做的很复杂，可以用 css 的自定义属性构建一个渲染依赖树。

## 一个更简单、更好的方法

~~~html
<head>
</head>
<body>
  <!-- HTTP/2 push this resource, or inline it, whichever's faster -->
  <link rel="stylesheet" href="/site-header.css">
  <header>…</header>

  <link rel="stylesheet" href="/article.css">
  <main>…</main>

  <link rel="stylesheet" href="/comment.css">
  <section class="comments">…</section>

  <link rel="stylesheet" href="/about-me.css">
  <section class="about-me">…</section>

  <link rel="stylesheet" href="/site-footer.css">
  <footer>…</footer>
</body>
~~~

当每一个 `<link rel="stylesheet">` 加载的时候，阻塞它后面加载的(页面)部分，但是允许它渲染之前的部分。
它们的加载是并行的，但是应用是串行的。这就使得 `<link rel="stylesheet">` 有点像 `<script src="…"></script>` 了。

设想一下，站点的 header、article、footer CSS 都已经加载完毕，但其它部分样式正式传输，此时页面就是这样：

* Header：已渲染
* 正文：已渲染
* 评论部分：未渲染，它前面的 CSS 还未被加载（/comment.css）。
* 关于本站：未渲染。它前面的 CSS 还未被加载（/comment.css）。
* Footer：未渲染。尽管它本身的 CSS 已加载完成，但它前面的 CSS 还未被加载（/comment.css）。

这样就提供了一种页面的连续呈现。你不需要再确定什么是“关键内容”，仅需要在页面元素第一次被渲染前引入所需的 css 即可。
而且这是一种完全的页面回流，因为在你需要它(样式文件)前，你已经引入了 `<link>`。

当你在使用内容导向的布局的属性时，如 `table`、`flex`，需要格外小心一点，避免在内容加载时引起错乱。
这是一个新的问题，而且这样渐进式的渲染会更加频繁的导致此问题。你可以 hack 调整一下 flex 的行为，但是 css grid 是一个非常好的页面整体布局系统，`flexbox` 对于较小的页面元素依旧非常强大。

## Chrome 的变化

html 规范中并没有表示页面在被 css 阻塞时要怎么去渲染，也不鼓励大家把 `<link ref="stylesheet">` 放在 body 中，但是所有浏览器都允许这样。
当然，它们都有自己处理这种情况的机制：

* Chrome & Safari：一但遇到 `<link rel="stylesheet">` 就停止渲染页面，直到它彻底加载完毕后。这就经常会导致在 `<link>` 之上的部分被硬塞渲染。
* Firefox：在 head 中的 `<link rel="stylesheet">` 会硬塞全部的页面渲染，在 body 中的 `<link rel="stylesheet">` 并不会阻塞渲染，除非某一个在 head 中的样式表已经阻塞了整个页面加载。这会导致一种无样式内容闪烁现象（FOUC）。
* IE/Edge：阻塞解析直到样式表加载完成，但是允许在 `<link>` 之上的元素继续渲染。

在 Chrome 团队，我们更喜欢 IE/Edge 的机制，也打算向向它靠拢。它可以形成一种如上所述的渐进式的渲染过程。我们也正在着手将此带进 html spec，开始允许在 `body` 中插入 `<link>`。

### Firefixing 

Firefox 也不总是为了 `link-in-body` 阻塞渲染，因此我们需要花点功夫来避免 FOUC 现象。
谢天谢地找到一个非常漂亮的方式，因为 `<script>` 会阻塞渲染，我们就用它来等待样式表加载完成：

~~~html
<link rel="stylesheet" href="/article.css"><script> </script>
<main>…</main>
~~~

这个 `script` 标签不能是空的，当然一个空格也足够了。

## 看干货

[View demo](https://jakearchibald-demos.herokuapp.com/progressive-css/)

Firefox & Edge/IE 会呈现一种非常友好的渲染过程，而 Chrome & Safari 在 CSS 加载完之前都是白屏。
目前在 Chrome/Safari 的这种机制下，没有比把所有 css 都放到 head 里更槽糕的了，所以你可以开始使用今天提到的这种方法。
在接下来的几个月中，Chrome 也会迁移成 Edge 的模式，很多用户会享受到更快速的渲染。

就是这样~！你需要一个更加简单的方法去加载 css，达到一种更快的渲染速度。

## 译者总结

前端性能优化是个永无止境的话题，也是当下移动端h5的一个最大痛点，没有之一。
在没有任何通用方法、工具的情况下，我们解决此类问题只能从最基础的原理机制下手，开开脑洞，抓住每一个可能性对页面进行优化。

译者将页面优化总体分为两点，一个是对开发者的，一个是对用户的。

对开发者的优化方法无非就两个点：更小、更快，尽我所能的将页面(包括资源)传达给用户，这里也不再复述。

还有一种是对用户的，用户环境的复杂性致使这类优化更不可控，但最终的落脚点都在一个“体验”上，以上笔者的方法就属于此类。放弃一部分“更快”的优化目标换来用户更好的体验，也是页面优化的的一种方式。
我们常说的“按需”、“延迟”也都是这个思路，达到一种 “更平缓” 的优化目的。

而且，在 http2 今后大面积推广情况下，笔者方式的缺点也将不再存在。

（为笔者点个赞 👍）