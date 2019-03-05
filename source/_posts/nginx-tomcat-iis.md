---
title: 利用Nginx让IIS和tomcat共用80端口
s: nginx-tomcat-iis
date: 2015-01-14 16:46:00
thumbnail: /images/server/nginx.png
tags:
  - Nginx
---
*项目：《安徽省儿童医院》主网站（PHP开发）与微信（JAVA开发）共用服务器*

原来整合时使用的是jakarta桥接插件，但当时整合时就各种弄不懂，也是各种迷糊然后就好了，最终主网站用的域名是[www.ahetyy.com](www.ahetyy.com)，微信端用的是[211.149.198.47/etyy](http://211.149.198.47/etyy)。

然后网站和微信一直都能使用，相安无事，但有一次莫名其妙地出了问题，不得其解。

在修复时打算按照原来的方式来，可是发现又不会弄了，因为当初怎么弄好的都不记得。

无奈之下在百度搜索时发现一篇[《IIS tomcat共用80端口解决一个IP多个域名：使用Nginx反向代理方式使两者兼容》](http://www.cnblogs.com/wuyou/p/3455619.html)的文章，受其启发，准备改用Nginx来完成。
<!-- more -->

## 1.下载
[http://nginx.org/en/download.html](http://nginx.org/en/download.html) 我当时下载的是nginx/Windows-1.7.8 版本。

## 2.解压

## 3.修改配置
*nginx的配置看起来还是比较复杂的，现在的配置只是保证能使用，但不一定是最好的*

修改Nginx的conf目录下的nginx.conf文件，修改server的配置如下：

    server {
      listen       80;
      server_name  www.ahetyy.com;
      location ^~ /etyy {
          proxy_pass   http://localhost:8080/etyy;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      }
      location / {
          	proxy_pass   http://localhost:81;
      }
	}

其中server_name表示对外访问的域名，第一个location的规则是 任意以"/etyy"开头的请求都转发给[http://localhost:8080/etyy](http://localhost:8080/etyy)也就是tomcat来处理，第二个location的规则是其余请求全都发给php的主网站处理。

特别注意：第一个location下的配置中的proxy_set_header的配置是必须的，否则最后打开[http://www.ahetyy.com/etyy](http://www.ahetyy.com/etyy)时页面请求的css和js路径都会是localhost:8080的，因为tomcat那边得到的请求就是localhost:8080的，需要将请求的头信息修改为真实请求的请求路径才行。（但是现在页面的base的路径上会有一个端口80，有点小小强迫症的我就忍了~）

## 4.运行
cmd切换到nginx.exe的目录下，启动-- start nginx 停止-- nginx -s stop，有时会结束不掉，我就会手动关闭进程~

## 5.设置Nginx以服务方式启动
（暂时没做，网上教程看着好复杂- -！），搞定！
