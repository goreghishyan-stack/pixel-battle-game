const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs');

app.use(express.static(__dirname));
const DATA_FILE = 'posts.json';
let posts = [];

// Загружаем старые посты
if (fs.existsSync(DATA_FILE)) {
    try { posts = JSON.parse(fs.readFileSync(DATA_FILE)); } catch(e) {}
}

io.on('connection', (socket) => {
    socket.emit('loadPosts', posts);

    socket.on('newPost', (data) => {
        const newPost = {
            user: data.user,
            content: data.content,
            time: Date.now()
        };
        posts.push(newPost);
        
        // Ограничим ленту 100 постами, чтобы не тормозило
        if (posts.length > 100) posts.shift();

        io.emit('updateFeed', newPost);
        fs.writeFile(DATA_FILE, JSON.stringify(posts), () => {});
    });
});

http.listen(process.env.PORT || 3000, () => console.log('ITD Social Network Live'));
