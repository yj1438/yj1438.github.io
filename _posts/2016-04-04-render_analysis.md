---
layout: post
title: 前端框架 “render” 分析
---

# 主流前端框架的 “render” 简要分析

以 `backbone`、 `angularjs 1`、 `reactjs` 为例，简要说明一下前端 MVC 框架中的 render 机制。

---

## Backbone

Backbone 框架是三者中最简练，但是最标准的 MVC 前端框架。

### 基本特性

![MVC frame](/img/mvc/backbone.png)

backbone 的中文字面翻译叫 “脊椎” 。如其名，它本是框架特性就是提供了一个明确的结构划分，有良好的扩展性，没有添加过多的“自动化”方法。强依赖 `Underscore` 、`jquery`/`zepto`，从中你可以使用依赖库所提供的方法，比如`this._`、`this.$`。

> 注意：在 backbone 类的内部调用 jquery：`this.$` 有 dom 控制域的限制，这也许被很多刚开始接触的人认为这是一个坑，实际上这个限制正是 backbone 在模块划分上的一种规范，backbone 建议由此来限制用户在控制器内只对 `el` 中指定的 dom 元素进行操作，强制用户进行更好的模块划分。

你会发现上图中缺少 “视图” 元素，这也体现了 backbone 的灵活性，它没有自带的模板引擎，你可以使用依赖库 `Underscore` 的 `_.template("———模板内容———")` 作为模板引擎，也可以使用其它的模板引擎。

~~~javascript
AppView = Backbone.View.extend({
    el: '#appele',
    template: _.template('<p>这是一个模板内容<br><span style="font-size: 30px;"><%=value%></span></p>'),
    initialize: function() {
        this.model = new Model();
        this.listenTo(this.model, 'add', this.render);
    },
    render: function() {
        this.$el.append(this.template({value: '哈哈'}));
        this.$('.dom').show();
    }
})
~~~

### （视图）模板渲染原理

backbone 是弱单向的数据绑定框架，你只能手动的将所需的数据事件绑定到指定的 Model 上，完全没有视图端的数据变化监听，也不去管数据变化后视图怎么变。它把 render 方法抛给了用户，完全由用户决定怎么弄。  
backbone 官方实际引导大家使用一个 简单、粗暴、有成效 的方式，就是 **整个重新渲染** ，而不是“细致”的根据变化的数据来去操作 DOM 一个一个的改。  
这实际也是 MVC 的一个核心思想：**数据驱动** --- 用户不应该直接操作视图，应该把重心放到数据和业务逻辑上来。

> 注：**整个重新渲染** 在很多情况下并不粗暴，也是有性能考虑的根据的，dom 的频繁改动是页面性能的一个痛点，与其改10个，不如一次换1个，除非你能做到极致。

---

## reactjs

reactjs PS: 我在这里是充数的，其实，我只是个 UI 。  

> JUST THE UI  
Lots of people use React as the V in MVC. Since React makes no assumptions about the rest of your technology stack, it's easy to try it out on a small feature in an existing project.

### 基本特征

如果说 “正规” 的 MVC 概念重心是进行层级的横向划分，那么 reactjs 的核心概念 Component 则提供一种(页面)模块的纵向划分思想。  

![v or h](/img/mvc/vh.png)

> “横向划分”与“纵向划分”（“水平拆分”与“垂直拆分”）是软件设计的两种最基本思想，相互补充，最终向整个软件系统“组模式”进化。

举个例子，大家手头有这样一个页面

~~~html
<body>
    <header>
        ...<!-- 此处省去50行 and 其它页面也用-->
    </header>
    
    <aside>
        ...<!-- 此处省去300行 -->
    </aside>
    
    <section>
        ...<!-- 此处省去500行 -->
    </section>
    
    <footer>
        ...<!-- 此处省去30行 and 其它页面也用 -->
    </footer>
</body>
~~~

