const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let pixelData = {}; 

io.on('connection', (socket) => {
    socket.emit('loadCanvas', pixelData);
    socket.on('setPixel', (data) => {
        pixelData[`${data.x}-${data.y}`] = data.color;
        io.emit('updatePixel', data);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log('Сервер запущен на порту ' + PORT);
});
