---
title: 解决Optinal chaining会报no-unused-exceptions的错误
s: eslint-optional-chaining-unused
date: 2020-06-10 15:30:00
cover: /images/js/optional-chaining-unused.png
thumbnail: /images/js/optional-chaining-unused.png
tags:
  - eslint
  - optional chaining
---

## 问题起源
在使用`vue-cli`生成的项目中可以直接使用可选链(Optional chaining)的写法，如`this.foo?.bar?.[0]?.()`。但是有时候会报一个`no-unused-exceptions`的错误，`eslint`认为你这写法仅仅是一个表达式而不是函数调用。一开始就1/2处的时候就直接`eslint-disable-next-line`忽略掉，但是多了后就在想不能老这么办啊，于是就上网搜索解决方法。

## 解决方法
最终[在这里](https://github.com/eslint/eslint/issues/11045)看到解决方法，禁用`eslint`的`no-unused-expressions`规则，改为使用`babel`的`babel/no-unused-expressions`规则。应该是`eslint`默认的规则还没有跟上时代，那`babel`就说我来替你处理吧。也许以后`eslint`升级了就可以不需要这么写了。
