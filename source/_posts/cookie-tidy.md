---
title: 工作中遇到的cookie知识整理
s: cookie-tidy
date: 2017-12-06 11:05:00
tags:
  - Cookie
---
本文主要记录在工作中遇到的cookie知识的一些整理，这些零散的细节的知识点在没遇到的时候是模棱两可，遇到的时候又不是很深入地了解，所以还要查资料，写demo来反复验证。所以这里把这次关于`cookie`的知识记录下以便后续查看。

在介绍结果之前先阐述个基本知识：`同源/同域`，即相同协议、相同域名、相同端口。浏览器对于`cookie`的一个限制是非同源请求不共享`cookie`。

在这个基础上我们不讨论设置`cookie`的`domain`域，只设置`path`字段，有如下结论：

- 同源情况下共享`cookie`，没毛病
- 同协议、同域名、不同端口在不设置`path`或使用默认的`path=/`的情况下是共享`cookie`的，注意这里的默认`path`是`/`，此时跨端口也是可以共享的
- 同协议、同域名、同端口、不同子目录的情况下在不设置`path`或使用默认的`path=/`的情况下是共享`cookie`的，即`http://xxx.xx:port/abc`和`http://xxx.xx:port/def`是共享`cookie`的
- 同协议、同域名、同端口、不同子目录的情况下在设置`path`为子目录的情况下不同的子目录是不共享`cookie`的，即`path=/abc`时`http://xxx.xx:port/abc`和`http://xxx.xx:port/def`不共享
- 同协议、同域名、不同端口、不同子目录的情况下在不设置`path`或使用默认的`path=/`的情况下是共享`cookie`的，即`http://xxx.xx:port1/abc`和`http://xxx.xx:port2/def`是共享`cookie`的

其它情况未做测试，但可根据同源限制得出相关结果。

## 测试文件
[测试参考](https://gist.github.com/erguotou520/97aab008e765d80c772e5717ad01c1c1)

## 相关文章
- [浏览器同源政策及其规避方法](http://www.ruanyifeng.com/blog/2016/04/same-origin-policy.html)
