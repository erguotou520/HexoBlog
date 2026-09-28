---
title: 个人项目[PortRelay]：macOS 上的 SSH/K8s 端口转发图形化管理工具
s: my-project-portrelay
date: 2026-09-28 11:30:00
# cover:
# thumbnail:
tags:
  - 我开发的
  - macOS
  - Kubernetes
  - SSH
---

# 🚀 PortRelay - macOS 端口转发图形化管理

做后端/运维的同学对这样的命令行一定不陌生：

```bash
ssh -L 3306:localhost:3306 user@server -N
kubectl port-forward svc/mysql 3306:3306
```

需要转发的端口一多，这些 `-L` 参数、`port-forward` 命令就成了灾难：哪条隧道还在跑、映射到本地哪个端口、密码是哪个，全靠记。我用过的方案要么太重（整套 GUI 客户端），要么只有 SSH 没有 K8s，索性自己写了一个——`PortRelay`，一个原生 SwiftUI 的 macOS 端口映射应用，把 **SSH 和 Kubernetes 端口转发装进同一个图形界面**。

<!-- more -->

## ✨ 核心特性

### SSH 端口转发管理

- 服务器管理：新增、右键修改删除，支持从 `~/.ssh/config`（含 `Include` 文件）单选导入或**批量导入**全部 `Host`
- 认证方式：密码、私钥路径、直接粘贴私钥、系统 SSH Agent 都可以
- 端口映射：搜索、增删改查、单条启停，Command/Shift 多选批量删除
- 状态实时可见：未启动 / 连接中 / 已映射 / 失败，失败时保留 SSH 错误信息——再也不用 `ps aux | grep ssh` 查隧道死活

### Kubernetes 端口转发

顶部切换到 K8s 模式后，以 **集群 → Namespace → 端口** 三栏浏览 Service、Deployment 和 Pod：

- 把 Service/Deployment 声明的 TCP 端口映射到 `127.0.0.1` 或 `0.0.0.0`，支持修改、启停和失败重试
- 没声明 `containerPort` 的资源也能用：看日志、开 Shell、手动填远程端口

### Teleport 支持

如果你的集群是通过 [Teleport](https://goteleport.com/) 管理的，PortRelay 原生支持 Teleport 登录，不用再手动 `tsh login` + 换 kubeconfig：

- **登录方式**：Teleport 模式下输入 Proxy 地址和账号密码即可选择有权限的集群；密码保存在 macOS 钥匙串
- **MFA**：支持可选的 OTP 多因素认证；无 MFA 的凭证会**定期自动续期**，MFA 凭证到期后从集群右键菜单重新登录即可
- **网络兼容**：通过 `tsh kubectl` 访问，兼容位于 **Cloudflare、七层负载均衡或反向代理后面**的 Teleport Proxy——自建 Teleport 常见的各种网络拓扑都能用
- 登录后同样是三栏浏览 + 端口映射 + 日志 + Shell，和 kubeconfig 集群的体验完全一致

### 附赠：日志与 Shell

这部分是写着写着顺手加的，用起来却很频繁：

- Deployment 可选运行中的 Pod，**流式查看并搜索日志**
- Pod/SSH 服务器都能开**交互式 Shell**（K8s 自动 bash，降级 sh）
- 所有日志和 Shell 统一收在全局底部面板，切换工作区会话不丢

## 🔒 安全细节

- SSH 密码保存在 **macOS 钥匙串**，不走明文配置
- 粘贴的私钥写入应用支持目录并设置 `0600` 权限
- 正常退出时自动停止所有 SSH 子进程和 `kubectl port-forward` 进程
- 记住每条映射的启用状态，重开应用自动恢复

## 📝 安装与使用

三种获取方式：

1. **GitHub Releases**：下载 ZIP 或 DMG 安装包（最低支持 macOS 14）
2. **CI Artifacts**：仓库的 GitHub Actions 在推 `main`、PR 或手动触发时自动测试打包，Artifacts 里可下载（临时签名，适合测试）
3. **本地构建**：

```bash
./Scripts/build-app.sh   # 产物 dist/PortRelay.app
./Scripts/build-dmg.sh   # 产物 dist/PortRelay.dmg
```

使用流程就三步：添加/导入服务器 → 添加端口映射 → 点启动。K8s 模式需要本机有 `kubectl`（Teleport 模式需要 `tsh`）。

> ⚠️ **注意**：监听 `0.0.0.0` 会让同一网络的其他设备也可能访问该端口，请结合 macOS 防火墙谨慎使用。

## 🔗 项目地址

GitHub: [https://github.com/erguotou520/PortRelay](https://github.com/erguotou520/PortRelay)

## 🌟 结语

PortRelay 解决的就是"隧道管理散落在无数终端窗口里"这个问题：SSH 和 K8s 的端口转发统一入口、状态可视、断线重连、密钥安全存储。如果你也天天 `ssh -L` 和 `kubectl port-forward`，可以试试。
