---
layout: post
title: bundle-loader 实现 react 按需加载(二)
published: false
categories: 技术文章
tags: react bundle
---

# bundle-loader 实现 react 按需加载(二)

上篇中，以 react 为例，简单介绍了一下 `bundle-loader` 这个加载器在处理一些需要分离出去的模块时带给我们的便利。
按官方文档的基本用法，我们已经针对某一个引用的模块实现了按需加载。

## 问题缺陷

因为 `bundle-loader` 将模块改成异步方式引用，需要在具体引用代码的地方进行修改。
比如在 react 中又得引入一个自制的加载器，还得将原来的 component 放入 加载器标签中使用。
总体上对代码的改动较大，而且不兼容非按需加载的情况，这是不留退路啊。

这种事咱们得谨慎点，一两处或是只针对某个特殊 component (如：重量级的富文本editor，视频组件等)用还好，要是用在其它业务代码上就不太好了。

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
      index.jsx
      detail.jsx
  router.jsx      // router 配置文件
  app.jsx         // app 入口文件
~~~

在这样比较合理的文件规划下，可以以非常小的业务代码改动实现具有一定设计感的按需加载方案，而不是用到哪写到哪。

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
但是引入后这些各业务的入口页面也都从正常的 react component 变成了一个异步的方法，在使用上也需要改变了。

#### router.jsx

使用 `bundle-loader` 之前，router.jsx 内容：

~~~javascript
// 一般 react-router 的形式
import Index from './routers/index';
import Detail from './routers/detail';

<Router>
  <Route path="/">
    <Route path="index.html" component={Index} />
    <Route path="detail.html" component={Detail} />
  </Route>
</Router>
~~~

使用 `bundle-loader` 之后，`Index`、`Detail` 已经是一个回调方法，如上使用自然不行，不过 react-router 本身就支持[动态路由](https://github.com/ReactTraining/react-router/blob/v2.8.1/docs/API.md#getcomponentsnextstate-callback)。
我们可以借用它的功能，很优雅的、绿色环保的实现页面业务js的按需加载。

改造后：

~~~javascript
import Index from './routers/index';
import Detail from './routers/detail';

/**
 * 返回 getComponent 对应的方法
 */
const loadComponent = function(component) {
  return function (nextState, cb) {
    return component(function (com) {
      return cb(null, com);
    });
  }
}

<Router>
  <Route path="/">
    <IndexRoute getComponent={loadComponent(Index)} />
    <Route path="index.html" getComponent={loadComponent(Index)} />
    <Route path="detail.html" getComponent={loadComponent(Detail)} />
  </Route>
</Router>
~~~

这样，我们就可以比较优雅的搞定此功能。

### 执行效果

加载 `/index.html` 时：

![5.png](/img/bundle_loader/5.png)

加载 `/detail.html` 时：

![4.png](/img/bundle_loader/4.png)

其中的 `1.index.app.js`、`3.detail.app.js` 就是按需打包出来的业务 js。完全符合我们需求。

### 完善优化

以上虽成功了，但有一个问题还需要解决：

我们一共改过了两个地方，`webpack` 配置是添加上的，对原来的代码没有太大影响，但是在 router 里代码改动较大，而且没有退路，这样一刀切、颠覆式的改造是有维护风险的，至少我们要优化成兼容方式：

~~~javascript
import Index from './routers/index';
import Detail from './routers/detail';

// 判断当前 component 的类型
function isReactComponent(obj) {
  return Boolean(obj && obj.prototype && Boolean(obj.prototype.isReactComponent));
}

/**
 * 根据 component 的加载类型，判断用哪种方式去加载 router
 */
const loadComponent = function(component) {
  return isReactComponent(component) ?
    {component: component} :
    {getComponent: function (nextState, cb) {
        return component(function (com) {
          return cb(null, com);
        });
      }
    }
}

<Router>
  <Route path="/">
    <IndexRoute {...loadComponent(Index)} />
    <Route path="index.html" {...loadComponent(Index)} />
    <Route path="detail.html" {...loadComponent(Detail)} />
  </Route>
</Router>
~~~

这里用了一个解构方法，来对 `Route` 标签进行参数传递。
这样就Ok了，去掉 webpack.config 中 `bundle-loader` 配置也照样好使。
