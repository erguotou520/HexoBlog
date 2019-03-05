---
title: Git迁移记录
s: git-migration
date: 2016-04-12 15:32:00
tags:
  - Git
---
## 背景
之前公司的Git服务器是用的[Gogs](https://gogs.io/)，当时安装时选择的是`tidb`数据库。后来发现`tidb`数据库无法使用`ssh`服务（更改为其它数据库是可以的），但是我们的开发过程中有很多命令行的一些操作，导致每次使用命令时都需要输入用户名和密码，很麻烦，所以想改下数据库，然后使用`ssh://`格式的Git仓库。
<!-- more -->
## 尝试
第一次是打算从`Gogs`入手，但是`Gogs`并不提供数据迁移的能力。
后来准备从数据库角度出发，备份之前的数据库和仓库。仓库备份很简单，但是数据库是`tidb`采用了`xorm`库封装的，没有启动服务，所以没法用mysql客户端连接。
再后来准备尝试用`xorm`库提供的方法新建个工程然后把数据备份出来，奈何需要学习`Go`语言，而且好多不会玩，后来还是没有尝试了。
也找过DBA帮我看下，无果...
## 现行解决方案
现在采用的解决方案虽然有点麻烦，但好歹也是可行的。首先重新建个`Gogs`的服务，初始化安装（这次选择的是`sqlite`，因为那台服务器上没有mysql，也就懒得装了），重新建立组织和空仓库，建用户。然后通过clone之前的仓库并添加新的仓库地址最后push的方式来完成的。理论虽然简单，但中间还是遇到了一些小问题，这里记录下。下面是shell脚本（参考了[Push local Git repo to new remote including all branches and tags](http://stackoverflow.com/questions/6865302/push-local-git-repo-to-new-remote-including-all-branches-and-tags)）。
```bash
#!/bin/sh
sourceProtocal='http://'
sourcePrefix='192.168.10.240:3000/'
targetPrefix='git@192.168.10.240:'
array=(
  org/repo.git
  org/repo1.git
)
for repository in ${array[@]}; do
  # username是原仓库的用户名，password是原仓库的密码
  source=${sourceProtocal}username:password@${sourcePrefix}${repository}
  target=${targetPrefix}${repository}
  tmp=${repository##*/}
  dir=${tmp%.git*}
  git clone ${source}
  cd ${dir}
  git remote add target ${target}
  for remote in `git branch -r | grep -v master `; do
    git checkout --track remotes/$remote
  done
  # git push target '*:*'
  git push target --all
  git push target --tags
  echo 'source '${source}' clone OK.'
  cd ../
done
```
## 添加ssh公钥
ssh公钥是为了让我们和服务器通讯时免去输入用户名和密码的一种认证方式，详细可以查看[这篇文章](https://wiki.archlinux.org/index.php/SSH_keys_(%E7%AE%80%E4%BD%93%E4%B8%AD%E6%96%87))，我们改成ssh方式后需要将我们电脑的公钥上传至`Gogs`才能实现无需密码的`push`操作。
1.生成公钥（已经生成过可以跳过）。如果电脑上安装了`Git`并且有`Git Bash`，那么可以打开`Git Bash`运行
```bash
# -C 后面的是注释，可不传
ssh-keygen -t rsa -C "youremail@xxx.com"
```
然后一路回车生成我们的公私钥，文件存放在`C:\Users\{your windows accoutn}\.ssh`。
如果该方法不适合你请自行百度生成ssh公钥。
2.上传我们的公钥。打开上面说的目录里面的`id_rsa.pub`文件，复制里面的所有内容。再打开`Gogs`服务的网址，登陆。
点击右上角头像，选择`用户设置`，选择`管理 SSH 密钥`，点击`增加密钥`。`密钥名称`处随便填写个，然后在`密钥内容`中粘贴我们前面复制的内容，点击下面的`增加密钥`按钮完成添加。
## 工作副本的仓库地址修改
1.进入原克隆的工作目录
```bash
cd /path/to/your/workspace
```
2.查看原工作副本的远程地址
```bash
git remote -v
```
可以看到之前的地址是以`http://`开头的，我们需要修改其为新的`ssh://`方式。
3.修改地址
```bash
git remote set-url origin <git@192.168.10.240:org/repo.git>
```
`org`和`repo`为上述`git remote -v`查看得到的组织名和仓库名，该地址也可以通过网页上复制得到
![Gogs ssh](/images/git/gogs-ssh.png)。
一切OK！
> 如果有其它非origin远程，可以通过同样的方法修改仓库地址。
