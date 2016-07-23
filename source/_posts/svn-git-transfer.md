---
title: SVN、GIT数据迁移
s: svn-git-transfer
date: 2015-01-14 16:45:00
tags:
  - Git
---
###SVN数据迁移
svn的管理使用的是Collabnet Subversion Edge。

#####1.安装服务
在目标机器上安装Collabnet Subversion Edge,简称CSE
#####2.复制版本库
将旧服务器上的repository全部复制到新服务器上
#####3.导入数据
在新服务器上打开CSE的管理后台[http://localhost:3343/csvn](http://localhost:3343/csvn)， 在“版本库”页面选择“发现版本库”，这样就把之前的版本库都导入进去了
#####4.复制用户数据
从原机器中拷贝{安装路径} \data\conf下的svn_auth_file文件到新机器
#####5.导入用户数据
修改新机器{安装路径}\data\csvn-production-hsqldb.script文件。复制原机器中类似

`INSERT INTO USER VALUES(1,2,'admin user','admin@example.com',TRUE,'f52c7457507a292a11bf8d274d720ee4','Super Administrator','admin')`

的语句到新服务器的对应文件。
#####6.重置用户密码
#####7.重启CSE服务即可
</br>

###GIT数据迁移
GIT的数据迁移比较简单，GIT是采用mysmgit+copssh搭建的。
#####1.安装环境
新机器上搭建GIT环境，并建立每个需要备份的项目的空仓库（好像不新建也是可以的）
#####1.GIT仓库转移
选择一份最新版本的项目路径，执行

`git remote set-url origin 资源库地址`

#####2.GIT提交
直接将当前项目提交即可，这样新的仓库里也是有之前所有的提交记录的
