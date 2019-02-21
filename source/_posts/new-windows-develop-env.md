---
title: 记新windows电脑打造前端开发环境流程
s: new-windows-develop-env
date: 2018-05-21 15:33:45
tags:
  - windows
  - 前端开发环境
---
## 系统环境

- 查看电脑配置（主要是CPU内存硬盘SSD这些），对于该配置能完成什么样的开发强度心里有数
- 联网，设置固定IP（较推荐）
- 清理已安装工具，取消不常用的任务栏（比如IE浏览器，应用商店）
- 规划分区，明确每个分区盘的用处

## 工具下载
下载以下常用工具并安装

- 7z
- Chrome
- VSCode
- python
- Git（VSCode安装后再安装），SourceTree（图形化Git管理），BeyondCompare（Diff对比工具）
- NodeJs
- yarn
- Everything
- Wox（Everything和python安装后再安装）
- Cmder
- Office工具
- MacType（美化windows字体显示）
- 迅雷极速版/FDM/Motrix
- IM工具 QQ/TIM 微信 钉钉
- VirtualBox
- 其它工具 坚果云 Zerotier-One
- 从坚果云的同步文件中安装ssr并添加订阅地址

## Chrome
前端开发浏览器是重头，所以要配置好浏览器的一些东西

- ssr运行后登录chrome同步扩展程序，确保常用的`vue-devtool` `Proxy SwitchSharp` `NIM(NodeJs调试管理工具)` `划词翻译`扩展已安装
- 登录后等待同步书签
- 为`Proxy SwitchSharp`导入坚果云同步的备份文件，并点击扩展图标选择自动模式，至此FQ已完成，后续可以科学上网
- 设置 -> 下载内容 -> 下载前询问每个文件的保存位置 勾选上

## Cmder
windows下如果要获得流畅的命令行使用体验，`Cmder`那是必备的工具，后续的命令行操作也是使用该工具执行，安装后需要做一些简单的设置，参考[](https://www.jianshu.com/p/979db1a96f6d)

- 注册右键菜单 管理员身份打开cmd并cd到`Cmder`目录，执行`Cmder.exe /REGISTER ALL`
- 设置启动目录 Settings -> Startup - > Task，修改{cmd::Cmder}项，把:
`cmd /k "%ConEmuDir%\..\init.bat"`改为`cmd /k "%ConEmuDir%\..\init.bat" -new_console:d:G:\workspace`
- 设置alias 打开`Cmder`安装目录下的`config/user-aliases.cmd`文件，添加常用的简写命令，比如
    ```bash
    gc = git commit -am $1
    ```
- 设置常用快捷键 在Settings -> Keys & Macro页面中搜索`split`，为split bottom设置快捷键`Ctrl+Shift+D`为split right设置快捷键`Ctrl+D`，保持和`iTerm2`一致。设置`Minimize/Restore (Quake-style hotkey also)`的快捷键为`Ctrl+F1`，这个可以用来快速显隐窗口。

## Git
Git现在几乎成了主流的版本控制工具，在开发之前我们需要先对Git做个简单的配置

- 配置Git
    ```bash
    git config --global user.name "erguotou"
    git config --global user.email erguotou525@gmail.com
    ```
- 生成本地公私钥
    ```bash
    ssh-keygen -t rsa
    cat ~/.ssh/id_rsa.pub
    ```
    将生成的公钥复制到Github/Gitlab之类的仓库中。
- 修改文件默认结尾格式
    ```bash
    git config core.eol lf
    git config core.autocrlf false
    ```

## VSCode
目前来看最火的编辑器，速度比`Atom`快很多，使用前先安装几个常用的插件

- EditorConfig for VS Code
- ESLint
- HTML Snippets
- language-postcss
- PostCSS syntax
- language-stylus
- Path Intellisense
- Prettier
- Vetur
- Beautify
- 其它如Flutter/Dart/Docker/Docker Compose/DotENV/Python/英汉词典

然后修改创建文件的默认结尾为`LF`，在用户配置中加入`"files.eol": "\n"`

## NodeJs
前端开发必备，主要是换源，安装常用全局模块

```bash
npm i -g nrm http-server
nrm use taobao
yarn config set registry 'https://registry.npm.taobao.org'
```

## Everything & Wox
类似Mac上的`Alfred`，配置简单，主要是改下快捷键为`Ctrl+~`

## 高级玩法
- AutoHotKey `AHK`为windows用户提供了更多的可能，开发时可以用它定义快捷输入、执行自动化操作，可以定义开机自启动脚本，显隐应用窗口等等
- MacType Windows的ClearType字体很多时候看着都很难受，这时我们需要MacType来优化字体显示，可以参考这个做个自定义优化[](https://blog.csdn.net/w19981220/article/details/47993893)或者直接使用Candy改的MacType

## 其它
- 使用`ssh-keygen -t rsa`生成公私钥，并将公钥上传到Github/Bitbucket/Gitlab等
- 使用`ssh-copy-id -i ~/.ssh/id_rsa.pub user@server.host`命令将公钥上传到服务器实现免密登录

## 开发一段时间后使用到的一些工具
- Photoshop CC
- Cow 本地代理
- GifCam 本地录屏并生成gif文件
- navcat 数据库连接工具
- oss-aliyun 连接阿里OSS
- 15_Second_ADB_Installer 快速安装adb工具
- Android SDK
- besttrace 路由跟踪工具
- charles-proxy/Fiddler 本地请求拦截
- 网易云音乐
- Dism 轻量级windows管理工具
- DockerToolbox 没有用Docker for Windows，因为它和VirtualBox冲突
- Golang
- lean cli leancloud命令行工具
- Medis redis连接工具
- minio 本地oss服务
- mingw-w64
- mongodb/robo3t mongodb和其连接工具
- ngrok 内网穿透工具
- postman api测试工具
- 搜狗输入法
- TeamViewer/向日葵 远程连接工具
- Telegram
- TunSafe
- Vagrant
- 微信web开发者工具
- windirstat 查看本地磁盘占用空间，磁盘清理就靠它定位了
- WinSCP 远程连接和管理工具
- 各种虚拟机镜像 Windows/Ubuntu等
