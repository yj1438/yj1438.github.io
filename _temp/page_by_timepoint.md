# 时间断点分页策略

我们平日的业务开发中，列表作为一种很基本的数据组织形式出现在各类业务需求中。

上一周的开发中，遇到了一个平日也会经常见到的列表分页需求：

1. 列表数据在本地做持久缓存，正常情况下不允许刷新缓存；
2. 按由新到旧的时间倒序排列；
3. 上拉到底加载较“旧”的一页；
4. 下拉刷新加载较“新”的一页。

这实际就是大家经常看的比如今日头条、网易新闻等客户端中新闻列表的分页方法。

但在实践中，后台改了好几次分页查询方法才把这个问题搞定，当然这也有一些业务的历史遗留原因。在这里，就把这个看似简单分页策略来捋一捋。

## 业务场景模拟

咱们先来假设正常用户的使用所产生分页场景，假设一页是10个新闻：

* 用户一进来，需要取最新的10个新闻；
* 拉到最底部，再取得比上一10条的最旧的新闻还“旧”的10个新闻，再拉，继续这一步；
* 在最项部下拉刷新，会获取比当本地所有新闻还“新”的10个新闻，再刷新，继续这一步；

## 前端发请求的参数规则

好了，就这么简单，从上述的需求中，我们总结下，远程拉新闻，就是“比新的新”、“比旧的旧”。因此我们需要两个时间戳变量：`last_ts`、`oldest_ts`，来保存本地新闻中`最新`、`最旧`的两个时间。

我们向后台发请求时，当然还需要一个参数 `before_or_after` 来控制是 `比x新`、`比x旧`，`x` 就是给后台传的基准时间戳，我们定为 `markTs`。


~~~
比新的新：
markTs = last_ts;
before_or_after = 1
~~~


~~~
比旧的旧：
markTs = oldest_ts;
before_or_after = 0
~~~

对前端来说，这就结束了

## 后台的查询排序规则

后台收到这两种参数时，基本的查询条件如下：

~~~~
比新的新：
x.create_ts > markTs order by create_ts asc limit
~~~~

~~~~
比旧的旧：
x.create_ts < markTs order by create_ts desc limit
~~~

如此，查询出的结果就是符合我们需求的新闻了。

## 注意点

结果是对了，但是在数据处理上，还有一些需要注意的地方： 

1. 比新的新取出的数据是正序的，需要前端自己进行倒序处理；
2. 如果是不稳定的排序，比如使用 update_ts 进行后台排序参数，这个时候，前端要做的就不是简单的合并两个列表了，还需要在这之前把本地缓存列表中，出现在新拉取的列表的记录给删除掉。


