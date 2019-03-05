---
title: vsftpd的安装配置
s: vsftpd-config
date: 2016-02-05 11:58:00
tags:
  - vsftpd
seo:
  title: vsftpd虚拟用户配置
  description: 在Linux系统上安装vsftpd并配置vsftpd的虚拟用户，该用户需要使用密码登录FTP，但不能登录系统，同时在登录FTP后只显示指定目录，不能切换到其它目录。
---
> 参考自<a target="_blank" href="http://www.cnblogs.com/whoamme/p/3494128.html">http://www.cnblogs.com/whoamme/p/3494128.html</a>

1. 安装相关工具包
```bash
yum -y install pam vsftpd db4 db4-utils
```
<!-- more -->
2. 创建一个不能登录的用户，用作ftp服务的虚拟用户
```bash
useradd -d /home/xxx -s /sbin/nologin vuser_ftp
```
`/home/xxx`为用户根目录，`/sbin/nologin`指定用户不能使用shell，该账号不能用于登录系统
这里使用`vuser_ftp`作为虚拟用户的映射对象，在web服务器中可以使用`httpd`
这个服务的用户来作为虚拟用的映射。比如`www apapche web`，没大明白~
3. 创建一个记录ftp虚拟用户的用户名和密码文件，如`login.txt`
第一行用户名，第二行密码，以此类推
```bash
vi /etc/vsftpd/login.txt
user1
pwd1
user2
pwd2
```
4. 使用db_load 命令生成虚拟用户认证文件
```bash
db_load -T -t hash -f /etc/vsftpd/login.txt /etc/vsftpd/vsftpd_login.db
```
`vsftpd_login.db`文件是db_load命令生成的虚拟用户认证文件
5. 备份vsftpd配置文件，再修改配置文件
```bash
vi /etc/vsftpd/vsftpd.conf

anonymous_enable=NO
local_enable=YES
write_enable=YES
local_umask=022
dirmessage_enable=YES
xferlog_enable=YES
connect_from_port_20=YES
xferlog_file=/var/log/vsftpd.log
xferlog_std_format=YES
listen=YES
userlist_enable=YES
tcp_wrappers=YES
max_per_ip=5
max_clients=100

#### 下面是关于虚拟用户的配置

guest_enable=YES #打开用户虚拟
guest_username=vuser_ftp #将所有虚拟用户映射成vuer_ftp这个本地用户
#此用户是之前新建的用户
pam_service_name=ftp.vu #ftp用户的pam验证方式，默认是vsftpd，必须改掉。
user_config_dir=/etc/vsftpd/vsftpd_user_conf #这里放置每个虚拟用户的配置文件
```
6. 创建vsftpd.conf中提到的验证文件
使用`rpm -ql vsftpd`这个命令查找验证模块的例文，找到如下一段
```text
/usr/share/doc/vsftpd-2.2.2/EXAMPLE/VIRTUAL_USERS/vsftpd.pam
```
将其拷贝到vsftpd.conf文件中配置的路径中并改变文件名
```bash
cp /usr/share/doc/vsftpd-2.2.2/EXAMPLE/VIRTUAL_USERS/vsftpd.pam /etc/pam.d/ftp.vu
```
前面配置中的`pam_service_name=ftp.vu中ftp.vu`使用的是相对路径，绝对路径是`/etc/pam.d/ftp.vu`

上面这条命令就是把vsftpd程序自带的关于pam认证的模板文件拷贝到`pam.d`这个服务的工作目录，同时改变文件名为`ftp.vu`。
`/etc/pam.d/`目录下已经有了一个`vsftpd.pam`文件，现在要做的是让vsftpd虚拟用户的这个功能用到的一个特殊的pam认证。还要修改下`ftp.vu`这个文件

先来看下原文件的内容：
```bash
vi /usr/share/doc/vsftpd-2.2.2/EXAMPLE/VIRTUAL_USERS/vsftpd.pam

auth required /lib/security/pam_userdb.so db=/etc/vsftpd/login
account required /lib/security/pam_userdb.so db=/etc/vsftpd/login
```
将两处的`db=/etc/vsftpd/login`修改成`db=/etc/vsftpd/vsftpd_login`，文件都是以.db结尾的，但此处不要填写.db。同时由于我们的系统是64位的，还需要将配置中间的`/lib/`改为`/lib64/`
```bash
vi /etc/pam.d/ftp.vu

auth required /lib64/security/pam_userdb.so db=/etc/vsftpd/vsftpd_login
account required /lib64/security/pam_userdb.so db=/etc/vsftpd/vsftpd_login
```
7. 创建`vsftpd.conf`中提到的虚拟用户配置目录`user_config_dir=/etc/vsftpd/vsftpd_user_conf`，以及在这个目录下面创建每个用户的权限配置文件
创建`/etc/vsftpd/vsftpd_user_conf`目录
```bash
mkdir /etc/vsftpd/vsftpd_user_conf
```
在`/etc/vsftpd/vsftpd_user_conf`目录下面分别创建之前在`login.txt`虚拟用户名和密码文件中提到的user1 user2 这两个虚拟用户的权限配置文件
```bash
vi /etc/vsftpd/vsftpd_user_conf/user1

anon_world_readable_only=no #用户可以浏览和下载文件，不能设为yes，否则无法看到文件
write_enable=yes #用户可以创建文件
anon_upload_enable=yes #用户可以上传文件
anon_mkdir_write_enable=yes #用户有创建和删除目录的权限
anon_other_write_enable=yes #用户具有文件改名和删除文件的权限
local_root=/home/xxx #指定这个虚拟FTP用户的家目录。这里的xxx是你网站的根目录
```
之后再创建user2的权限文件（略）
8. OK！结束！重启vsftpd服务
```bash
service vsftpd restart
```
