---
title: NodeJs分享
s: nodejs-share
date: 2016-04-26 20:50:25
tags:
- NodeJs
---

*技术分享以及项目实践*

## 目录
* 起源
* 特性
* 发展
* 影响
* 安装
* 生态圈
* 项目应用

## 起源
### Nodejs是什么？
* 服务器端运行的 Javascript
* 基于 Google Chrome的javascript engine V8
* 事件驱动，无阻塞 Evented,no-blocking
* 扩展js语义：增加了模块化
* 大约有8000行 c/c++代码，2000行 js 代码

另外这里有一篇在线的文章[深入浅出Node.js](http://book.51cto.com/art/201311/417099.htm)可以参阅。

### 特性
* 支持高并发
* 异步io

### 发展
#### Nodejs版本
在和`io.js`合并之前一直维持着`0.x.x`版本，但是和`io.js`合并后就已经开始是`4.x.x`，`5.x.x`甚至`6.x.x`。

### 影响
由于js语法简单，掌握起来非常快，且大多数开发者都比较熟悉，所以上手很快。再加上有npm库的支持，使得nodejs开发也是很快，而且是越发展越迅猛的势头。它可以运用于许多场景，不仅仅是web开发，可以做桌面应用，手机App，可以命令行等等。

* 在web通讯中运用最广的应该是`socket.io`，它可以应用到web实时通讯，可以用于游戏通讯，可以用于在线开发工具通讯或者热重载等等。
* 在服务器领域最火的应该是`express`，用它开发web服务器非常快而且性能不错。
* 在用户身份认证方面使用最多的应该是`passport`，它为身份认证提供了统一的接口，支持本地身份认证和各种第三方身份认证。
* 在桌面应用开发方面有`nw.js`和`electron`，相对来说`electron`更好，而且Github官方出的开发工具`Atom`就是使用`electron`开发的。使用它们开发的工具还有很多，包括`slack` // todo
* 在手机App方向应用最火的、热度最高的应该算是`ionic`和`React Native`，前者借助于`Angularjs`和`PhoneGap`可以实现用js开发跨平台的手机应用。后者是Fackbook依赖于其`React`推出的手机应用开发套件，其火热程度非同一般。
* 其它更多的产品等你发现和分享。

### 安装
Nodejs环境的安装方法各平台不一致，但都比较简单。非windows平台建议使用`nvm`进行nodejs的安装和版本管理。
#### 全局安装模块
使用npm安装全局模块`npm install -g some-module`
#### 本地安装
使用npm安装本地模块`npm install some-module`，它有2个常用的参数`--save`和`--save-dev`，分别表示将该模块依赖信息保存到`package.json`的`dependencies`和`devDependencies`，分别表示运行时依赖和开发时依赖。这样项目发布出去后别人就可以通过`npm install --production`和`npm install`命令将依赖安装上。
#### 安装指定版本或指定tag
* 安装指定版本 `npm install some-module@1.3.0`
* 安装指定tag `npm install some-module#dev`
* 更多其它的安装条件在这里不做说明

#### 更新
更新可以直接重新安装也可以使用update命令`npm update [-g] some-module`

#### 卸载
对应于install命令有uninstall命令，使用方法和install一致`npm uninstall [-g] [--save|--save-dev]`

#### 一些说明
* npm的包大多是嵌套的，即包A依赖包B，包B又依赖包C，npm会处理所有的依赖关系并全部安装（npm 2和npm 3有所区别，npm 2是在每个包下安装其所有的依赖包，包括嵌套依赖，而npm 3会先分析包的依赖关系，将依赖扁平化，减少重复依赖）
* 由于国内网络管制原因，可能有些包在安装时会出现失败，如果出现失败，建议使用国内npm源，比如cnpm等。个人喜欢使用`nrm`进行管理

```bash
npm install -g nrm
nrm ls
nrm use taobao # 这里使用的是淘宝源
```

### 生态圈
Nodejs的生态圈主要靠npm(node package manager)。这里面有成千上万的工具，每天更新的包数量就有//todo
当我们需要使用node开发某些功能时要善用npm，因为它里面已经有很多现成的包，不需要我们重复造轮子，直接拿来用就可以了。
我们可以通过npm search或者去[npm官网](https://npmjs.org)搜索，输入关键词，找到包后查看其说明，如果是我们想要的，那就`npm install`它吧。

### 项目应用
此次精总前端项目就大量使用了Nodejs的相关技术。

* 包安装。使用npm（npm也是很多前端库文件的发布目录，bower等已经不适合现在的趋势）将项目使用的框架文件安装到本地并使用node的文件模块将其复制到我们的项目目录中（多这一步是因为我们没有采用开发时编译的思路，因为这对框架的搭建和开发学习的成本要求较高）
* `gulp`任务。使用`gulp`添加开发时任务`gulp dev`，包括代码风格检查和预编译语言的实时编译以及浏览器自动重载等。还有其它的包括js文档生成任务和文档查看服务器任务等。
* 源代码的构建。使用nodejs生态圈中的构建工具对源码进行构建，生成服务发布的目录文件，主要是对代码进行合并压缩和版本控制。
