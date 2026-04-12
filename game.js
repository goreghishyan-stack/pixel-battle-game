const socket = io();
const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const timerDisplay = document.getElementById('timer-display');
const nickDisplay = document.getElementById('nickname-display');

const worldSize = 80; // Размер поля (80x80 пикселей)
const pixelSize = 12; // Размер одного квадратика
canvas.width = worldSize * pixelSize;
canvas.height = worldSize * pixelSize;

let pixels = {}; 
let myNick = "";
let canDraw = true;
let currentTool = 'brush'; // Инструмент по умолчанию
let showGrid = false; // Сетка выключена

// Функция входа
window.startGame = function() {
    const nickInput = document.getElementById('nickname');
    if (nickInput.value.trim() !== "") {
        myNick = nickInput.value;
        nickDisplay.innerText = `Игрок: ${myNick}`;
        document.getElementById('login-screen').style.display = 'none';
    }
};

// Переключение инструментов
window.setTool = function(tool) {
    currentTool = tool;
    document.getElementById('btn-brush').classList.toggle('active', tool === 'brush');
    document.getElementById('btn-eraser').classList.toggle('active', tool === 'eraser');
};

// Вкл/Выкл сетки
window.toggleGrid = function() {
    showGrid = !showGrid;
    render();
};

socket.on('loadCanvas', (data) => { pixels = data; render(); });
socket.on('updatePixel', (data) => {
    pixels[`${data.x}-${data.y}`] = { color: data.color, user: data.user };
    render();
});

socket.on('error_cooldown', (sec) => {
    canDraw = false;
    startTimer(sec);
});

function render() {
    // Очистка поля
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Рисуем пиксели
    for (let key in pixels) {
        const [x, y] = key.split('-').map(Number);
        ctx.fillStyle = pixels[key].color;
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    }

    // Рисуем сетку (оверлей), если включена
    if (showGrid) {
        ctx.strokeStyle = "rgba(0,0,0,0.1)";
        ctx.lineWidth = 1;
        for (let i = 0; i <= worldSize; i++) {
            ctx.beginPath();
            ctx.moveTo(i * pixelSize, 0);
            ctx.lineTo(i * pixelSize, canvas.height);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i * pixelSize);
            ctx.lineTo(canvas.width, i * pixelSize);
            ctx.stroke();
        }
    }
}

canvas.addEventListener('mousedown', (e) => {
    if (!canDraw || !myNick) return;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / pixelSize);
    const y = Math.floor((e.clientY - rect.top) / pixelSize);
    
    // Если ластик — отправляем белый цвет (стираем)
    const finalColor = (currentTool === 'eraser') ? '#ffffff' : colorPicker.value;
    
    socket.emit('setPixel', { x, y, color: finalColor, user: myNick });
});

function startTimer(seconds) {
    let timeLeft = seconds;
    const interval = setInterval(() => {
        timerDisplay.innerText = `ПЕРЕЗАРЯДКА: ${timeLeft}с`;
        timeLeft--;
        if (timeLeft < 0) {
            clearInterval(interval);
            timerDisplay.innerText = "ГОТОВ К БОЮ";
            canDraw = true;
        }
    }, 1000);
}
