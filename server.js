const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

let posts = [];
let users = {}; // Хранилище: { "ник": { pass: "пароль", clan: "эмодзи" } }

app.use(express.static(__dirname));

io.on('connection', (socket) => {
    // Отправляем старые посты при входе
    socket.emit('loadPosts', posts);

    // ЛОГИКА АВТОРИЗАЦИИ
    socket.on('authenticate', (data) => {
        const { mode, nick, pass, clan } = data;

        if (mode === 'reg') {
            if (users[nick]) {
                return socket.emit('authResult', { success: false, message: "Это имя уже занято!" });
            }
            // Регистрация нового
            users[nick] = { pass: pass, clan: clan };
            console.log(`Новый игрок: ${nick} [${clan}]`);
            socket.emit('authResult', { success: true, userId: `${clan} ${nick}`, pass: pass });
        } else {
            // Вход в существующий
            if (!users[nick]) {
                return socket.emit('authResult', { success: false, message: "Такого ника нет!" });
            }
            if (users[nick].pass !== pass) {
                return socket.emit('authResult', { success: false, message: "Неверный пароль!" });
            }
            socket.emit('authResult', { success: true, userId: `${users[nick].clan} ${nick}`, pass: pass });
        }
    });

    socket.on('newPost', (post) => {
        posts.push(post);
        if (posts.length > 100) posts.shift();
        io.emit('updateFeed', post);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log('KGTD Server active on port ' + PORT));
