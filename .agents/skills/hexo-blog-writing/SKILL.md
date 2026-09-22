---
name: hexo-blog-writing
description: 为「云帆在途」Hexo 博客（icarus 主题）撰写新文章。当用户说"写一篇博客"、"记录一下这个问题"、"介绍我的项目 X"、"写一篇教程/总结/排障记录"，或要求按本博客风格生成文章时使用。
---

# 云帆在途 · Hexo 博客写作规范

本博客位于 `source/_posts/`，主题 `icarus`，全文中文，permalink 为 `:slug.html`。
写文章前先浏览 1-2 篇最近的文章（`source/_posts/` 下按时间最近的，如 `my-tool-igit.md`、`k8s-network-refused.md`）确认语感。

## 何时使用

- 用户要求撰写 / 续写 / 改写博客文章
- 用户说"把这次排查/开发记录成文章"
- 用户要求介绍自己开发的某个项目（README 转博客）

## 博客目录

当前博客项目采用 git 管理，**修改完成后 `git push` 即自动发布上线，无需手动构建**。
添加/修改博客文章前请先 `git pull` 以保证数据不丢失。

## 第一步：确定文体

本项目文章分两类，先和用户确认（或从素材判断）属于哪类：

| 文体 | 典型示例 | 结构 |
|------|---------|------|
| A. 排障 / 实战记录 | `k8s-network-refused.md`、`rancher-k3s.md`、`develop-electron-ssr.md` | 场景引入 → 排查/实现过程 → 总结 |
| B. 个人项目介绍 | `my-tool-igit.md`、`my-project-fake-sms.md` | README 风格：简介 → 特性 → 技术栈 → 使用 → 配置 → 地址 |

标题前缀约定：
- 个人项目 / 工具：`个人项目[xxx]` 或 `我的工具[xxx]`（方括号内为项目名）
- 排障 / 教程：直接用中文描述，如 `k8s集群中App无法访问网络问题排查`

## 第二步：写 front-matter

```yaml
---
title: 文章中文标题
s: kebab-case-english-slug
date: 2026-09-21 17:30:00
cover: /images/<分类>/<文件名>.png   # 可选，约一半文章有；没有就保留注释 # cover:
thumbnail: /images/<分类>/<文件名>.png  # 可选，通常与 cover 相同
tags:
  - 标签1
  - 标签2
---
```

规则（全部 55 篇存量文章的共同约定，必须遵守）：
- **`s:` 必填**：kebab-case 英文 slug（小写、连字符分隔），与文件名一致。这是本博客 permalink 的核心字段。
- `date` 格式：`YYYY-MM-DD HH:mm:ss`。
- **只用 tags，不用 categories**（存量文章 0 篇使用 categories）。
- `cover`/`thumbnail` 可以是本地图 `/images/<分类>/xxx.png`（图片目录见 `source/images/`：k8s、rancher、devops、electron、wechat、windows、linux、server、vps、others…）也可以是外部 URL；没有封面时写成 `# cover:` 注释占位。

### tag 词表（优先复用，保持全站标签一致性）

- 个人开发标识：**`我开发的`**（所有个人项目/工具文章必打）
- 前端 / 工程化：`Git`、`git hooks`、`工程化`、`Hexo`、`eslint`、`前端`、`浏览器插件`
- DevOps / 基础设施：`traefik`、`drone`、`dokku`、`Gogs`/`gitea`、`registry`、`devops`、`k8s`、`kubernetes`、`k3s`、`rancher`、`istio`、`network`、`Nginx`、`SSH`、`backup`
- CI/CD：`CI/CD`、`CI`、`Travis CI`、`Gitlab CI`、`Github Actions`
- 平台 / 系统：`windows`、`mac`、`os`、`openwrt`、`Raspberry`、`Firebase`、`Vps`
- 技术栈：`Bun`、`ElysiaJS`、`Electron`、`electron-ssr`、`flutter`、`Rust`、`STM32`、`Arduino`、`3D打印`、`硬件`
- 内容系列：`Ghost`（10 篇，博客早期系列）、`DeepSeek`、`OpenAPI`、`wechat`、`小程序`
- 应用类：`京东`、`青龙`、`Cookie`、`bitwarden`、`adguard home`

新 tag 命名：技术名用官方写法（大小写随官方，如 `Electron`、`Gogs`）；存量词表大小写略有不统一（`git`/`Git` 并存），新文章一律优先上表推荐写法。一般每篇 2-4 个 tag。

## 第三步：写正文

通用规则（两类文体都遵守）：
- **全文中文**，语气友好、带一点个人化口吻，可适度自谦自嘲（"这就很懵了"、"激动！困扰了几天的问题终于解决了"）。
- **专有名词、技术名词、文件名、命令一律用反引号包裹**：`k8s`、`istio-proxy`、`holdApplicationUntilProxyStarts`、`/images/k8s/xxx.png`。
### `<!-- more -->` 摘要截断标记（必须）

