---
title: 个人项目[igit]
s: igit
date: 2025-03-07 19:10:00
# cover:
# thumbnail:
tags:
  - git
  - git hooks
  - 工程化
  - 我开发的
---

# 🚀 iGit - 智能 Git 工作流助手

## 💡 项目简介

在日常开发中，Git 工作流是每个开发者必不可少的一部分。然而，标准化提交信息、执行代码检查、确保代码质量等工作往往需要耗费大量的时间和精力。**iGit** 正是为解决这些问题而生的智能 Git 工作流助手，它能够帮助你实现更智能、更高效的 Git 工作流程。

## ✨ 核心特性

- 🤖 **AI 驱动的提交信息** - 自动生成符合约定式提交规范的提交信息，让你的提交历史更清晰、更专业
- 🎯 **智能 Git Hooks** - 提供一系列开箱即用的 Git Hooks，帮助你规范代码提交流程
- 🎈 **简单易用** - 通过简单的命令行工具，轻松集成到你的项目中
- ⚙️ **高度可配置** - 提供灵活的配置选项，满足不同项目的需求

## 🛠️ 技术栈

- Node.js
- OpenAI API
- Git Hooks
- YAML 配置

## 📝 安装与使用

1. 安装依赖

```bash
# 使用 npm
npm install -D @doremijs/igit-cli

# 使用 yarn
yarn add -D @doremijs/igit-cli

# 使用 pnpm
pnpm add -D @doremijs/igit-cli
```

<!-- more -->

2. 初始化项目

```bash
npx igit init
```

这将在你的项目中创建一个 `.config/igit.yaml` 配置文件，你可以根据项目需求进行自定义配置。值得一提的是，配置文件支持 schema 编辑提示，让配置过程更加便捷。

3. 安装 Git Hooks

```bash
npx igit install
```

这一步会根据你的配置文件设置所需的 Git Hooks，建议将该命令添加到`package.json`的`scripts.postinstall`中，方便使用。

4. 使用 AI 提交功能

```bash
# 修改代码后添加到暂存区
git add .

# 使用 AI 生成提交信息
npx igit commit -y
```

AI 会自动分析你的代码变更，生成符合[约定式提交](https://www.conventionalcommits.org/zh-hans/)规范的提交信息。

## 🔧 配置详解

### Git Hooks 配置

```yaml
hooks:
  # 是否启用 hooks
  enabled: true
  # hooks 配置
  hooks:
    pre-commit:
      - npm run test
      - npm run build
    commit-msg:
      - npx commitlint --edit
    pre-push:
      - npm test
```

### 暂存区 Hooks 配置

```yaml
staged_hooks:
  # 是否启用暂存区 hooks
  enabled: true
  # 针对不同文件类型的规则，这样当文件提交时，会自动执行这些命令
  # 这有助于我们规范代码提交，比如提交前自动格式化代码
  rules:
    "**/*.{js,ts}":
      - eslint --fix
    "**/*.{css,scss}":
      - stylelint --fix
```

### AI 提交配置

```yaml
ai:
  # 是否启用 AI 功能
  enabled: true
  # OpenAI API 基础 URL
  baseUrl: https://api.openai.com
  # 使用的模型
  model: gpt-3.5-turbo
  # AI 响应使用的语言
  respondIn: 中文
```

> ⚠️ **注意**：不要将 API Key 直接写入配置文件。请使用环境变量 `OPENAI_API_KEY` 来设置。

## 🚀 最佳实践

### 1. 代码检查与格式化

配置暂存区 hooks 自动对修改的文件进行代码检查和格式化：

```yaml
staged_hooks:
  enabled: true
  rules:
    '**/*.{css,scss,less,styl,stylus}': stylelint --fix
    '**/*.{js,jsx,ts,tsx}': biome check --write
```

### 2. 提交信息规范

启用提交信息检查并自动添加 emoji：

```yaml
commit_msg:
  enabled: true
  prependEmoji: true
```

### 3. 自动化测试

在提交或推送代码前自动运行测试：

```yaml
hooks:
  enabled: true
  hooks:
    pre-push:
      - npm run test:coverage
```

## 📚 常见问题

### Q: 如何跳过 hook 检查？

在特殊情况下，你可以使用 Git 的 `--no-verify` 选项跳过 hook 检查：

```bash
git commit --no-verify -m "your message"
# 或者
git commit -m "your message" -n
```

> ⚠️ **注意**：请谨慎使用 `--no-verify`，它会跳过所有的 hook 检查。

### Q: 如何改进 AI 生成的提交信息质量？

1. 确保每次提交的变更都是相关的
2. 在配置文件中使用更强大的 AI 模型（如 GPT-4）
3. 提供更多的上下文信息

## 🔗 项目地址

GitHub: [https://github.com/doremijs/igit](https://github.com/doremijs/igit)

## 🌟 结语

iGit 通过结合 AI 技术和 Git Hooks，为开发团队提供了一种更智能、更高效的 Git 工作流解决方案。无论是个人开发者还是团队协作，iGit 都能帮助你提高代码质量，规范化提交流程，最终提升整体开发效率。

开始使用 iGit，让你的 Git 工作流更上一层楼吧！
