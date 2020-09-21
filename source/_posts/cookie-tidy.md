---
title: 工作中遇到的cookie知识整理
s: cookie-tidy
date: 2017-12-06 11:05:00
cover: /images/js/cookie.png
thumbnail: /images/js/cookie.png
tags:
  - Cookie
---
本文主要记录在工作中遇到的cookie知识的一些整理，这些零散的细节的知识点在没遇到的时候是模棱两可，遇到的时候又不是很深入地了解，所以还要查资料，写demo来反复验证。所以这里把这次关于`cookie`的知识记录下以便后续查看。

在介绍结果之前先阐述个基本知识：`同源`，即相同协议、相同域名、相同端口。浏览器对于跨域访问有一些限制，但是对于`cookie`的限制稍微有些不同。
<!-- more -->

在实验中我们**不讨论设置`cookie`的`domain`域**，只考虑设置`path`字段，有如下结论：

- 同源情况下共享`cookie`，没毛病
- 不同协议、同域名、同端口在不设置`path`或使用默认的`path=/`的情况下是共享`cookie`的，注意这里的默认`path`是`/`，此时http和https是可以共享的
- 同协议、同域名、不同端口在不设置`path`或使用默认的`path=/`的情况下是共享`cookie`的，此时跨端口是可以共享的
- 不同协议、同域名、不同端口在不设置`path`或使用默认的`path=/`的情况下是共享`cookie`的，此时跨端口是可以共享的
- 同协议、同域名、同端口、不同子目录的情况下在不设置`path`或使用默认的`path=/`的情况下是共享`cookie`的，即`http://xxx.xx:port/abc`和`http://xxx.xx:port/def`是共享`cookie`的
- 同协议、同域名、同端口、不同子目录的情况下在设置`path`为子目录的情况下不同的子目录是不共享`cookie`的，即`path=/abc`时`http://xxx.xx:port/abc`和`http://xxx.xx:port/def`不共享
- 同协议、同域名、不同端口、不同子目录的情况下在不设置`path`或使用默认的`path=/`的情况下是共享`cookie`的，即`http://xxx.xx:port1/abc`和`http://xxx.xx:port2/def`是共享`cookie`的
- 同协议、不同二级域名在不修改`domain`的情况下是不共享`cookie`的，即`https://super.domain.com`与`https://sub.domain.com`是不共享`cookie`的

因此可以得出：
> 不管使用哪个协议（HTTP/HTTPS）或端口号，浏览器都允许给定的域以及其任何子域名(sub-domains)来访问cookie。
但跨二级域名是不共享`cookie`的。

## 测试文件
[测试参考](https://gist.github.com/erguotou520/97aab008e765d80c772e5717ad01c1c1)

## 相关文章
- [RFC 6265](https://tools.ietf.org/html/rfc6265)
- [浏览器的同源策略](https://developer.mozilla.org/zh-CN/docs/Web/Security/Same-origin_policy)
- [浏览器同源政策及其规避方法](http://www.ruanyifeng.com/blog/2016/04/same-origin-policy.html)（文章中关于cookie限制这块有误）
