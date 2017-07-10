---
title: 在OpenShift上安装Ghost
s: ghost-on-openshift
date: 2015-04-29 20:29:00
tags:
  - Ghost
---
使用OpenShift(以下简称OS)搭建Ghost环境的好处就是简单、免费，速度还不错。如果只是希望使用Ghost的用户不妨试试吧。
###注册OS并登录
这一步不做介绍，很简单。
###创建Ghost
1.在OS的控制台中切换到`Applications`页面，点击`Add Application`。  
2.在搜索输入框中输入`ghost`并回车，在搜索结果页面中点击`Ghost 0.5.10`(目前版本)。  
3.在`Public URL`中输入一个唯一的二级域名，这里输入的内容不重要，后面可以使用自己的域名，其它默认就可以了，点击`Create Application`。  
4.完成后的页面可以无视，重新点击`Applications`就可以看到已经创建好的Ghost博客了，点击进去可以看到系统给你分配的二级域名，点击此链接即可访问博客。
###使用自定义的域名
1.在上面第4步的二级域名旁有一个`change`链接，点击之。  
2.在新页面的`Domain name`里输入你想要绑定的域名，下面的ssl本文不做介绍，接着点击下面的`Save`按钮。  
3.最后在你的域名的dns解析的地方加一条cname解析，cname的指向是之前系统给你分配的二级域名。配置好了以后等待一段时间，你就可以用你自定义的域名来访问Ghost博客了。
###Ghost汉化与升级
#####汉化
汉化我采用的是[GhostChina](http://www.ghostchina.com/)提供的汉化版本。  
1.首先去下载页面下载最新的版本。  
2.然后再OS的控制台的应用界面里面找到`Source Code`。
![Source Code](/images/ghost/openshift-source-code.png)
复制此地址。  
3.使用git拷贝项目

```bash
#xxxxxx是刚复制的地址
git clone ssh://xxxxxx
```
4.将第1步下载的中文版的`/content/themes/casper-zh`目录下的所有文件拷贝到第3步clone的项目下的`/content/themes/casper`目录下并覆盖原文件。将中文版的`/core`目录下的所有文件拷贝到第3步clone的项目下的`/core`目录下并覆盖原文件。  
5.在第3步clone的项目的根目录下执行
```bash
git add ./ --all
git commit-m "hanhua"
git push
```

*在执行push前请在OS中添加自己电脑的ssh公钥，生成公钥的方法可参考[Git SSH Key 生成步骤](http://blog.csdn.net/hustpzb/article/details/8230454/)，OS添加公钥的方法就是点击`Settings`-->`Add a new key`，在`Key name`中输入一个名字，在`Paste the contents of your public key file`中输入你的公钥并保存。*

push完成后系统会自动重启，无需担心重启的问题，完成后再次访问你的域名吧。
#####升级
升级请参照[更新 Ghost](http://docs.ghostchina.com/zh/installation/upgrading/)
