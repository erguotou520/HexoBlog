---
title: Ghost开发之API
s: ghost-api
date: 2015-03-18 19:49:00
tags:
  - Ghost
  - Api
---
# Ghost API 接口
当前版本为0.5.8，后续更新的API不在其中。 本文写作时用的是英文版，下面所有涉及`language`为`en_US`的对应的中文版为`zh_CN`。
下面所有的链接都是以`http://your.blog.site:port`开头，请注意。
你可以使用Chrome的Postman工具进行调试
![](/images/ghost/postman.png)
<!-- more -->
## 登录认证
POST `/ghost/api/v0.1/authentication/token`
ACCEPT json
DATA
```js
{
  grant_type:password
  username:your.email@email.com(请替换为你的邮箱)
  password:your_password(请替换为你的登录密码)
  client_id:ghost-admin
}
```
RESULT
```js
{
  access_token: 'xxx',
  expires_in: 3600,
  refresh_token: 'xxx',
  token_type: "Bearer"
}
注意保存返回的结果
```
如果登录错误，会返回错误结果
```js
{
  status: 404
  errors[0]: {message: 'xxx', type: 'xxxError'}
}
```
错误主要分为不存在的邮箱、错误的密码、密码输入错误次数过多几种
注意：以下所有请求涉及用户权限的，都需要在HTTP请求的头中加入`access_token`的信息，请求格式为
```
Request Headers中添加
Authorization: Bearer your_access_token
```
如果验证信息过期，会提示错误，如果没有加Authorization的头信息也会返回类似的错误信息
## 获取登录者信息
GET `/ghost/api/v0.1/users/me/?status=all&include=roles`
ACCEPT json
Authorization 见上说明
RESULT
```js
{
	accessibility: null
	bio: null
	cover: null
	created_at: "2015-02-08T12:11:34.683Z"
	created_by: 1
	email: "your.email@email.com"
	id: 1
	image: null
	language: "en_US"
	last_login: "2015-03-18T08:55:30.330Z"
	location: null
	meta_description: null
	meta_title: null
	name: "你的名字"
	roles: [{id: 4, uuid: "9227adb4-a836-4f6c-ba41-7d5dd307968a", name: "Owner", description: "Blog Owner",…}]
	slug: "your-slug"
	status: "active"
	updated_at: "2015-03-18T08:55:30.331Z"
	updated_by: 1
	uuid: "xxxx-uuid"
	website: null
}
```
每个字段对应的意思从单词应该可以看出来，具体不做说明，注意保存返回结果

下面列出的所有api路径都是由`/ghost/api/v0.1`开头，在调用时请自行追加
## 配置相关
系统级的配置信息的json格式
```json
{
    "key": "fileStorage",
    "value": true
}
```
* GET /configuration 获取博客配置信息
* GET /configuration/:key 根据指定ID获取配置信息

## 文章相关
新增文章的业务流程应该是(2,3步骤在Ghost中是监测输入间隔，然后发送请求)
1. 获取标签等信息`/tags/?limit=all`
2. 输入title后调用`/slugs/post/:inputed-title`会返回一个新的slug
3. 输入正文时保存`/posts/?include=tags`，其中发送的数据格式为
```js
{
    posts: [
        {
            title: 'xxx',
            slug: 'xxx', // 上一步获取到的slug
            markdown: 'xxx', // 输入的markdown内容
            image: 'xxx', // 文章的封面
            featured: false, // 是否推荐
            page: false, //是否单独页
            status: "draft", // 状态为草稿或者发布published
            language: "en_US", // 语言
            meta_title: null, // 设置里面的meta信息，下同
            meta_description: null,
            author: "1", // 作者id
            published_by: null, // 发布者
            tags:[ // 标签数组
                {
                    description: null
                    hidden: false
                    image: null
                    meta_description: null
                    meta_title: null
                    name: "tag1"
                    post_count: null
                    slug: null // 这个是新增的tag，没有uuid和slug
                    uuid: null
                }
            ]
        }
    ]
}
```
此请求返回的数据里面有一个id，保存id，下次在保存文章时的地址就是`/posts/:id?include=tags`

文章的json结构体如下
```js
{
  slug: "welcome-to-ghost", // 类似文章的链接
  status: "published", // 文章的状态 草稿 已发布等
  id: 1, // 文章ID
  uuid: "xxxx-xxxx", // 文章的UUID
  title: "Welcome to Ghost", // 文章标题
  markdown: xxx // 文章的markdown内容
  html: xxx // 文章的html内容
  image: null, // 图片
  featured: false, // 推荐
  page: false, // 单独页
  language: "en_US", // 语言
  meta_title: null, // meta里面的title
  meta_description: null, // meta里面的description，下面的很好理解，不做解释
  created_at: "2015-02-08T12:11:20.645Z",
  created_by: 1,
  updated_at: "2015-02-08T12:11:20.645Z",
  updated_by: 1,
  published_at: "2015-02-08T12:11:20.684Z",
  published_by: 1,
  author: 1,
  url: "/welcome-to-ghost/"
}
```
* GET /posts 获取所有文章，返回的数据里面还包含分页信息
* POST /posts 新增文章
* GET /posts/:id 根据ID获取文章
* GET /posts/slug/:slug 根据文章链接获取文章
* PUT /posts/:id 编辑文章
* DEL /posts/:id 根据ID删除文章

