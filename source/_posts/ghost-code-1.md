---
title: Ghost源码解读系列（一）目录结构
s: ghost-code-1
date: 2015-01-28 14:04:00
tags:
  - Ghost
seo:
  title: Ghost源码分析解读
---
**本系列文章以Ghost0.5.8安装版本为基础，后续版本升级时可能会做升级记录日志**
*由于个人水平和理解有限，可能部分地方没有给出分析或者解读有误，欢迎指正*
<!-- more -->
## Ghost目录结构
```
├content: 内容
　├apps: 以后Ghost开发的app会放在这个目录下，期待吧！
　├data: 数据文件夹，请勿修改此文件下任何内容，默认sqlite数据文件会存放与此
　├images: 图片文件夹，默认使用本地存储时，上传的图片会存于此处
　├themes: 主题文件夹，所有的主题文件夹存放于此，下面以默认的casper主题为例
　　├casper: 默认主题
　　　├assets: 资源目录，不做更多介绍
　　　├partials:
　　　author.hbs: 作者页面
　　　default.hbs:
　　　index.hbs: 首页
　　　page.hbs:
　　　post.hbs:
　　　tag.hbs:
├core: 核心模块
　├built: 用Grunt合并压缩后的js代码，不做展开介绍
　├client: 客户端代码，主要是js css font image等内容，后续详细介绍
　├server: 服务端代码，后续详细介绍
　├shared: 共享文件
　index.js: 服务器启动入口文件
.bower.json: bower文件配置
.config.example.js: 示例的配置文件
Gruntfile.js: grunt配置
index.js: 主入口函数，启动函数位置
LICENSE: LICENSE
package.json: 项目配置
PRIVACY.md: 隐私控制，可用的第三方功能说明，可以在config.js中修改
README.md: 项目说明文档
```
