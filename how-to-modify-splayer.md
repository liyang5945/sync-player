修改方法：

首先安装 socket.io-client 或 goeasy

```bash

npm install socket.io-client

npm install goeasy

```

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

引入上面的`randomString`方法，并引入`socket.io-client`或`GoEasy`

```

import io from 'socket.io-client';

import GoEasy from 'goeasy';

import { randomString, generateShortCutImageBy, ShortCut } from '@/libs/utils';  //此行是修改原来的代码

import { debounce, throttle } from 'lodash'; //此行是修改原来的代码


```

在data里面添加以下数据：

```
data() {
    return {
      //……
      userId: '', // userId，用以区分哪个用户发送的消息
      channel: 'channel1', // GoEasy channel 
      appkey: '******', // GoEasy应用appkey，替换成你的appkey
    };
  }

```

在mount事件里面找到以下代码并修改:

```

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
      // this.socket.emit('video-control', JSON.stringify(controlParam));
      this.goEasyConnect.publish({
        channel: this.channel,
        message: JSON.stringify(controlParam),
      });
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
      // this.socket.emit('video-control', JSON.stringify(controlParam));
      this.goEasyConnect.publish({
        channel: this.channel,
        message: JSON.stringify(controlParam),
      });
    }, 200, { leading: false }));
```

并在控制跳转代码下面添加以下新代码：

```

    /* 生成10位userId */
    this.userId = randomString(10);

    const that = this;

    function resultHandler(result) {
      switch (result.action) {
        default:
          that.pause();
          break;
        case 'play':
          that.seekTime = [result.time];
          that.updateVideoCurrentTime(result.time);
          that.play();
          break;
        case 'pause':
          that.seekTime = [result.time];
          that.updateVideoCurrentTime(result.time);
          that.pause();
          break;
        case 'seek':
          that.seekTime = [result.time];
          that.updateVideoCurrentTime(result.time);
          break;
      }
    }

    /* 使用socket-io */

    // this.socket = io('http://192.168.3.58:2233'); // 替换成你的websocket服务地址
    // this.socket.on('video-control', (res: string) => {
    //   const result = JSON.parse(res);
    //   if (result.user !== this.userId) {
    //     resultHandler(result);
    //   }
    // });

    /* 使用GoEasy */

    this.goEasyConnect = new GoEasy({
      host: 'hangzhou.goeasy.io', // 应用所在的区域地址，杭州：hangzhou.goeasy.io，新加坡：singapore.goeasy.io
      appkey: this.appkey, // 替换为您的应用appkey
      onConnected() {
        console.log('连接成功！');
      },
      onDisconnected() {
        console.log('连接断开！');
      },
      onConnectFailed(error) {
        console.log('连接失败或错误！');
      },
    });
    this.goEasyConnect.subscribe({
      channel: this.channel,
      onMessage(message) {
        const result = JSON.parse(message.content);
        if (result.user !== that.userId) {
          resultHandler(result)
        }
      },
    });    

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

注意事项：安装依赖包时因为墙的原因大概率会失败，安装前要设置命令行代理

```bash

# windows cmd 设置代理命令
set http_proxy=http://127.0.0.1:1081
set https_proxy=http://127.0.0.1:1081

```




