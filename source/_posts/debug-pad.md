---
title: Windows下调试平板设备
s: debug-pad
date: 2016-08-31 13:56:00
tags:
  - Debug
---
# Windows下调试平板设备经验记录
本文主要记录Android上的Chrome和IOS上的Safari浏览器的调试方法，方便以后查看。开始之前请自备梯子，下面会需要翻墙。
## Android设备调试
借助于Chrome的inspect工具，我们可以调试Android中使用了WebView的应用，所以调试Chrome网页也是同样的道理。
1. 安装ADB和驱动。网上有很多这方面的文章介绍，但是鉴于很多时候会出现各种问题，所以建议使用一键工具统一安装，[下载地址，需翻墙](http://forum.xda-developers.com/showthread.php?p=48915118#post48915118)。
安装时一路`Y`确认安装，结束后你的系统中就已经有了ADB环境和Android驱动。
2. USB连接上平板设备，并勾选平板设置里面的`USB调试`(一般在开发者选项里，如果没有开发者选项点击关于并连续点击版本号)，如果平板弹出调试授权窗口，勾选一律允许然后点击确定。
3. 打开命令行输入`adb devices`，此时应该能获取到设备ID，如果没有请上网查找解决方案。
![](/images/others/adb-devices.png)
4. 平板上打开Chrome并输入网址，打开后在PC的Chrome上输入`chrome://inspect/#devices`，此时可以查看到已连接的平板上打开的网址，点击对应网址下的`inspect`，此时就会弹出一个调试窗口，这时候你就可以像调试WEB页面一样愉快地调试Android网页了。
![](/images/others/chrome-inspect.png)

## IOS设备的调试
IOS上Safari浏览器的调试就比较简单，连接上设备和Mac，打开Mac上的Safari，勾选Safari的偏好设置里高级菜单下的“在菜单栏显示"开发"菜单”。
![](/images/others/safari-develop.png)
然后点击PC Safari的"开发"->"XXX的Mac"下的具体网址，此时就可以在弹出的窗口中进行调试了。
![](/images/others/safari-devices.png)

## 其它环境的调试
至于其它不能调试的情况，都可以使用weinre等方案进行调试，具体请Google之。
