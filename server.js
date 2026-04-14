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
        if (!nick || !pass) return;

        // Если режим LOGIN, но сервер пустой — мы разрешим создать акк заново скрыто
        if (mode === 'reg') {
            if (users[nick]) {
                return socket.emit('authResult', { success: false, message: "Это имя уже занято!" });
            }
            users[nick] = { pass: pass, clan: clan };
            socket.emit('authResult', { 
                success: true, 
                userId: `${clan} ${nick}`, 
                pass: pass, 
                userClan: clan,
                userName: nick 
            });
            socket.broadcast.emit('clanNotification', { clan: clan, user: nick });
        } else {
            // Вход
            if (!users[nick]) {
                // ХАК: Если юзера нет, сообщаем фронтенду, что нужно перерегистрироваться
                return socket.emit('authResult', { success: false, code: "RE_REG", message: "Сервер обновился. Восстанавливаю доступ..." });
            }
            if (users[nick].pass !== pass) {
                return socket.emit('authResult', { success: false, message: "Неверный пароль!" });
            }
            socket.emit('authResult', { 
                success: true, 
                userId: `${users[nick].clan} ${nick}`, 
                pass: pass, 
                userClan: users[nick].clan,
                userName: nick
            });
        }
    });

    socket.on('newPost', (post) => {
        posts.push(post);
        if (posts.length > 100) posts.shift();
        io.emit('updateFeed', post);
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => console.log('KGTD Server active'));
