---
title: 服务器数据备份方案
s: server-data-backup
date: 2020-04-05 17:24:00
updated: 2020-09-21 10:30:00
cover: /images/devops/backup-logo.png
thumbnail: /images/devops/backup-logo.png
tags:
  - gogs
  - bitwarden
  - backup
  - rclone
---

由于服务器买的是一年，而一年后可能有各种不确定性因素，再加上可能的一些误操作，所以之前建立的`DevOps`环境以及`Bitwarden`需要做一个备份。~~正好家里有黑群晖，就用它做数据备份吧~~。

### 最新备份方案

由于之前一直是用家里的 nas 进行备份，导致不怎么用的 nas 一直开机且无法进入自动休眠模式，心疼，所以打算切换到线上备份方案。原本打算用 api 对接各种云服务，自己 coding，但忽然想起不是有最厉害的开源多端云同步工具`rclone`么！那就用它做来备份吧。

### 安装

按照官网教程，在服务器上安装`rclone`

```bash
curl https://rclone.org/install.sh | sudo bash
```

<!-- more -->

然后配置各种用来备份的远程 config，此处具体可以搜索。

### 加密

如果希望对某个备份目录进行加密，例如`bitwarden`，那么可以在 config 添加后继续添加一个 config，`type`选择`crypt`，目录填需要备份的`config:path`，例如`OneDrive:/server/backup/path/to/bitwarden`，后续的配置就按需填写。之后上传到该目录的文件就是加密的。

### 添加备份脚本

新建一个`backup.sh`脚本文件，内容如下

```shell
#!/usr/bin/env bash
rclone --checksum sync /path/to/gogs/ GoogleDisk:/server/backup/path/to/gogs --exclude "*.{swp}" --exclude "{log,tmp,sessions}/" ;
rclone --checksum sync /path/to/bitwarden/ GoogleDisk:/server/backup/path/to/bitwarden ;
rclone --checksum sync /path/to/devops/gogs/ OneDrive:/server/backup/path/to/gogs --exclude "*.{swp}" --exclude "{log,tmp,sessions}/" ;
rclone --checksum sync /path/to/bitwarden/ OneDrive:/server/backup/path/to/bitwarden
# 可继续添加任意多个备份服务，前提是你在rclone config里配置好的
```

### 添加备份 service

在`/usr/lib/systemd/system`目录下新建`backup.service`，内容如下

```
[Unit]
Description=BackupTimer

[Install]
WantedBy=multi-user.target

[Service]
ExecStart=/bin/bash /path/to/backup.sh
```

在`/etc/systemd/system/`目录新建`backup.timer`，内容如下

```
[Timer]
OnCalendar=*-*-* 04:00:00
Unit=backup.service
```

启动 service

```bash
systemctl start backup
systemctl enable backup
```

_以下内容为旧版备份方案_

### Gogs 备份

将备份服务器的 ssh key 添加到 gogs 服务器上，使用`rsync`进行备份，并添加定时脚本。

```bash
nohup rsync -e "ssh -p ssh-port" -avL --delete --exclude "gogs/log" --exclude "gogs/data/sessions" user@gogs.erguotou.me:/user/devops/gogs /path/to/backup >> gogs.rsync.log 2>&1 &
```

### Drone 备份

无需备份

### Docker registry 备份

我是觉得没必要备份，大不了再打包运行一次

### Bitwarden 备份

类似 gogs 的备份

```bash
nohup rsync -e "ssh -p 22" -avL --delete user@gogs.erguotou.me:/user/bitwarden/data/ /path/to/backup >> bitwarden.rsync.log 2>&1 &
```
