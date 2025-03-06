---
title: 个人项目[fe-conf]
s: fe-conf
date: 2025-03-05 18:10:00
# cover:
# thumbnail:
tags:
  - 前端
  - 配置管理
  - 工程化
  - 我开发的
---

# 🚀 fe-conf - 配置生成器

前端喜欢造轮子，也喜欢搞各种工程化，项目中经常配置了各种工程化工具，而这些工具要么是`xxx-cli`初始化生成，要么自己手动配置，每次针对项目可能还要做一些配置调整，而且看着`package.json`里一堆依赖又很碍眼，而`fe-config`就是用来解决这个问题的。

`fe-conf`由2个项目共同组成（后续可以合并？），一个配置生成器[config-generator](https://github.com/doremijs/config-generator)，一个默认配置好的配置集合[doremi-config](https://github.com/doremijs/doremi-config)。2者配合使用就可以完成项目工程化的配置。当然`fe-conf`生成的是默认配置，你也可以按照自己的需求进行调整。

[![asciicast](https://asciinema.org/a/s754q27kLEDqs3uzgr78YYVRS.svg)](https://asciinema.org/a/s754q27kLEDqs3uzgr78YYVRS)

<!-- more -->

## 💡 配置生成器

配置生成器是一个基础的前端项目配置生成工具，主要用于:

- 🎯 项目初始化时生成基础配置
- 🔧 完善现有项目的配置文件
- ⚙️ 提供通用配置模板

### ✨ 支持的配置类型

配置生成器支持生成以下常用工具的配置:

- ~~`a2s`~~
- ~~`babel`~~
- `biome`
- `browserslist`
- `commitlint`
- `devmoji`
- `docker`
- `editorconfig`
- `eslint`
- `git`
- `husky`
- `igit`
- `jest`
- `license`
- `lintstaged`
- `npm`
- `nvm`
- `o2t`
- `oxlint`
- `prettier`
- `react`
- `readme`
- `stylelint`
- `typescript`
- `vue`

### 🎯 使用方法

1. 全局安装

```bash
npm i -g @doremijs/fe-conf
# 或者
yarn global add @doremijs/fe-conf
pnpm i -g @doremijs/fe-conf
# 使用
```bash
fe-conf
```

2. 临时使用

```bash
npx @doremijs/fe-conf
pnpx @doremijs/fe-conf
```

## 📚 配置集合

我将常见的一些配置做成集合，这样就可以直接使用，而不用每次都去配置。这些配置集合我直接在[config-generator](https://github.com/doremijs/config-generator)中引用并配置，降低了使用成本。[doremi-config](https://github.com/doremijs/doremi-config)项目中目前包含的配置集合有

- `eslint` 对应 `npm` 包 `@doremijs/biome-config`
- `prettier` 对应 `npm` 包 `@doremijs/prettier-config`
- `stylelint` 对应 `npm` 包 `@doremijs/stylelint-config`
- `biome` 对应 `npm` 包 `@doremijs/biome-config`
