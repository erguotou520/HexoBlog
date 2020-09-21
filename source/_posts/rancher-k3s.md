---
title: 搭建一套k3s的集群环境
s: k3s-over-rancher
date: 2020-03-18 19:08:00
cover: /images/rancher/k3s-rancher.png
thumbnail: /images/rancher/k3s-rancher.png
tags:
  - rancher
  - kubernetes
  - k8s
  - k3s
---

### 服务器组织
准备4个服务器，hostname如下
1. rancher-server
2. k3s-server
3. k3s-agent1
4. k3s-agent2

其中`rancher-server`和`k3s-server`2个节点配置稍微高点，`agent`节点配置可以低点，1G内存也是够了。
<!-- more -->
### 安装
1. `rancher-server`上按照rancher官网配置跑起来，
  ```bash
  # docker加速
  mkdir /etc/docker
  vi /etc/docker/daemon.json
  # 填入内容
  `{
    "registry-mirrors": [
      "https://1nj0zren.mirror.aliyuncs.com",
      "https://docker.mirrors.ustc.edu.cn",
      "http://f1361db2.m.daocloud.io",
      "https://registry.docker-cn.com"
    ]
  }`
  # 安装docker
  curl -fsSL https://get.docker.com | sh -
  docker run -d --restart=unless-stopped -p 8080:80 -p 9443:443 rancher/rancher:stable
  ```
然后在rancher的web页面上添加集群，选择自定义，复制添加的命令（第2个，因为需要跳过ssl认证的过程）后面备用
2. 在`k3s-server`节点上执行
  ```shell
  # 关闭防火墙
  systemctl stop firewalld
  systemctl disable firewalld
  # latest节点下载不了，需要手动指定版本，否则下载失败
  # 当前最新版本，可替换
  export INSTALL_K3S_VERSION=v1.17.3+k3s1
  # 使用ffp.yux.io提供的代理服务，再次感谢
  curl -sfL https://ffp.yux.io/r/https://get.k3s.io | sh -
  # 显示token，复制
  cat /var/lib/rancher/k3s/server/node-token
  # 查看当前ip，复制
  ip addr
  # 查看host，确认已分配
  hostname
  # 在/etc/hosts中添加一条记录是对hostname的解析
  # 如 127.0.0.1 k3s-server
  ```

3. 在`k3s-agent`2个节点上执行
  ```shell
  # latest节点下载不了，需要手动指定版本，否则下载失败
  # 当前最新版本，可替换
  export INSTALL_K3S_VERSION=v1.17.3+k3s1
  # 使用ffp.yux.io提供的代理服务，再次感谢
  curl -sfL https://ffp.yux.io/r/https://get.k3s.io | K3S_URL=https://上一步复制的ip:6443 K3S_TOKEN=上一步复制的token sh -
  ```
4. 将第一步复制的集群添加命令在`k3s-server`节点上执行，等待rancher上面的状态更新，在完成后会变成`active`状态，此时就表示完成了。
5. 目前就研究到这么多，后续的得结合`helm`做发布了。
