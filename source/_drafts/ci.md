---
layout: false
title: CI简介和实际应用
s: ci-intro
date: 2017-01-16 23:06:00
tags:
  - ci
  - travis ci
  - gitlab ci
---
# CI
## 什么是CI
![CI](https://pic2.zhimg.com/c5c8e6f40c7c133e22402c00bb7e1a25_b.png)
饮用知乎上的一个回答
> 作者：赵劼  
> 链接：https://www.zhihu.com/question/23444990/answer/26995938  
> 来源：知乎  
> 著作权归作者所有，转载请联系作者获得授权。

> 集成是指软件个人研发的部分向软件整体部分交付，以便尽早发现个人开发部分的问题；部署是代码尽快向可运行的开发/测试节交付，以便尽早测试；  
交付是指研发尽快向客户交付，以便尽早发现生产环境中存在的问题。  
如果说等到所有东西都完成了才向下个环节交付，导致所有的问题只能再最后才爆发出来，解决成本巨大甚至无法解决。
而所谓的持续，就是说每完成一个完整的部分，就向下个环节交付，发现问题可以马上调整。是的问题不会放大到其他部分和后面的环节。

> 这种做法的核心思想在于：既然事实上难以做到事先完全了解完整的、正确的需求，那么就干脆一小块一小块的做，并且加快交付的速度和频率，使得交付物尽早在下个环节得到验证。早发现问题早返工。

> 举个例子，你家装修厨房，其中一项是铺地砖，边角地砖要切割大小。如果一次全切割完再铺上去，发现尺寸有误的话浪费和返工时间就大了，不如切一块铺一块。这就是持续集成。
装修厨房有很多部分，每个部分都有检测手段，如地砖铺完了要测试漏水与否，线路铺完了要通电测试电路通顺，水管装好了也要测试冷水热水。如果全部装完了再测，出现问题可能会互相影响，比如电路不行可能要把地砖给挖开……。那么每完成一部分就测试，这是持续部署。
全部装修完了，你去验收，发现地砖颜色不合意，水池太小，灶台位置不对，返工吗？所以不如没完成一部分，你就去用一下试用验收，这就是持续交付。
--------------------
补充：从敏捷思想中提出的这三个观点，还强调一件事：通过技术手段自动化这三个工作。加快交付速度。

还有些细节可以参考[阮一峰的文章](http://www.ruanyifeng.com/blog/2015/09/continuous-integration.html)

## 常用的持续集成工具
- [Travis CI](https://travis-ci.org/) 针对开源项目免费，私有项目收费
- [AppVeyou](https://www.appveyor.com/) 主要是windows平台的持续集成
- [Gitlab CI](https://about.gitlab.com/gitlab-ci/) 私有仓库Gitlab自带的CI
- [Jenkins](https://jenkins.io/index.html) 同样的开源产品，适合私有仓库使用，但是需要jre环境来部署

## 项目实践
- [vue-fullstack](https://github.com/erguotou520/vue-fullstack)
  该项目为一个`vue`全栈项目模板，项目中使用`travis`做持续集成  
  ```yaml
  language: node_js
  node_js:
    - "6"
  before_install:
    - git config --global push.default matching
    - git config --global user.name "erguotou"
    - git config --global user.email "erguotou525@gmail.com"
  install:
    - npm install -g vue-cli
    - npm install
    - node test/index.js
  script:
    - cd ../test-fullstack
    - npm install
    - npm run lint
    - npm run build
  cache:
    directories:
      - node_modules
      - ../test-fullstack/node_modules
      - $(npm config get prefix)/vue-cli
  ```
  该配置文件中主要就做了一件事，根据当前模板生成一个项目文件并执行代码检查和构建操作，以此来简单地验证模板生成的正确性。  
  *TODO:最好可以添加一个文件结构验证的代码，另外后续会根据生成后的项目自动push到github的其它分支中，并通过heroku实现自动部署*
- [electron-ssr](https://github.com/erguotou520/electron-ssr) 该项目是`ShadowsocksR`的一个多平台pc客户端，该项目同时使用了`travis`和`appveyor`用来构建不同平台上的安装包文件，简单的看下配置文件  
  ```yaml
  # travis
  osx_image: xcode7.3

  sudo: required
  dist: trusty

  language: c

  matrix:
    include:
      - os: osx
      - os: linux
        env: CC=clang CXX=clang++ npm_config_clang=1
        compiler: clang

  addons:
    apt:
      sources:
        - ubuntu-toolchain-r-test
      packages:
        - icnsutils
        - graphicsmagick
        - xz-utils
        - rpm

  cache:
    directories:
    - node_modules
    - app/node_modules
    - $HOME/.electron
    - $HOME/.cache

  before_install:
    - mkdir -p /tmp/git-lfs && curl -L https://github.com/github/git-lfs/releases/download/v1.2.1/git-lfs-$([ "$TRAVIS_OS_NAME" == "linux" ] && echo "linux" || echo "darwin")-amd64-1.2.1.tar.gz | tar -xz -C /tmp/git-lfs --strip-components 1 && /tmp/git-lfs/git-lfs pull

  install:
  - nvm install 6
  - npm install electron-builder
  - npm install
  - npm prune

  script:
  - npm run build

  branches:
    only:
      - master
  ```

  ```yaml
  version: 1.0.{build}

  platform:
    - x64

  cache:
    - node_modules
    - app\node_modules
    - '%APPDATA%\npm-cache'
    - '%USERPROFILE%\.electron'

  branches:
    only:
    - master

  init:
    - git config --global core.autocrlf input

  install:
    - ps: Install-Product node 6 x64
    - git reset --hard HEAD
    - npm install npm -g
    - npm install electron-builder
    - npm install
    - npm prune

  build_script:
    - node --version
    - npm --version
    - npm run build
  ```
  我们可以看到在`travis`中同时定义了Linux和Mac的构建任务，在`appveyor`中定义了Windows平台的构建任务。任务的大致流程都是根据当前的系统环境构建当前系统的安装包（打包App的任务由构建工具提供），然后自动发布到Gihub Release中，这样就实现了代码push->打包构建（全平台）->发布的完整过程，免去很多手动操作以及对系统环境的要求。
- [vio-frontend]() T2Cloud的VIO产品前端代码，集成Gitlab CI实现自动编译并发布到poc环境，配置文件如下：
  ```yaml
  ```

## 总结
简单的说，持续集成帮助我们开发人员免去很重复的手工操作任务，同时可以帮我们持续观察项目的构建状态，测试通过与否，实在是我们开发之幸。
