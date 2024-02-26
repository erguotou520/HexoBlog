---
title: k8s集群中App无法访问网络问题排查
s: k8s-network-refused
date: 2024-02-26 16:00:00
cover: https://istio.io/v1.12/img/service-mesh.svg
thumbnail: https://istio.io/v1.11/img/istio-bluelogo-whitebackground-framed.svg
tags:
  - k8s
  - istio
  - network
---
在工作中使用[Fireboom](https://fireboom.io)构建镜像后，使用`k8s`运行容器，发现应用无法访问网络，错误内容是:`dial tcp 10.14.228.89:9825: connect: connection refused`，导致`Fireboom`应用无法正常使用。多天排查后发现竟然是`Istio`的问题。

<!-- more -->
我们使用[Kubesphere](https://kubesphere.io/)来搭建`k8s`集群，它提供了很方便的`k8s`管理功能，包括对于应用部署非常重要的服务网格、蓝绿部署、金丝雀部署等。

最近正在逐步将我们的`Fireboom`相关应用重构为使用`k8s`来管理，为此我们构建了一个`Fireboom`二进制基础镜像，该镜像只有一个任务，就是`fireboom start`。我们的镜像在本地运行非常正常，于是我们推送到`Kubesphere`集群中部署：新建`自制应用`，开启`应用治理`，添加容器，添加 Volume 共享，启动。但是在`fireboom`容器中查看日志发现应用无法访问`oidc`和`s3`服务。

## 排查过程

1. 通过查看代码，发现这2个服务都是通过`golang`的`client.Do`方法来访问某个 URL，于是在`Kubesphere`中使用`Terminal`测试这些链接，结果都是可以连同的，排除网络问题
2. 在`Kubesphere`的其它命名空间中创建同样的应用，结果`Fireboom`启动日志是正确的，排除`Kubesphere`网络问题
3. 在原应用的同`namespace`中创建同样的应用，仍无法访问，猜测是不是`namespace`有什么不一样的设置，只是后来多次对比测试后没找到问题
4. 尝试在原应用中添加[wait-for-it.sh](https://github.com/vishnubob/wait-for-it)来测试容器启动阶段是否网络是通的，结果发现是可访问的，这就很懵了
5. 同事提醒我可以不要在应用下创建，于是我就在`Kubesphere`中单独开了一个`工作负载`，同样的容器和 Volume 配置，发现启动日志正常。于是对比了下和应用里的 Pod 的区别，那只剩下多出的`istio-init`和`istio-proxy`两个容器了
6. 根据查找出的现象，开始搜索，找到一篇文章提到要修改`istio`的`ConfigMap`中的`holdApplicationUntilProxyStarts`配置，但是文章中的配置方法较老，于是找到[官网的介绍](https://istio.io/v1.14/docs/ops/common-problems/injection/#pod-or-containers-start-with-network-issues-if-istio-proxy-is-not-ready)，根据官网描述在全局`ConfigMap`中找到`istio-system`命名空间下的`istio-sidecar-injector-1-14-6`配置，将其中的`holdApplicationUntilProxyStarts`修改为`true`，然后重启应用，结果从日志中发现应用可以正常访问网络了。激动！困扰了几天的问题终于解决了。

## 总结

`Istio`为我们提供了非常强大的应用治理能力，它通过在`init containers`注入一个`istio-proxy` sidecar 容器，来为整个 Pod 添加 `iptabls`规则并将流量重定向到`istio-proxy`也就是`Envoy`。但是由于`istio-proxy`的启动时间较长，因此在应用启动阶段，`istio-proxy`还未启动，导致应用流量转发失败而无法访问网络。

针对这个这个问题的解决方法就是`holdApplicationUntilProxyStarts`配置为`true`，可以是`k8s`全局的，也可以针对某个 Pod，上述的官网中这2种情况都有配置介绍。其实现原理是将`istio-proxy`注入为第一个 container，并添加`postStart`钩子`pilot-agent wait`，其目的就是等待`istio-proxy`流量转发完成并阻塞后续容器启动。这样当`istio-proxy`流量转发就绪的时候，应用就可以正常访问网络了。

![istio-proxy-injection.png](/images/k8s/istio-postStart.png)

这是我刚接触`k8s`实战的过程中遇到的一个问题，记录下来，希望对大家有所帮助。
