const socket = io();
const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');
const timerDisplay = document.getElementById('timer-display');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const worldSize = 300; // Оптимально для ивента
const pixelSize = 20; 

let pixels = {}; 
let myNick = "";
let canDraw = true;

// Настройки камеры
let zoom = 0.3;
let cameraX = canvas.width / 2 - (worldSize * pixelSize * zoom) / 2;
let cameraY = canvas.height / 2 - (worldSize * pixelSize * zoom) / 2;
let isPanning = false;
let startPanX = 0, startPanY = 0;

function startGame() {
    const input = document.getElementById('nickname');
    if (input.value.trim() !== "") {
        myNick = input.value;
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('user-info').innerText = "Игрок: " + myNick;
    }
}
window.startGame = startGame;

socket.on('loadCanvas', (data) => { pixels = data; render(); });
socket.on('updatePixel', (data) => {
    pixels[`${data.x}-${data.y}`] = data.color;
    render();
});

socket.on('error_cooldown', (sec) => {
    canDraw = false;
    startTimer(sec);
});

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // ОТКЛЮЧАЕМ РАЗМЫТИЕ (делаем пиксели четкими)
    ctx.imageSmoothingEnabled = false;

    ctx.save();
    ctx.translate(cameraX, cameraY);
    ctx.scale(zoom, zoom);

    // Рисуем сетку фона
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, worldSize * pixelSize, worldSize * pixelSize);

    // Рисуем пиксели
    for (let key in pixels) {
        const [x, y] = key.split('-').map(Number);
        ctx.fillStyle = pixels[key];
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    }
    
    ctx.restore();
}

// Управление мышкой
canvas.addEventListener('contextmenu', e => e.preventDefault());

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 2) { // ПКМ - Перемещение
        isPanning = true;
        startPanX = e.clientX - cameraX;
        startPanY = e.clientY - cameraY;
    } else if (e.button === 0 && canDraw && myNick) { // ЛКМ - Рисование
        const worldX = (e.clientX - cameraX) / zoom;
        const worldY = (e.clientY - cameraY) / zoom;
        const x = Math.floor(worldX / pixelSize);
        const y = Math.floor(worldY / pixelSize);

        if (x >= 0 && x < worldSize && y >= 0 && y < worldSize) {
            socket.emit('setPixel', { x, y, color: colorPicker.value, user: myNick });
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (isPanning) {
        cameraX = e.clientX - startPanX;
        cameraY = e.clientY - startPanY;
        render();
    }
});

window.addEventListener('mouseup', () => isPanning = false);

canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomAmount = e.deltaY > 0 ? 0.9 : 1.1;
    
    // Зум в точку курсора
    const mouseX = e.clientX;
    const mouseY = e.clientY;
    cameraX = mouseX - (mouseX - cameraX) * zoomAmount;
    cameraY = mouseY - (mouseY - cameraY) * zoomAmount;
    
    zoom *= zoomAmount;
    zoom = Math.max(0.05, Math.min(zoom, 10));
    render();
}, { passive: false });

function startTimer(seconds) {
    let timeLeft = seconds;
    const interval = setInterval(() => {
        timerDisplay.innerText = `ЖДИ: ${timeLeft}с`;
        timeLeft--;
        if (timeLeft < 0) {
            clearInterval(interval);
            timerDisplay.innerText = "ГОТОВ";
            canDraw = true;
        }
    }, 1000);
}

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    render();
});
