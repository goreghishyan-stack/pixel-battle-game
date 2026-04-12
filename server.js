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
        pixelData[id] = { color: data.color };
        io.emit('updatePixel', { x: data.x, y: data.y, color: data.color });

        // Удаление через 5 секунд
        setTimeout(() => {
            if (pixelData[id]) {
                delete pixelData[id];
                io.emit('removePixel', { x: data.x, y: data.y });
            }
        }, 5000);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => { console.log('Server is running'); });
