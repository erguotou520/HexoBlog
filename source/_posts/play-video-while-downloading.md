---
title: mp4视频实现边下载边播放
s: play-video-while-downloading
date: 2016-03-23 15:35:00
author: 合肥小朋友
tags:
---
在做视频播放时,出现了这样一个问题,就是网页上播放mp4视频时,必须要等到视频下载完成之后,才能播放,不能够随意拖拽,之后通过一个叫做ffmpeg的视频转码软件解决了这个问题.
<!-- more -->

1. 软件地址:链接: http://pan.baidu.com/s/1qW2ZpJe 密码: 291n

2. windows下进入,通过cmd命令行进入该软件的目录bin文件夹下,然后,输入qt-faststart.exe 源文件.mp4 新文件.mp4 就会当前目录生成一个转过的mp4视频,

3. 最后,视频要通过nginx服务器作为中转来实现在线播放,具体配置如下:

nginx服务器的root目录要改为具体的tomcat目录存放转换好了的视频资源路径,端口要改成一个不和tomcat冲突的端口号

jsp视频播放页面,加载视频资源的时候访问的是nginx服务器(通过nginx的端口号来访问)不访问tomcat,访问nginx之后,然后nginx寻找资源从tomcat的静态资源存放路径中去读取事先上传过来的视频,当然如果你愿意把视频直接拷到nginx的默认根目录,也可以不需要改动nginx的conf配置文件的root目录
这里是当时jsp页面端的部分代码,nginx的端口号改的是8080,视频播放插件用的是ckplayer
```
//nginx服务器视频地址
var path=location.protocol+"//"+window.location.host+":8080"+"${path}";
	var flashvars={
		f:path,
		c:0,
		b:1
		};
var params={bgcolor:'#FFF',allowFullScreen:true,allowScriptAccess:'always',wmode:'transparent'};
	CKobject.embedSWF("<c:url value='/static/ckplayer6.4/ckplayer/ckplayer.swf'/>",'a1','ckplayer_a1','800','470',flashvars,params);
```
