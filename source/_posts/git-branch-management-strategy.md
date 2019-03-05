---
title: GIT分支管理策略(非Git workflow)
s: git-branch-management-strategy
date: 2015-04-11 23:28:00
tags:
  - Git
seo:
  description: GIT分支管理策略，非Git workflow，主分支Master，主分支有且只有一个，所有提供给用户使用的正式版本都在这个分支上发布。开发分支Develop，日常的开发工作应该都在这个分支上进行。
---
[参照  http://www.ruanyifeng.com/blog/2012/07/git.html](http://www.ruanyifeng.com/blog/2012/07/git.html)
## 主分支Master
主分支有且只有一个，所有提供给用户使用的正式版本都在这个分支上发布。
## 开发分支Develop
日常的开发工作应该都在这个分支上进行。
```bash
git checkout -b develop
```
如果需要从develop对外发布版本
```bash
git checkout master
git merge --no-ff development
```
注：这里的参数`--no-ff`是不进行快速合并(快速合并只是改变指针)的意思。
<!-- more -->
## 临时分支
前面介绍的是两条主要分支，一般正常情况下仓库中只存在这2个分支，但有时需要一些临时性的分支用于特定目的，这些分支在使用完成后应该删除掉，删除的命令为
```bash
git branch -d temp-branch
```
如果删除过程中出现错误需要强制删除的话可以执行
```bash
git branch -D temp-branch
```
注：临时分支不要提交到远程，在本地提交就可以了。
### 功能分支(feature)
比如突然需要开发某个新的功能，但不是必需的，或者实现起来可能有些困难而直接放弃，或者是BOSS临时的想法，但不确定是否要加入到产品中，此时可以使用功能分支。
```bash
git checkout -b feature-xxx develop
```
开发完成后需要合并到develop分支的话
```bash
git checkout develop
git merge --no-ff feature-xxx
```
然后删除
### 预发布分支(release)
当我们需要在正式发布版本前做一个测试的时候就需要预发布分支。使用过程和功能分支稍有差别，第一步创建
```bash
git checkout -b release-xxx develop
```
然后可能要执行一些操作，比如我会在这时执行grunt构建命令，完成开发代码到发布代码的构建。
当测试完成且没有问题的时候就开始合并代码
```bash
git checkout master
git merge --no-ff release-xxx
# 对合并后产生的新节点做一个标签(一般为版本号)
git tag -a xxx
```
接着根据情况考虑是否需要合并到开发分支(比如我grunt构建后的代码就不需要)，最后说删除此分支。
### 修复bug分支
项目正式发布后难免会有bug出现，此时就需要这样的分支，命名为`fixbug-xxx`，`xxx`一般是项目的bug管理中对应的bug编号。
```bash
git checkout -b fixbug-xxx master
```
修改完成后合并到`master`分支
```bash
git checkout master
git merge --no-ff fixbug-xxx
# 遵循版本升级原则
# 一般bug修复后的版本号在上个版本的最后一位上面加1
# 比如上个版本为0.1.0，那么bug修复后的版本就是0.1.1
git tag -a xxx
```
再合并到develop分支
```bash
git checkout develop
git merge --no-ff fixbug-xxx
```
最后删除此分支。
