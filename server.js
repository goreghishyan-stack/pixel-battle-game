const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const fs = require('fs'); // Модуль для работы с файлами

app.use(express.static(__dirname));

const DATA_FILE = 'pixels.json';
let pixelData = {}; 

// 1. При старте сервера пытаемся прочитать сохраненные пиксели
if (fs.existsSync(DATA_FILE)) {
    const data = fs.readFileSync(DATA_FILE);
    try {
        pixelData = JSON.parse(data);
        console.log('Данные холста успешно загружены!');
    } catch (e) {
        console.error('Ошибка чтения файла пикселей:', e);
    }
}

io.on('connection', (socket) => {
    // 2. Новому игроку сразу отправляем всё состояние холста
    socket.emit('loadCanvas', pixelData);

    socket.on('setPixel', (data) => {
        const id = `${data.x}-${data.y}`;
        
        // Обновляем пиксель в оперативной памяти
        pixelData[id] = data.color;
        
        // Рассылаем всем игрокам (включая того, кто нарисовал)
        io.emit('updatePixel', data);

        // 3. Сохраняем обновление в файл
        fs.writeFile(DATA_FILE, JSON.stringify(pixelData), (err) => {
            if (err) console.error("Ошибка сохранения в файл:", err);
        });
    });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log('Сервер запущен на порту ' + PORT);
});
