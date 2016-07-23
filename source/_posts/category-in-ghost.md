---
title: 在Ghost中使用分类
s: category-in-ghost
date: 2015-07-21 23:25:00
tags:
  - Ghost
---
有不少刚接触Ghost博客的朋友都会问：Ghost如何做分类？如何按分类来浏览博客？其实Ghost没有分类这个概念，不像其它的博客系统，在发表文章时要选择分类，Ghost只有标签(Tag)。而我们正是要利用这个标签来变相地实现分类浏览。  
　　首先说下Ghost添加标签的地方，还是有些人是不知道的。在如图位置输入标签，标签和标签之间以英文逗号隔开，会自动提示之前的标签：![Ghost tag](/images/ghost/ghost-tag.png)  
　　Ghost中的标签是没有限制的，给了我们很多自由，但如果要做分类，我们还是需要遵守一定规则为好，比如之前有篇文章有个标签`test`，那么你下一篇文章如果还要使用这个标签，在标签输入处输入`t`，Ghost会自动提示出之前的`test`分类，选择即可。这样我们就有2篇文章有相同的标签`test`了，这时候我们可以通过`http://your.blog.site/tag/test`来访问这个分类下的所有文章。  
　　OK，现在我们已经完成了一半了，还有个问题是如何在我们的首页中显示分类信息呢？这里有几种方法，我们一一介绍。  
　　1. 第一种也是最简单最粗暴的方法，修改首页模板，在需要的位置添加一个到刚才的标签链接的a标签即可，该方法不做过多介绍，会网页基础的应该都会。  
　　2.使用Ghost新的helper`navigation`，这个需要你现在后台的设置里面加入相应的标签的链接即可。如图![Ghost navigation](/images/ghost/ghost-navigation.png)之后在模板中使用`navigation`来显示导航，关于该helper的使用，可以参考[我翻译的文档](https://github.com/ghostchina/docs/blob/master/navigation.md)。我们的[GhostChina](http://www.ghostchina.com/)网站的导航就是使用了该方法，只不过它的导航链接都不是标签的，这里只是举例说明。  
　　3.使用中文版中特有的标签`tag_cloud`，关于该标签的使用[请查看](http://www.ghostchina.com/output-tag-cloud/)。另外[GhostChina](http://www.ghostchina.com/)网站也使用了该标签云。![Ghost china](/images/ghost/ghost-china.png)  
　　这里简单地介绍了如何在Ghost中添加分类浏览，那么有人要问了，Ghost可以按日期来浏览文章么？其实Ghost可以在发表文章时选择在文章的链接上加上日期的，![Ghost title date](/images/ghost/ghost-title-date.png)但是要实现按日期浏览文章暂时是没有的，起码我没有看到过，不过这个可以通过添加标签的方式来实现，期待高手出现。
