const App = new Vue({
  el: '#app',
  template: '#template',
  data: {
    socket: null,
    player: null,
    goEasyConnect: null,
    videoList: [],
    videoSrc: 'http://192.168.3.58:8088/movie/Better.Call.Saul.S05E08.mp4',
    playing: false,
    controlParam: {
      user: '',
      action: '',
      time: '',
    },
    userId: '',
    channel: 'channel1', //GoEasy channel
    appkey: '****************', // 替换成你的GoEasy应用appkey
  },
  methods: {
    randomString(length) {
      let str = ''
      for (let i = 0; i < length; i++) {
        str += Math.random().toString(36).substr(2)
      }
      return str.substr(0, length)
    },
    addVideo() {
      if (this.videoSrc) {
        this.videoList.push(decodeURI(this.videoSrc))
      }
      localStorage.setItem('videoList', JSON.stringify(this.videoList))
    },
    playVideoItem(src) {
      this.$refs.video.src = src
      localStorage.setItem('currentPlayVideo', src)

    },
    deleteVideoItem(index) {
      this.videoList.splice(index, 1)
      localStorage.setItem('videoList', JSON.stringify(this.videoList))
    },
    toggleFullScreen() {
      if (this.player.requestFullscreen) {
        this.player.requestFullscreen()
      } else if (this.player.mozRequestFullScreen) {
        this.player.mozRequestFullScreen()
      } else if (this.player.webkitRequestFullscreen) {
        this.player.webkitRequestFullscreen()
      } else if (this.player.msRequestFullscreen) {
        this.player.msRequestFullscreen()
      }
    },
    playVideo() {
      if (this.playing) {
        this.player.pause()
        this.controlParam.action = 'pause'
        this.controlParam.time = this.player.currentTime
        /* 使用socket-io*/
        // this.socket.emit('video-control', JSON.stringify(this.controlParam))

        /* 使用GoEasy*/
        this.goEasyConnect.publish({
          channel: this.channel,
          message: JSON.stringify(this.controlParam)
        })
      } else {
        this.player.play()
        this.controlParam.action = 'play'
        this.controlParam.time = this.player.currentTime
        /* 使用socket-io*/
        // this.socket.emit('video-control', JSON.stringify(this.controlParam))

        /* 使用GoEasy*/
        this.goEasyConnect.publish({
          channel: this.channel,
          message: JSON.stringify(this.controlParam)
        })
      }
    },
    seekVideo() {
      this.player.pause()
      this.controlParam.action = 'seek'
      this.controlParam.time = this.player.currentTime
      /* 使用socket-io*/
      // this.socket.emit('video-control', JSON.stringify(this.controlParam))

      /* 使用GoEasy*/
      this.goEasyConnect.publish({
        channel: this.channel,
        message: JSON.stringify(this.controlParam)
      })
    },
    resultHandler(result) {
      switch (result.action) {
        case "play":
          this.player.currentTime = (result.time + 0.2) //播放时+0.2秒，抵消网络延迟
          this.player.play();
          break
        case "pause":
          this.player.currentTime = (result.time)
          this.player.pause();
          break
        case "seek":
          this.player.currentTime = (result.time);
          break
      }
    }
  },
  created() {

    /* 读取本地视频列表和上一次播放的视频*/

    const localList = JSON.parse(localStorage.getItem('videoList'))

    this.videoList = localList ? localList : []

    const currentPlayVideo = localStorage.getItem('currentPlayVideo')

    this.videoSrc = currentPlayVideo ? currentPlayVideo : ''

    this.userId = this.randomString(10)

    this.controlParam.user = this.userId
  },
  mounted() {

    this.player = this.$refs.video

    /*使用socket-io*/
    // this.socket = io('http://192.168.3.58:2233'); // 替换成你的websocket服务地址
    // this.socket.on('video-control', (res) => {
    //   const result = JSON.parse(res);
    //   if (result.user !== this.userId) {
    //     this.resultHandler(result)
    //   }
    // });

    /* 使用GoEasy*/

    /* 创建GoEasy连接*/
    this.goEasyConnect = new GoEasy({
      host: "hangzhou.goeasy.io", // 应用所在的区域地址，杭州：hangzhou.goeasy.io，新加坡：singapore.goeasy.io
      appkey: this.appkey,
      onConnected: function () {
        console.log('连接成功！')
      },
      onDisconnected: function () {
        console.log('连接断开！')
      },
      onConnectFailed: function (error) {
        console.log(error, '连接失败或错误！')
      }
    })

    const that = this

    /* 监听GoEasy连接*/
    this.goEasyConnect.subscribe({
      channel: this.channel,
      onMessage: function (message) {
        const result = JSON.parse(message.content)
        if (result.user !== that.userId) {
          that.resultHandler(result)
        }
      }
    })
    this.player.addEventListener('play', () => {
      this.playing = true
    })
    this.player.addEventListener('pause', () => {
      this.playing = false
    })
  }
})
