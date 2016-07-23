---
title: 前端学习之路
s: road-to-frontend
date: 2015-08-05 15:06:00
tags:
  - Frontend
---
以下只是自己总结的一些经验，欢迎大家讨论并提出自己的意见。
####1. 道亦有道
　　学习任何一门语言，都应该遵循它的编程规范，前端也不例外，一致的代码规范为我们后面的学习和维护会减少很多麻烦。这里介绍几个前端规范文档。   
[GOOGLE的前端代码规范](http://www.chaozh.com/google-front-end-style-guide/)  
[编写灵活、稳定、高质量的 HTML 和 CSS 代码的规范。](http://codeguide.bootcss.com/)
####2. 历史沉淀
　　在WEB开发中，有许多问题是需要我们解决的，其中比较让人头疼的就是浏览器规范不一，我们需要一个统一的工具来实现多浏览器的通用，而Jquery就是一个不错的实现。对于新人来说，学习Jquery似乎是一个必经之路，只有走过这条路才能发现更好的更适合使用需求的。文档方面首推[w3school](http://www.w3school.com.cn/) ，这里有很多新人学习的资料，也是很多人成长道路上的第一份学习资料，建议将“HTML教程”和“浏览器脚本”这2个部分学习好，尤其是“JQuery”这部分，还有一个[JQuery的API](http://www.jquery123.com/)。   
　　同样是历史遗留问题，各浏览器的兼容也是一个很大的难题，虽然我们很希望所有的浏览器的表现都一样，所写的代码在各浏览器都运行正常，但是目前的形式并不是我们理想的那样，有时候我们很多代码是为了适应各种浏览器而写的（当然，未来是光明的，未来肯定不会再有这么多问题）。多浏览器的兼容我觉得主要靠经验积累，因为你可能会遇到各种不同的情况，这里提供一些经验参考。  
[知乎上关于浏览器兼容性的讨论](http://www.zhihu.com/question/19736007)  
[前端工程师如何系统地整理和累积兼容性相关的知识？](http://www.zhihu.com/question/20984284)  
　　这里还有一点需要介绍，也是新人必须学习的，那就是调试技巧，调试也是开发过程中最重要的环节。我个人常用的调试工具还是用Chrome的[Developer Tools](http://ued.taobao.org/blog/2012/06/debug-with-chrome-dev-tool/)，如果用FireFox，那么调试工具就是使用FireBug，如果是IE，似乎就是用自带的开发者工具，这些调试工具的使用大致相同，都可以通过`F12`键调出（Mac下不是的），调试代码也是经验的积累，前期掌握调试的步骤就可以了。  
####3. 时下热门
　　前端发展到现在已经要进入了一个爆炸式的时期了，要学习和掌握的技能太多了，而这一切都是因为NodeJs的异军突起。不过在学习NodeJ之前，可以先看看一些常见的CSS框架和JS框架，这些框架可以帮助我们更好地布局或者更好的码代码。  
* [BootStrap](http://v3.bootcss.com/getting-started/) 这个是现在非常火的一个框架，由Twitter开发，让那些即使不太会前端的人也能开发出不错的布局和界面。  
* [AngularJs](http://www.ituring.com.cn/minibook/303) 同样也是一个很火的JS框架，由Google开发，其数据双向绑定功能非常吸引人，能大量减少开发者的工作量，Gmail就是非常成功的一个转型。   
* [ReactJs](http://www.ruanyifeng.com/blog/2015/03/react.html) 今年特别火的一个JS框架，由Facebook开发，其背后也是有很多故事，这个东西也是非常新，自己还没有去学习，不做过多介绍。  
* [RequireJs](http://www.requirejs.cn/)/[SeaJs](http://seajs.org/docs/) 都是模块化开发的工具，让代码的组织性更强，不再杂乱无章。  
* [NodeJs](http://ourjs.com/detail/529ca5950cb6498814000005) 无疑是当前最火的一个点，从NodeJs后诞生出了很多新的技术，不过NodeJs的学习还是比较快的，因为代码都是js。  
* [Grunt](http://www.gruntjs.net/getting-started)/[Gulp](http://www.gulpjs.com.cn/) 在NodeJs出来之前很多的自动化工具都是基于Ant的，但是现在有了NodeJs后这2个自动化工具就变得非常火热，这些自动化工具可以一键完成各种任务，包括代码检查、代码压缩和合并等等。  
* [CoffeeScript](http://coffee-script.org/) 一门编译到 JavaScript 的小巧语言，它尝试用简洁的方式展示 JavaScript 优秀的部分。还有后来发展的[TypeScript](http://www.cnblogs.com/tansm/p/3370615.html)
* [Less](http://less.bootcss.com/)/[Sass](http://www.w3cplus.com/sassguide/)/[Stylus](http://www.zhangxinxu.com/jq/stylus/) 这些是css的预编译语言，也是为了更好的书写CSS。
####4. 展望未来
　　因水平有限，此处也不做过多展望，免得误导大家，不过可以知道的是前端的发展速度太快，不跟紧脚步就会赶不上大部队，别人说的东西你就不懂了，这里给出一个[Github里的流行趋势](https://github.com/trending)，在这里可以看到现在有哪些东西比较热门，总的来说学习前端就要保持一个时刻学习的心。  
　　再说说前端演化的发展吧，一个是混合开发（Hybrid App），其中以[Ionic](http://www.ionicframework.com/)和[HBuilder/HTML5+/mui](http://ask.dcloud.net.cn/docs)为代表，还有一个是NodeJs桌面级应用开发。这些都可以作为前端学习道路中的一个分支吧，也会是一个不错的方向。

> 这里有一个别人推荐的网站，我看了觉得还是挺不错的，也是推荐给大家[菜鸟教程](http://www.runoob.com/)。还有一个很有意思的[Web Developer技能树](http://skill.phodal.com/)，像玩游戏一样查看自己的技能结构。
