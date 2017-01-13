---
layout: post
title:  浅析 KOA2 的中间件集成
---

# 浅析 KOA2 的中间件集成

## 前言

（填上次许的坑）基本知识接上文 [软件中间件概念简介](/2016/12/28/middleware.html)，其中提到这么一名话：

> “不少新生的、或是老牌的框架系统，也不再像以前那样提供万斤油的功能，只给你一个最基础的平台，剩下的你需要什么自己去写（找）中间件吧。”

咱们今天要说的这个需要各种中间件集成的框架 `KOA2`，就是这样一个典型。
它本身只是一个非常单纯的 `web framework`，在 KOA 首页看到的第一句话就是：

> next generation web framework for node.js

估计里面的 `next` 所指的其中之一就是中间件集成化。

KOA 不像之前传统的一些 server framework：你能想到的功能它都有，你没想到的功能它也有，KOA 真是啥“功能”都没有（它的前身 express 也一样）。
它只是给你提供了一个 web 服务端的平台，有非常完善的 request / response 封装，还有就是今天要重点说的：“规范且开放的中间件集成模式”。

## KOA2 的中间件机制

KOA2 就像是一个空旷的厂房，里面没有任何实际生产的设备，你需要按自己的需求去找到(或自己造)相关的机器设备 --- 中间件，来搭建成一条“流水线”，流水线进入一端就是 `request` 输出的一头就是 `response`。

这也体现了中间件的主要价值：“根据两端进行适合的数据变换”。

![流水线](http://img1.ph.126.net/XERq8SHoEG8eP8V1DRPYVw==/6597717379005803171.gif)

但是，KOA 也有它自己的中间件特征，我们先来看它文档中相关部分：

![doc.gif](/img/middleware/2-2.gif)

没错，就是这么一张图，第一次接触KOA(或 express)的人估计要懵逼了，说实话我最开始看的时候也😵了一下：WTF~~~
幸好有个官方的例子，看了一下，又试运行了一下，才知道所以然。

gif 图中主要强调了一个问题：**顺序**。咱们把4个中间件的“执行”顺序写出来：

~~~
1 -> 2 -> 3 -> 4 -> 3 -> 2 -> 1
~~~

是不是有点头绪了。常规的中间件都是遵循着 `从输入到输出` 的队列式集成，多个中间件也是依次执行，典型的流水线模式。
而 KOA 用的是一种包含式的集成方式，也就是洋葱模式。

![alt](/img/middleware/2-1.jpg)

当然，以这各形式进行中间件的集成策略也是有道理的。我们都知道 webserver 的基本功能就是接收 request 返回 response，所谓的从一个点有来有回，不像是常规的“粘合剂”那样的直接链接两个数据终端。
KOA 的中间件就是在给网络请求打上了一个个的“断点”，拦截 koa 平台接收到的每一个请求，包括 request 和 response，我们可以在中间件中去任意“修改”这些请求。

这也很符合 webserver framework 的一个基本规范：单点进单点出，不建议在“中途”直接 response。

> 比如像 php 类的比较“随意”的语言，可以通过 `exit` 直接打回 response，这其实是不被建议的，在之前工作中代码上线需要通过各种lint和代码检测，其中有一项就是 php 不能使用 `exit`。

所以，koa 包含式中间件的设计初衷之一就是上述的原因。

## KOA2 中间件的编写

其实 koa2 已经给出了很多前人们编写的、官方认定的中间件 [koa 中间件列表](https://github.com/koajs/koa/wiki)，应该可以满足一般 server 的大部分需求了。

当然，肯定也会有一些我们想要的中间件不在这个列表中，这就需要我们自己去编写了。官方给出了一种很详细的中间件写法，就是上面的那个 gif 动图，可以自己去看。

在这里我再提供一种写法，个人感觉更明了一些，我写了一个 `art-template` 的 KOA2 中间件，正好以此示例一下：

~~~javascript
import path from 'path';
import template from 'art-template';
import fs from 'fs';

/**
 * koa2 art-template 中间件
 */
const basePath = process.cwd(),
    viewRoot = path.resolve(basePath, 'views');

export default async function (ctx, next) {
    if (ctx.render) {
        return;
    }
    ctx.template = template;
    ctx.render = function (view, data) {
        console.log(ctx.request.url);
        const vPath = path.resolve(viewRoot, view),
            ext = '.html';
        data = data || {};
        let html = '';
        const exist = fs.existsSync(vPath + ext);
        html = exist ? template(vPath, data) : ('模板错误' + vPath);
        return html;
    };
    await next();
}
~~~

这里对于写法说几个要点：

* `next()` 是 req 和 res 的分隔线。意思是 `next()` 之前的代码，是对这层“洋葱皮”的进来 request 进行修改，`next()` 之后，就是对要出去的 response 进行修改。
* 中间件内部代码是以同步方式运行的。这个比较先进了，你可以在里面用异步的方法直接返回同步的返回值，很给力的，具体原理有兴趣可以自己去研究。比如这样：

~~~javascript
export default async function (ctx, next) {
    await next();
    var text = yield new Promise(function(resolve){
        fs.readFile('./index.html', 'utf-8', function(err, data){
            resolve(data);
        })
    });
    ctx.body = text;
}
~~~

## 总结

针对 KOA2 的中间件集成模式和编写方法就基本写完了，同时也对 KOA 这个 webserver framework 有了基本的认识。
不是说你非要用到它时这篇文章才会有用，主要是以它为例对中间件这一概念有个更直观的感觉，对以后的开发和学习中能有所帮助。

（大概翻了一上2016年的笔记，还有有一些东西的，从下一篇开始把其中的一些东西整理出来，算是上一年的一个总结系列）