Hexo 列表页（首页/归档）默认渲染整篇文章，只有正文里出现 `<!-- more -->` 时，列表页才只显示该标记**之前**的内容 + "阅读全文"链接。**漏掉它会导致首页每篇文章展开全文**，页面巨长且互相干扰。

用法规则：
- 位置固定：**开头的简介/背景段落（通常 1-3 句）写完之后、正文主体第一个小节标题之前**。
- 一篇文章**只放一个**，放多了截断无意义。
- 标记独占一行，前后各留一个空行：

```markdown
---
(front-matter)
---

在工作中使用 k8s 运行容器时，发现应用无法访问网络，排查多天后发现竟然是 Istio 的问题。

<!-- more -->

## 排查过程
……
```

- 摘要部分要能独立成话：让读者在列表页只看这 1-3 句就知道文章讲什么、是否值得点开。
- 存量 57 篇中 49 篇遵守此约定；新文章一律必须加。
- 代码块必须带语言标记（`bash`、`yaml`、`js` 等），关键行加注释。
- 外部链接用 markdown 形式 `[描述](url)`；本地图片 `![说明](/images/<分类>/xxx.png)`。
- 适当使用表格呈现对照信息（如配置项、方案对比）。

### 文体 A：排障 / 实战记录

```
[场景引入：什么环境下遇到什么问题，贴出真实错误信息，1-3 句，口语化]

<!-- more -->

## 排查过程
（或 ## 实现过程 / ## 搭建过程）
1. 第一步尝试……排除了什么
2. ……（编号列表，每步写清楚"做了什么 → 观察到什么 → 得出什么结论"，允许保留摸索痕迹和"懵"的过程）

## 总结
（收敛到根因 + 原理 + 解决方法，这是文章的干货核心）

[结尾一句话，如"记录下来，希望对大家有所帮助。"]
```

### 文体 B：个人项目介绍（README 风格，emoji 小节标题）

```
# 🚀 项目名 - 一句话口号

[项目背景与价值，2-3 句，坦诚说明状态，如"这是个搁置了的项目……可供参考"]

🌐 在线体验: https://xxx（如有）

## 🖼️ 预览
![apps](截图URL)

<!-- more -->

## ✨ 核心特性
- 🚀 特性一：说明
- ⏱️ 特性二：说明

## 🛠️ 技术栈
- Node.js / Bun / ...

## 📝 安装与使用
1. 安装依赖
   ```bash
   npm install -D xxx
   ```
2. 初始化 / 配置……

## 🔧 配置详解
（yaml 配置块 + 逐项说明；涉及密钥时写：
> ⚠️ **注意**：不要将 API Key 直接写入配置文件。请使用环境变量 `XXX_API_KEY` 来设置。）

## 🚀 最佳实践（可选）
## 📚 常见问题（可选，Q/A 形式）

## 🔗 项目地址
GitHub: [https://github.com/...](https://github.com/...)

## 🌟 结语
（总结价值 + 一句号召）
```

常用 emoji 小节：💡 项目简介、✨ 特性、🎯 使用方法、🛠️ 技术栈/开发、📝 文档、📦 安装部署、🖼️ 预览、🔧 配置、📚 常见问题、🔗 项目地址、🌟 结语。emoji 点缀即可，不要每行都加。

## 第四步：保存与发布

1. 先 `git pull` 拉取最新内容，避免覆盖他人/其他设备的修改。
2. 新文章用 `hexo new "文章标题"` 创建（scaffold 在 `scaffolds/post.md`，会生成 `source/_posts/<title>.md`），然后把文件名改成与 `s:` slug 一致的 kebab-case 英文文件名，再补全 front-matter。
3. 本地图片放 `source/images/<分类>/`，正文用绝对路径引用。
4. 验证：`npx hexo clean && npx hexo g` 确保无报错；需要时 `npx hexo s` 本地预览。
5. 发布：`git add` / `git commit` / `git push`，push 后自动发布上线（无需手动构建）。
6. 草稿（未完成、不发布）放 `source/_drafts/`，不是 `_posts/`。

## 规则（红线）

- 不得省略 `s:` 字段；slug 必须 kebab-case 且与文件名一致。
- 不得使用 categories；只用 tags。
- 不得用英文写正文（代码、专有名词除外）。
- 不得在 front-matter 里写任何密钥 / API Key / client_secret（主题配置里的 gitment secret 是既有配置，文章里绝不重复）。
- 不得跳过 `<!-- more -->`（它决定列表页摘要，是本项目惯例）。
- 不确定的链接 / 数据不要编造；素材里没有的项目地址、版本号留占位并提示用户补充。
