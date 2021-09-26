---
title: Flutter开发中遇到的问题总结
s: flutter-practice
date: 2021-09-26 16:27:00
cover: /images/flutter/cover.jpg
thumbnail: /images/ci/thumbnail.jpg
tags:
  - flutter
---

1. 不要在`flutter`中使用`/`开头的路由，按照官网对于`initialRoute`的介绍[https://api.flutter.dev/flutter/material/MaterialApp/initialRoute.html](https://api.flutter.dev/flutter/material/MaterialApp/initialRoute.html)，如果路由名由`/`开头那么将会被分割成多份并以此进入，所以应用启动前必然会先进入`/`对应的路由，而这可能产生一些不可控的问题。
