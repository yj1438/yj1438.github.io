---
layout: post
title: bundle-loader 实现 react 按需加载(一)
published: true
categories: 技术文章
tags: react bundle
---

# bundle-loader 实现 react 各类按需加载

react 做为一个优秀的单页 webapp 框架，已经被广泛用于多种场景。随着当下前端业务体量的增大，有时候单页带来的一些问题也需要解决。

bundle 全量包在页面多、体量大业务下就显出它的不足了：每个“页面”中都是加载全都的js，其实很多其它页面的功能是不需要的，我们希望在用到它的时候再去加载。

翻一翻官方的 loader、plugin 列表，发现以下几个 loader 应该可以解决这个问题：

* [bundle](https://github.com/webpack/bundle-loader): Wraps request in a require.ensure block (callback)
* [promise](https://github.com/gaearon/promise-loader): Wraps request in a require.ensure block (promise)
* [async-module](https://github.com/NekR/async-module-loader): Same as bundle, but provides a way to handle script loading errors. Wraps request in a require.ensure block (callback, errback)

以第一个为例，逐步介绍一下它的用法。

## 基础用法

文档中已经有详细说明：

~~~javascript
var waitForChunk = require("bundle-loader!./file.js");

// To wait until the chunk is available (and get the exports)
//  you need to async wait for it.
waitForChunk(function(file) {
	// use file like it was required with
	// var file = require("./file.js");
});
~~~

就是包了一个 function，通过其参数获得真正的加载模块。这里不再多述。

## react 中使用

react 中使用它稍有点抽象，我在之前两篇博文简单介绍了“高阶函数”，在这里我们就可以用高阶函数的思想实现一个 react 的按需加载策略。

首先来调整一下思路，先想一下以下的概念：

* react component 也是一个函数（这样仅有助于理解）；
* react jsx 标签也可以是一个动态变量；

然后再去看一下官方的这篇讲 react 高阶函数的文章：[Higher-Order Components](https://facebook.github.io/react/docs/higher-order-components.html)。没看明白不要紧，建议看完我这一篇再回去看一篇。

先来说一下我的实现思路，`bundle-loader` 加载来的内容不能直接使用（看“基础用法”一章），需要我们封装一个方法这是必需的，借此可以写一个统一的 react-lazyloader 组件作为此类组件的入口，这样来实现按需加载。

demo 设定三个文件：

* **index.jsx**：主页面
* common/**lazyloader.jsx**：加载器
* components/**lazyComponent.jsx**：需要懒加载的组件

### lazyComponent.jsx

~~~javascript
import React, { Component } from 'react';

class LazyComponent extends Component {
    render() {
        return (
            <div>
                this is a lazy Component!!!;
                <br/>
                name: {this.props.name} ===== tips: {this.props.tips}
            </div>
        );
    }
}

export default LazyComponent;
~~~

很普通的一个 react 组件，不用在意。

### index.jsx

~~~javascript
import React, { Component } from 'react';

import LazyComponent from 'bundle-loader?lazy&name=lazy.[name]!./components/lazyComponent.jsx';
import LazyLoader from './common/lazyloader';

// debugger; 打开这个可以看“按需”js加载过程

class Index extends Component {
    render() {
        return (
            <div>
                this is index page!!!
                <LazyLoader component={LazyComponent} name={'lazyname'} tips={'lazytips'}/>
            </div>
        );
    }
}

export default Index;
~~~

`index.jsx` 中，我们引入了需要加载的组件 `LazyComponent` 和相应的加载器 `LazyLoader`，通过它来对 `LazyComponent` 进行按需加载。

~~~javascript
LazyLoader.propTypes = {
    component: ReactComponent.isRequire,      // 要加载的组件
    ...props: {any}                           // 组件的属性 props
}
~~~

### lazyloader.jsx

~~~javascript
import React, { Component } from 'react';

class LazyLoader extends Component {
    constructor(props) {
        super(props);
        this.state = {
            component: null,
            props: null,
        };
        this._isMounted = false;  // 这个需要考虑
    }

    componentWillMount() {
        this._load();
    }

    componentDidMount() {
        this._isMounted = true;
    }

    componentWillReceiveProps(next) {
        if (next.component === this.props.component) {
            return null;
        }
        this._load();
    }

    componentWillUnmount() {
        this._isMounted = false;
    }

    _load() {
        this.props.component( com => {
            this.setState({
                component: com.default || com,        // 兼容 es6 => commonjs
            });
        });
    }

    render() {
        const LazyComponent = this.state.component;
        const props = Object.assign({}, this.props);    // clone props
        delete props.component;                         // 去掉 component
        return LazyComponent ? (
            <LazyComponent {...props}/>
        ) : null;
    }
}

export default LazyLoader;
~~~

加载器核心功能实际也不复杂，就是将接收到的 `component` 进行动态的渲染就可以了，开始要调整好那二点思路，看这里就很简单了。

## 执行结果

最后我们来验证一下结果是否可行。

js 的 loader 配置：

~~~javascript
{
    test: /\.(js|jsx)$/,
    loader: 'babel',
    exclude: /node_modules/,
    query: {
        plugins: ['transform-runtime', 'transform-decorators-legacy', 'transform-decorators-legacy', 'transform-class-properties'],
        presets: ['es2015', 'react', 'stage-2'],
    },
},
~~~

先看页面结果： 

![1.png](/img/bundle_loader/1.png)

没问题。重要的是 js 的加载情况：

### `index.jsx` debugger 执行前：

![2.png](/img/bundle_loader/2.png)

### `index.jsx` debugger 执行后：

![3.png](/img/bundle_loader/3.png)

> 注意：笔者环境下 `index` 也是懒加载的，所以有 `1.index.app.js` 这个东西，按文中结果是没有的。

是不是和想像的一样~~~， 在我们需要这个组件的时候它跑来（*.lazy_lazyComponent.js）。

> 下一篇中，再介绍一下 **bundle-loader** 在 webpack.config.js 中的配置使用，和在 `react-router` 中的结构化实现，这个实用性更高哦。


