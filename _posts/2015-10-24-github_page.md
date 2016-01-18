---
layout: post
title: GitHub Pages（Jekyll + markdown + less）
---

# 用 github + jekyll 搭建个人站点

> 
在 GITHUB 上搭建个人技术站点

## github IO repositorie

## 本地 jekyll 安装及设置

### clone github IO 站点项目到本地

### *gem sources

gem sources 

gem sources -a https://ruby.taobao.org

gem sources -r ___url___

### 安装bundle

gem install bundler

### 安装jekyll (github-pages)

* 在本地的 github IO 项目下新建 Gemfile 文件，添加 `gem 'github-pages'` ，然后执行 `bundle install`

* 在本地的 github IO 项目下新建 Gemfile 文件，内容如下

```
source 'https://ruby.taobao.org'
gem 'github-pages'
```

再执行 `gem install github-pages`

### jekyll 配置

在本地的 github IO 项目下新建 _config.yml 文件，内容如下：

```
github: {
    "version": {},
    "author": "yinjie",
    "hostname": "https://github.com/yj1438/",
    "pages_hostname": "http://yj1438.github.io/"
}
source: ./
destination: ./_site
plugins: ./_plugins
safe: true

# Conversion
#markdown: kramdown
highlighter: pygments
markdown: rdiscount
rdiscount:
   extensions:
     - footnotes
lsi: false
excerpt_separator: "\n\n\n\n"
incremental: false

# Serving
detach: false
port: 4000
host: 127.0.0.1
baseurl: "" # does not include hostname

encoding: "utf-8"
markdown_ext: markdown,mkd,mkdn,md

```

官方给出的默认配置与网上许多配置都会在翻译 Markdown 语法时出各种情况，
以上配置是个人尝试后给出的最靠谱配置，尤其对 Markdown 中的代码样式翻译的最好，
加上 highlight.js 和 gist.css, 所呈现出来的各类语言的样式都很优秀

### 启动 jekyll

bundle exec jekyll serve

## jekyll 基本使用方法

## LESS 插件使用

每个 LESS 文件前面必须添加空 YAML font matter 

安装`gem install less`

```
---
---
```

github 下不支持自定义插件，可以在编写的时候用 less-watch 及时转译 less 文件


## 