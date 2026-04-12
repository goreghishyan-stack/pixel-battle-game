const socket = io();
const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight - 60;

const worldSize = 500; // ОГРОМНЫЙ ХОЛСТ как у топ-стримеров
const pixelSize = 20; 

let pixels = {}; 
let zoom = 0.5; // Сразу отдаляем, чтобы видеть всю карту
let cameraX = 50, cameraY = 50;
let isPanning = false, startPanX = 0, startPanY = 0;
let canDraw = true;

socket.on('loadCanvas', (data) => { pixels = data; render(); });
socket.on('updatePixel', (data) => {
    pixels[`${data.x}-${data.y}`] = data.color;
    render();
});

socket.on('error_cooldown', (sec) => {
    canDraw = false;
    alert(`Подожди еще ${sec} сек.!`);
});

function render() {
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(cameraX, cameraY);
    ctx.scale(zoom, zoom);

    // Холст
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, worldSize * pixelSize, worldSize * pixelSize);

    for (let key in pixels) {
        const [x, y] = key.split('-').map(Number);
        ctx.fillStyle = pixels[key];
        ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
    }
    
    // Тонкая сетка
    ctx.strokeStyle = "rgba(0,0,0,0.1)";
    ctx.lineWidth = 0.5 / zoom;
    for (let i = 0; i <= worldSize; i += 5) { // Сетка каждые 5 пикселей для оптимизации
        ctx.beginPath(); ctx.moveTo(i * pixelSize, 0); ctx.lineTo(i * pixelSize, worldSize * pixelSize); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * pixelSize); ctx.lineTo(worldSize * pixelSize, i * pixelSize); ctx.stroke();
    }
    ctx.restore();
}

// Управление (Правая кнопка - тащить, Левая - ставить)
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('mousedown', (e) => {
    if (e.button === 2) {
        isPanning = true;
        startPanX = e.clientX - cameraX;
        startPanY = e.clientY - cameraY;
    } else if (e.button === 0 && canDraw) {
        const worldX = (e.clientX - cameraX) / zoom;
        const worldY = (e.clientY - 60 - cameraY) / zoom;
        const x = Math.floor(worldX / pixelSize);
        const y = Math.floor(worldY / pixelSize);

        if (x >= 0 && x < worldSize && y >= 0 && y < worldSize) {
            socket.emit('setPixel', { x, y, color: colorPicker.value });
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
    const zoomAmount = e.deltaY > 0 ? 0.9 : 1.1;
    zoom *= zoomAmount;
    zoom = Math.max(0.05, Math.min(zoom, 5));
    render();
});
