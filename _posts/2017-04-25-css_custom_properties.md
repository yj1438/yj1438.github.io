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

通常，使用一个新的预处理程序或框架，都得从它的语法开妈学起。


