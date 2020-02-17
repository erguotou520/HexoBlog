---
title: 利用Traefik搭建超简单的DevOps平台
s: traefik-devops
date: 2020-02-16 14:38:00
thumbnail: /images/devops/traefik-devops.jpg
tags:
  - traefik
  - devops
  - gogs
  - drone
  - registry
---

又是好久没有写博客了，忽然有点自己不知道继续往哪个方向发展，一会搞搞Flutter，一会又玩玩Docker，有时又想做些框架沉淀，很多东西都没深入做下去。正好之前搞的DevOps平台最近需要做些扩展，就花点时间把这次经验记录下来方便以后查看:joy:。

## 首先，做什么？为什么做？
还是DevOps，还是为了简化开发，还是低端机器，所以选择的方案依然是Gogs+drone。但是这次的方案有别于之前的Dokku，而是使用`traefik`作为网关服务器并且提供自动设置HTTPS的功能。先看下什么是`traefik`：
<!-- more -->

> Traefik 是一个边缘路由器，这意味着它是您平台的大门，它拦截并路由每个传入的请求:
> ![Traefik示意图](https://traefik.tech/docs/assets/img/traefik-concepts-1.png)
>
> 它管理所有逻辑和每个规则确定哪些服务处理哪些请求（基于路径，主机，headers，等等......）。
>

`traefik`支持服务自动发现，当我们在Docker上使用`traefik`时，只需给Docker容器指定Label，就可以让`traefik`自动发现它们，自动完成端口映射、域名绑定、HTTPS证书管理等:thinking:。

所以基于`traefik`的部署方案可以让我们省去很多配置工作（比如Nginx的配置，Let's Encrypt的证书申请和更新，负载均衡等），当然也留给了我们很多坑...:worried:

## 其次，准备阶段
一个1核2G2M的云服务器，ssh登录上，安装docker，安装docker-compose，这些官网都有教程，很简单，掠过。

然后我们先提前做好域名映射，如果你使`用traefik`的`dnsChallenge`方式可以跳过，`traefik`会利用api自动为你做好域名映射（应该是吧，反正我没用过，我更喜欢自己把控:thinking:）：
```
traefik.erguotou.me -> ip
whoami.erguotou.me -> ip
gogs.erguotou.me -> ip
drone.erguotou.me -> ip
registry.erguotou.me -> ip
registry-ui.erguotou.me -> ip
```

然后我们新建`.env`文件，并填入下面内容

```text
# 顶级域名，此处替换成自己的
SERVER_DOMAIN=erguotou.me

# Time Zone
TIME_ZONE=Asia/Shanghai

# ACME，此处替换成自己的
ACME_EMAIL=xxx

# Drone，此处替换成自己的
DRONE_SECRET=xxx
DRONE_ADMIN=xxx

# basicauth用户密码
# 使用 echo $(htpasswd -nb user password) 生成用户密钥
# 如果直接在yml中使用需要改为 echo $(htpasswd -nb user password) | sed -e s/\\$/\\$\\$/g
TRAEFIK_AUTH_USER=xxx
REGISTRY_AUTH_USER=xxx
REGISTRY_UI_AUTH_USER=xxx
```

接着新建一个`docker-compose.yml`文件，并填入下面内容
```yaml
# 目前最新版本，可以支持更多特性，虽然我可能也没用上啥特性
version: "3.7"
services:
  traefik:
    # The official docker image
    image: traefik:latest
    container_name: traefik
    # Enables the web UI and tells Traefik to listen to docker
    command:
      # 提供web查看页面
      - "--api.insecure=true"
      # 使用docker provider
      - "--providers.docker=true"
      # 取消暴露所有的容器，由我们自己把控
      - "--providers.docker.exposedbydefault=false"
      # 定义websecure
      - "--entryPoints.websecure.address=:443"
      # 使用tlschallenge方式进行https证书管理，当前也可以使用httpChallenge或者dnsChallenge
      - "--certificatesresolvers.mytlschallenge.acme.tlschallenge=true"
      # - "--certificatesResolvers.mytlschallenge.acme.httpchallenge.entryPoint=web"
      # 指定Let's Encrypt证书获取所使用的邮箱地址
      - "--certificatesResolvers.mytlschallenge.acme.email=${ACME_EMAIL}"
      # acme.json文件存储位置（容器内），方便后续暴露出来
      - "--certificatesResolvers.mytlschallenge.acme.storage=/etc/acme/acme.json"
    ports:
      - "443:443"
      # The Web UI (enabled by --api.insecure=true)
      - "8080:8080"
    volumes:
      - "./acme:/etc/acme"
      # So that Traefik can listen to the Docker events
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
    environment:
      - TZ=${TIME_ZONE}

  # 先启用一个官方示例的容器
  whoami:
    image: containous/whoami
    container_name: simple-service
    labels:
      - "traefik.enable=true"
      # 告诉traefik映射80端口
      - "traefik.http.services.whoami.loadbalancer.server.port=80"
      - "traefik.http.routers.whoami.rule=Host(`whoami.${SERVER_DOMAIN}`)"
      # 告诉traefik入口方式使用https
      - "traefik.http.routers.whoami.entrypoints=websecure"
      - "traefik.http.routers.whoami.tls.certresolver=mytlschallenge"
```

最后运行`docker-compose up`运行，我们看到`http://traefik.erguotou.me:8080/dashboard/`和`https://whoami.erguotou.me/`都可以正常访问，并且在traefik的Dashboard里可以看到成功纳管了一个Router。
![traefik面板](/images/devops/traefik-only-whoami.png)
![whoami启动完成](/images/devops/whoami.png)

## 再次，尝试与填坑
初步测试成功后我们开始搭建我们的DevOps平台，我们在原来的`docker-compose.yml`文件中追加以下内容

```yml
version: "3.7"

services:
  # ...原来的内容，下面是新增的
  # gogs
  gogs:
    container_name: gogs
    image: gogs/gogs
    restart: always
    hostname: gogs
    ports:
      - "10022:22"
    volumes:
      - ./devops/gogs:/data
    environment:
      - TZ=${TIME_ZONE}
    labels:
      - "traefik.enable=true"
      - "traefik.http.services.gogs.loadbalancer.server.port=3000"
      - "traefik.http.routers.gogs.rule=Host(`gogs.${SERVER_DOMAIN}`)"
      - "traefik.http.routers.gogs.entrypoints=websecure"
      - "traefik.http.routers.gogs.tls.certresolver=mytlschallenge"
  # drone 服务端
  drone-server:
    container_name: drone-server
    image: drone/drone
    restart: always
    hostname: drone-server
    volumes:
      - ./devops/drone-server:/var/lib/drone/
    environment:
      - TZ=${TIME_ZONE}
      - DRONE_GOGS_SERVER=https://gogs.${SERVER_DOMAIN}
      - DRONE_RPC_SECRET=${DRONE_SECRET}
      - DRONE_SERVER_HOST=drone.${SERVER_DOMAIN}
      - DRONE_SERVER_PROTO=https
      # 设置管理员
      - DRONE_USER_CREATE=username:${DRONE_ADMIN},admin:true
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.drone-server.rule=Host(`drone.${SERVER_DOMAIN}`)"
      - "traefik.http.routers.drone-server.entrypoints=websecure"
      - "traefik.http.routers.drone-server.tls.certresolver=mytlschallenge"
  # drone agent
  drone-agent:
    container_name: drone-agent
    image: drone/agent
    restart: always
    hostname: drone-agent
    depends_on:
      # 让server先起
      - drone-server
    # deploy:
      # mode: replicated
      # replicas: 6
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - TZ=${TIME_ZONE}
      - DRONE_RPC_HOST=drone.${SERVER_DOMAIN}
      - DRONE_RPC_SECRET=${DRONE_SECRET}
      - DRONE_SERVER_PROTO=https
      # 一台机器最多同时跑2个任务
      - DRONE_RUNNER_CAPACITY=2
      # - DRONE_RUNNER_NAME=${HOSTNAME}
    labels:
      # agent不需要对外暴露
      - "traefik.enable=false"
  # docker registry
  registry:
    container_name: registry
    image: registry
    restart: always
    hostname: registry
    volumes:
      - ./devops/registry:/var/lib/registry
    environment:
      - TZ=${TIME_ZONE}
      - REGISTRY_STORAGE_DELETE_ENABLED=true
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.registry.rule=Host(`registry.${SERVER_DOMAIN}`)"
      - "traefik.http.routers.registry.entrypoints=websecure"
      - "traefik.http.routers.registry.tls.certresolver=mytlschallenge"
      - "traefik.http.routers.registry.middlewares=registry-auth@docker"
       - "traefik.http.middlewares.registry-auth.basicauth.users=${REGISTRY_AUTH_USER}"
      - "traefik.http.middlewares.registry-auth.basicauth.removeheader=true"
  # docker registry 可视化web页面
  registry-ui:
    container_name: registry-ui
    image: quiq/docker-registry-ui
    #image: jc21/registry-ui
    #image: konradkleine/docker-registry-frontend:v2
    restart: always
    hostname: registry-ui
    depends_on:
      - registry
    environment:
      - TZ=${TIME_ZONE}
    # 此处有个大坑，对于Dockerfile中没有暴露端口的，需要自己手动指定下暴露的端口，这样traefik才能检测到要映射哪个端口，否则不成功
    expose:
      - 8000
    volumes:
      - ./devops/registry-ui.yml:/opt/config.yml:ro
    labels:
      - "traefik.enable=true"
      # 添加一个basic auth
      - "traefik.http.middlewares.registry-ui-auth.basicauth.users=${REGISTRY_UI_AUTH_USER}"
      - "traefik.http.middlewares.registry-ui-auth.basicauth.removeheader=true"
      - "traefik.http.services.registry-ui.loadbalancer.server.port=8000"
      - "traefik.http.routers.registry-ui.rule=Host(`registry-ui.${SERVER_DOMAIN}`)"
      - "traefik.http.routers.registry-ui.entrypoints=websecure"
      - "traefik.http.routers.registry-ui.tls.certresolver=mytlschallenge"
      - "traefik.http.routers.registry-ui.middlewares=registry-ui-auth@docker"
```
对于`registry-ui`镜像的选择，原来用的是`konradkleine/docker-registry-frontend:v2`，后来也试过`jc21/registry-ui`，但是容器体积都比较大，最后换了go语言的`quiq/docker-registry-ui`（每种镜像的配置稍有差异）要知道在小内存服务器上，Golang一条线才是正道:joy:。

除此之外我们给`registry`和`registry-ui`加了一个`traefik`提供的`baisicauth`中间件，帮助我们添加一层安全认证，只有指定的用户可以查看，方便:+1:！同时配置中提到的`registry-ui.yml`文件的内容如下（去掉了很多注释，具体可以看容器的文档说明）：

```yaml
listen_addr: 0.0.0.0:8000
base_path: /

registry_url: https://registry.erguotou.me
verify_tls: true
# 更换成自己的
registry_username: user
registry_password: pass
event_database_driver: sqlite3
event_database_location: data/registry_events.db
event_deletion_enabled: False
cache_refresh_interval: 10
anyone_can_delete: false
admins: []
debug: false
purge_tags_keep_days: 90
purge_tags_keep_count: 2
purge_tags_schedule: ''
```

我们开始启动服务`docker-compose up`，然后打开`gogs.erguotou.me`开始配置gogs，同时`drone`,`registry`,`registry-ui`服务也都起好了。
![初步启动完成](/images/devops/traefik-devops1.png)
等等，不是说好多坑么？Emmmmm~ 我这都是坑填完了得出的配置，`traefik`文档也不知道看了多少次，配置试了多少次。:sweat_smile:

一切看起来那么的美好:smirk:

## 接着，深入与实践
虽然服务都启动了，但还有些可以优化的点，并且我们还要验证下整个DevOps流程是否可以跑通，尤其是drone的agent我们还没有验证呢。在这之前我们先将配置文件分离下，按功能将`docker-compose.yml`中的service分开到多个文件中分别启动。

### 服务拆分
1. 删除初始版本中的`whoami`服务

2. 在`devops`目录新增`docker-compose.yml`文件，将后续添加的services剪切到yml文件中（yml文件中services和version根节点也要复制）

3. 修改`devops/docker-compose.yml`中`volumns`中映射路径

4. 分别启动`docker-compose up -d`和`docker-compose -f ./devops/docker-compose.yml up -d`

这里关于`.env`文件我做了一些测试，发现在`traefik`同级创建的`.env`文件在`devops`目录中不做任何操作可以直接访问到里面的环境变量，之前还一直以为需要手动指定呢。

~~另外上面的环境变量其实是不对了，原来的`.env`文件是当前目录下的，但是现在目录结构变了，所以那些环境变量就取不到了。
其实[有很多方法可以实现环境变量共享](https://stackoverflow.com/questions/36283908/re-using-environmental-variables-in-docker-compose-yml)，本来打算用`extends env_file`实现的，结果compose 3版本后不支持了，那就采用每个service指定`env_file`的方案吧（虽然有点麻烦），修改完重新启动。~~

访问不了？先看下`traefik`的路由表，发现有接入，但就是访问不了。无意间在查看`registry-ui`的启动日志时发现错误，说`registry.erguotou.me`访问不了。这是为什么呢？又是一番搜索排查尝试，最终发现当`devops services`和`traefik service`不在同一个文件时，我们需要让它们加入同一个网络，这样子`traefik`才可以完成自动代理。于是我们开始给`traefik`服务关联网络，给`devops`里的各种服务也绑定同样的网络。同时需要添加新的label`traefik.docker.network=traefik_webgateway`。改完重启，一切OK（最终配置可查看下文）。

### 给Traefik增加安全性
现在我们的`traefik`开启了8080的Dashboard，意味着别人也能看到我们的内容，所以在生产环境下我们需要关闭`traefik`的`api`服务，或者至少我们需要给`api`加一层认证。

关闭的话直接在`traefik`的`service`中把`--api.insecure=true`改为`--api=false`即可。

如果想看Dashboard又想安全性可以用上面说到的`basic auth`套一层，

### 验证DevOps流程
这里我们以一个简单的vue项目做测试看下如何实现`devops`自动化。

1. 在gogs上新建一个临时项目`/tmp/vue-demo`

2. 在本地使用`Vue cli`创建一个demo项目，并上传到git服务。此时不会触发任何后续操作

3. 添加`.drone.yml`，推送到仓库，yml文件内容大致如下
  ```yml
  ---
  kind: pipeline
  name: default

  trigger:
    event:
      - tag

  steps:
    - name: build
      image: plugins/docker
      settings:
        dockerfile: docker/Dockerfile
        registry: registry.erguotou.me
        repo: registry.erguotou.me/tmp/vue-demo
        username:
          from_secret: REGISTRY_USER
        password:
          from_secret: REGISTRY_PASSWORD
        tags:
          - latest
          - ${DRONE_TAG}
        auto_tag: true
        force_tag: true
    - name: deploy
      image: appleboy/drone-ssh
      settings:
        host: vue-demo.erguotou.me
        username:
          from_secret: SSH_USER
        ssh_key:
          from_secret: SSH_KEY
        script:
          # 在机器上执行一次login操作，以后就不用了
          # - docker login registry.erguotou.me --username ${REGISTRY_USER} --password ${REGISTRY_PASSWORD}
          - docker pull registry.erguotou.me/tmp/vue-demo:${DRONE_TAG}
          - docker-compose -f apps/vue-demo/docker-compose.yml stop
          - docker-compose -f apps/vue-demo/docker-compose.yml rm -f
          - docker-compose -f apps/vue-demo/docker-compose.yml up -d
    - name: send-wechat
      image: yakumioto/drone-serverchan
      settings:
        key:
          from_secret: SERVERCHAN_KEY
        text: "部署结果"
        # 目前该插件支持能力稍微不足，后期可以考虑自己开发下
        desp: "部署完成，[点击前往查看](https://vue-demo.erguotou.me)"
  ```

4. 查看drone上的构建结果，查看registry是否推送成功，查看项目是否部署成功
，最后结果可以成功，[点击地址查看](https://vue-demo.erguotou.me)。
![DevOps流程全部走完](/images/devops/traefik-drone-devops.png)

### 最终配置
最终`docker-compose.yml`文件内容如下：

```yml
version: "3.7"

services:
  traefik:
    image: traefik:latest
    container_name: traefik
    command:
      - "--api=true"
      - "--api.dashboard=true"
      - "--providers.docker=true"
      # 默认加入此网络，也许关联networks之后可以不设置？反正不关联networks其它的都映射不成功
      - "--providers.docker.network=traefik_webgateway"
      - "--providers.docker.exposedbydefault=false"
      - "--entryPoints.websecure.address=:443"
      - "--certificatesresolvers.mytlschallenge.acme.tlschallenge=true"
      - "--certificatesResolvers.mytlschallenge.acme.email=${ACME_EMAIL}"
      - "--certificatesResolvers.mytlschallenge.acme.storage=/etc/acme/acme.json"
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`traefik.${SERVER_DOMAIN}`)"
      - "traefik.http.routers.api.service=api@internal"
      - "traefik.http.services.api.loadbalancer.server.port=8080"
      - "traefik.http.routers.api.entrypoints=websecure"
      - "traefik.http.routers.api.tls.certresolver=mytlschallenge"
      - "traefik.http.routers.api.middlewares=auth"
      - "traefik.http.middlewares.auth.basicauth.users=${TRAEFIK_AUTH_USER}"
    networks:
      - traefik_webgateway
    ports:
      - "443:443"
    volumes:
      - "./acme:/etc/acme"
      - "/var/run/docker.sock:/var/run/docker.sock:ro"
    environment:
      - TZ=${TIME_ZONE}
networks:
  traefik_webgateway:
    name: traefik_webgateway
    driver: bridge
```

`devops/docker-compose.yml`文件内容如下：

```yml
version: "3.7"

services:
  # gogs
  gogs:
    container_name: gogs
    image: gogs/gogs
    restart: always
    hostname: gogs
    networks:
      - traefik
    ports:
      - "10022:22"
    volumes:
      - ./gogs:/data
    environment:
      - TZ=${TIME_ZONE}
    labels:
      - "traefik.enable=true"
      - "traefik.http.services.gogs.loadbalancer.server.port=3000"
      - "traefik.http.routers.gogs.rule=Host(`gogs.${SERVER_DOMAIN}`)"
      - "traefik.http.routers.gogs.entrypoints=websecure"
      - "traefik.http.routers.gogs.tls.certresolver=mytlschallenge"
  # drone 服务端
  drone-server:
    container_name: drone-server
    image: drone/drone
    restart: always
    hostname: drone-server
    networks:
      - traefik
    volumes:
      - ./drone-server:/var/lib/drone/
    environment:
      - TZ=${TIME_ZONE}
      - DRONE_GOGS_SERVER=https://gogs.${SERVER_DOMAIN}
      - DRONE_RPC_SECRET=${DRONE_SECRET}
      - DRONE_SERVER_HOST=drone.${SERVER_DOMAIN}
      - DRONE_SERVER_PROTO=https
      # 设置管理员
      - DRONE_USER_CREATE=username:${DRONE_ADMIN},admin:true
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.drone-server.rule=Host(`drone.${SERVER_DOMAIN}`)"
      - "traefik.http.routers.drone-server.entrypoints=websecure"
      - "traefik.http.routers.drone-server.tls.certresolver=mytlschallenge"
  # drone agent
  drone-agent:
    container_name: drone-agent
    image: drone/agent
    restart: always
    hostname: drone-agent
    depends_on:
      # 让server先起
      - drone-server
    # deploy:
      # mode: replicated
      # replicas: 6
    networks:
      - traefik
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - TZ=${TIME_ZONE}
      - DRONE_RPC_HOST=drone.${SERVER_DOMAIN}
      - DRONE_RPC_SECRET=${DRONE_SECRET}
      - DRONE_SERVER_PROTO=https
      # 一台机器最多同时跑2个任务
      - DRONE_RUNNER_CAPACITY=2
      # - DRONE_RUNNER_NAME=${HOSTNAME}
    labels:
      # agent不需要对外暴露
      - "traefik.enable=false"
  # docker registry
  registry:
    container_name: registry
    image: registry
    restart: always
    hostname: registry
    networks:
      - traefik
    volumes:
      - ./registry:/var/lib/registry
    environment:
      - TZ=${TIME_ZONE}
      - REGISTRY_STORAGE_DELETE_ENABLED=true
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.registry.rule=Host(`registry.${SERVER_DOMAIN}`)"
      - "traefik.http.routers.registry.entrypoints=websecure"
      - "traefik.http.routers.registry.tls.certresolver=mytlschallenge"
      - "traefik.http.routers.registry.middlewares=registry-auth@docker"
      - "traefik.http.middlewares.registry-auth.basicauth.users=${REGISTRY_AUTH_USER}"
      - "traefik.http.middlewares.registry-auth.basicauth.removeheader=true"
  # docker registry 可视化web页面
  registry-ui:
    container_name: registry-ui
    image: quiq/docker-registry-ui
    restart: always
    hostname: registry-ui
    networks:
      - traefik
    depends_on:
      - registry
    environment:
      - TZ=${TIME_ZONE}
    # 此处有个大坑，对于Dockerfile中没有暴露端口的，需要自己手动指定下暴露的端口，这样traefik才能检测到要映射哪个端口，否则不成功
    expose:
      - 8000
    volumes:
      - ./registry-ui.yml:/opt/config.yml:ro
    labels:
      - "traefik.enable=true"
      - "traefik.http.services.registry-ui.loadbalancer.server.port=8000"
      - "traefik.http.routers.registry-ui.rule=Host(`registry-ui.${SERVER_DOMAIN}`)"
      - "traefik.http.routers.registry-ui.entrypoints=websecure"
      - "traefik.http.routers.registry-ui.tls.certresolver=mytlschallenge"
      - "traefik.http.routers.registry-ui.middlewares=registry-ui-auth@docker"
      - "traefik.http.middlewares.registry-ui-auth.basicauth.users=${REGISTRY_UI_AUTH_USER}"
      - "traefik.http.middlewares.registry-ui-auth.basicauth.removeheader=true"

networks:
  traefik:
    external:
      name: traefik_webgateway
```

`traefik`的Dashboard效果如下：
![Traefik Dashboard](/images/devops/traefik-devops-final.png)

## 最后，总结
通过这么多天的不断学习和尝试，基本上填完了`traefik`作为网关路由器的坑，也让我学习了`traefik`的各种配置，最终组建了自己的`DevOps`平台。最终流程走通后心情非常舒畅，感觉完成了天大的事:joy:。

我们可以浅尝辄止，也可以深坑直入。这是自己的选择，也许也决定了自己的高度。

分享此文，给可能需要的人。
