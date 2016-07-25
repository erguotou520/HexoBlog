---
title: 利用firebase打造极速静态博客
s: hexo-on-firebase
date: 2016-07-25 14:38:24
tags:
  - Hexo
  - TravisCI
  - Firebase
  - Github
---
之前博客一直是做的动态的，后台页面，添加博文，然后保存后查看博文。但最近VPS感觉不稳定加之价格有点小高（主要是穷），打算将vps上的所有东西都放在云端，使用免费资源（还不是因为穷）。第一步就是从博客开始。
### Hexo介绍
`Hexo`是由台湾的一名大学生创建的静态博客系统，它基于'NodeJs'，生成文章的速度非常快，这也是为什么选择它的原因。当然还有很多其它的系统，但是作为`NodeJs`阵营的我当然是选择它啦。
### Hexo项目搭建
首先，安装[官方文档](https://hexo.io/zh-cn/docs/index.html)过一遍，在本地安装搭建一个`Hexo`项目，例如我的`HexoBlog`。
这时运行`hexo server`并打开浏览器访问`http://localhost:4000`应该就可以访问到你搭建后的博客了，如果没有，请仔细阅读文档，重来一遍。
这里我稍微修改了下`_config.yml`文件，然后添加了deploy模块
```yaml
deploy:
  type: git
  repo: https://github.com/erguotou520/HexoBlog.git
  branch: gh-pages
```
这样以后deploy后的`public`文件夹里的内容会自动提交到`gh-pages`分支下。
### 数据迁移
最开始的博客是在`Ghost`上跑的，后来又是用的`pagekit`，到现在的`Hexo`，每次数据迁移都是手动复制粘贴，太麻烦了，即使它们可能提供了一些迁移工具，但是还是会存在不靠谱的情况，所以还是手动复制吧。
这里要提到`Hexo`的一个好处了，文章是以`markdown`格式的文件存储，而不是存在数据库中，对于我们是可视的，再配合上后面的git，可以实现文章的历史管理。
### 结合Github
本地环境搭建好了之前就开始将它推送到github了，为什么放在github？一来是有个存储的地方，二来自带历史版本管理，三来可以实现自动化。
首先，添加hexo的git deploy插件。
```shell
npm install hexo-deployer-git --save
```

接着在项目中添加一些必要的文件，因为`Hexo`的生成器并没有生成这些文件和内容。
1. 添加`.gitignore`，把`node_modules`和`.deploy_git`添加进来，后者是在添加`hexo-deployer-git`插件并执行`hexo deploy`命令时会生成。
2. 补充`package.json`文件，可以加上`description`等其它字段，可选
3. 添加`README.md`说明文件，可选

OK，完成后开始推送。这个时候已经实现了hexo和github的结合，但是现在，每次添加完文章后都需要手动执行`hexo generate`和`hexo deploy`，是否可以更简单呢？
### 与Travis结合
我们可以利用`TravisCI`的自动化测试来进行自动构建任务。网上也有很多介绍`Hexo`+`Github`的文章，简单来说，就是在项目根目录下添加`.travis.yml`，内容如下
```yaml
language: node_js

node_js:
  - "6"

branches:
  only:
    - master

before_install:
  - npm install hexo-cli -g
  - git config --global push.default matching
  - git config --global user.name "erguotou"
  - git config --global user.email "erguotou525@gmail.com"
  - sed -i'' "/^ *repo/s~github\.com~${ACCESS_TOKEN}@github.com~" _config.yml

install:
  - npm install

script:
  # - git submodule init      # 用于更新主题
  # - git submodule update
  - hexo clean
  - hexo d -g

cache:
  directories:
    - node_modules
```
其中`{ACCESS_TOKEN}`就是下文要介绍的token。

接着在github中生成一个用于自动提交用的token。点击github中头像-->'Settings'-->`Personal access tokens`-->`Generate new token`生成一个给travis用的token（权限我只勾选了repo相关的）。
因为github提供了中使用token进行push的方式，这也是我为什么`_config.yml`文件中`deploy`模块用的repo是https地址的原因了。
生成token后将其添加到travis的环境变量中`ACCESS_TOKEN`=token。  
最后提交所有文件，等待`TravisCI`的构建结果，此时应当完成了与`TravisCI`结合的功能，如果构建报错，请具体结合报错内容修改。
### 与Firebase结合
说到现在，我们都还没提到我们的主角`Firebase`。对于还不了解Firebase的同学建议先去看下网上的介绍。Firebase为我们提供了实时的云端存储和并提供全球CDN服务，我就是要利用它的CDN服务将我们的静态博客挂在CDN上。
首先，全局安装它的cli工具
```shell
npm install -g firebase-tools
```
然后登录firebase
```shell
# 不带参数会登录报错
firebase login --no-localhost
```
接着进入项目根目录，执行
```shell
firebase init
```
安装提示完成初始化，Firebase会自动在项目根目录下创建`firebase.json`文件，我们保证`firebase.json`里的`public`值为`public`即可，因为`public`文件夹是`hexo`生成的博客的目录。
此时执行`firebase deploy`就可以将我们的博客推送上去了。但是我们需要结合`TravisCI`实现自动部署，所以在`.travis.yml`中添加firebase的自动部署模块
```yaml

```
最后git提交推送，travis自动构建，firebase自动部署，OK，完美。
### Firebase自定义域名
默认firebase会为我们提供一个域名访问地址，但我们一般会用自己的域名来访问。此时按照Firebase Hosting的文档提示，在我们的域名中添加2个txt记录完成域名拥有权的验证，验证完成后等待firebase颁发https证书（我睡了一晚，醒来之后就好了），最后按照提示，将我们自己的域名做一个cname，解析到firebase给我们提供的域名上就可以啦。

### 总结
本文介绍了Hexo+Github+TravisCI+Firebase搭建一个免费的拥有https的全球cdn加速的静态博客，综合利用了现有的网上资源，整个搭建过程会遇到各种问题，但都被一一解决。当然，Hexo作为静态博客，也会有一些不足，但这些不足我们都可以使用插件系统来实现，这也是后面要做的内容。
后面打算利用Firebase的database功能实现一个简单的博客评论系统，然后是定义一个自己用的主题，默认的太难看啦。后面的还有很长的一段路要走呢～
