const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

let posts = [];
let users = {}; 

app.use(express.static(__dirname));

io.on('connection', (socket) => {
    socket.emit('loadPosts', posts);

    socket.on('authenticate', (data) => {
        const { mode, nick, pass, clan } = data;

        if (mode === 'reg') {
            if (users[nick]) {
                return socket.emit('authResult', { success: false, message: "Это имя уже занято!" });
            }
            users[nick] = { pass: pass, clan: clan };
            const userId = `${clan} ${nick}`;
            
            // УВЕДОМЛЕНИЕ ДЛЯ КЛАНА
            // Рассылаем всем, кроме отправителя, информацию о новом члене клана
            socket.broadcast.emit('clanNotification', { clan: clan, user: nick });
            
            socket.emit('authResult', { success: true, userId: userId, pass: pass, userClan: clan });
        } else {
            if (!users[nick]) {
                return socket.emit('authResult', { success: false, message: "Такого ника нет!" });
            }
            if (users[nick].pass !== pass) {
                return socket.emit('authResult', { success: false, message: "Неверный пароль!" });
            }
            socket.emit('authResult', { success: true, userId: `${users[nick].clan} ${nick}`, pass: pass, userClan: users[nick].clan });
        }
    });

    socket.on('newPost', (post) => {
        posts.push(post);
        if (posts.length > 100) posts.shift();
        io.emit('updateFeed', post);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log('KGTD Server is live!'));
