---
title: ppt-online
s: ppt-online
date: 2016-03-23 15:01:00
author: 合肥小朋友
tags:
---
在做科大学生骨干培训班这个项目时 ,由于需要用到在线浏览学生的ppt文件,为了实现这个问题,采用的解决方案是通过一个软件将其转换为flash进行播放.
<!-- more -->

软件准备:链接:http://pan.baidu.com/s/1sjv5DPb

解压之后,可以看到iSpring Presenter文件夹,iSpring Presenter 是以 PowerPoint 插件的形式工作的，下载解压后先运行 !)iSpringPresenterPortable.exe，选择安装后会自动添加插件，再打开 PowerPoint 就能看到了，支持 Microsoft PowerPoint 2003/2007/2010.

安装完毕之后,打开一个ppt文件,这时ppt菜单工具栏会出现一个iSpring Presenter工具选项,点击切换到该工具选项,点击publish按钮,弹出一个对话框,general选项卡有个Player Template,可以选择一个适合的播放器模板,还有就是选择生成路径,其他选项卡设置可以不动,点击弹出框的按钮publish即可.具体如下图
![](/images/others/test.png)

完了之后生成一个文件,里面有swf文件以及js 和html文件,在实际应用中,把html和js文件写成jsp形式,然后把jsp文件里面引用swf的路径替换为从数据库读取的路径即可.

整个过程就是把ppt转swf文件,然后通过,软件提供的html和js整合一个公共的ppt在线播放页面,用来加载swf文件即可.
