// Найди место, где обрабатывается socket.on('setPixel') и замени на это:
socket.on('setPixel', (data) => {
    const now = Date.now();
    const COOLDOWN = 5000; 

    if (lastMove[clientIp] && now - lastMove[clientIp] < COOLDOWN) {
        socket.emit('error_cooldown', Math.ceil((COOLDOWN - (now - lastMove[clientIp])) / 1000));
        return;
    }

    lastMove[clientIp] = now;
    // Сохраняем и цвет, и имя пользователя!
    pixelData[`${data.x}-${data.y}`] = { color: data.color, user: data.user || "Аноним" };
    
    io.emit('updatePixel', { x: data.x, y: data.y, color: data.color, user: data.user });
    fs.writeFile(DATA_FILE, JSON.stringify(pixelData), () => {});
});
