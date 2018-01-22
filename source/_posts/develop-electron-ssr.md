---
title: 记录在开发electron-ssr过程中遇到的问题
s: develop-electron-ssr
date: 2018-01-22 15:54:00
tags:
  - electron-ssr
keywords:
  electron,shadowsocks,shadowsocksr,electron-ssr,shadowsocksr客户端
---
# 在开发electron-ssr过程中的经验总结
首先是项目介绍，其实这个项目就是给`shadowsocksr-python`项目加一个GUI壳，所以它的功能就是为了FQ。[GitHub地址在这](https://github.com/erguotou520/electron-ssr)

其次，本文这里只记录这此在2017年底开始的重构经历，因为之前的代码写得实在比较乱（我一开始只是打算练习用的。。。）。OK，话不多说，下面进入正题。

## 脚手架
我们在开发一个完整的功能的时候往往不是从零开始做（因为那太费时间和经历了，还得自己维护项目框架），这里我是从[electron-vue](https://github.com/SimulatedGREG/electron-vue)项目初始化而来的。为什么用这个框架？跨平台用`electron`，前端开发用`vue`配合`webpack`，所以就选择了这个框架咯。

## 开发前的约定
之前其它分支的代码乱就是因为在开发之前没有做一个好的规划，然后就是哪用到什么就直接写，不方便后期维护和代码阅读。这次在开发之前做了几个简单的约定：  
- `ipc`通讯的`channel`要约定清楚，并且用常量定义，详见[https://github.com/erguotou520/electron-ssr/blob/redesign/docs/EVENT_LIST.md](https://github.com/erguotou520/electron-ssr/blob/redesign/docs/EVENT_LIST.md)
- 主进程代码在`src/main`目录维护，渲染进程代码在`src/renderer`目录维护，两者通用代码在`src/shared`目录维护，第三方库在`src/lib`目录维护
- 主进程和渲染进程都使用数据驱动开发的方式开发，渲染进程使用`vue`开发，主进程使用`rxjs`开发，2个进程间使用`ipc`进行数据变更通知和更新
- 主进程和渲染进程代码统一使用ES6语法编写

## 项目目录结构
有了开发约定好就开始撸码，有些代码是从之前的分支中复制过来稍作改变便可，而大部分则是全新编写。`src`目录的大致结构如下：  

```
src
├─lib
│ ├─proxy_conf_helper     # mac os上用于设置系统代理模式的helper
│ └─sysproxy.exe          # windows上用于设置系统代理模式的helper
├─main                    # main进程
│ ├─bootstrap.js          # 项目启动，初始化操作
│ ├─client.js             # shadowsocksr-python命令执行和终止
│ ├─data.js               # main进程的中央数据文件
│ ├─index.dev.js          # 开发环境的入口文件
│ ├─index.js              # 入口文件
│ ├─ipc.js                # 负责ipc通讯
│ ├─logger.js             # 日志
│ ├─pac.js                # 负责pac文件下载和提供pac地址
│ ├─proxy.js              # 设置系统代理模式
│ ├─tray-handler.js       # 任务栏操作方法
│ ├─tray.js               # 任务栏
│ └─window.js             # 页面窗口
├─renderer                # renderer进程
│ ├─assets                # 页面资源
│ ├─components            # vue组件
│ ├─qrcode                # 二维码识别
│ ├─store                 # renderer进程的中央数据
│ ├─views                 # 页面
│ ├─ipc.js                # 负责ipc通讯
│ ├─constants.js          # 常量定义
│ └─main.js               # 前端入口文件
└─shared                  # main和renderer共享文件夹
  ├─config.js             # 应用配置相关
  ├─env.js                # 应用环境相关
  ├─events.js             # ipc交互事件定义集合
  ├─ssr.js                # SSR配置对象
  └─utils.js              # 工具集
```

## renderer进程开发技术点
* 页面开发中用到了`vue` `vuex` 和`iview`组件库，其中`iview`稍微做了些修改。
* `vuex`作为前端数据中心，维护了很多页面数据，页面的修改都是维护`vuex`的`state`。
* 鉴于页面内容不是特别多就没有使用`vue-router`，而是使用简单的`component`配置`is`属性做页面切换。
* 整个页面开发中最饶人的是我把扁平的`configs`数组变成了按分组显示的树形结构，导致整个交互变得极其复杂，最后在绕来绕去饶了好几次后还是使用数据驱动开发的思维解决。

## main进程开发技术点
* 由于main进程使用`rxjs`作为数据维护中心，而我又是第一次使用`rxjs`，所以在初期就遇到了不少问题。比如多处文件可能会触发（ipc和tray都会触发）数据变更，应该怎么去编写和改变Observable数据，比如支持多播以及和renderer进程保持同步。最后还是在`data.js`中统一初始化和改变数据（对外暴露可改变数据的方法）并提供多播能力，其它文件在使用时直接`subscribe`关注，在变更时使用`data.js`暴露的入口进行数据变更。这样在开发时数据的维护会更方便，而且可以保持每个文件尽量只关注自己的业务。
* main进程最复杂的应该是设置系统代理功能。由于每个系统的调用方法不一致，所以要收集所有系统的实现方式，可以草考[https://github.com/erguotou520/electron-ssr/blob/redesign/docs/AUTO_PROXY.md](https://github.com/erguotou520/electron-ssr/blob/redesign/docs/AUTO_PROXY.md)的收集结果（Linux系统中非gnome桌面如何实现还没有找到方法，如果你知道，欢迎提issue告知）。  
  理论知道了只是第一步，实现是第二步。开开心心地用`child_process.exec`执行命令，开发时一切正常，happy。然而到了打包的时候懵逼了，没有可执行文件了。OK，我放到`static`目录下，还是不行，因为这些文件还是在`asar`压缩包里，没法复制和执行。最后在`electron-builder`中找到了`extraFiles`字段，就是用来将文件复制到项目根目录下的（如何找到项目根目录也是个坑，得使用app.getPaht('exe')来实现`）。  
  目前还有一个问题也是mac上实现最大的问题。mac上使用`networksetup`设置需要`sudo`权限，而如何实现只弹框输入一次管理员密码就可以一直修改系统代理模式才是最大的难题。一开始使用`networksetup`命令实现时每次切换都需要输入密码，很烦。后来参考`shadowsocks-NG`项目，直接将它生成的`proxy_conf_helper`文件复制到项目里使用，但目前在打包后还是会闪退，目前仍在查找实现方案。

## 其它的坑
* 配置向下兼容。如果再后期维护时添加了新的系统配置项，需要在系统初始化时复制到应用配置对象中并保存。
* 异常处理。错误文件？端口占用？
* 在更新订阅服务器时，同时使用`window.fetch`和`electron.net.request`来请求数据，并使用`Promise.race`来选择最快完成的数据。

## 最后
如果你喜欢这个项目，欢迎来star。如果你觉得这个项目对你有帮助，[欢迎来打赏](https://github.com/erguotou520/donate)。