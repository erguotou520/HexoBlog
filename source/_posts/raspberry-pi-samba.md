---
title: 闲置树莓派捣腾记
s: raspberry-pi-samba
date: 2016-06-07 21:32:12
# thumbnail: https://www.raspberrypi.org/app/uploads/2015/08/raspberry-pi-logo.png
cover: /images/linux/raspberry.png
thumbnail: /images/linux/raspberry.png
tags:
  - Raspberry
---
手上有一个树莓派，之前装个`openelec`看看视频什么的，后来因为一些原因废弃了。本来打算做私有云的，但是树莓派做私有云可能有些力不从心，等安定了后再捣腾私有云吧，到时可能黑群晖，也可能白群晖，也可能其它方案，都还不一定呢。现在先拿来玩耍玩耍做个共享弄个开源`ownCloud`还是可以的。废话不多说，进入正题。
<!-- more -->

## 安装系统
1. 使用`SDFormat`格掉SD卡。
2. 使用`Win32 Disk Imager`将img镜像写入SD卡。这2步都在Win主机上执行，因为快，这也是为什么不推荐使用`NOOBS`安装的原因，太慢了。
3. 卸下SD卡，装在我们的树莓派上，其它电源、网线、键鼠、显示器都接上。键鼠和显示器不是必须，但是有时为了方便会接上，而且刚进入系统用界面看IP地址也比较方便。
4. 开机，点亮。
5. 简单配置。如果是用`NOOBS`安装的系统，这步可以跳过。进入系统界面后，打开控制台，运行`sudo raspi-config`进入配置页面。选择第一个`Expand Filesystem`，将SD卡里的剩余空间全部扩充上。完成后可能要求重启。

## 调教系统
1. 更新源。参考[科大的帮助页](https://lug.ustc.edu.cn/wiki/mirrors/help/raspbian)。如果需要更新已有软件，可以使用`sudo apt-get upgrade`。
2. 静态IP。网上关于更改`/etc/network/interfaces`文件的方法我试了，没用（`jessie`版本开始不能用此方法了），在界面中也没找到网络设置的位置。不过可以使用这种方法：
    ```bash
    sudo nano /etc/dhcpcd.conf
    # 在配置文件最后加上
    interface eth0
    static ip_address=192.168.1.200
    static routers=192.168.1.1
    static domain_name_servers=114.114.114.114
    ```
改完后记得重启下。
3. 安装`samba`。不知道是因为执行过`apt-get upgrade`的原因还是什么，在安装时会出现依赖冲突，不能安装的情况。最后参考[http://askubuntu.com/questions/222658/samba-installation-failed-on-ubuntu-12-10](http://askubuntu.com/questions/222658/samba-installation-failed-on-ubuntu-12-10) 里面介绍的方法解决的。首先执行
	```bash
    sudo apt-get install --fix-broken && sudo apt-get autoremove && sudo apt-get update && sudo apt-get install samba
    ```
  失败，然后卸载。
	```bash
    sudo apt-get remove samba-common libwbclient0 tdb-tools`，卸载完成后重新安装`sudo apt-get install samba samba-common-bin
    ```
4. 配置`samba`。参照[http://www.dreamxu.com/raspberrypi-nas/](http://www.dreamxu.com/raspberrypi-nas/) 。先备份配置
    ```bash
    sudo cp /etc/samba/smb.conf /etc/samba/smb.conf.bak
    ```
  然后修改配置文件`sudo vim /etc/samba/smb.conf`并删除默认的`home`共享。
	```bash
    [share]
        comment = Raspberry smb
        path = /home/pi/share
        browseable = yes
        writeable = yes
        create mask = 0664
        directory mask = 0775
  ```
  为了简单，此处直接使用已有的`pi`用户。在`/home/pi`下新建`share`目录。完成后重启`samba`服务`sudo service samba restart`。到此就完成了`samba`的安装配置，可以在设备上拷贝文件测试了。
