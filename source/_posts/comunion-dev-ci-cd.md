---
title: 我是如何给Comunion开发环境做CI/CD的
s: comunion-dev-ci-cd
date: 2020-05-26 12:00:00
thumbnail: /images/comunion/logo.png
tags:
  - comunion
  - ci
  - cd
  - github actions
---

## 项目介绍

`Comunion`是一个分布式的协作网络，通过区块链的技术去重新组织生产力和劳动的交易模式，从而实现全球劳动力、资源的自由、高效的流通和交易的一个平台:two_hearts:。详情可以[查看官网](https://comunion.io)。

目前我在项目中主要负责前端开发和自动化打包发布等工作:construction_worker:。

<!-- more -->

## CI/CD 流程

1. 分支命名约束

为了保证前后端仓库的 CI 配置文件可以通用，所以我们约定将`master`分支作为开发分支，将`qa`分支作为测试分支，`prod`分支作为线上版本分支。最终构建的 Docker 镜像在`master`分支将打上`dev`和`latest`标签，`qa`分支将打上`qa`标签，`prod`分支将打上`prod`标签。

2. Docker 打包配置

我们约定前后端同时使用 Docker 作为交付结果，所以前后端都要维护自己的`Dockerfile`甚至是`docker-compose.yml`。原本前端这边想的是可以做简单点，就只有一个`nginx`容器，通过`volume`挂载配合`scp`上传来实现。但是后来跟后端沟通了下既然后端是需要`registry`仓库的，那前端也就弄成完整镜像的形式吧。于是`Dockerfile`就类似下面的内容

```dockerfile
# build stage
FROM node:lts-alpine as build-stage
WORKDIR /app
COPY ./package*.json ./
RUN yarn install
COPY . .
RUN yarn run build

# production stage
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
COPY ./docker/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

其中 nginx.conf 的配置如下

```conf
server {
  listen       80;
  server_name  _ default_server;
  # charset utf-8;
  # access_log  /var/log/nginx/log/access.log  main;

  location / {
    root   /usr/share/nginx/html;
    index  index.html;
    try_files   $uri $uri/ /index.html;
  }

  #error_page  404              /404.html;

  # redirect server error pages to the static page /50x.html
  #
  error_page   500 502 503 504  /50x.html;
  location = /50x.html {
    root   html;
  }
}
```

后端的打包逻辑大概就是`go build`各个模块，然后用`alpine`镜像拷贝 Golang 打包好的二进制文件，最后运行二进制文件这样的一个过程，具体可以查看后端代码。

3. Github actions 流程和配置

先看图:+1:
![](/images/comunion/github-actions.png)

其中有几点需要说明。第一个在进行`ssh`登录并重启时提供的是`ssh`私钥，为了安全考虑加了一层`passphrase`，然后这些私密设置都是在`Github secret`里设置但，但从某种意义上来说这样也不能保证完全安全，毕竟这个`appleboy/ssh-action` action 也是可以利用收集到的数据进行 ssh 连接的，所以我们只是在开发环境这么使用，正式线上环境可以考虑自建 ci，风险可以自己把控。

另一个目前镜像是推送到自己到仓库里的，其实可以直接推到`Docker Hub`，毕竟我们本来就是源代码公开的。

还有一个是微信推送用的是国人维护的一个公众号推送服务，然后在`Github action`里封装了一层，但这个服务仍然有 down 的风险。

前后端流程基本一致，除了代码校验和打包发布的代码稍有不同，主体流程基本一致的。

4. 部署机器环境准备

首先我们需要给机器安装好`docker`和`docker-compose`，这里不做过多说明。然后利用之前博客里提到的[利用 Traefik 搭建超简单的 DevOps 平台](./traefik-devops.html)的方案实现服务自动发现和自动添加`https`的功能，但是需要去掉`Dashboard`功能，`traefik`的配置如下：

```yml
version: "3.7"

services:
  traefik:
    image: traefik:latest
    container_name: traefik
    command:
      - "--api=true"
      - "--api.dashboard=false"
      - "--providers.docker=true"
      - "--providers.docker.network=traefik_webgateway"
      - "--providers.docker.exposedbydefault=false"
      - "--entryPoints.websecure.address=:443"
      - "--certificatesresolvers.mytlschallenge.acme.tlschallenge=true"
      - "--certificatesResolvers.mytlschallenge.acme.email=${ACME_EMAIL}"
      - "--certificatesResolvers.mytlschallenge.acme.storage=/etc/acme/acme.json"
    labels:
      - "traefik.enable=false"
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

然后我们需要准备`registry`和`registry-ui`作为`docker`容器仓库，这个和之前那篇文章一样，就不做过多介绍。接着创建前后端的目录，创建好前后端的`docker-compose.yml`配置文件，前端的配置文件蛮简单的

```yml
version: "3.7"

services:
  cos-front-com:
    image: registry.comunion.io/comunion/cos-front-com:dev
    container_name: cos-front-com
    restart: always
    networks:
      - traefik
    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=traefik_webgateway"
      - "traefik.http.services.cosFront.loadbalancer.server.port=80"
      - "traefik.http.routers.cosFront.rule=Host(`dev.${SERVER_DOMAIN}`)"
      - "traefik.http.routers.cosFront.entrypoints=websecure"
      - "traefik.http.routers.cosFront.tls.certresolver=mytlschallenge"

networks:
  traefik:
    external:
      name: traefik_webgateway
```

但是后端的配置方式折腾了我好几天:sob:，因为后端是微服务模式，而且我不想增加域名，直接在前端的 url 后面加`/api/xxx`就能访问到后端服务。最终还是在`traefik`官网的`migration`的文章中找到了答案（一开始我怎么也想不到竟然会在迁移教程里找到我想要的内容...），最终配置如下

```yml
version: "3.7"

networks:
  app:
  traefik:
    external:
      name: traefik_webgateway

services:
  comunion-redis:
    container_name: comunion-back-redis
    image: redis:alpine
    restart: always
    networks:
      - app

  # 这里以一个account服务作为示例，其它服务配置基本一致
  comunion-account:
    image: registry.comunion.io/comunion/cos-back-account:dev
    container_name: comunion-back-account
    volumes:
      - /etc/localtime:/etc/localtime
    env_file:
      - ./comunion-conf.env
    environment:
      PG_MASTER: postgres://xxx:xxx@comunion-db:5432/xxx?sslmode=disable&connect_timeout=10&search_path=comunion&timezone=Asia/Shanghai
    depends_on:
      - comunion-redis
    restart: always
    networks:
      - app
      - traefik
    labels:
      - "traefik.enable=true"
      - "traefik.docker.network=traefik_webgateway"
      - "traefik.http.services.comunion-account.loadbalancer.server.port=80"
      # 先添加PathPrefix
      - "traefik.http.routers.comunion-account.rule=Host(`dev.${SERVER_DOMAIN}`) && PathPrefix(`/api/account`)"
      - "traefik.http.routers.comunion-account.entrypoints=websecure"
      - "traefik.http.routers.comunion-account.tls.certresolver=mytlschallenge"
      # 再通过stripprefix去掉传递到容器服务的url前缀
      - "traefik.http.routers.comunion-account.middlewares=api-account-stripprefix"
      - "traefik.http.middlewares.api-account-stripprefix.stripprefix.prefixes=/api/account"

  comunion-db:
    image: postgres:10.3-alpine
    container_name: comunion-back-db
    networks:
      - app
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=xxx
      - POSTGRES_PASSWORD=xxx
      - POSTGRES_DB=xxx
```

5. 流程跑通
1. 前端代码 merge 到`master`分支，触发`Github actions`，开始构建、打包镜像，上传到仓库，`ssh`连接并拉取最新镜像，重新跑`docker`容器，完成后发送微信通知。
1. 后端代码 merge 到`master`分支，触发`Github actions`，开始构建、打包镜像，上传到仓库，`ssh`连接并拉取最新镜像，重新跑`docker`容器，完成后发送微信通知。

完美！:smirk:

## 最后

- :link: [前端仓库地址](https://github.com/comunion-io/cos-front-com)

- :link: [后端仓库地址](https://github.com/comunion-io/cos-backend-com)