这么“庞大”的一个页面，你会怎么分隔，也许你会说，可以用 php 把它折开啊~那么用前端的技术和方法呢？

> 其实，php 和 java 的一些模板引擎早已做到这一步了，而且有着很好的实用性。现在需要用前端的技术完成“前端”的工作。

现在有了 react 提供的页面组件化方式，你就不用把这么繁多的标签挤在一个页面里了。你的入口主页真的会变成这样:

~~~html
<body>
    <MyHeader />
    
    <MyAside />
    
    <MySection />
    
    <MyFooter />
</body>
~~~

你只需要在主页面（JS）中 “引入” 每一块的的 JS ，就是会得到你想要的结果，页面包含完整的功能与样式哦。就像这样:

**index.jsx** 

~~~javascript
//react
import React from 'react';
//各个页面模块
import MyHeader from './MyHeader';
import MyAside from './MyAside';
import MySection from './MySection';
import MyFooter from './MyFooter';
//整体需要的样式
import './style/reset.less';
import './style/layout.less';

class Index extends React.Component {
    render() {
        return (
            <div>
                <MyHeader />
                <MyAside />
                <MySection />
                <MyFooter />
            </div>
        )
    }
}

export default Index;
~~~

**mySection.jsx**

~~~javascript
//react
import React from 'react';
//MySection 模块中需要的样式
import './style/my_section.less';

class MySection extends React.Component {
    render() {
        return (
            <section>
                ...<!-- 此处省去500行 -->
            </section>
        )
    }
}

export default MySection;
~~~

通过 react 制作的每一个模块都是独立的，你不用再去纠结一个模块的 HTML结构、样式、JS脚本怎么分别弄进来，webpack 的强大的打包能力最终生成的文件肯定让你满意---当然这得自己去配置。

### MVC 特性

从总体框架上来看，虽说 react 不是一个 MVC 框架，但其内在方法的划分和设计原理还是有明显的 MVC 思想。

**state** 和 **render**。react 在数据和视图的关系上采用单向数据绑定的数据驱动模式，也就是数据模型和视图是一一对应的，不过数据改动后视图不一定立刻跟着变化，而是需要你自发的用 **setState** 去触发视图内容更新。

但是 react 不像 backbone 那么懒，把渲染视图的过程也抛给用户，react 有自己的一套非常先进的视图渲染系统---基于虚拟 dom 的最少改动方案。大致过程如下图：

![react 虚拟 DOM](/img/mvc/v-dom.png)

> 注：策略上的区别对待是看 dom 更新的情况来确定是重新刷一遍、修改内容、还是替换等

### 渲染的优化点

* 将只是内在用的、和视图无关的标识变量不要放在 state 下；
* 连续多次的修改 state 下的数据时，可以前几步用直接赋值：
    如：this.state.data = ‘new data’
    最后再统一调起 setState，如：this.setState(data: xxx)
* 尽可能的给每一个数组型的 dom 元素定死一个持久化的、唯一的 key，不要用随机值、遍历的 index 等不稳定的值；
* 精确控制 shouldComponentUpdate 和 componentWillUpdate，帮助 react 进行过滤。


相比 backbone reactjs 就是算是把“DOM 操作”精细化到极致的人，我们最终看到的页面上的东西，不是完全真实的，而存在在内存里的 虚拟DOM 某种意义上才是和你的数据模型完全对应的 dom。

---

## angular

angular 框架是三者中最大，当然也是最 “强” 的 MVC 前端框架。

### 基本特性

angular 本质上是一个 MVVM 框架，也就是 **数据模型-视图** 双向绑定框架，自己就能提供框架所需的全部功能，当然你也可以再加入其它 js 类库，不过那之前我建议你还是先去认真找一找 angular 是否已经有了 -_-。

从 MVC 的基本要点出发，这里简要说一下以下几种模块类型：

![angular](/img/mvc/angular.png)

为了让大家大致了解各部分是干什么的，先说一下任何一个 WEB 应用框架的主要流程大概都是这样的：

