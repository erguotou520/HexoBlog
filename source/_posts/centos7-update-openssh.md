---
title: CentOS7升级OpenSSH
s: centos7-update-openssh
date: 2019-06-13 11:51:00
thumbnail: /images/server/openssh.gif
tags:
  - openssh
  - centos
---

# CentOS 7升级OpenSSH

## 当前状态

查看openssh版本 `ssh -V`，查看openssl版本`openssl version`，记录当前版本号以便升级后做对比。

## 开启Telnet

升级ssh的过程中可能导致ssh无法登录，所以最好先开着Telnet。

```bash
yum install xinetd telnet-server -y
systemctl enable xinetd.service
systemctl enable telnet.socket
systemctl start telnet.socket
systemctl start xinetd
# 允许root登录
echo  'pts/0'  >>/etc/securetty
echo 'pts/1' >>/etc/securetty
service  xinetd  restart
# 防火墙添加过滤
firewall-cmd --add-service=telnet --zone=public --permanent
# 确认下telnet是否可以登录成功
# 安装一些可能需要的库
yum install zlib-devel -y pam-devel tcp_wrappers-devel gcc
# 备份文件
mv /usr/bin/openssl /usr/bin/openssl.bak
mv /etc/ssh /etc/ssh.bak
# 在/opt目录下载
cd /opt
# openssl
wget https://www.openssl.org/source/openssl-1.0.2s.tar.gz
tar zxvf openssl-1.0.2s.tar.gz
# openssl-fips
wget https://www.openssl.org/source/openssl-fips-2.0.16.tar.gz
tar zxvf openssl-fips-2.0.16.tar.gz
# openssh
wget http://ftp.openbsd.org/pub/OpenBSD/OpenSSH/portable/openssh-8.0p1.tar.gz
tar zxvf openssh-8.0p1.tar.gz

# 编译安装openssl-fips
cd ../openssl-fips-2.0.16/
./config && make && make install

# 编译安装openssl
cd openssl-1.0.2s/
./config fips shared -fPIC
make depend
make && make install
ln -s /usr/local/ssl/bin/openssl /usr/bin/openssl
ln -s /usr/local/ssl/include/openssl /usr/include/openssl
echo "/usr/local/ssl/lib" >> /etc/ld.so.conf
/sbin/ldconfig
# 查看版本是否升级成功
openssl version

# 编译安装openssh
./configure --prefix=/usr/ --sysconfdir=/etc/ssh  --with-openssl-includes=/usr/local/ssl/include --with-ssl-dir=/usr/local/ssl --with-zlib --with-md5-passwords --with-pam && make && make install
# 修改ssh配置文件，修改PermitRootLogin为yes UseDNS为no
vi /etc/ssh/sshd_config
cp -a contrib/redhat/sshd.init /etc/init.d/sshd
cp -a contrib/redhat/sshd.pam /etc/pam.d/sshd.pam
chmod +x /etc/init.d/sshd
chkconfig --add sshd
systemctl enable sshd
systemctl enable sshd
# 使用命令测试端口是否正常
systemctl stop sshd
netstat -lntp
systemctl start sshd
netstat -lntp
# 重启
reboot
# 测试ssh版本是否升级成功
ssh -V
# 关闭telnet服务
systemctl disable xinetd.service
systemctl stop xinetd.service
systemctl disable telnet.socket
systemctl stop telnet.socket
```
