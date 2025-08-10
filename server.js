// 必要モジュール
const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const fs = require("fs");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

let width = 500;  // 初期サイズ
let height = 500;
let pixels;

// 保存読み込み
try {
    const saved = JSON.parse(fs.readFileSync("pixels.json"));
    width = saved.width;
    height = saved.height;
    pixels = saved.data;
    console.log(`Loaded canvas: ${width}x${height}`);
} catch {
    pixels = Array(height).fill().map(() => Array(width).fill("#FFFFFF"));
    console.log("Created new blank canvas");
}

// 静的ファイル
app.use(express.static("public"));

// 拡張API（管理者用）
app.get("/expand", (req, res) => {
    expandCanvas(width + 100, height + 100);
    io.emit("init", { width, height, data: pixels });
    res.send(`Canvas expanded to ${width}x${height}`);
});

function expandCanvas(newWidth, newHeight) {
    const newPixels = Array(newHeight).fill().map(() => Array(newWidth).fill("#FFFFFF"));
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            newPixels[y][x] = pixels[y][x];
        }
    }
    width = newWidth;
    height = newHeight;
    pixels = newPixels;
    savePixels();
}

function savePixels() {
    fs.writeFileSync("pixels.json", JSON.stringify({ width, height, data: pixels }));
}

// Socket通信
io.on("connection", (socket) => {
    socket.emit("init", { width, height, data: pixels });

    socket.on("setPixel", ({ x, y, color }) => {
        if (x >= 0 && x < width && y >= 0 && y < height) {
            pixels[y][x] = color;
            io.emit("pixelUpdate", { x, y, color });
            savePixels();
        }
    });
});

server.listen(3000, () => {
    console.log("Server running → http://localhost:3000");
});
