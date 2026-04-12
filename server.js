const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.use(express.static(__dirname));

let pixelData = {}; 

io.on('connection', (socket) => {
    socket.emit('loadCanvas', pixelData);

    socket.on('setPixel', (data) => {
        const id = `${data.x}-${data.y}`;
        
        // Сохраняем пиксель
        pixelData[id] = { color: data.color, user: data.user };
        io.emit('updatePixel', { x: data.x, y: data.y, color: data.color });

        // Магия CS2: через 5 секунд удаляем этот пиксель
        setTimeout(() => {
            if (pixelData[id]) {
                delete pixelData[id];
                io.emit('removePixel', { x: data.x, y: data.y });
            }
        }, 5000); // 5000 миллисекунд = 5 секунд
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log('Сервер запущен на порту ' + PORT);
});
