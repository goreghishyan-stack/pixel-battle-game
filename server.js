const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');

app.use(express.static(__dirname));
const DATA_FILE = 'pixels.json';
let pixelData = {}; 
let lastMove = {};

if (fs.existsSync(DATA_FILE)) {
    try { pixelData = JSON.parse(fs.readFileSync(DATA_FILE)); } catch(e){}
}

io.on('connection', (socket) => {
    const ip = socket.handshake.headers['x-forwarded-for'] || socket.request.connection.remoteAddress;
    socket.emit('loadCanvas', pixelData);

    socket.on('setPixel', (data) => {
        const now = Date.now();
        if (lastMove[ip] && now - lastMove[ip] < 5000) {
            socket.emit('error_cooldown', Math.ceil((5000 - (now - lastMove[ip])) / 1000));
            return;
        }
        lastMove[ip] = now;
        pixelData[`${data.x}-${data.y}`] = { color: data.color, user: data.user || "Аноним" };
        io.emit('updatePixel', { x: data.x, y: data.y, color: data.color, user: data.user });
        fs.writeFile(DATA_FILE, JSON.stringify(pixelData), () => {});
    });
});

http.listen(process.env.PORT || 3000, () => console.log('Server Online'));
