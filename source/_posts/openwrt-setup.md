---
title: 基于openwrt的家庭网络设置
s: openwrt-setup
date: 2020-04-05 13:29:00
cover: /images/linux/openwrt.png
thumbnail: /images/linux/openwrt.png
tags:
  - openwrt
  - adguard home
  - pppoe
---

家里网络终于通了，开始要捣鼓起来了。
1. 让宽带师傅改桥接（究竟有没有效果不知道）
2. openwrt软路由设置pppoe拨号，发现是100开头的内网地址，后面准备申请让电信给公网ip
3. 前往 [](https://github.com/AdguardTeam/AdGuardHome/releases) 下载最新版本，上传到软路由，解压并移动到`/usr/sbin`目录，执行`AdGuardHome -s install`完成服务安装并启动
<!-- more -->
4. 前往`软路由ip:3000`按照引导完成初始配置，dns端口填`5335`，方便某服务使用。
5. 在`设置 - 常规设置`中添加上游DNS服务器，最好是dot或doh的，可参考`https://lovemen.cc/moe1621.html`，测试并应用。
6. 在`过滤器 - DNS封锁清单`中添加一些常用的过滤规则，如
  ```
  # Easylist China
  https://easylist-downloads.adblockplus.org/easylistchina.txt
  # 合并自EasylistChina、EasylistLite、CJX'sAnnoyance、EasyPrivacy
  https://gitee.com/halflife/list/raw/master/ad3.txt
  # 合并自EasylistChina、EasylistLite、CJX'sAnnoyance，并补充了贴吧过滤规则
  https://gitee.com/halflife/list/raw/master/ad.txt
  # 大圣净化: 主要针对国内视频网站
  https://raw.githubusercontent.com/jdlingyu/ad-wars/master/hosts
  ```
7. openwrt导出备份文件，`/usr/sbin/AdGuradHome.yml`文件也复制出来，建一个项目，存储这2个文件并保存，方便下次继续使用。
