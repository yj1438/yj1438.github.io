---
layout: post
title: MVC 架构简介
---

# MVC 架构简介

> MVC 是一个软件框架模式。自从 1982 被提出至今，MVC 一直存在于软件行业的各个领域，
为整个软件的基础架构设计、层级设计、模块划分、代码组织逻辑等等行为提供有力的理论支持

## 知识背景

上世纪 80 年代初，全球图形界面软件快速发展，在软件规模不断变大的情况下，需要一种明确的软件框架模式对大中型软件进行合理规划。
Xerox PARC 提出了 **模型－视图－控制器（MVC）** 模式，进行框架层级的划分和代码上的分离。

![MVC frame](/img/mvc/1.png)

MVC 提出后被各个图形软件广泛采用。因其具有清晰的逻辑层次和优秀的工程管理性质，被企业软件巨头之一的 Oracle 用在了 J2EE 平台软件的设计模式上。
随着 J2EE 的兴盛和软件面向对象设计的普通采用，MVC 的思想在软件各个领域都大放异彩。

## 框架思想哲理

> 写书是人类表达和展示自己的思想的重要方式

在老老年间，古人们写书或复制书就只能用手写，直接将字手写在纸上。数据的来源和展现都通过纸面这唯一中间过程。行为不可完全复制。

![MVC frame](/img/mvc/2.jpg)

后来，活字印刷术的出现将上述过程进行统一标准化。将整个过程划分为三部分： 

![MVC frame](/img/mvc/3.jpg)

* 统一的、持久化的数据源：活字 （Model）;
* 标准化的业务逻辑过程：排版 （Controller）;
* 纯粹的渲染展示：印刷 （View）;

如此一来，整个印刷过程根据侧重点的不同分为三部分。每一部分在业务上能够做到相对独立，复用程度提高，后期的维护也简单不少。

MVC 的思想其实在我们生活的各个方面都有展现。将普通作业进行工程化改造，有利于作业过程管理，思维上更加清晰明确。提高工作效率和后期维护度。

## MVC 在软件框架上的具体体现

（以 babytree 为例，简单说一下 MVC 在软件系统前后台的体现）

（。。。）

### bbt 后台 MVC 简要说明

#### 文件组织结构

* Controller : `baby/classes/Babytree/Controllers`

![MVC frame](/img/mvc/5.png)

> 例如一个 Controller 文件 baby/classes/Babytree/Controllers/**XXX/indexController.php**  

~~~php  
class indexController extends WebSiteController {
    
    /**
     * 这是一个 action 
     * 对应的 url /XXX/index/index
     */
    public function indexAction() {
        //组织一些数据
        $data = array(
            type => '前端',
            lessons => array(
                'javascript',
                'css',
                'html'
            ),
            other => null
        );
        //将相关数据输出到页面上
        $this->assign('data', $data);
        //选择模板进行渲染
        return $this->htmlView('tmpl/XXX/index_tpl.php');
    }
    
}
~~~

* View : `baby/tmpl`

![MVC frame](/img/mvc/4.png)

> 和上面 Controller 对应的模板文件 baby/tmpl/**XXX/index_tpl.php**  

~~~html
<section><h1>你需要掌握什么核心专业知识?</h1>
    <div>你是<span><?php echo $data['type']?></span>工程师</div>
    <ul>
        <?php foreach($data.lessons as $i => $v){?>
        <li anchor="lessons"><?php echo $v?></li>
        <?php }?>
    </ul>
    <p><label>还有补充的吗？<input type="text" value="<?php echo $data['other']?>"></label></p>
    <p><textarea style="width: 300px;" rows="5" placeholder="总结一下学习计划">总结一下吧</textarea></p>
</section>
~~~

* Model : `baby/classes/Babytree/Models`

![MVC frame](/img/mvc/6.png)

> Model 中主要是业务中抽象出来的数据模型，比如以上的

~~~php
class Model {
    
    function __construct() {
        $this->type = '前端';
        $this->lessons = array(
            'javascript',
            'css',
            'html'
        );
        $this->other = null;
    }
}

//用 new Model() 可以获得一个数据实例
~~~

从数据到视图的流程大致如下：

![MVC frame](/img/mvc/lichen.png)

### 主流前端框架的 MVC 简要分析

下面，以 `backbone`、 `angularjs 1`、 `reactjs` 为例，简要说明一下当 MVC 做为前端的一个新兴的事物，是如何被我们所利用的。

#### Backbone

Backbone 框架是三者中最简练，但是最标准的 MVC 前端框架。

##### 基本特性

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

##### （视图）模板渲染原理

backbone 是弱单向的数据绑定框架，你只能手动的将所需的数据事件绑定到指定的 Model 上，完全没有视图端的数据变化监听，也不去管数据变化后视图怎么变。它把 render 方法抛给了用户，完全由用户决定怎么弄。  
backbone 官方实际引导大家使用一个 简单、粗暴、有成效 的方式，就是 **整个重新渲染** ，而不是“细致”的根据变化的数据来去操作 DOM 一个一个的改。  
这实际也是 MVC 的一个核心思想：**数据启动** --- 用户不应该直接操作视图，应该把重心放到数据和业务逻辑上来。

> 注：**整个重新渲染** 在很多情况下并不粗暴，也是有性能考虑的根据的，dom 的频繁改动是页面性能的一个痛点，与其改10个，不如一次换1个，除非你能做到极致。

#### angular

Backbone 框架是三者中最大，当然也是最 “强” 的 MVC 前端框架。

##### 基本特性

angular 本质上是一个 MVVM 框架，也就是 **数据模型-视图** 双向绑定框架，自己就能提供框架所需的全部功能，当然人也可以再加入其它 js 类库，不过那之前我建议你还是先去认真找一找 angular 是否已经有了 -_-。





