修改方法：

下载splayer源码(develop分支)到本地，打开项目文件夹，先不要安装依赖包


打开package.json文件，我们直接在dependencies里添加依赖包，添加socket.io-client、 goeasy 或 leancloud-realtime，这三个包任选一个，npm上的goeasy现已更新至2.X版本，API发生了变化，代码我懒得改了，这里仍然使用1.2版本

```json
{
  "dependencies": {
    "goeasy": "^1.2.1",
    "leancloud-realtime": "^5.0.0-rc.7",
    "socket.io-client": "^2.3.0",
  }
}

```
添加好之后再安装依赖包，执行一下 yarn install，电脑上没有yarn也要安装yarn，npm容易出现问题


```bash

yarn install

```
这一步90%的概率会失败，因为一些依赖包的域名被墙了，最好在命令行里设置代理再安装

```bash

# windows cmd 设置代理命令
set http_proxy=http://127.0.0.1:1081
set https_proxy=http://127.0.0.1:1081

```
安装成功后会有个这样的提示：Done in 62.07s，如果没有出现这个就是没成功

不要修改代码，先测试下能不能正常打包，执行打包命令前也要设置好代理，因为打包的时候也要下载一些文件，如果第一次下载好并且打包成功了，以后再打包就不需要设置代理。

```bash

# 打包windows平台
npm run build

```
打包成功的话也会有上面的提示英文，并在build目录下生成安装包，能成功打包后再进行下一步。


能打包成功的话，下面来修改代码：


打开 `/src/renderer/libs/utils.ts`文件，复制以下代码进去

```ts
/* 生成随机字符串*/
export function randomString(length:number) {
  let str = ''
  for (let i = 0; i < length; i++) {
    str += Math.random().toString(36).substr(2)
  }
  return str.substr(0, length)
}
```

打开文件 `/src/renderer/containers/VideoCanvas.vue`

引入上面的`randomString`方法，并引入相应依赖包，三个包任选其一

```

import io from 'socket.io-client';

import GoEasy from 'goeasy';

import {Realtime, TextMessage} from 'leancloud-realtime/es-latest'

// 上面三行任选其一


import { randomString, generateShortCutImageBy, ShortCut } from '@/libs/utils';  //此行是修改原来的代码

import { debounce, throttle } from 'lodash'; //此行是修改原来的代码


```

在data里面添加以下数据：

```
data() {
    return {
      //……
      // userId是公用变量
      userId: '', // userId，用以区分哪个用户发送的消息

      // socket.id添加以下变量
      socket: null,

      // goEasy 添加以下变量
      channel: 'channel1', // GoEasy channel 
      appkey: '******', // GoEasy应用appkey，替换成你的appkey

      // leancloud-realtime 添加以下变量，appId、appKey、server这几个值去leancloud控制台>设置>应用凭证里面找
      chatRoom: null, 
      appId: '*******************', 
      appKey: '*******************', 
      server: 'https://*******************.***.com', // REST API 服务器地址
    };
  }

```

在mount事件里面找到以下代码并修改:

```js

/* 原代码(控制播放、暂停)*/
this.$bus.$on('toggle-playback', debounce(() => {
      this[this.paused ? 'play' : 'pause']();
      // this.$ga.event('app', 'toggle-playback');
    }, 50, { leading: true }));

/* 新代码(控制播放、暂停)*/
this.$bus.$on('toggle-playback', debounce(() => {
      const controlParam = {
        user: this.userId,
        action: this.paused ? 'play' : 'pause',
        time: videodata.time,
      };
      this.sendMessage(controlParam);
      this[this.paused ? 'play' : 'pause']();
      // this.$ga.event('app', 'toggle-playback');
    }, 50, { leading: true }));


/* 原代码(控制快进)*/
this.$bus.$on('seek', (e: number) => {
      // update vuex currentTime to use some where
      this.seekTime = [e];
      this.updateVideoCurrentTime(e);
    });

/* 新代码(控制快进)*/
this.$bus.$on('seek', throttle((e: number) => {
      // update vuex currentTime to use some where
      this.seekTime = [e];
      this.updateVideoCurrentTime(e);
      const controlParam = {
        user: this.userId,
        action: 'seek',
        time: e,
      };
      this.sendMessage(controlParam);
    }, 200, { leading: false }));
```
在mounted()事件最顶部添加以下代码