## 设置相关
博客的设置数据的json格式
```js
{
    "settings": [
        {
            "id": 5,
            "uuid": "xxxx-xxxx",
            "key": "title",
            "value": "My blog",
            "type": "blog",
            "created_at": "2015-02-08T12:11:35.040Z",
            "created_by": 1,
            "updated_at": "2015-03-18T09:47:42.464Z",
            "updated_by": 1
        },
        ...
        {
            "key": "availableThemes", // 可用的主题
            "value": [
                {
                    "name": "casper",
                    "package": {
                        "name": "Casper",
                        "version": "1.1.5"
                    },
                    "active": true
                }
            ],
            "type": "theme"
        },
        {
            "key": "availableApps", // 可用的app，当前版本暂时还不支持app的调用？
            "value": [],
            "type": "app"
        }
    ],
    "meta": {}
}
```
* GET /settings 获取所有设置
* GET /settings/:key 根据指定key获取设置
* PUT /settings 修改设置

## 用户相关
用户数据的json格式
```js
{
    email: "your.email@email.com",
    id: 1,
    uuid: "xxxx-xxxx",
    name: "你的名字",
    slug: "exxx", // slug，个人信息页面链接为http://your.blog.site/author/:slug
    image: null, // 头像
    cover: null, // 封面
    bio: null, // 简介
    website: null,
    location: null,
    accessibility: null, // 这是虾米？
    status: "active",
    language: "en_US",
    meta_title: null,
    meta_description: null,
    last_login: "2015-03-18T10:11:18.753Z",
    created_at: "2015-02-08T12:11:34.683Z",
    created_by: 1,
    updated_at: "2015-03-18T10:11:18.753Z",
    updated_by: 1
}
```
* GET /users 获取所有用户
* GET /users/:id 根据指定Id获取用户
* GET /users/slug/:slug 根据用户的slug获取用户
* GET /users/email/:email 根据邮箱获取用户
* PUT /users/password 修改用户登录密码
* PUT /users/owner 修改用户的所有者(不懂，没测试过)
* PUT /users/:id 根据用户id来修改用户信息
* POST /users 添加用户
* del /users/:id 删除用户

## 标签相关
标签数据的json格式
```js
{
    "id": 1,
    "uuid": "xxxx-xxxx",
    "name": "Getting Started",
    "slug": "getting-started",
    "description": null,
    "image": null,
    "hidden": false,
    "meta_title": null,
    "meta_description": null,
    "created_at": "2015-02-08T12:11:20.685Z",
    "created_by": 1,
    "updated_at": "2015-02-08T12:11:20.685Z",
    "updated_by": 1,
    "parent": null
}
```
* GET /tags 获取所有表情
* GET /tags/:id 根据Id获取标签
* POST /tags 添加标签
* PUT /tags/:id 根据ID修改标签
* del /tags/:id 根据ID删除标签

## 角色相关
角色数据的json格式
```json
{
    "id": 1,
    "uuid": "1b925c9f-92f2-45b3-9828-9244adbaaddc",
    "name": "Administrator",
    "description": "Administrators",
    "created_at": "2015-02-08T12:11:20.687Z",
    "created_by": 1,
    "updated_at": "2015-02-08T12:11:20.687Z",
    "updated_by": 1
}
```
* GET /roles/ 获取所有的角色

## Slugs
* GET /slugs/:type/:name 未研究，不做解释

## 主题
主题数据的json格式
```json
{
    "uuid": "casper",
    "name": "Casper",
    "version": "1.1.5",
    "active": true
}
```
* GET /themes 获取所有主题
* PUT /themes/:name 修改当前的主题

## 通知相关
通知信息的json结构
```js
{
    notifications: [
        {
	        dismissible： true,
	        location: 'bottom',
            type': 'info', // 错误等级'error', 'success', 'warn' and 'info'
	        message: 'message'
	    }
    ]
}
```
* GET /notifications
* POST /notifications
* del /notifications/:id

## DB数据库
能获得数据里的各种数据，建议不要直接操作，使用其它方法单独操作
* GET /db
* POST /db
* del /db

## 邮件
未测试
* POST /mail 发送邮件
* POST /mail/test 发送测试邮件

## 用户认证
未测试。。
* POST /authentication/passwordreset
* PUT /authentication/passwordreset
* POST /authentication/invitation
* GET /authentication/invitation
* POST /authentication/setup
* GET /authentication/setup
* POST /authentication/token
* POST /authentication/revoke

## 上传文件
* POST /uploads
  uploadimage file数据，上传时的图片文件
