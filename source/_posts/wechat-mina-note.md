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
<!-- more -->
- 部分原生组件上无法使用`svg`图片地址，例如`map`组件的`markers`使用`svg`图片在模拟器上能显示在真机上显示不出来。其它的一些组件也有可能会有。
- 想要在小程序上实现表格组件，第一时间想到的可能是`flex`布局，但是`flex`布局无法保证`td`和`th`在不设置具体宽度的情况下保持相同宽度。其次可能会想到用`grid`布局，但是小程序对`grid`布局的兼容性无法保证。最后能想到的就是用`table`布局了。
  但随着业务开发，发现简单的数据渲染已经无法满足了，可能还需要支持类似web上自定义render的功能，但小程序不支持`scoped-slot`，思来想去只能用`slot`加索引的方式实现。最后还有个默认空数据的提示，由于不支持`colspan`属性，只能用hack方式实现。具体`table`组件代码可参考如下（mpx组件）
  ```html
  <template>
    <view class="table relative">
      <view class="tr">
        <view wx:for="{{computedColumns}}" wx:key="index" class="th"
          wx:style="{{{textAlign:item.align,width:item.width}}}">
          {{item.title}}
        </view>
      </view>
      <view wx:if="{{!data.length}}" class="tr placeholder">
        <view wx:for="{{computedColumns}}" wx:key="index" class="td">　</view>
        <view class="placeholder-text">{{placeholder}}</view>
      </view>
      <view wx:for="{{data}}" wx:for-index="rowIndex" wx:for-item="row" wx:key="rowIndex" class="tr">
        <view wx:for="{{computedColumns}}" wx:key="index" class="td"
          wx:style="{{{textAlign:item.align,width:item.width}}}">
          <slot wx:if="{{item.slot}}" name="col_{{rowIndex}}" />
          <block wx:else>{{ data[rowIndex][item.key]}}</block>
        </view>
      </view>
    </view>
  </template>

  <script>
  import { createComponent } from '@mpxjs/core'

  export default createComponent({
    options: {
      styleIsolation: 'apply-shared',
      multipleSlots: true
    },
    properties: {
      /**
      * [{
      *  title:'',
      *  key:'',
      *  width:?rpx,
      *  align: 'left/center/right'
      * }]
      */
      columns: {
        type: Array,
        value: []
      },
      data: {
        type: Array,
        value: []
      },
      placeholder: {
        type: String,
        value: '暂无数据'
      }
    },
    computed: {
      computedColumns() {
        return this.columns.map(col => {
          return {
            ...col,
            width: typeof col.width === 'number' ? `${col.width}rpx` : col.width
          }
        })
      }
    }
  })
  </script>

  <script type="application/json" lang="json">
  {
    "component": true
  }
  </script>

  <style lang="stylus">
  @import '~@/assets/styles/variables.styl'
  .table {
    display table
    width 100%
    border-collapse: collapse;
    .tr {
      width: 100%;
      display table-row
    }
    .th,
    .td {
      display table-cell
      padding 20rpx 8rpx
      width auto
      vertical-align middle
      font-size 24rpx
      color $darkTextColor
    }
    .th {
      color $greyTextColor
    }
    .td {
      border-top 1px solid $dividerColor
    }
    .placeholder {
      .td {
        height: 72rpx;
      }
    }
    .placeholder-text {
      position absolute
      left 50%
      top 92rpx
      font-size 24rpx
      color $placeholderColor
      transform translateX(-50%)
    }
  }
  </style>
  ```
