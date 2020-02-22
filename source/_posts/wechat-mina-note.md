---
title: 微信小程序开发填坑整理
s: wechat-mina-note
date: 2020-02-21 13:52:00
thumbnail: /images/wechat/mina.png
tags:
  - wechat
  - 小程序
---

- `open-data`显示头像，希望加圆角，直接使用`border-radius`不生效，需要再加`overflow:hidden`，猜测为`open-data`下还有子节点，而图片在子节点上，必须在父节点上加`overflow:hidden`来隐藏超出部分
- `picker`上设置`flex`一类的样式无法直接应用到子节点上，需要在`picker`内部再套一层带样式的`view`，原因同上。例如
  ```html
  <picker>
    <view class="flex ai-center">
      <view class="child1"></view>
      <view class="child2"></view>
    </view>
  </picker>
  ```
