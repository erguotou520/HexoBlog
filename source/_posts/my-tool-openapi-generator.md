---
title: 前端工具[openapi-generator]
s: openapi-generator
date: 2025-03-05 17:30:00
# cover:
# thumbnail:
tags:
  - OpenAPI
  - SDK
  - 我开发的
---

# 🛠️ OpenAPI Generator - API 客户端生成

## 💡 项目背景

在现代前端开发中，与后端 API 的交互是不可或缺的。然而，手动编写 API 调用客户端不仅耗时，还容易引入类型和调用错误。`@doremijs/o2t` 正是为了解决这一痛点而生的 OpenAPI 客户端生成工具（简称`o2t`）。

## ✨ 核心特性

- 🚀 全自动生成类型安全的 TypeScript API 客户端
- 🎯 简单配置，一键生成
- 📦 灵活的拦截器和错误处理机制
- 🔒 支持 OpenAPI/Swagger 规范（v2 和 v3）

## 🛠️ 技术栈

- TypeScript
- Fetch API
- OpenAPI/Swagger 规范

<!-- more -->

## 📝 安装与使用

1. 安装依赖

```shell
npm i @doremijs/o2t
# 或
pnpm i @doremijs/o2t
# 或
yarn add @doremijs/o2t
# 或
bun i @doremijs/o2t
```

2. 初始化配置文件

使用`npx o2t init`命令生成配置文件，或者手动创建`o2t.config.mjs`文件，并添加以下内容：

```javascript
import { defineConfig } from '@doremijs/o2t'
export default defineConfig({
  specUrl: 'https://petstore.swagger.io/v2/swagger.json'
})
```
将`specUrl`替换为你的OpenAPI规范文件URL。

3. 生成 API 客户端

```shell
npx o2t generate typescript
```

你可以将这条命令添加到`package.json`中`"gen:api": "o2t generate typescript"`，这样就可以直接使用`npm run gen:api`来生成API客户端。

4. 创建并使用客户端

在项目中创建一个文件，例如`src/api/index.ts`，并添加以下内容：

```typescript
import { createFetchClient } from '@doremijs/o2t/client'
import type { OpenAPIs } from './schema'

export const client = createFetchClient<OpenAPIs>({
  requestInterceptor(request) {
    const token = localStorage.getItem('access_token')
    if (!request.url.startsWith('/api/auth') && token) {
      request.init.headers.Authorization = `Bearer ${token}`
    }
    return request
  }
})
```

然后在业务中这样使用

```typescript
// 使用
const result = await client.get('/path/to/api', {
  query: { param1: 'value1' },
  params: { id: 123 }
})
```

> 目前提供了`fetch`和小程序的客户端生成，因此任意支持`fetch`的运行时都可以使用。而小程序客户端支持传入`requestImpl`，在`Taro`中可以传入`Taro.request`，在`uni-app`中可以传入`uni.request`，因此理论上可以支持任何小程序框架。

## 🚀 配置选项

| 配置项 | 描述 | 默认值 |
|--------|------|--------|
| `specUrl` | OpenAPI 规范文件 URL | 必填 |
| `outputDir` | 生成代码目录 | `src/api` |
| `preferUnknownType` | 未知类型处理 | `any` | `unknown` |

## 🌟 项目地址

项目地址：[https://github.com/doremijs/openapi-generator](https://github.com/doremijs/openapi-generator)

**提示**：在使用时，建议在 `tsconfig.json` 中设置 `moduleResolution` 为 `bundler`，`module` 为 `ESNext`。
