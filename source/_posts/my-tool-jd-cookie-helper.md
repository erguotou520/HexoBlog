---
title: 个人项目[jd-cookie-helper]
s: jd-cookie-helper
date: 2025-03-27 13:10:00
# cover:
# thumbnail:
tags:
  - 京东
  - 青龙
  - cookie
  - 我开发的
---

# 🚀 jd-cookie-helper - 京东cookie辅助工具

## 🛠️ 工具简介
**jd-cookie-helper** 是一款基于Electron开发的京东多账号 Cookie 管理工具，专为**青龙面板自动化任务**玩家量身打造。告别传统浏览器反复登录、手动抓取Cookie的繁琐操作，一键实现**全自动登录+Cookie提取**！

## 🌟 核心功能亮点
1️⃣ ​**批量管理账号**
   - 集中保存所有JD账号，告别记事本散装记录
   - 支持「全部打开」秒启所有账号登录页
![](https://user-images.githubusercontent.com/7945757/223311353-57e9041d-80b6-44d2-8527-efd5481a067b.png)

2️⃣ ​**智能填充提速**
   - 自动填写手机号，跳过手动输入
   - 自动触发验证码请求（需完成**滑动验证码**，目前滑动验证码通过率较低，需要一定技巧，应该是风控）
![](https://user-images.githubusercontent.com/7945757/223311410-2da14637-44e0-438b-b06a-42ee2f422894.png)

3️⃣ ​**青龙专属适配**
   - 登录成功即弹窗，点击复制直接生成 `pt_key=xxx;pt_pin=xxx;`
   - 无缝对接青龙脚本，告别格式拼接错误

## 🚀 极简操作教程

1. 打开应用 → 添加账号
2. 点击「全部打开」→ 自动弹出一键填号页面
3. 手动完成滑动验证码（注：滑动成功率较低，文末有增加成功率方法）+ 短信验证码填写
4. 登录成功 → 点击「确定」即可将 cookie 粘贴到青龙面板

## 🔗 项目地址

GitHub: [https://github.com/doremijs/igit](https://github.com/doremijs/igit)

## 📚 FAQ

Q1. 滑动验证码如何提高通过率？

A: 速度不要太快，滑动时不要保持一条直线，模拟手指滑动时的弧度感。

Q2. Mac 运行时提示已损坏？

A: 在 shell 中执行下面的命令再重新打开

```bash
xattr -r -d com.apple.quarantine /Applications/jd-cookie-helper.app
```

Q3. 工具安全吗？会泄露账号吗？

A: 数据完全本地存储，无云端同步，代码已开源，代码地址 [https://github.com/doremijs/igit](https://github.com/doremijs/igit)

## ⬇️ 立即下载体验

目前只提供了 Github 的 Release 地址，如果有需要可以留言，我再提供其他下载渠道。

[https://github.com/erguotou520/jd-cookie-helper/releases](https://github.com/erguotou520/jd-cookie-helper/releases)