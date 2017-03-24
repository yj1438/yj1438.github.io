---
layout: post
title: 简单有效的流式布局解决方案
---

# 简单有效的流式布局解决方案

> 上周未一个前同事（移动端的）找我，他们需要在一个 h5 页面中做个那种类似手机相册照片列表的流式布局，问我有没有类似的插件。
> 我也没用过这类插件，就给它说了一个实现思路。然后周一同事又找我，说是这个思路在图片很多的时候有缺陷啊（文末会说到），问了一下细节，是同事想简单了，代码却写复杂了点。
> 找时间我实现了个 demo，交付无误，就把这个 demo 分享出来。

## demo

[流式布局](/page/flow_layout.html)

## 关键代码

~~~javascript
// 记录每列的当前堆积高度
var heightArr = [];
/**
    * ==========================
    * 主要方法
    */
function flowAction() {
    var eles = document.querySelectorAll('.flow-container li');
    var i = 0, ele;
    while (i < eles.length) {
        ele = eles[i];
        if (!ele.classList.contains('show')) {
            ele.style.display = 'block';
            if (i >= COL) {
                // 第二行开始
                // 取其中最短的一行
                var minHeight = Math.min.apply(null,heightArr);
                var index = heightArr.indexOf(minHeight);
                ele.style.left = index * (100 / COL) + '%';
                ele.style.top = minHeight + MARGIN_TOP + 'px';
                // 重置这一行的高度为现有高度
                heightArr[index] = heightArr[index] + MARGIN_TOP + ele.offsetHeight;
            } else {
                // 如果是第一行
                ele.style.left = i * (100 / COL) + '%';
                ele.style.top = 0 + 'px';
                // 初始化每行高度
                heightArr[i] = ele.offsetHeight;
            }
            (function (_ele, _i) {
                setTimeout(function () {
                    _ele.classList.add('show');
                }, SHOW_DELAY + _i * SHOW_DELAY);
            })(ele, i % PAGE_SIZE);
        }
        ++i;
    }
}
~~~

## *前期的缺陷

同事实现的核心思路是对的，差别只是他是将图片元素**从上到下、从左到右**依次排列。比如：

~~~
1  2  3  4
5  6  7  8
9  10 11 12
...
~~~

大家可以自己去想一下这样实现的缺陷~~~？

