const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'https://syayou.f5.si', // フロントのURL
    methods: ['GET', 'POST']
  }
});

app.get('/', (req, res) => {
  res.send('Hello from r/place backend!');
});

// 保存用ファイルパス
const PIXELS_FILE = './pixels.json';

// 起動時に保存ファイル読み込み
let pixels = {};
if (fs.existsSync(PIXELS_FILE)) {
  try {
    const data = fs.readFileSync(PIXELS_FILE, 'utf8');
    pixels = JSON.parse(data);
    console.log('Pixel data loaded from file.');
  } catch (err) {
    console.error('Error loading pixel data:', err);
    pixels = {};
  }
} else {
  console.log('No saved pixel data found, starting fresh.');
  pixels = {};
}

// ピクセル状態を保存する関数
function savePixels() {
  try {
    fs.writeFileSync(PIXELS_FILE, JSON.stringify(pixels));
  } catch (err) {
    console.error('Error saving pixel data:', err);
  }
}

io.on('connection', (socket) => {
  console.log('user connected');

  // 初期ピクセル送信
  socket.emit('init', pixels);

  // 通常の1ピクセル更新
  socket.on('setPixel', ({ x, y, color }) => {
    const key = `${x}_${y}`;
    pixels[key] = color;
    savePixels(); // 保存
    io.emit('pixelUpdate', { x, y, color });
  });

  // 一括更新（管理人ページ専用想定）
  socket.on('bulkSetPixels', (pixelArray) => {
    pixelArray.forEach(({ x, y, color }) => {
      const key = `${x}_${y}`;
      pixels[key] = color;
    });
    savePixels(); // 保存
    io.emit('bulkPixelUpdate', pixelArray);
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`listening on *:${PORT}`);
});
