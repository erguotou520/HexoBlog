---
title: 在搬瓦工上安装Ghost
s: ghost-on-banwagong
date: 2015-02-05 12:35:00
tags:
  - Ghost
  - Vps
---
1. 前面的内容不做介绍，SSH连接上（本文以CentOS 6 64位系统做说明）
2. 安装需要的环境，中间有确认的过程，直接输入y回车
```bash
yum install libtool automake autoconf gcc-c++ openssl-devel
```
<!-- more -->
3. 在/home目录下新建一个目录（名字随意，主要用于存放我们的文件，本例使用的是latazu）`latazu`，并下载我们需要的文件nodejs、ghost
```bash
cd /home
mkdir latazu
cd latazu
wget http://nodejs.org/dist/v0.10.36/node-v0.10.36.tar.gz
wget http://cdn.diancloud.com/ghost/releases/Ghost-0.5.8-zh.zip
```
4. 编译安装nodejs（make的过程有点长，耐心等待）
```bash
tar zxvf node-v0.10.36.tar.gz
cd node-v0.10.36
./configure
make && make install
```
5. 解压ghost文件，并配置ghost配置文件`config.js`
```bash
cd ../
unzip Ghost-0.5.8-zh.zip -d ghost
cd ghost
cp config.example.js config.js
vi config.js
```
配置完成后保存（具体配置不做详细说明）
6. 安装依赖文件（只安装生产环境需要的文件）
```bash
npm install --production
```
*如果npm过程中出现glibc版本过低的问题，请参考["libc.so.6: version `GLIBC_2.14' not found"系统的glibc版本太低](http://www.cnblogs.com/gw811/p/3676856.html)升级glibc版本*

7. 设置环境变量并启动Ghost（这里使用的是forever守护进程）
```bash
export NODE_ENV=production
npm install -g forever
forever start index.js
```
8. 安装Nginx
```bash
rpm -Uvh http://nginx.org/packages/centos/6/noarch/RPMS/nginx-release-centos-6-0.el6.ngx.noarch.rpm
yum install nginx
```
配置nginx（新建一个配置文件`ghost.conf`，下面有一个样例）
```bash
mkdir /etc/nginx/logs
vi /etc/nginx/conf.d/ghost.conf

server {
	listen       80;
    server_name  www.renshiwo.me renshiwo.me;
	charset      utf-8;
	access_log   logs/ghost.log;
	location / {
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header Host $http_host;
		proxy_set_header X-NginX-Proxy true;

		proxy_pass http://127.0.0.1:2368;
		proxy_redirect off;
	}
}

```
9. 启动nginx，并设置开机自启动
```bash
service start nginx
chkconfig nginx on
```

OK!可以了，现在访问你的域名看看吧！哦~对了，不要忘记设置域名解析！


其它后续操作
  1.安装FTP [vsftpd的安装配置](http://noblog.xyz/conf-vsptdd-user/)
  2.安装ShandowSocks（翻墙必备） [CentOS下shadowsocks一键安装脚本](http://teddysun.com/342.html)
