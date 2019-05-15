---
title: 黑苹果安装记录
s: black-mac-os
date: 2019-05-14 23:10:00
thumbnail: /images/others/mac-install.jpg
tags:
  - os
  - mac
---
因工作原因换台电脑，作为开发人员，肯定是优先Mac的，其次是Linux系，但Linux系系统在软件工具生态上还有些不足，而Mac无疑是最佳选择。虽然黑苹果可能会遇到一些意外事故，但是也挡不住我对它的喜爱，哈哈。

以下介绍基本都是参照[https://www.tonymacx86.com/threads/unibeast-install-macos-mojave-on-any-supported-intel-based-pc.259381/#create_unibeast](https://www.tonymacx86.com/threads/unibeast-install-macos-mojave-on-any-supported-intel-based-pc.259381/#create_unibeast)得来，有能力的还是去`tonymacx86`好好研究一番。

## 安装前准备

### 硬件准备

黑苹果安装中最大的问题就是驱动问题，所以最好是安装[tonymacx86](https://www.tonymacx86.com/buyersguide/building-a-customac-hackintosh-the-ultimate-buyers-guide/)上推荐的配置去购买，但是我的机器已经是准备好的了，就跳过这一步，但是要通过搜索确认下自己的硬件安装黑苹果没有太大问题。我的主要配置如下：
- Intel I5 8400
- MSI B310M
- 集成显卡 Intel UHD 630

另外你最好有一台白苹果，没有的话用Windows应该也可以，不过我更倾向于白苹果制作引导盘的方式。

除此意外你还需要准备一个8G以上（最好16G）的U盘用来做安装盘。

### 软件准备

首先你需要注册一个[tonymacx86](https://www.tonymacx86.com/)的账号，因为我们需要的工具以及教程基本上都是在这里找到的。

然后在下载Mac的系统安装文件，根据自己情况选择不同的方案。这里以`macOS High Sierra 10.13.6`版本为例（最新的Mojave版本感觉有不少问题，我的白苹果一直都没有升级），白苹果前往[https://itunes.apple.com/cn/app/macos-high-sierra/id1246284741?ls=1&mt=12](https://itunes.apple.com/cn/app/macos-high-sierra/id1246284741?ls=1&mt=12)下载。Windows系统可以通过下载集成`clover`的系统镜像配合`TransMac`工具制作启动盘进行安装，因为这个方式没有做过测试，所以不做过多介绍，各位可以自行搜索尝试，成功之后的操作应该都是一样的。

另外还需要在`tonymacx86`下载好`MultiBeast`和`UniBeast`工具，注意配合自己下载的系统版本。

这里需要将白苹果的系统语言改为英语，这是`UniBeast`的强制性要求，改完后重启。

## 安装流程

1. 制作启动盘。插上U盘，在白苹果的磁盘工具中擦除U盘，格式选择Mac扩展（日志）。然后打开`UniBeast`按照流程进行启动盘制作，这里引导方式选择`UEFI`模式（一般新的电脑都是支持的）。制作完成后将`MultiBeast`应用拖到U盘中以备后用。
2. 修改主板设置。让要安装黑苹果的电脑重启进入BIOS，关闭CPU的`VT-D`功能，关闭`CFG-Lock`，关闭主板的安全启动模式（Secure Boot Mode），关闭IO串口(IO Serial Port)，打开`XHCI`，硬盘调整为`AHCI`模式（一般新电脑都改成这种模式）。以上说的这些都是有则改之，无则跳过。然后修改U盘为第一启动盘，保存重启就可以进入`Clover`启动界面了。
3. 准备安装。在`Clover`界面选择安装macOS系统，然后就等待安装吧，安装过程中可能会多次重启，重启后在`Clover`界面选择`High Sierra`来进行下一步安装。如果过程中出现什么错误（我就出现了叉号禁止符，并在之后一直无法进行下一步安装），那么在`Clover`界面选择启动参数设置（下面第2个还是第3个的）并追加` -v`参数并重新进行之前操作，这样就可以将日志打印出来，找到你出错的那一行的关键信息进行搜索并找到解决方案。我出现的问题是通过在启动参数后追加`-f UseKernelCache=No`来解决了，有时可能还需要不断的重启或者更改U盘插的USB位置来修复，也是奇葩。
![](/images/others/clover-mac.png)

4. 系统安装。第一次安装时需要将整个盘都擦除，同样是macOS扩展（日志）格式，安装完成后就是一些系统的初始化配置了，之后就进入我们的黑苹果系统了。

## 后续操作
1. 使用`MultiBeast`安装各种驱动。将`MultiBeast`从U盘拖到应用程序中并启动，按照自己电脑硬件选择合适的驱动文件（鬼知道我应该勾选哪些驱动，除了个别是明确的，其它驱动都是看着最像或者凭感觉选的）并完成安装，之后重启电脑，这是基本上就可以拔掉U盘（这个启动盘后期还可以作为我们系统的修复引导工具）。
2. 配置基本环境并安装工具。作为开发，我们还是要给我们的电脑安装些基础和必备的东西
  - Homebrew 这个在安装时可能很慢，所以需要提前找好梯子
    ```sh
    /usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
    ```
  - nvm NodeJs版本管理
    ```sh
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
    ```
  - Git
    ```sh
    brew install git
    ```
  - Xcode 一些命令行工具需要
  - Docker VSCode iTerm2 Alfred等

## 总结
安装黑苹果不难，但需要新手花点时间学习研究，遇到问题通过日志搜索，多逛逛`tonymacx86`。
