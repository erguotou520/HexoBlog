---
title: 个人项目[rust-http-server]
s: http-server
date: 2025-02-12 13:29:00
# cover:
# thumbnail:
tags:
  - Rust
  - http-server
  - 我开发的
---

# 🚀 rust-http-server - 极简HTTP服务器

多年没有更新博客了，不过工作期间倒是在做项目中提炼了一些项目和工具，现在开始整理下这些项目并记录下。

做前端的或许都知道`http-server`或者`serve`模块，它们都是用来快速启动一个http服务，方便本地开发调试和提供简单的文件服务。我也想复现一个，并学习下`Rust`语言，于是就开始了入坑之旅。

为什么用Rust再造一个HTTP服务器？

## 🌟 项目背景：现有工具的痛点

作为前端开发者，你是否厌倦了这些场景？

- 每个项目都需要配置一次`nginx`
- 调试nginx配置时频繁修改`.conf`文件
- 启用压缩可能需要安装额外的`nginx`模块
- 代理配置繁琐，SPA 项目每次都需要`try_files`
- 想快速实现文件上传却要额外搭建服务

这就是我开发Rust HTTP Server的初衷 - 一个专为现代前端部署优化的全能服务器，在单二进制文件中集成了你需要的一切功能！

<!-- more -->

## ⚡️ 核心差异：为什么选择它而不是nginx/http-server？

1. 极简主义哲学

- 9MB超轻二进制
- 零配置启动：./hs 即刻运行（默认当前目录）
- 多模式切换：列表/SPA/服务器模式按需切换，无需`try_files`

2. 为前端而生

```bash
# 一键启动SPA应用 + API代理 + WebSocket代理
hs -m spa -P "/api->后端地址" -W "/ws->即时通讯服务"
```

- SPA/列表/服务器模式随意切换
- SPA模式自动 fallback 到`index.html`
- 自动压缩 + 智能缓存控制开箱即用

3. 用户友好特性

- 文件上传：`-u` 参数秒启上传接口
- 浏览器自动打开：`-o` 提升调试体验
- 容器化友好：镜像仅9MB

  ```bash
  docker run -p 8080:8080 -v $PWD:/app erguotou/hs
  ```

4. Rust赋予的超能力

- 🚀 比Node.js实现快3-5倍的请求处理
- 🔋 内存占用降低70% (实测对比http-server)
- 🔒 无GC + 内存安全保证

（根据 benchmark 测试，暂时还达不到 nginx 那样的性能，就不吹了，后续有能力再优化）

## 🛠️ 特色功能详解

- 混合代理架构

  ```bash
  hs -P "/api->http://localhost:3000" -W "/ws->ws://echo服务"
  ```
- 同时支持HTTP/WebSocket代理
- 自动目录列表（类似`http-server`）
- 正则忽略隐藏文件：`--ignore-files "^\.|DS_Store"`，默认隐藏`.`开头的请求，防止泄露隐私
- 自定义404页面：`--custom-404 /404.html`
- 基础认证：`-s username:password`

## 🎯 如何开始使用？

项目地址：[https://github.com/erguotou520/http-server](https://github.com/erguotou520/http-server)

```bash
# 一键安装
curl hs.erguotou.me/install | bash

# 启动！(自动打开浏览器)
./hs -o
```

立即体验极简部署的魅力，让这个用Rust打造的神器解放你的生产力！⚡️
