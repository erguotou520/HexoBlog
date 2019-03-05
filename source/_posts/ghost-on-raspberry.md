---
title: 在树莓派上安装Ghost的一些坑
s: ghost-on-raspberry
date: 2015-11-08 00:45:00
tags:
  - Ghost
  - Raspberry
---
最近开始玩树莓派，自然要在小pi上装个node，跑个Ghost啊。中途遇到了一些小坑，这里记录一下。
<!-- more -->

1. `raspbian`系统安装后默认只有大概4G左右的空间（可以使用`df -hl`查看磁盘空间），tf卡的其它空间浪费了，需要扩容到整个tf卡的大小。在`raspbian`中运行
```bash
sudo raspi-config
```
选择`expand_rootfs`，按照提示操作并重启。

2. 删除了一些不需要的安装包。首先安装`wajig`（这个工具集成了apt-get/dpkg/aptitude等等）：
```bash
sudo apt-get install wajig -y
```
然后查看已安装的包
```bash
wajig large
```
找到后面几个用不到的且占用体积较大的删除掉，可一次性删除多个：
```bash
sudo aptitude remove xxxx xxxx xxxx
```

3. nodejs的`sqlite3`模块似乎没有arm平台的编译包，我也懒得自己编辑了，直接改成使用mysql了。

4. 其它没什么不一样的，使用`pm2`守护Ghost，使用`Nginx`做代理，运行，OK！
