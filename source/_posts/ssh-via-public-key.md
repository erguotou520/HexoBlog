---
title: 服务器安全登录
s: ssh-via-public-key
date: 2015-12-24 00:12:00
tags:
  - SSH
---
搬瓦工的VPS要到期了，以前用着好难受的感觉，所以决定加点钱换个好点的，最后还是买了`Linode`。这里记录一下以一个更安全的方式连接VPS的设置过程。
## 新建用户
首先新建用户，不使用`root`用户登录
```shell
useradd -g root erguotou
```
设置密码
```shell
passwd erguotou
```
添加到`root`组（不确定该步骤是否必须）
```shell
vi /etc/sudoers
```
找到
```shell
## Allow root to run any commands anywhere
root    ALL=(ALL)     ALL
```
在下面添加
```shell
erguotou ALL=(ALL)     ALL
```
## 使用公私钥方式登录
首先退出`root`用户，使用新建的用户登录，然后在用户目录下新建`.ssh/authorized_keys`文件。
```shell
mkdir ~/.ssh
touch ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```
然后复制本机的公钥内容添加到VPS的`authorized_keys`文件中，保存，退出登录，重新登录后就可以不用输入密码了。

## 禁root禁密码登录
使用`root`用户执行
```shell
vi /etc/ssh/sshd_config
```
找到`PasswordAuthentication`配置，并改为`no`
```shell
PasswordAuthentication no
```
找到`PermitRootLogin`配置，并改为`no`
```shell
PermitRootLogin no
```
最后退出当前用户登录，然后尝试使用`root`登录，再尝试是否可以用密码方式登录。
