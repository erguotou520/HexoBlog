---
title: 利用dokku打造自己的私有云仓库和自动化部署
s: dokku_ci_cd
date: 2017-07-09 18:15:00
thumbnail: https://raw.githubusercontent.com/dokku/dokku/v0.10.3/docs/assets/dokku.png
tags:
  - dokku
  - gogs
  - drone
  - CI
  - CD
---

`dokku`是什么？一句话概括就是一个几百行shell代码的高可扩展性的类`Heroku`的单服务器PAAS平台，利用它可以简化很多docker操作，更加方便我们维护一个`docker driven`的平台。

1. 创建机器，选择`Ubuntu`系统，同时做好域名映射
2. 安装`dokku`
  ```bash
  # 选择0.9.4版本，后面的版本都有些问题
  wget https://raw.githubusercontent.com/dokku/dokku/v0.9.4/bootstrap.sh
  sudo DOKKU_TAG=v0.9.4 bash bootstrap.sh
  ```
  然后打开对应的域名，完成`dokku`的初始化
3. 创建`gogs`应用，参照[https://dokku.github.io/tutorials/deploying-gogs-to-dokku](https://dokku.github.io/tutorials/deploying-gogs-to-dokku)
  其中推送代码部分可以用`tag`部署方式，所有命令如下
  ```bash
  dokku apps:create gogs
  dokku proxy:ports-add gogs http:80:3000
  dokku docker-options:add gogs deploy -p 2222:22
  mkdir -p /var/lib/dokku/data/storage/gogs
  chown -R dokku:dokku /var/lib/dokku/data/storage/gogs
  dokku storage:mount gogs /var/lib/dokku/data/storage/gogs:/data
  dokku plugin:install https://github.com/dokku/dokku-mysql.git mysql
  dokku mysql:create gogs
  dokku mysql:link gogs gogs
  # 使用指定版本
  docker pull gogs/gogs:0.11.4
  docker tag gogs/gogs:0.11.4 dokku/gogs:0.11.4
  dokku tags:deploy gogs 0.11.4
  ```
4. 使用Let's Encrypt进行https加密
  ```bash
  sudo dokku plugin:install https://github.com/dokku/dokku-letsencrypt.git
  dokku config:set --global DOKKU_LETSENCRYPT_EMAIL=erguotou525@gmail.com
  dokku letsencrypt gogs
  dokku letsencrypt:cron-job --add
  ```
  完成之后打开web页面完成`gogs`的`install`，注意配置页面的各设置（mysql的配置地址可以用`dokku mysql:info gogs`查看。即使设置错了，也可以后期使用`dokku enter gogs`，在`/data/gogs/conf/app.ini`中直接修改）。
5. 创建`drone`应用，`drone`分`server`端和`agent`端
  ```bash
  # server
  dokku apps:create drone
  dokku mysql:create drone
  dokku mysql:link drone drone
  # 暂时不能使用最新版本，坑了很久
  # docker pull drone/drone:latest
  docker pull drone/drone:0.7.3
  docker tag drone/drone:0.7.3 dokku/drone:0.7.3
  # 配置drone的环境变量
  dokku config:set drone DRONE_OPEN=false DRONE_GOGS_PRIVATE_MODE=true DRONE_DATABASE_DRIVER=mysql DRONE_DATABASE_DATASOURCE='root:password@tcp(1.2.3.4:3306)/drone?parseTime=true' DRONE_HOST=https://drone.erguotou.me DRONE_GOGS=true DRONE_GOGS_URL=https://gogs.erguotou.me DRONE_SECRET=secret DRONE_ADMIN=username,password
  dokku tags:deploy drone 0.7.3
  dokku proxy:ports-add drone http:80:8000
  dokku proxy:ports-remove drone http:443:443 http:8000:8000 http:80:80
  dokku letsencrypt drone
  # agent，暂时不能使用最新版，直接使用docker命令启动，看最新版源码里/ws/broker请求都没有了
  # dokku apps:create drone-agent
  # docker pull drone/agent:latest
  # docker tag drone/agent:latest dokku/drone-agent:latest
  docker run -d -e DRONE_SERVER=wss://drone.erguotou.me/ws/broker -e DRONE_SECRET=password -e DRONE_TIMEOUT=15m -v /var/run/docker.sock:/var/run/docker.sock --restart=always --name=drone-agent-docker drone/drone:0.7.3 agent
  # 配置agent的环境变量
  # dokku config:set drone-agent DRONE_SERVER=wss://drone.erguotou.me/ws/broker DRONE_SECRET=secret
  # dokku storage:mount drone-agent /var/run/docker.sock:/var/run/docker.sock
  # dokku tags:deploy drone-agent latest
  ```
7. 检查应用运行情况
  可使用的命令
  ```bash
  dokku proxy:report app
  dokku proxy:ports-remove app http:80:3000
  dokku proxy:ports-add app http:80:3000
  cat /home/dokku/app/nginx.conf
  dokku ps:stop app
  dokku ps:start app
  ```
8. 创建自己的应用
  在`dokku`中创建对应的app `dokku apps:create gift`，完成域名映射，配置`proxy:ports`，使用`Let's encrypt`插件进行https加密，这些步骤就不多说了。接着在gogs中创建对应的一个仓库，记得项目根目录下要有一个`.drone.yml`文件（参考[http://docs.drone.io/getting-started/](http://docs.drone.io/getting-started/)进行配置），然后提交代码。
9. 自动发布应用
  上一步只能使用drone进行自动构建，要想将构建后的项目自动打包发布，还需要一些额外的操作（这里也是坑了自己好久，主要难题是如何将drone agent生成的文件发布到dokku git里，后来经人提醒可以通过共享ssh的方式，然后后续的共享ssh的操作也是摸索了好久才成功，可谓一路心酸）。
  - 找1台虚机生成一份新的ssh公私钥对（也可以本地备份原来的，然后重新生成）
    ```bash
    ssh-keygen -t rsa -C "dokku-deploy"
    ```
  - 将上一步生成的`id_rsa.pub`上传至服务器并添加到dokku中
    ```bash
    # local
    scp ~/.ssh/id_rsa.pub root@erguotou.me:/root/deploy.pub
    # server
    dokku ssh-keys:add deploy ./deploy.pub
    ```
  - 项目根目录新建一个`ssh`目录，然后将上一步生成的ssh公私钥复制进去
    ```bash
    cp ~/.ssh/id_rsa* ./ssh
    ```
  - 修改原来的`.drone.yml`，在原来build之后添加一些操作
    ```bash
    - rm -rf ~/.ssh
    - mkdir -p ~/.ssh
    - cp ssh/* ~/.ssh
    - chmod 600 ~/.ssh/id_rsa # 特别要注意这3行
    - chmod 644 ~/.ssh/id_rsa.pub
    - ssh-keyscan erguotou.me >> ~/.ssh/known_hosts
    - ssh-keyscan 45.77.42.201 >> ~/.ssh/known_hosts
    - echo 'FROM ilyasemenov/dokku-static-site' > dist/Dockerfile # 根据自己的项目选择合适的Dockerfile或者实现适合自己项目的Dockerfile，也可以使用buildpacks
    - cd dist
    - git config --global user.email "erguotou525@gmail.com"
    - git config --global user.name "erguotou"
    - git init
    - git add ./ -A
    - git commit -m "auto build"
    - git remote add dokku dokku@erguotou.me:gift
    - git push -u dokku master --force
    ```
    至此就完成了自动化部署的工作，现在就可以访问[https://gift.erguotou.me](https://gift.erguotou.me)了。