```js
    /* 生成10位userId */
    this.userId = randomString(10);

    const that = this;

    /* 使用socket-io */

    // this.socket = io('http://192.168.3.58:2233'); // 替换成你的websocket服务地址
    // this.socket.on('video-control', (res: string) => {
    //   const result = JSON.parse(res);
    //   if (result.user !== this.userId) {
    //     that.resultHandler(result);
    //   }
    // });

    /* 使用GoEasy */

    // this.goEasyConnect = new GoEasy({
    //   host: 'hangzhou.goeasy.io', // 应用所在的区域地址，杭州：hangzhou.goeasy.io，新加坡：singapore.goeasy.io
    //   appkey: this.appkey, // 替换为您的应用appkey
    //   onConnected() {
    //     console.log('连接成功！');
    //   },
    //   onDisconnected() {
    //     console.log('连接断开！');
    //   },
    //   onConnectFailed(error) {
    //     console.log('连接失败或错误！');
    //   },
    // });
    // this.goEasyConnect.subscribe({
    //   channel: this.channel,
    //   onMessage(message) {
    //     const result = JSON.parse(message.content);
    //     if (result.user !== that.userId) {
    //       that.resultHandler(result)
    //     }
    //   },
    // });

    /* 使用leancloud-realtime */
    
    let client; let room;
    // 换成你自己的一个房间的 conversation id（这是服务器端生成的），第一次执行代码就会生成，在leancloud控制台>即时通讯>对话下面，复制一个过来即可
    let roomId = '*************';

    const realtime = new Realtime({
      appId: this.appId,
      appKey: this.appKey,
      server: this.server,
    });

    realtime.createIMClient(this.userId).then((c) => {
      console.log('连接成功');
      client = c;
      client.on('disconnect', () => {
        console.log('[disconnect] 服务器连接已断开');
      });
      client.on('offline', () => {
        console.log('[offline] 离线（网络连接已断开）');
      });
      client.on('online', () => {
        console.log('[online] 已恢复在线');
      });
      client.on('schedule', (attempt, time) => {
        console.log(
          `[schedule] ${
            time / 1000
          }s 后进行第 ${
            attempt + 1
          } 次重连`,
        );
      });
      client.on('retry', (attempt) => {
        console.log(`[retry] 正在进行第 ${attempt + 1} 次重连`);
      });
      client.on('reconnect', () => {
        console.log('[reconnect] 重连成功');
      });
      client.on('reconnecterror', () => {
        console.log('[reconnecterror] 重连失败');
      });
      // 获取对话
      return c.getConversation(roomId);
    })
      .then((conversation) => {
        if (conversation) {
          return conversation;
        }
        // 如果服务器端不存在这个 conversation
        console.log('不存在这个 conversation，创建一个。');
        return client
          .createConversation({
            name: 'LeanCloud-Conversation',
            // 创建暂态的聊天室（暂态聊天室支持无限人员聊天）
            transient: true,
          })
          .then((conversation) => {
            console.log('创建新 Room 成功，id 是：', roomId);
            roomId = conversation.id;
            return conversation;
          });
      })
      .then(conversation => conversation.join())
      .then((conversation) => {
        // 获取聊天历史
        room = conversation;
        that.chatRoom = conversation;
        // 房间接受消息
        room.on('message', (message) => {
          const result = JSON.parse(message._lctext);
          that.resultHandler(result);
        });
      })
      .catch((err) => {
        console.error(err);
        console.log(`错误：${err.message}`);
      });    
```
在methods()里面添加两个方法：

```js
    sendMessage(controlParam) {
      const params = JSON.stringify(controlParam);
      // 使用socket.io
      /* this.socket.emit('video-control', params); */
      // 使用GoEasy
      /* this.goEasyConnect.publish({
        channel: this.channel,
        message: params,
      }); */
      // 使用leancloud-realtime
      if (!this.chatRoom) { return false; }
      this.chatRoom.send(new TextMessage(params));
    },
    resultHandler(result) {
      switch (result.action) {
        default:
          this.pause();
          break;
        case 'play':
          this.seekTime = [result.time];
          this.updateVideoCurrentTime(result.time);
          this.play();
          break;
        case 'pause':
          this.seekTime = [result.time];
          this.updateVideoCurrentTime(result.time);
          this.pause();
          break;
        case 'seek':
          this.seekTime = [result.time];
          this.updateVideoCurrentTime(result.time);
          break;
      }
    },
```

实现了同步功能还不算完，作为一个强迫症晚期患者，我觉得这款播放器的字幕样式有点丑，经过仔细查找之后，我发现字幕样式是用CSS写的，同样修改之，修改方法：

打开文件 `/src/renderer/css/subtitle.scss`，找到`subtitle-style3`的位置修改为：
```css
.subtitle-style3 {
  font-family: 'FZZhongDengXian-Z07';
  font-size: 9px;
  letter-spacing: 0.2px;
  font-weight: 800;
  opacity: 1;
  color: #fff;
  text-shadow: 0.4px 0.4px 0.7px #0080FF,
  0.2px 0.2px 0.3px #009be6,
  0.3px 0.3px 0.3px #009be6,
  0.4px 0.4px 0.3px #009be6;
  -webkit-background-clip: text;
  -webkit-text-fill-color: white;
  -webkit-text-stroke: 1.6px transparent;
  -webkit-font-smoothing: antialiased;
}
```
`FZZhongDengXian-Z07`是方正中等线字体，可去方[正字库官网](https://www.foundertype.com/index.php/FindFont/searchFont?keyword=%E6%96%B9%E6%AD%A3%E4%B8%AD%E7%AD%89%E7%BA%BF%E7%AE%80%E4%BD%93)免费下载，下载GBK版本，字体对比效果：

![wInoT0.png](https://s1.ax1x.com/2020/09/19/wInoT0.png)


最后打包成安装包，发给你的小伙伴，安装后就能使用了。


```bash

# 打包windows平台
npm run build

# 打包Mac平台
npm run build:mas

```



