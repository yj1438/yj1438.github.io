## 配置 webpack.config 的 loader

上面的基础用法虽然对原有代码的改造较大，但灵活性很高，可控性也很好。

还可将 `bundle-loader` 作为统一的 js loader 加入 webpack 中：

~~~javascript
// webpack.loader
{
  test: /\.(js|jsx)$/,
  loader: 'bundle?lazy&name=[name]',
  include: /\/lazy_module\//,
},
~~~

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
我在配置中写了一个 `include` 也是这个意思， 必尽“按需加载”这个需求在单页中是双刃刀，有利有弊的。

而且，因为 bundle-loader 加载的 module，在使用上也需要改动，所以建议自己封装一个 load 作为此类 module 的加载统一入口，最好能兼容两种情况，
这样也更易维护。比如可以用 promise 抹平使用层面上代码形式，做到使用上的透明。
