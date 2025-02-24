---
title: 个人项目[fake-sms]
s: fake-sms
date: 2025-02-14 12:00:00
# cover:
# thumbnail:
tags:
  - Bun
  - sms-provider
---

这是一个搁置了的项目，原本是想要在多项目中使用，但是后来没有项目可应用，就暂时搁置了，但是我觉得它还是很有价值的。项目整体流程没有得到完全的测试，可供参考，请不要在生产环境使用。

## 💡 项目：fake-sms

`fake-sms`是一个用于测试基于短信的应用程序的模拟短信服务器，在项目开发时使用它来代替真实的短信发送，可以减少企业在测试环境中的成本。

默认情况下，`fake-sms` 与 `Casdoor go-sms-sender` 兼容。

🌐 在线体验: https://fake-sms.erguotou.me （家中服务器，暂时关闭）

## 🖼️ 预览

![apps](https://github.com/erguotou520/fake-sms/blob/main/assets/screen1.png?raw=true)

![notifications](https://github.com/erguotou520/fake-sms/blob/main/assets/notifications.png?raw=true)

<!-- more -->

## ✨ 特性

- 🚀 易于使用：只需在平台上创建应用程序，并在`Casdoor`中配置对应的`appId`和`appSecret`
- ⏱️ 实时推送：通过`websocket`实时推送短信内容
- 💰 节省成本：测试环境无需发送真实短信

## 🎯 使用方法

1. 在[https://fake-sms.erguotou.me](https://fake-sms.erguotou.me)上登录/注册
2. 创建新应用
3. 点击应用底部的设置图标，将`appId`和`appSecret`保存到您的短信提供商数据库中，如下所示：

| 提供商名称 | App ID | App Secret | 模板 |
|------------|---------|------------|------|
| Infobip SMS | jOFwCWm0aYV21brgWnqbQ3lALXmoPAkX | HgD7lCijmU68Nf6BDL3TNSwA27FQdf1JTxR40K0Gz07OmfuaxlcwZTX4R5PDJOzz | Hello, your code is {code} |

注意：目前提供商名称必须是`Infobip SMS`。

4. 使用基于`casdoor/go-sms-sender`的服务器发送短信
5. 点击应用底部的聊天图标，将显示共享消息面板。在共享消息面板中查看服务器发送的短信消息。

## 📱 客户端

- Chrome 扩展：下载 zip 文件并解压，然后在浏览器中访问`chrome://extensions/`，启用开发者模式，加载解压后的文件夹作为未打包扩展。
- Microsoft Edge 扩展：下载 zip 文件并解压，然后在浏览器中访问`edge://extensions/`，启用开发者模式，加载解压后的文件夹作为未打包扩展。
- 共享消息面板：如果您只想监听自己的手机消息，请使用链接[https://fake-sms.erguotou.me/#/messages?type=phones&topics=13800138000](https://fake-sms.erguotou.me/#/messages?type=phones&topics=13800138000)

## 🛠️ 开发

项目地址：[https://github.com/erguotou520/fake-sms](https://github.com/erguotou520/fake-sms)

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

# 启动 chrome 扩展
cd packages/chrome-ext
bun dev
```

## 🔧 项目技术栈

- 前端：Vite + React
- 后端：Bun + ElysiaJS + Drizzle ORM
- 数据库：Bun Sqlite
- 消息推送：WebSocket

其中使用`Bun`作为服务端基座，使用`ElysiaJS`作为框架，再配合`Drizzle ORM`作为数据库ORM也是我第一次使用，速度很快，但生态没有`NodeJS` + `Prisma`成熟，有时为了保证严格的类型安全，需要手动编写很多代码。
