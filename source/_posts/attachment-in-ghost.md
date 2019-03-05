---
title: 在Ghost中使用附件
s: attachment-in-ghost
date: 2015-07-20 23:30:00
tags:
  - Ghost
---
有不少人问过ghost能不能上传附件的问题，当然大家可能都知道Ghost可以上传图片，使用`![]()`可以插入一个图片。然后有人就尝试在选择图片时上传一个普通文件，可惜这样系统会报错。
  ![Ghost image format error](/images/ghost/ghost-image-format-error.png)
　　这是因为ghost后台做了限制，当然，你可以改代码去掉这个限制，不过上传后的图片在image目录里，这与设计之初的本意不符。Ghost本就是一个极简的，专注于写作的博客系统，使用的是markdown来写作，因此也没有做上传附件这个功能。不过如果真的要在文章中使用附件怎么办呢？
<!-- more -->
　　其实很简单，附件也不过只是个网络资源，你只需要将资源的url引用下就可以了。一种是自己用apache建一个静态文件服务器，比如我这个<a href="http://media.erguotou.me/" target="_blank">我的简单媒体工具</a>。一种是使用云存储，然后获得文件的下载地址，比如使用<a href="http://www.qiniu.com/" target="_blank">七牛云存储</a>。
　　这里以使用七牛为例，首先建一个静态目录的空间
![Ghost image format error](/images/ghost/qiniu-new-block.png)，关于空间的设置不做介绍，点击“空间管理”再点击“上传”，建议添加一个前缀，完成附件的上传。![七牛上传](storage/blog_images/qiniu-upload.png)这时候在列表页面点击刚上传的文件，在右侧就可以获取到文件的外链。![Qiniu link](storage/blog_images/qiniu-link.png)
　　通过上面2种方法得到了文件的外链后，只需要在博客中需要插入附件的地方插入`[your title](刚获取到的外链地址)`或者使用a标签`<a href="刚获取到的外链地址" target="_blank">链接显示的文字</a>`插入。a标签与markdown的语法相比，可以实现打开的页面是一个新的标签而不是覆盖当前的页面。最后，如果觉得默认的附件样式很丑，可以通过css来完善一下。下面附上我使用的附件。
[自己服务器上的](http://media.erguotou.me/files/VID_20150705_180232.mp4)
[七牛云存储的](http://7xkip3.dl1.z0.glb.clouddn.com/@/files/魔方原理及其应用.pdf)
<style type="text/css">
.attachments {
	list-style: none;
	padding: 1em;
	background: #FFFE90;
	border: 1px solid #E4E4E4;
}
.attachments li:before {
    content: '';
    display: inline-block;
    width: 18px;
    height: 18px;
    background-size: 100% 100%;
    margin-right: 8px;
    background-image: url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAASCAYAAABWzo5XAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAyZpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuNS1jMDIxIDc5LjE1NTc3MiwgMjAxNC8wMS8xMy0xOTo0NDowMCAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTQgKFdpbmRvd3MpIiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjZFMzkzMDREOUQ0RTExRTRCMEE5OEU4MUE4Q0QxNTZBIiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjZFMzkzMDRFOUQ0RTExRTRCMEE5OEU4MUE4Q0QxNTZBIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NkUzOTMwNEI5RDRFMTFFNEIwQTk4RTgxQThDRDE1NkEiIHN0UmVmOmRvY3VtZW50SUQ9InhtcC5kaWQ6NkUzOTMwNEM5RDRFMTFFNEIwQTk4RTgxQThDRDE1NkEiLz4gPC9yZGY6RGVzY3JpcHRpb24+IDwvcmRmOlJERj4gPC94OnhtcG1ldGE+IDw/eHBhY2tldCBlbmQ9InIiPz5OMX2LAAABV0lEQVR42pTSzStEURjH8Tneig1FNBvKTmoWSko0ChsLL4kslK1ssLDx0pSYnYVShplZs/E2YsEGf4PssPCy8Q8gub6nnlun23XnmVuf7p157v2d85xzTKz0awm9+MUP9j3Pu6ooIaASO/jGHN7RjZQxpkYbYgfMIR1Sa8VZmTIkgzcsB4u09cTtWRM0JWGpiHeqNUFd2JXnOMbcIuszyq1WE1SOTzTgAO43SSxiTbPQ/RjCCYYDIXdIsE4xE/LhNDpk5GPc4xCXOJcZDmDSHgNCHvwdcVvIynNW2olLO2n5vSEDvGICH8FZVCGPdee/epxiAT3/9W3bsvxZ7WHTqbfgRtakGUfFguw05/GFFadu12gbBRnI0+zKBRoj6rPY0rRWiAhJSotNmiC7xZ0h7/ThFu1R7bhBg7hGm1Mfl5BEsXXxg/wDOYIZvMhRqMMqHjVB9voTYADxfGp9UkgPWgAAAABJRU5ErkJggg%3D%3D);
}
.attachments li a {
	font-size:16px;
    color:#666;
}
.attachments li a:hover{
	font-size:16px;
    color:#F60;
}
</style>
<ul class="attachments">
	<li><a href="https://nodejs.org/dist/v0.12.7/node-v0.12.7.pkg" target="_blank">Nodejs v0.12.7 Mac OS Universal</a></li>
    <li><a href="http://download.jetbrains.com/webstorm/WebStorm-10.0.4.dmg" target="_blank">Webstorm 10.0.4 Mac OS</a></li>
    <li><a href="http://d.bootcss.com/bootstrap-3.3.5-dist.zip" target="_blank">BoosStrap 3</a></li>
</ul>
