---
title: 使用Swiftype完成Ghost搜索功能
s: ghost-swiftype-guide
date: 2015-04-18 21:58:00
tags:
  - Ghost
  - Swiftype
---
不知道出于什么目的，Ghost并没有给出搜索功能，但是我们可以使用第三方服务来完成站内搜索，本文推荐使用[Swiftype](https://swiftype.com/)来实现这一功能（不仅仅说Ghost可以使用该服务，所有需要站内搜索的都可以，可以查看本站[blog.erguotou.me](blog.erguotou.me)体验）。
<!-- more -->
## 注册
OK，这一步不做过多介绍，应该都会，记得激活账号，激活后进入控制台主界面。
## 创建一个搜索引擎
![](/images/ghost/swiftype-create-engine.png)
选择左侧的“Create a search engine(standard web crawler)”，然后输入你的Ghost博客地址。接着系统会验证你输入的网址，验证成功后在弹出框中输入引擎名称。
## 安装搜索引擎
1. 在控制面板中切换至“install”，点击"Start Installation"。在"Appearance"中选择搜索引擎到外貌，这里我选择默认设置一直Next下去，最后点击"Save&Preview"。
2. 然后点击“Install Code”，将代码复制到你的Ghost中去（可以在default.hbs的body标签后面添加），完成后点击Next。
3. 在“Search Field”中根据自己的情况（一般Ghost博客没有搜索输入框）选择，这里我选择第二个“ No, my site needs an input field”，接着选择“Use the Swiftype search tab”，下面会有一个预览样式，然后点击Next。
4. 最后点击页面最下方的“Active Swiftype”就可以为你的Ghost博客提供一个样式不错的搜索引擎啦～
