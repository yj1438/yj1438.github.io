# NODE_PATH 对 node module 加载环境的重新规划

## 一个自认为的不爽点

> 自开始接触 node ，就被 node 的那个模块加载(引用)的方式一真膈应到现在：
> 对于非 node_modules 为什么不能像 PHP 甚至 JAVA 那样，默认指定一个模块加载的 basepath，而是只能用 './' 、'../' 的相对路径来引用。
> 这样的话，引用路径有一定的耦合性，在代码结构重构的时候会带来很大不便。
> (好，高大尚的理由说完了。。。 再说这样引用也真不好看啊，太 LOW 了点吧~ 在 require 的时候还好，现在用 import 真是不太协调啊~)

## 原始自创的方法

在用 commonjs-module 的情况下，因为 require 支持动态引用，所以可以在程序入口处设置一个 `global` 的 `BASE_PATH`, 这样，在以后每个模块的引用时，都用基于这个 base_path 的路径： 

~~~javascript

global.BASE_PATH = __dirname;

---

const module1 = require(global.BASE_PATH + '/dir/module1');

~~~

当然，这个不是这篇文章的重点，而且在 ES6 下，`import` 不支持动态引用，这种方法也就自然无效了。

## 