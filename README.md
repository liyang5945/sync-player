
# 功能介绍&特性：

一个可以同步看视频的播放器，可用于异地同步观影、观剧，支持多人同时观看。
本项目有两个版本，web版运行在浏览器上，可跨平台，不限操作系统、设备，功能简单适用于要求不高的用户。还有基于SPlayer(射手影音)DIY的客户端版本(windows、MAC)，播放4K高清文件、外挂字幕，统统没问题。

# 演示demo:

web版同步效果

![wI60je.gif](https://s1.ax1x.com/2020/09/19/wI60je.gif)

客户端与web版同步效果

![wofbYd.gif](https://s1.ax1x.com/2020/09/20/wofbYd.gif)


# 原理：

基于websocket实现，与一些用websocket实现的聊天室类似，只不过这个聊天室里的消息换成了播放暂停的动作和时间信息，客户端收到消息后执行相应的动作:播放、暂停、快进，以达到同时播放的效果。

# 项目所用到的
 + node.js 
 + socket.io
 + HTML5 video API 
 + vue.js

# 如何使用：

本项目的核心是websocket，所以至少需要一台服务器提供websocket服务，websocket服务可以自己部署，可以使用第三方平台GoEasy提供的websocket服务(可免费使用两个月)。

1、自己部署：websocket服务器可以是一台具有公网IP的云服务器，也可以是一台具有公网IP的普通PC，没有公网IP也可以。你也可以使用zerotier或其他VPN工具将两台设备组成一个大局域网，让它们能互相通信。websocket服务器操作系统不限，只要有node.js环境。

websocket服务端部署方法：安装node.js环境，将server目录移动到服务器上，进入server目录，执行以下命令

安装项目依赖包
```bash

# 安装项目依赖包

npm install 

# 启动websocket服务

node index.js

```

2、使用GoEasy的websocket服务

注册GoEasy开发者账号并创建一个应用，获得appkey，复制到本项目相应位置即可。

GoEasy官网：https://www.goeasy.io

无论是使用哪种websocket服务都可以，本项目写了两套代码，只需将不用的那套注释掉即可(默认GoEasy)。

除了websocket服务器之外，还需要两个http服务端，一个是web服务端(提供html、css、js等文件的访问)，一个是视频服务端(提供视频文件访问)。

3、使用leancloud-realtime

leancloud-realtime是啥玩意？简单来说就是一个即时通讯SDK，这里不多介绍，请去[leancloud官网](https://leancloud.cn/docs/realtime_v2.html) 了解。这个服务也是使用websocket传输数据的，所以本项目也能用，我们只要把传输的文本消息换成一个JSON字符串即可。而且leancloud为开发者提供了一些免费额度，消息数量不限，只有120次/分钟的限制，个人使用的话是完全够用的，强烈推荐这个。

首先注册leancloud开发者账号，进入控制台，获得appId、appKey等信息，复制到对应位置(client/script/main.js)，第一次执行(使用浏览器打开页面)这段代码时会生成一个对话(conversation)，在leancloud控制台>即时通讯>对话下面，复制一个conversation id到对应位置

![TvG1Qs.png](https://s4.ax1x.com/2022/01/05/TvG1Qs.png)

![TvGQzj.png](https://s4.ax1x.com/2022/01/05/TvGQzj.png)


你可以将web服务部端署到以下位置：

+ 具有公网IP的服务器
+ github-pages或国内的码云提供的静态web服务
+ localhost(本地服务器)，同一个局域网内的设备访问该服务器内网IP

视频文件只需一个视频地址就行，也有以下几种选择：

+ 具有公网IP的服务器
+ localhost(本地服务器)，同一个局域网内的设备访问该服务器内网IP
+ 第三方视频地址

![wfntdU.png](https://s1.ax1x.com/2020/09/17/wfntdU.png)

使用场景1：云服务器带宽足够大(至少要大于播放视频的码率)，云服务器既可以作为websocket服务端，也可以作为http服务端。上图中所有设备都访问云服务器的ip或域名。

使用场景2：云服务器的带宽很小，这时候它只能作为websocket服务端，这时可以用上图中的PC1和PC2作为http服务端，PC1和PHONE1在一个内网访问PC1的内网IP，PC2和PHONE2在一个内网访问PC2的内网IP，PC3可作为自己的http服务端，PHONE3若是有提供视频文件的服务端，也可以使用。

![wfnYZT.png](https://s1.ax1x.com/2020/09/17/wfnYZT.png)

使用场景3：需要使用zerotier或其他VPN工具将异地设备组成一个大局域网，其中任意一台PC均可作为websocket服务端和http服务端(需要上传带宽足够大)。上图中各设备都访问那台PC的内网ip即可。

最简单的使用方法，下载nginx开启一个本地服务器，下载本项目client文件夹放到到nginx根目录里，视频文件也放到里面。注册leancloud开发者账号并创建一个应用，获得appId、appKey等信息，并填入到代码(`script/main.js`)相应位置。然后浏览器打开 `192.168.3.58/client/`，填入你的视频地址`192.168.3.58/movie/xxx.mp4`或网络视频地址，对方也这样操作一番，即可实现同步播放视频。

web版本的功能比较简单，而且受限于网络问题，快进之类的操作需要缓冲一段时间。如果你不满足web版功能，对用户体验有更高的要求，如支持更多文件格式、播放高清本地视频文件、外挂字幕等，我也找到了另一种方式来满足你的需求。

那就是DIY一个开源的播放器的源码：SPlayer(射手影音)。

射手影音官网：https://splayer.org

源码地址：https://github.com/chiflix/splayerx

在以**electron + 播放器**为关键字一番搜索之后，我找到了这个基于electron实现的开源播放器，并下载了源码来研究。

经过一番研究之后，我找到了控制视频播放、暂停、快进的代码位置，并将控制同步的代码移植了进去，从而也实现了同步功能，并且与web版兼容。

具体方法请看：[修改教程](how-to-modify-splayer.md)

PS：射手影音官方的代码打包之后会有一个bug，窗口无法拖动，我自己fork了一个分支，修正了这个bug，控制同步的代码也都加进去了，需要的可以直接fork，修改一下appKey即可，地址：https://github.com/liyang5945/splayerx


本项目部分图标样式来源于此项目: [coplay](https://github.com/Justineo/coplay) 

## 更新记录

2022-01-05
- 添加leancloud即时通讯方案、完善修改射手影音的教程。

2022-01-18
- 添加m3u8视频支持。
