---
layout: post
title: VR基础&页面级应用(1) --- 方向
---

# VR基础及其在页面级应用(1) --- 方向

> “文字说明不想看~ ！？”，直接[“点击这里”](#anchor3)看例子

## 技术背景

今年国际技术的主要着力点在于两个方向：

1. **VR (AR/MR)**
2. **人工智能**

VR 这种在十几年前只能出现在科幻电影里的技术，在如今，随着各方面技术成熟而全面暴发。

2016年被称为 VR元年，不管是硬件，还是软件，都有非常给力的作品正式出现在人们的生活中。

IT技术上，刚刚过去的一年一度电商盛事双11，让各个公司技术团队相互较着一股暗劲。
前端方向上，都不约而同的将类 vr 技术运用到了各个大型促销活动的页面中。

> 这场整个中国电商对决的大事件，经过几年的演化，已经不仅仅在促销、推广、渠道等几个硬实力上一决高下，
所映射出的资金、技术、影响力、文化等等方面也体现出各个电商的软实力。

淘宝的"ZAO"；京东的品牌街；1号店的品类空间都做得非常给力。(个人认为1号店的最牛，3D场景、3D视野展示)。相信以后这类技术会在更多的场景中有所应用。

以下就简要说一下这类技术的基本核心 --------- **方向**。

## 陀螺仪的作用

设备的方向感知是依靠陀螺仪进行的。这个主题的文章在网上数不胜数，有兴趣可以自己去搜一下陀螺仪的原理。

以常用的三轴陀螺仪为例，它的作用就是在我们生活的这个三维空间中，总以一种稳定的位置形态存在，不会随着外界的3d旋转而改变。
通过这种能力，以稳定的陀螺仪作基准角度参照，我们就可以知道设备在各个方面上的旋转角度。

![alt](/img/gyroscope.gif)

当然，以上这些对表现层的开发者来说是透明的，我们只关心它的最终产出 ------ **三个维度的旋转角度**。

## deviceorientation 事件

HTML5 接口中提供了一个获取设备旋转角度的接口：`deviceorientation`。

~~~javascript

    window.addEventListener('deviceorientation', function (evt) {
        evt.alpha                   // alpha 轴角度
        evt.beta                    // beta 轴角度
        evt.gamma                   // gamma 轴角度
    }

~~~

### alpha

此角度是指设备沿着垂直屏幕的轴的旋转角度，范围是 0~360。

![alt](https://developer.mozilla.org/@api/deki/files/5695/=alpha.png)

这个最容易理解，就是手机屏幕旋转的角度。

### beta

此角度是设备沿着屏幕左至右方向的轴的旋转角度，范围是 -180~180

![alt](https://developer.mozilla.org/@api/deki/files/5696/=beta.png)

这个角度就是正握手机，**前后**倾斜的角度(相对水平面)。因为分“向前倾斜”和“向后倾斜”，所以在范围上也就有了正负值的区别。

### gamma

此角度是设备沿着屏幕下至上方向的轴的角度，范围是 -90~90

这个角度是正握手机，**左右**倾斜的角度(相对水平面)。

> 敏感的人在此处应该会有一个疑问，为什么范围 只有 180 度，这样不就在实用会造成空间维度缺失吗？
笔者接着试验中也发现，gamma 角度过了边界值，就会发生正负跳变，导致旋转混乱，不明白为什么这样设计。
找了不少材料，大致明白了其中原因。有兴趣的人可以自行百度 “万向锁现象” 和 “全角度解算”。
这是一个数学、空间几何、计算机科学的一个小难点。

### absolute*

有些设备/浏览器还是提供一个 absolute ，这是相对地球坐标系统还是相对设置坐标系统的一个标识，根据设备采用的不同陀螺仪会有不同。实际应用中，影响还是很大的。
笔者的例子中，那个方向骰子，“东南西北”方向有可能不准，就是受这个参数所致。

### compassHeading*

在有些浏览器中，还会有 compassHeading/webkitCompassHeading 这样一个参数，这就是罗盘方向值，通过这个可以将 alpha 角度校准到地球坐标。

## 最终上干货

上面整了一堆“没用的”，直接看例子吧~~~，页面中有原码，有兴趣也可以自行研究。

这类技术有非常强的通用性，网上的相关文档都非常全，核心代码实现也不是很多，重点在于理解，更在于实际的应用场景。

* [三维方向旋转](/page/vr/3drotate.html)
* [beta、gamma 角度重力掉落](/page/vr/gyroscope.html)

(下一篇：[VR基础&页面级应用(2) --- 速度](/2016/12/07/vr_acceleration.html))

---

> 参照：  
[1] [https://developer.mozilla.org/en-US/docs/Web/API/Detecting_device_orientation](https://developer.mozilla.org/en-US/docs/Web/API/Detecting_device_orientation)  
[1] [https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Orientation_and_motion_data_explained](https://developer.mozilla.org/en-US/docs/Web/Guide/Events/Orientation_and_motion_data_explained)  
[2] [https://en.wikipedia.org/wiki/Gyroscope](https://en.wikipedia.org/wiki/Gyroscope)