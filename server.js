 const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'https://syayou.f5.si', // ここを実際のフロントのURLに
    methods: ['GET', 'POST']
  }
});
app.get('/', (req, res) => {
  res.send('Hello from r/place backend!');
});

const pixels = {}; // { "x_y": "#RRGGBB" }

io.on('connection', (socket) => {
  console.log('user connected');

  // 初期ピクセル送信
  socket.emit('init', pixels);

  // クライアントからピクセル変更受信
  socket.on('setPixel', ({ x, y, color }) => {
    const key = `${x}_${y}`;
    pixels[key] = color;

    // 変更を全クライアントに通知
    io.emit('pixelUpdate', { x, y, color });
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});
