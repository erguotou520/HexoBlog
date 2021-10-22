---
title: Flutter开发中遇到的问题总结
s: flutter-practice
date: 2021-09-26 16:27:00
cover: /images/flutter/cover.jpg
tags:
  - flutter
---

1. 不要在`flutter`中使用`/`开头的路由，按照官网对于`initialRoute`的介绍[https://api.flutter.dev/flutter/material/MaterialApp/initialRoute.html](https://api.flutter.dev/flutter/material/MaterialApp/initialRoute.html)，如果路由名由`/`开头那么将会被分割成多份并以此进入，所以应用启动前必然会先进入`/`对应的路由，而这可能产生一些不可控的问题。
2. 在使用`SharedPreferences.getInstance()`方法前一定要先执行`WidgetsFlutterBinding.ensureInitialized()`，否则会报`Null check operator used on a null value`的错误。
3. App 分享到微信 QQ 等，过程比较繁琐，需要先准备一个应用官网，不能太简单，需要有应用介绍、产品说明、隐私协议、用户协议、联系方式、备案信息等。

然后在 QQ 互联和微信开放平台分别注册一个移动应用。

接着按照苹果官网完成`Universal Links`的准备和配置工作完成配置，接着在 QQ 互联和微信开放平台里填写`Universal Link`地址，QQ 互联可以直接验证。

然后引用`wechat_kit` `tencent_kit`库，按照文档中的配置去操作，其中 微信在 `iOS` 端还需要重写一个方法方法，否则无法正常分享，在`AppDelegate.swift`文件里，重写后如下：

```swift
import UIKit
import Flutter

@UIApplicationMain
@objc class AppDelegate: FlutterAppDelegate,WXApiDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    GeneratedPluginRegistrant.register(with: self)
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  override func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
    return WXApi.handleOpenUniversalLink(userActivity ,delegate:self)
  }
}
```
