---
title: 服务器数据备份方案
s: server-data-backup
date: 2020-04-05 17:24:00
thumbnail: /images/devops/backup-logo.png
tags:
  - gogs
  - bitwarden
  - backup
---

由于服务器买的是一年，而一年后可能有各种不确定性因素，再加上可能的一些误操作，所以之前建立的`DevOps`环境以及`Bitwarden`需要做一个备份。正好家里有黑群晖，就用它做数据备份吧。

### Gogs备份
将备份服务器的ssh key添加到gogs服务器上，使用`rsync`进行备份，并添加定时脚本。
```bash
nohup rsync -e "ssh -p ssh-port" -avL --delete --exclude "gogs/log" --exclude "gogs/data/sessions" user@gogs.erguotou.me:/user/devops/gogs /path/to/backup >> gogs.rsync.log 2>&1 &
```
<!-- more -->

### Drone备份
无需备份

### Docker registry备份
我是觉得没必要备份，大不了再打包运行一次

### Bitwarden备份
类似gogs的备份
```bash
nohup rsync -e "ssh -p 22" -avL --delete user@gogs.erguotou.me:/user/bitwarden/data/ /path/to/backup >> bitwarden.rsync.log 2>&1 &
```
