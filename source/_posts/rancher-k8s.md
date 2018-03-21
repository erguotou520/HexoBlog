---
title: 基于Rancher搭建k8s的集群环境
s: k8s-over-rancher
date: 2018-03-21 09:38:11
tags:
  - rancher
  - rancher os
  - kubernetes
  - k8s
---
# 基于Rancher搭建k8s的集群环境
本文主要纪录了在k8s的学习过程中我是如何搭建k8s集群环境的经历。  
在学习和了解了k8s的一些基础概念我开始尝试去自己搭建一套集群环境，经过一段时间的尝试，我决定使用`rancher`来帮助搭建环境，并使用`rancher os`作为主机镜像。  
你要问我为什么使用`rancher`搭建？因为简单啊！为什么使用`rancher os`作为主机镜像？因为小啊！

## 环境准备

- 官网下载好`rancheros.iso`文件
- 4台虚拟机或者主机，根据实际业务场景增加或减少，机器用途如下：
    | Hostname       | IP              | Role           | Configuration |
    | :------------: | :-------------: | :------------: | :-----------: |
    | rancher-server | 192.168.103.90  | rancher server | 1C1G8G        |
    | k8s-node1      | 192.168.103.101 | k8s node       | 2C2G20G       |
    | k8s-node2      | 192.168.103.102 | k8s node       | 2C2G20G       |
    | k8s-node3      | 192.168.103.103 | k8s node       | 2C2G20G       |
- 确认本机已生成ssh密钥对，然后在本机生成`cloud-config.yml`，用于ssh连接到node节点：
    ```bash
    echo -e "#cloud-config\nhostname: rancher-server\nssh_authorized_keys:\n - $(cat .ssh/id_rsa.pub)" > $HOME/cloud-config.yml
    ```
  如果虚拟机网络没有dhcp，还需要在`cloud-config.yml`中加入`network`相关的配置
    ```bash
    echo -e "#cloud-config\nhostname: rancher-server\nrancher:\n  network:\n    interfaces:\n      eth0:\n        address: 192.168.103.90/24\n        gateway: 192.168.103.1\n        mtu: 1500\n        dhcp: false\nssh_authorized_keys:\n  - $(cat .ssh/id_rsa.pub)" > $HOME/cloud-config.yml
    ```
  PS：一定要保证hostname唯一，我之前就被坑了

### 安装Rancher OS系统

- 在`rancher-server`虚机上选择iso镜像，启动虚机，进入系统后启动的是类似`Live CD`的系统，所以我们需要先安装`rancheros`到硬盘，否则下次重启后数据都将丢失
- 使用命令`ip addr`查看网卡是否被分配ip，如果没有请参考官网介绍配置静态ip
    ```bash
    sudo ros config set rancher.network.interfaces.eth0.address 192.168.103.90/24
    sudo ros config set rancher.network.interfaces.eth0.gateway 192.168.103.1
    sudo ros config set rancher.network.interfaces.eth0.mtu 1500
    sudo ros config set rancher.network.interfaces.eth0.dhcp false
    ```
  设置完成后执行`sudo system-docker restart network`使其生效
- 给虚机设置password：`sudo passwd rancher`
- 将本机的`cloud-config.yml`文件复制到虚机上：`scp $HOME/cloud-config.yml rancher@172.68.1.100:/home/rancher/cloud-config.yml`，如果本机可以通过ssh登录那么反向的从虚机上执行scp命令也可以
- 在虚机上执行安装：`sudo ros install -d /dev/sda -c cloud-config.yml`，完成后重启虚机
- 注意：如果使用`ros`命令设置的网络ip和`cloud-config.yml`配置的ip是一致的，那么在虚机装好系统后本机将无法ssh连上，因为本机已经存储了该ip对应的公钥，所以需要删除`~/.ssh/known_hosts`文件中该ip所在行
- 重新ssh连到虚机，切换虚机`docker`版本，参考[](http://rancher.com/docs/rancher/v1.6/en/hosts/#supported-docker-versions)切换到支持的版本号，切换命令：`sudo ros engine switch docker-17.03.2-ce`
- 重复之前的操作，注意在安装之前要先修改`cloud-config.yml`文件中的ip地址以及hostname，这样我们就可以得到3台node节点。PS：之前试过克隆虚机的方式，但打开克隆的机器无法登陆，所以还是选择重复执行的方式。

### Docker加速

在所有的虚机上执行`sudo vi /etc/docker/daemon.json`并填入下面内容
```json
{
  "registry-mirrors": ["https://registry.docker-cn.com"]
}
```
保存后执行`sudo system-docker restart docker`然后执行`docker info`查看是否成功设置docker源

## 安装Rancher server
在`rancher-server`虚机上执行
```bash
sudo docker run -d --restart=unless-stopped -p 8080:8080 rancher/server:stable
```
等待一段时间后在本地打开浏览器访问`http://<rancher-server-ip>:8080`即可访问Rancher UI。  
在web页面中的操作就不做详细介绍，大致就是添加环境，然后按照页面提示添加我们的3台`k8s node`主机，然后等待各种服务安装完成即可，[点击查看官方视频介绍（需翻墙）](https://player.vimeo.com/video/212648517?autoplay=1&title=0&byline=0)  
PS：参考[](https://www.cnrancher.com/kubernetes-installation/)文章中**kubernetes环境管理**一节修改国内加速。