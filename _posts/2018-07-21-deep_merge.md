---
layout: post
title: 深度复制方法
published: true
categories: 技术文章
tags: js lib
---

# 深度复制方法

一直在用的一个 Object 尝试复制方法，不断完善，算是比较成熟吧。

在 redux、vuex 这类状态管理框架中可以很有用的，你懂的。

直接上代码，代码不多：

```js
/**
 * 自有属性判断
 * @private
 */
function hasOwnProp(a, b) {
  return Object.prototype.hasOwnProperty.call(a, b);
}
/**
 * 是否是对象的判断
 * @private
 */
function isObject(input) {
  return input != null && Object.prototype.toString.call(input) === '[object Object]';
}
/**
 * 属性扩展方法
 * @private
 */
function extend(a, b) {
  for (var i in b) {
    if (hasOwnProp(b, i)) {
      a[i] = b[i];
    }
  }

  if (hasOwnProp(b, 'toString')) {
    a.toString = b.toString;
  }

  if (hasOwnProp(b, 'valueOf')) {
    a.valueOf = b.valueOf;
  }
  return a;
}

/**
 * 深度合并对象的方法
 *
 * @memberof bizKit
 * @param {object} parentConfig 被合并对象，此方法执行后不会修改 parentConfig
 * @param {object} childConfig 合并对象
 * @returns {object} 合并后的结果对象
 * @example
 * const a = {aa: 11, ab: {aba: 121, abb: 122, n: {x: 1}}, ac: [1,2,3,4]};
 * const b = {bb: 22, ab: {aba: 120, abc: 123, n: {y: 2} }, ac: [4,5,6]};
 * const ab = deepMerge(a, b);
 * // ab 如下：
{
  "aa": 11,
  "ab": {
    "aba": 120,
    "abb": 122,
    "abc": 123,
    "n": {
      "x": 1,
      "y": 2
    }
  },
  "ac": [
    4,
    5,
    6
  ],
  "bb": 22
}
 */
function deepMerge(parentConfig, childConfig) {
  var res = extend({}, parentConfig);
  var prop;
  for (prop in childConfig) {
    if (hasOwnProp(childConfig, prop)) {
      if (isObject(parentConfig[prop]) && isObject(childConfig[prop])) {
        res[prop] = deepMerge(parentConfig[prop], childConfig[prop]);
      } else if (childConfig[prop] != null) {
        res[prop] = childConfig[prop];
      } else {
        delete res[prop];
      }
    }
  }
  for (prop in parentConfig) {
    if (hasOwnProp(parentConfig, prop) && !hasOwnProp(childConfig, prop) && isObject(parentConfig[prop])) {
      res[prop] = extend({}, res[prop]);
    }
  }
  return res;
}

module.exports = deepMerge;

```

**TODO**

对于 Array 是直接替换的，没有做合并，一般也没有这个的使用场景。
后续更新一下 Array 合并的策略。

> npmjs 库里的 [deepmerge](https://www.npmjs.com/package/deepmerge) 是更加完善的方法，可以直接用这个。

<br />
