---
layout: post
title: bundle-loader 实现 react 按需加载(二)
published: false
categories: 技术文章
tags: react bundle
---

# bundle-loader 实现 react 按需加载(二)

上篇博文中，以 react 为例，简单介绍了一下 `bundle-loader` 这个加载器在处理一些需要分离出去的模块时带给我们的便利。
按官方文档的基本用法，我们已经针对某一个引用的模块实现了按需加载。

## 问题缺陷

因为 `bundle-loader` 将模块改成异步方式引用，需要在具体引用代码的地方进行修改。
比如在 react 中又得引入一个自制的加载器，还得将原来的 component 放入 加载器标签中使用。
总体上对代码的改动较大，而且不兼容非按需加载的情况，这是不留退路啊。

这种事咱们得谨慎点才好，一处两处用或是只针对一两个特殊 component 用还好(如：重量级的富文本editor，视频组件等)，要是用在其它业务代码上就不太好了。

## webpack.config 中配置 bundle-loader

`bundle-loader` 既然是一个 loader，那么它也可以在 webpack 中配置使用：

~~~javascript
// webpack.loader
{
  test: /\.(js|jsx)$/,
  loader: 'bundle?lazy&name=[name]',
  include: /\/needLazyloadComponent\//
},
~~~

这样的话，业务代码中不用改这一处：

~~~javascript
// write in file where use ‘bundle-loader’
import LazyComponent from 'bundle-loader?lazy&name=lazy.[name]!./components/lazyComponent.jsx';
// write into webpack.config
import LazyComponent from './components/lazyComponent.jsx';
~~~

实际上没什么大的改进~~~

不过可以通过配置 `include`，项来控制需要按需的组件，如果你的项目文件结构设计良好，还是有一定的优势。

## 联合 react-router 使用

下面介绍一个非常适合 `bundle-loader`，而且写法优雅的使用场景，就是我们在前一篇开始提到的：

“基于 react 的单页 app，按业务分成多个‘页面’，需要在显示某个页面时再去加载页面业务对应的 js”

我们一般都使用 `react-router` 来控制 url 和页面的对应关系，假设文件结构如下：

~~~
app
  - routers        // router component文件夹，里面都各业务页面的入口文件
  router.jsx      // router 配置文件
  app.jsx         // app 入口文件
~~~

在这样比较合理的文件规划下，我们就可以经非常小的业务代码改动实现具有一定设计感的按需加载文案，还不是用到哪写到哪。

### 关键配置/代码

#### webpack.config

~~~javascript
// +++++++++++++++ <<<<<<
{
    test: /\.(js|jsx)$/,
    loader: 'bundle?lazy&name=[name].app',
    include: /\/routers\//,
},
// +++++++++++++++ >>>>>>
{
    test: /\.(js|jsx)$/,
    loader: 'babel',
    exclude: /node_modules/,
},
~~~

加入一个 `bundle-loader` 的配置项，当然 `include` 是关键，只将路由入口页面进行隔离。

如此一来，我们在引用时可以少去 `bundle-loader!` 这个前置 loader，和正常情况一样用法，但是引用后的对象还是得像基础用法那样改造。

~~~javascript
var load = require("./lazy_module/lazyModule.js");
var moduleA = require("./module/moduleA.js");

// The chunk is not requested until you call the load function
load(function(module) {
  // module is lazyModule
});

console.log(moduleA)     // moduleA is also regular module as you know
~~~

在使用这种用法之前一定要按业务需求先对整个框架的组织、文件结构进行合理规划，想清楚哪些 module 是需要被按需加载的，
我在配置中写了一个 `include: /\/lazy_module\//` 也是这个意思， 必尽“按需加载”这个需求在单页中是双刃刀，有利有弊的。

而且，因为 bundle-loader 加载的 module，在使用上也需要改动，所以建议自己封装一个 load 作为此类 module 的加载统一入口，最好能兼容两种情况，
这样也更易维护。比如可以用 promise 抹平使用层面上代码形式，做到使用上的透明。
