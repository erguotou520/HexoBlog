---
title: 个人项目[image-compress]
s: image-compress
date: 2025-03-05 17:00:00
# cover:
# thumbnail:
tags:
  - Electron
  - sharp
  - svgo
  - 我开发的
---

# 🚀 图片压缩工具 - 本地的极速图片压缩工具

在前端开发过程中，图片资源的优化一直是一个重要的环节。过大的图片文件会影响网站的加载速度和用户体验，而手动压缩图片又比较繁琐。市面上虽然有很多图片压缩工具，但大多数要么是在线服务需要上传下载，要么是收费软件。为了解决这个问题，我开发了一个简单易用的本地图片压缩工具。

这是一个使用 Electron 和 Sharp 开发的图片压缩应用程序，专为前端开发者/UI设计师使用，用于批量压缩图片。它模仿了 `ImageOptim` 的使用体验，但增加了一些个性化的功能。

*原本我是打算使用 Tauri 开发的，但是在处理 libvips 和 pngquant 的动态、静态编译时遇到了一些技术难题，所以最终选择了更成熟的 Electron 框架。*

## 🖼️ 预览

| | |
|---|---|
| ![Welcome](https://github.com/erguotou520/image-compress/raw/electron/assets/welcome.png) | ![Setting](https://github.com/erguotou520/image-compress/raw/electron/assets/setting.png) |
| ![Light](https://github.com/erguotou520/image-compress/raw/electron/assets/light.png) | ![Dark](https://github.com/erguotou520/image-compress/raw/electron/assets/dark.png) |

<!-- more -->

## ✨ 特性

- 🖥️ 简单易用的界面：拖拽即可使用，操作直观
- 📚 支持批量处理：可以同时处理多个图片或整个文件夹
- 🚀 高效的压缩算法：使用 Sharp 库进行图片压缩，保证压缩质量
- 💻 跨平台支持：可在 Windows、macOS 和 Linux 上运行
- 🎨 SVG 优化：使用 SVGO 压缩 SVG 文件，可选择是否保留`viewBox`
- 🌓 支持暗黑模式：提供明暗两种主题切换

## 🎯 使用方法

1. 从 [Release](https://github.com/erguotou520/image-compress/releases) 页面下载对应操作系统的最新版本
2. 安装并运行应用程序
   - 注意：由于应用未签名，首次运行可能需要特殊处理
   - Mac 用户需要允许从非 App Store 安装应用，并在终端执行：
     ```bash
     sudo xattr -dr com.apple.quarantine /Applications/image-compress.app
     ```
3. 将需要压缩的图片或文件夹拖入应用窗口
4. 根据需要调整压缩设置
5. 点击"开始压缩"按钮
6. 等待压缩完成后，压缩后的文件会自动保存

## 🛠️ 技术栈

项目主要使用了以下技术：

- Electron：用于构建跨平台桌面应用
- Sharp：用于高性能图片处理
- SVGO：用于优化 SVG 文件
- React：用于构建用户界面

## 📄 项目地址

项目地址：[https://github.com/erguotou520/image-compress](https://github.com/erguotou520/image-compress)
