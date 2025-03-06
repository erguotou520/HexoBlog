---
title: 个人项目[sync-gitea-server]
s: sync-gitea-server
date: 2025-02-14 13:24:00
# cover:
# thumbnail:
tags:
  - Bun
  - ElysiaJS
  - gitea
  - CI/CD
  - 我开发的
---

# 🚀 sync-gitea-server - 代码仓库同步工具

我们开发时的代码仓库一般都放在阿里云效上，刚开始我们尝试使用云效自带的流水线来实践CI/CD流程，但是云效有很多限制，甚至绑定了阿里云的体系，导致很多场景没法实现自动化，于是我们将CI/CD流程迁移到内网实现。我们对比了一些开源方案，最终选择`Gitea`作为代码同步仓库，并使用`Gitea`自带的`Actions`来实现CI/CD流程。`Gitea`的几个特点正好符合我们的需求：

- 轻量级，资源消耗少，部署简单
- 支持兼容`Github Actions`的语法来实施CI/CD流程，可以直接服用现有的大量`Actions`能力
- 支持`LDAP`认证，可以直接使用内网的用户体系

唯一的问题是无法实现自动、实时地从云效同步代码到`Gitea`，于是我开发了`sync-gitea-server`项目，用于实现自动、实时地从云效同步代码到`Gitea`。项目的整体框架我是直接从之前的[fake-sms](https://github.com/erguotou520/fake-sms)项目中复制过来的，所以代码结构上会有很多相似的地方。

`sync-gitea-server`是一个用于同步代码仓库的 webhook 服务器。当上游代码仓库（如云效）发生变更时，它会向此服务器发送webhook 事件，服务器随后调用`Gitea` API 来同步这些变更。

通过这个服务器，我们可以实现代码仓库的自动、实时同步，无需人工干预。目前该项目已经在我们内网运行，新项目都已经接入，非常稳定。

## 🖼️ 预览

![apps](https://github.com/erguotou520/sync-gitea-server/blob/main/assets/apps.png?raw=true)

![sync-url](https://github.com/erguotou520/sync-gitea-server/blob/main/assets/sync-url.png?raw=true)

<!-- more -->

## ✨ 特性

- 🚀 易于使用：只需在平台上创建应用程序，并配置云效代码仓库对应的 webhook 密钥，然后将生成的同步地址填到云效的 webhook 配置中
- 🔄 实时同步：通过 webhook 实时触发代码同步
- 🔐 安全可靠：支持 webhook secret 验证，确保请求来源可信

## 🎯 使用方法

使用 Docker 部署，容器镜像是`erguotou/sync-gitea-server`，只需要暴露 7879 端口，挂载`/app/db`，并按需配置以下环境变量：

- `PORT`：服务器端口，默认为`7879`
- `LOG_LEVEL`：服务器日志级别，默认为`info`
- `JWT_SECRET`：JWT令牌的密钥
- `PUBLIC_URL`：本服务的公共URL，用于接收 webhook 事件
- `ENABLE_LOG_IP`：是否在 webhook 事件中启用 IP 地址记录，默认为`false`
- `GITEA_URL`：`Gitea` 服务器的 URL，作为所有应用的默认值
- `GITEA_TOKEN`：`Gitea` 用户的令牌，作为所有应用的默认值，在`Gitea`的`用户设置`->`应用`中添加生成
- `DISABLE_REGISTRATION`：是否禁用注册功能，默认为`false`

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
