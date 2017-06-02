---
layout: post
title: webpack plugin 开发
published: true
categories: 技术笔记
tags: webpack develop
---

# webpack plugin 开发

webpack 已经是大家手中常用的构建工具了，其强大的构建功能和一站式的解决方案为前端开发的工程化带来了很大的方便。
其中，离不开的是它自身提供的丰富的 [loader](https://webpack.js.org/loaders/) 和 [plugin](https://webpack.js.org/plugins/)。

当然，大家自身业务的需求差别导致这些插件不一定能够满足每个人的需求。这个时候，我们就得自己写插件了。

## 基础插件开发

在官方的 webpack 开发文档中，就对怎样开发一个 loader 或 plugin 进行了详细的说明：

[https://webpack.js.org/development/how-to-write-a-plugin/](https://webpack.js.org/development/how-to-write-a-plugin/)。

如果英文还可以，有耐心的同学可以看完了解一下。

这里几处基础的知识点做一个通俗的解释：

* compiler ：这个简单来讲就是整个 webpack 编译对象，在初始化的时候一次生成，记载着你在 webpack.config.js 中配置的、和其它基础构建的信息。
* compilation ：每一次独立的编译过程会产生一次新的 compilation，比如在初始构建、watch 文件改动时都会产生，同时也记载着改动文件相关的一切信息。

插件中所有的操作对象都是基于这两个对象的。最好多看看它里面都有哪些数据，尤其是 `compilation`。这里对 `compilation` 其中一些重要的属性简单介绍：

* compilation.modules: 编译中涉及到的模块

* module.fileDependencies: 模块所依赖的所有源文件，包括 js、css、pic 等等

* compilation.chunks: 看名字就知道了，就是 `entry` 中入口文件的分组 

* chunk.modules: chunk 中包含的模块，这个地方也可以看到其依赖模块

* chunk.files: chunk 最终输出的文件，也可以在 `compilation.assets` 中看到详细的输出文件列表

如果你还不知道 chunk、module、dependencies 是指什么，那你还是别往下看了。

## 插件编写格式

~~~javascript
function HelloWorldPlugin(options) {
  // Setup the plugin instance with options...
  this.options = options;
}

HelloWorldPlugin.prototype.apply = function(compiler) {
  compiler.plugin("compilation", function(compilation) {
    compilation.plugin("optimize", function() {
      console.log("Assets are being optimized.");
    });
  });
  
  compiler.plugin('done', function(stats) {
    console.log('compile done !');
  });
};

module.exports = HelloWorldPlugin;
~~~

如上所示， webpack 的插件编写格式比较简单，只需要一个 prototype 方法 `apply`。

凑这么简单~，当然这只是一个空壳，要写功能还得看下面。

## 插件生命周期

webpack 构建是一个过程，既然是过程，它肯定有生命周期的。这个也是写插件的关键。

在上面例子中就稍有体现，通过 `.plugin('event')` 这种形式来绑定各种生命周期中出现的『事件』。在[https://webpack.js.org/api/plugins/compiler/](https://webpack.js.org/api/plugins/compiler/)中已经有详细的解释。

这里补充几点很重要的信息：
* **上面列表中的事件是按生命周期的顺序列出来的！**；
* 注意事件的类型 async 还是 sync，异步事件的触发是相对的，对于一个 module 这的触发是按有顺序的，但总体来说可不一定，尤其存在说多异步插件的时候。建议大家自己去看一下就明白了；
* `done` 事件的回调参数 `status` 里面包含着 compilation 的构建结果；
* 整个生命周期结束后，并不就是 webpack 构建结束，而只是插件构建的结束，接下来才是 webpack 自身的基于 module 的核心构建过程。

## 代码示例

看以下简单的代码，当然实现的功能也够简单，能看出来是什么功能吗？那算是到这里没白看了。

~~~javascript
function PagePathPlugin(options) {
  this.options = options;
}
PagePathPlugin.prototype.apply = function (compiler) {
  var self = this;
  // 在整个基本构建完成后执行
  compiler.plugin('done', function (stats) {
    try {
      var assets = stats.compilation.assets;
      var logTable = [];        // 所有 assets 文件列表
      for (var key in assets) {
        var size = assets[key].size() || 0;
        var file = assets[key].existsAt || '';
        logTable.push({
          asset: file,
          size: size
        });
      }
      console.log(os.EOL);
      console.table(logTable);
      console.log(os.EOL);
    } catch (err) {
      // done 最终结束时执行，出错不会影响主构建过程
      console.log(os.EOL + '===页面获取失败===========================');
    }
  });
};
module.exports = PagePathPlugin;
~~~