![angular](/img/mvc/web-app.png)

> 在这里又要吐糟一下了，Js 总体来说，要比一些成熟的面向对象语言要弱的多，不论从前端框架还是整个 JS 语言的进化来看，都是在不断的追随着如 JAVA、C 等高级语言

这样，我们从路由 ROUTER 入手，来一步步简要分析一下 angular。

~~~javascript 
angular.module('my_mvc', ['ngRoute', 'ngResource'])
  .config(function ($routeProvider) {
    'use strict';

    var routeConfig = {
        controller: 'IndexController',       //对应的 Controller
        templateUrl: 'js/views/index.html',  //对应的 html View 
        resolve: {                           //获取所需的 Model 操作对象 
            store: function (dataFactory) {
                //获取数据源
                return dataFactory.then(function (module) {
                    module.get(); // Fetch the todo records in the background.
                    return module;
                });
            }
        }
    };

    $routeProvider
        .when('/', routeConfig)
        .otherwise({
            redirectTo: '/'
        });
  });
~~~

在路由中，angular 就对 controller 、view、model 进行了明确的组装。
下面就来看看 controller、model 是怎么编写的。

~~~javascript
/**
 * 控制器 IndexController
 */
angular.module('my_mvc')
    .controller('IndexController', function IndexController($scope, store) {
    'use strict';
    
    //从 service 里取数据操作对象
    var datalist = $scope.datalist = store.datalist;
    //====为了测试用
    window.datalist = datalist;
    window.$apply = $scope.$apply;
    
    //计算数组元素的个数，并进行及时的监控
    $scope.count = datalist.length;
    $scope.$watch('datalist', function () {
        $scope.count = datalist.length;
    }, true);
    
    /*
     * 给页面提供的方法
     */
    //年龄加一
    $scope._addAge = function (data, event) {
        data.age = data.age + 1;
        store.edit(data)
    }
    
    //加一条记录
    $scope._insertData = function () {
        var _data = {
            id: new Date().getTime(),
            name: '小王' + ($scope.count + 1),
            age: 19 + $scope.count
        };
        store.insert(_data);
    }
    
});
~~~

~~~javascript
/**
 * 业务逻辑层 dataFactory
 * 这里用了 factory 的封装形式
 */
angular.module('my_mvc')
    .factory('dataFactory', function ($http, $injector) {
        'use strict';
        return $http.get('http//localhost/api')
                .then(function success() {
                    return $injector.get('http');
                }, function error() {
                    return $injector.get('localStorage');
                })
    
    })
    .factory('http', function ($resource) {
        'use strict';
        var store = {
            datalist: [],
            //用$resource构造 restful API 的 http 的远程接口
            api: $resource('http//localhost/api/data/:id', null, {update: {method: 'PUT'}}),
            //数据操作方法
            get: function () {
				return store.api.query(function (resp) {
					angular.copy(resp, store.datalist);
				});
			},
            edit: function (data) {
                return store.api.update({ id: data.id }, data)
					.$promise;
            },
            insert: function (data) {
                var realData = store.datalist.slice(0);

				return store.api.save(data,
					function success(resp) {
						data.id = resp.id;
						store.datalist.push(data);
					}, function error() {
						angular.copy(realData, store.datalist);
					})
					.$promise;
            }
        };
        return store;
    })
    .factory('localStorage', function ($q) {
        'use strict';
        var LOCALSTORAGE_ID = 'my_mvc';
        var store = {
            datalist: [],
            //通过的从 localstorage 存取数据的方法
            _getFromLocalStorage: function () {
                return JSON.parse(localStorage.getItem(LOCALSTORAGE_ID) || '[]');
            },
            _saveToLocalStorage: function (datalist) {
                return localStorage.setItem(LOCALSTORAGE_ID, JSON.stringify(datalist));
            },
            //数据操作方法
            get: function () {
                var deferred = $q.defer();
				angular.copy(store._getFromLocalStorage(), store.datalist);
				deferred.resolve(store.datalist);
				return deferred.promise;
            },
            edit: function (data) {
                var deferred = $q.defer(),
                    i;
                for (i = 0; i < store.datalist.length; i++) {
                    if(data.id === store.datalist[i].id) {
                        break;
                    }
                }
                store.datalist[i] = data;
                store._saveToLocalStorage(store.datalist);
                deferred.resolve(store.datalist)
                return deferred.promise;
            },
            insert: function (data) {
                var deferred = $q.defer();
                store.datalist.push(data);
                store._saveToLocalStorage(store.datalist);
                deferred.resolve(store.datalist);
                return deferred.promise;
            }
            
        };
        return store;
    })
