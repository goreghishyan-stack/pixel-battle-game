const socket = io();
const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');

// Настройка размера
const worldSize = 100; 
const pixelSize = 8; 
canvas.width = window.innerWidth > 800 ? 800 : window.innerWidth;
canvas.height = 600;

let pixels = {}; 
let isDrawing = false;

// Слушаем сервер
socket.on('loadCanvas', (data) => { pixels = data; render(); });
socket.on('updatePixel', (data) => {
    pixels[`${data.x}-${data.y}`] = { color: data.color };
    render();
});
socket.on('removePixel', (data) => {
    delete pixels[`${data.x}-${data.y}`];
    render();
});

function render() {
    ctx.fillStyle = "#222";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    for (let key in pixels) {
        const [x, y] = key.split('-').map(Number);
        ctx.fillStyle = pixels[key].color;
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    }
}

// Логика рисования мышкой
canvas.addEventListener('mousedown', () => isDrawing = true);
window.addEventListener('mouseup', () => isDrawing = false);

canvas.addEventListener('mousemove', (e) => {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / pixelSize);
    const y = Math.floor((e.clientY - rect.top) / pixelSize);
    
    socket.emit('setPixel', { x, y, color: colorPicker.value });
});
