---
title: 个人项目[wenhui]
s: wenhui
date: 2025-02-16 13:24:00
# cover:
# thumbnail:
tags:
  - Bun
  - ElysiaJS
  - doc
  - 我开发的
---

# 🚀 文汇 - 文档管理平台

在企业应用开发过程中，我们经常需要提供各种合规文档，比如`隐私政策`、`用户协议`、`免责声明`等，这些文档通常需要定期更新，以确保它们符合最新的法律法规和公司政策。当我们在小程序中集成这些文档时，通常需要手动更新，非常麻烦，而且需要重新审核，同时网页端应用可能也要展示这些文档，所以一个可以同时服务多端的文档管理工具就比较重要。这也是我创建`文汇(wenhui)`项目的初衷。

项目的整体框架我是直接从之前的[sync-gitea-server](https://github.com/erguotou520/sync-gitea-server)项目中继续迭代过来的，所以在开发和配置上会有很多相似的地方。

后来业务上需要使用本服务多项目较少，所以没有继续迭代。未来可扩展的一些方向有文档复制、文档搜索、文档统计等等，也可以做成商业化产品。



文汇是一个文档管理平台，旨在帮助用户更高效地管理和利用文档资源。它提供了一个集中存储、组织和检索文档的系统，同时支持文档的协作和共享。

我为项目创建的 slogan 是：

> 「汇聚文档，赋能应用」 (Where docs meet apps)

<!-- more -->

## 预览

- 首先是登录页
![login](images/wenhui/login-page.png)
- 登录后创建应用并查看列表
![list](images/wenhui/apps.png)
- 应用中的文档列表
![docs](images/wenhui/docs.png)
- 应用支持微信小程序的域名验证
![weixin-dev](images/wenhui/weixin-dev.png)
- 文档详情
![doc](images/wenhui/doc-detail.png)

## ✨ 特性

- 内置自适应网页模板，发布的文章支持 PC 端和移动端查看
- 支持邀请和协作编写
- 支持文档的版本管理
- 支持文档的权限管理
- 支持微信小程序业务域名验证

## 🎯 使用方法

使用 Docker 部署，容器镜像是`erguotou/doc-hub`，只需要暴露 9100 端口，挂载`/app/db`，并按需配置以下环境变量：

- `PORT`：服务器端口，默认为`9100`
- `LOG_LEVEL`：服务器日志级别，默认为`info`
- `JWT_SECRET`：JWT令牌的密钥
- `PUBLIC_URL`：本服务的公共URL

## 🛠️ 开发

项目使用 bun 进行开发，首先需要安装：

```bash
curl -fsSL https://bun.sh/install | bash
```

然后安装依赖

```bash
bun i
```

启动开发环境

```bash
# 启动服务端
cd packages/server
bun dev

# 启动网页端
cd packages/web
bun dev
```
