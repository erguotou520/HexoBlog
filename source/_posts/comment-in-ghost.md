---
title: Ghost中添加评论系统
s: comment-in-ghost
date: 2015-07-24 00:19:00
tags:
  - Ghost
---
Ghost系统默认是没有评论系统的，虽然官方也在关注这个问题，不过短时间内应该是不会有所进展，所以现在如果要在Ghost中使用评论，还是先使用第三方服务吧。下面介绍几种常见的评论系统，如果有更好的，欢迎来补充。  
　　1. [Disqus](https://disqus.com/) 一个国外的评论系统。首先注册一个账号，这个不多介绍，记得激活邮箱。进去后点击头像旁边的设置下拉里面的"Add Disqus To Site",
![Disqus](/images/ghost/disqus.png)
然后在弹出的页面中根据情况设置属性，
![Disqus profile](/images/ghost/disqus-profile.png)
完成后会跳到安装页面，在这里我们选择“Universal Code”，
![Disqus code selection](/images/ghost/disqus-code-selection.png)
最后我们复制页面中的脚本插入到Ghost的主题文件中，位置是`/content/themes/[casper]/post.hbs`文件的`</article>`结束标签之前。
```html
<article>
   ...
   <div id="disqus_thread"></div>
   <script type="text/javascript">
   /* * * CONFIGURATION VARIABLES * * */
   /* * * 请将此处改为你自己的 * * */
   var disqus_shortname = 'erguotou';

  /* * * DON'T EDIT BELOW THIS LINE * * */
  (function() {
  var dsq = document.createElement('script'); dsq.type = 'text/javascript'; dsq.async = true;
  dsq.src = '//' + disqus_shortname + '.disqus.com/embed.js';
  (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(dsq);
  })();
  </script>
  <noscript>Please enable JavaScript to view the <a href="https://disqus.com/?ref_noscript" rel="nofollow">comments powered by Disqus.</a></noscript>
</article>
```
到这里应该说基本是完成了，你已经可以在文章页面中看到Disqus的内容了，页面下面还有个统计评论数量的，这里不做介绍了。到这里基本上已经成功地使用上了Disqus，但是我们是不是可以做一点设置，让它更本地化，样式更好看呢？答案肯定是可以的，在Disqus的设置页面(Settings)中有很多设置，其中General选项卡中有一个`Language`，你可以选择`Chinese`，这样你的Disqus就是中文的了，这里还有很多其它设置，请自行研究。另外目前Disqus无法修改样式，虽然可以[微调](https://help.disqus.com/customer/portal/articles/545277-disqus-appearance-tweaks)，然而并没有乱用啊。  
　　2. [多说](http://duoshuo.com/) 一个国内的评论系统。同样是先登录，然后点击“我要安装”，根据自己情况填写，
![Duoshuo](/images/ghost/duoshuo.png)然后选择通用代码－稳定版进行复制，同样插入到`post.hbs`文件的`</article>`结束标签之前。复制后我们需要对复制的代码进行一些修改，我们将第一行修改为
```html
<div class="ds-thread" data-thread-key="{{id}}" data-title="{{title}}" data-url="{{url absolute="true"}}"></div>
```
这样就完成来多说的安装，在多说的设置中有很多是我们可以调节的，多说支持自定义CSS，这样我们就可以将多说的评论框调成我们自己喜欢的样子，这部分请自行研究，这里不做过多介绍，我这个博客用的就是多说评论，自己简单的改了点样式。  
　　3. [友言](http://www.uyan.cc/getcode)以及[畅言](http://changyan.kuaizhan.com/)等其它的第三方社会化评论系统都有类似的功能，安装方式大抵相同，欢迎大家自己研究，给出更多教程。  
　　另外关于各个评论的比较，大家可以看下[这篇文章](http://changyan.sohu.com/blog/?p=126)，不过个人觉得畅言的样式更符合ghost一些。
