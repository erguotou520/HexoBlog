---
title: 利用dokku打造自己的私有云仓库和自动化部署
s: dokku_ci_cd
date: 2017-07-09 18:15:00
tags:
  - dokku
  - gogs
  - drone
  - CI
  - CD
---
# 利用dokku打造自己的私有云仓库和自动化部署
1. 创建机器，选择`Ubuntu`系统，同时做好域名映射  
2. 安装`dokku`
  ```shell
  # 选择0.9.4版本，后面的版本都有些问题
  wget https://raw.githubusercontent.com/dokku/dokku/v0.9.4/bootstrap.sh
  sudo DOKKU_TAG=v0.9.4 bash bootstrap.sh
  ```
  然后打开对应的域名，完成`dokku`的初始化  
3. 创建`gogs`应用，参照[https://dokku.github.io/tutorials/deploying-gogs-to-dokku](https://dokku.github.io/tutorials/deploying-gogs-to-dokku)
  其中推送代码部分可以用`tag`部署方式，所有命令如下
  ```shell
  dokku apps:create gogs
  dokku proxy:ports-add gogs http:80:3000
  dokku docker-options:add gogs deploy -p 2222:22
  mkdir -p /var/lib/dokku/data/storage/gogs
  chown -R dokku:dokku /var/lib/dokku/data/storage/gogs
  dokku storage:mount gogs /var/lib/dokku/data/storage/gogs:/data
  dokku plugin:install https://github.com/dokku/dokku-mysql.git mysql
  dokku mysql:create gogs
  dokku mysql:link gogs gogs
  docker pull gogs/gogs:latest
  docker tag gogs/gogs:latest dokku/gogs:latest
  dokku tags:deploy gogs latest
  ```
4. 使用Let's Encrypt进行https加密
  ```shell
  sudo dokku plugin:install https://github.com/dokku/dokku-letsencrypt.git
  dokku config:set --global DOKKU_LETSENCRYPT_EMAIL=erguotou525@gmail.com
  dokku letsencrypt gogs
  dokku letsencrypt:cron-job --add
  ```
  完成之后打开web页面完成`gogs`的`install`，注意配置页面的各设置（mysql的配置地址可以用`dokku mysql:info gogs`查看。即使设置错了，也可以后期使用`dokku enter gogs`，在`/data/gogs/conf/app.init`中直接修改）。
5. 创建`drone`应用，`drone`分`server`端和`agent`端
  ```shell
  # server
  dokku apps:create drone
  dokku mysql:create drone
  dokku mysql:link drone drone
  # 暂时不能使用最新版本，坑了很久
  # docker pull drone/drone:latest
  docker pull drone/drone:0.7.3
  docker tag drone/drone:0.7.3 dokku/drone:0.7.3
  # 配置drone的环境变量
  dokku config:set drone DRONE_OPEN=false DRONE_DATABASE_DRIVER=mysql DRONE_DATABASE_DATASOURCE='root:password@tcp(1.2.3.4:3306)/drone?parseTime=true' DRONE_HOST=https://drone.erguotou.me DRONE_GOGS=true DRONE_GOGS_URL=https://gogs.erguotou.me DRONE_SECRET=secret DRONE_ADMIN=username,password
  dokku tags:deploy drone 0.7.3
  dokku letsencrypt drone
  # agent，暂时不能使用最新版，直接使用docker命令启动，看最新版源码里/ws/broker请求都没有了
  # dokku apps:create drone-agent
  # docker pull drone/agent:latest
  # docker tag drone/agent:latest dokku/drone-agent:latest
  docker run -d -e DRONE_SERVER=wss://drone.erguotou.me/ws/broker -e DRONE_SECRET=password -e DRONE_GOGS_PRIVATE_MODE=true -v /var/run/do cker.sock:/var/run/docker.sock --restart=always --name=drone-agent-docker drone/drone:0.7.3 agent
  # 配置agent的环境变量
  dokku config:set drone-agent DRONE_SERVER=wss://drone.erguotou.me/ws/broker DRONE_SECRET=secret
  dokku storage:mount drone-agent /var/run/docker.sock:/var/run/docker.sock
  dokku tags:deploy drone-agent latest
  ```
7. 检查应用运行情况
  可使用的命令
  ```shell
  dokku proxy:report app
  dokku proxy:ports-remove app http:80:3000 
  dokku proxy:ports-add app http:80:3000 
  cat /home/dokku/app/nginx.conf
  dokku ps:stop app
  dokku ps:start app
  ```
8. 创建自己的应用
  在`gogs`中创建仓库，编写`.drone.yml`（参考[http://docs.drone.io/getting-started/](http://docs.drone.io/getting-started/)），提交代码。系统将自动触发`drone`构建
9. TODO:自动发布应用
  将上一步自动构建生成的应用自动打包部署
