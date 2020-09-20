const httpServer = require('http').Server();
const io = require('socket.io')(httpServer);

const port = 2233;

httpServer.listen(port, () => {
  console.log('正在监听端口：' + port);
});

io.on('connection', (socket) => {

  const remoteUser = socket.request.connection.remoteAddress + ':' + socket.request.connection.remotePort;

  console.log('来自' + remoteUser + '的新连接');

  socket.on('disconnect', function () {
    console.log('用户' + remoteUser + '断开连接');
  });

  socket.on('video-control', (controlParam) => {
    console.log('用户' + remoteUser + '的消息:' + controlParam);
    io.emit('video-control', controlParam);
  });

});