~~~

这里要专门说一下 angular 的 service 层。做为一个前端框架，ng 的 service 层异常强大，直接把后台常用的 service 层概念都搬了过来，而且功能实现的都有模有样的。 

* 支持依赖注入 --- $injector (JAVA的一个卖点)
* 支持 restful 的接口调用 --- $resource
* 有三种表达形式 --- factory、service、provider

### angular 双向绑定机制的简要分析

Angular 通过 $watch、$apply、$digest 三个内方法来实现两端的监听

**$watch** 是 model 数据的变化监听队列

~~~html
<section id="mvcapp">
    <ul>
        <li ng-repeat="data in datalist track by $index" ng-click="_addAge(data)"}>
            姓名: {{data.name}}, 年龄：{{data.age}}
        </li>
    </ul>
    <p>点一下加一岁哦~</p>
    <p>共有{{count}}条记录<button ng-click="_insertData()">加一条记录</button></p>
</section>
~~~

每当有 controller 最的变量被“写”到模板里时，就 会在 $watch 里添加一条的监听

> 在说明 $apply、$digest 的功能前，先提问一个问题？
> 你有没有想过这个问题：
Angular 没有提供类似 get(‘data’)、 setState 的特定方法来在数据变动时视图的更新，而是简单的常规 js 对象赋值就能同步改变视图。  
比如：只是这样 data.age = data.age + 1 ，页面里的年龄就加了一岁。
要知道，事件监听只是页面 DOM 才有的东西，单纯 JS 数据可没有事件机制的。

？？？？？？？？？？？？？？？？？？

**Angular content** --- 双向绑定背景的重要概念

angular 实际没有直接对数据做出监听（本质上也不可能为到），angular 为自己营造了一个叫angular content 的运行环境，任何 “ng-”自定义事件的触发和带有”ng-”指令的 DOM 变化，都会调起下面要说的 $apply 指令，来进行下一步的更新工作。

在上面的 controller 代码中，**//====为了测试用** 的下面两行，我估意向 window 暴露了两个对象(方法)，当你直接通过 window.datalist 来修改数据时，页面视图是不会发生变化的，因为这个修改没有被 angular content 捕捉到。当你调用一下 window.$apply 时，页面又和数据同步了，因为 $apply 是调起页面渲染的功能。

angular content ---> $apply ---> $digest 流程如下：

![angular](/img/mvc/angular-liuchen.png)

### 渲染的优化点

…好吧，我只能假装一下有优化点

Angular 双向绑定的 $watch、$apply、$digest 机制比较固化，留给使用自己的改进很少。
其中 ng 的数据监听是重点，为了不漏掉任何一个可能会影响数据变化的情况，angular 生成的 $watch 比模板上能看到的要多，还好 js 的处理速度非常快，表现在页面上不会感觉到慢。（但的确比单向绑定框架更耗资源）

ECMAscript 6 中提到了新的特性 Object.observe 。希望浏览器内核提供原生支持后，双向绑定应该会变得更好。

---

总结：mvc 是一种思想，再优秀的 MVC 框架也不一定写出和符合 MVC 逻辑的代码，当然，即使没有 MVC 框架，也可以写出层级清晰的程序。
