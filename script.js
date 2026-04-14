const socket = io();
let currentUser = null;
const clans = ["🏴‍☠️", "💊", "🔥", "👁️", "🛡️", "⚡", "👾", "👑"];
let selectedEmoji = "";

// ПРОВЕРКА СОХРАНЕНИЯ
window.onload = () => {
    const saved = localStorage.getItem('kgtd_user');
    if (saved) {
        document.getElementById('btn-login').classList.remove('hidden');
        document.getElementById('saved-name').innerText = saved;
        currentUser = saved;
    }
};

function showReg() {
    document.getElementById('auth-initial').classList.add('hidden');
    document.getElementById('auth-reg').classList.remove('hidden');
    
    const grid = document.getElementById('emoji-grid');
    clans.forEach(e => {
        const d = document.createElement('div');
        d.style = "font-size:24px; cursor:pointer; padding:10px; background:#1a1a1a; border-radius:10px;";
        d.innerText = e;
        d.onclick = () => {
            selectedEmoji = e;
            document.querySelectorAll('#emoji-grid div').forEach(el => el.style.border = "none");
            d.style.border = "2px solid #fff";
        };
        grid.appendChild(d);
    });
}

function finishRegistration() {
    const nick = document.getElementById('nick-input').value.trim();
    if (!nick || !selectedEmoji) return alert("Выбери ник и клан!");
    currentUser = `${selectedEmoji} ${nick}`;
    localStorage.setItem('kgtd_user', currentUser);
    enterApp();
}

function fastLogin() {
    enterApp();
}

function enterApp() {
    document.getElementById('screen-auth').classList.add('hidden');
    document.getElementById('my-identity').innerText = currentUser;
}

// ПЕРЕКЛЮЧЕНИЕ СТРАНИЦ
function switchPage(page, el) {
    document.querySelectorAll('nav div').forEach(d => d.classList.remove('active'));
    el.classList.add('active');
    
    document.getElementById('page-feed').classList.add('hidden');
    document.getElementById('page-search').classList.add('hidden');
    document.getElementById('input-wrap').classList.add('hidden');

    if (page === 'feed') {
        document.getElementById('page-feed').classList.remove('hidden');
        document.getElementById('input-wrap').classList.remove('hidden');
        document.getElementById('page-name').innerText = "Лента";
    } else if (page === 'search') {
        document.getElementById('page-search').classList.remove('hidden');
        document.getElementById('page-name').innerText = "Поиск";
    } else if (page === 'clan') {
        document.getElementById('page-name').innerText = "Мой Клан";
        // Здесь можно отфильтровать посты только твоего эмодзи
    }
}

// РАБОТА С ПОСТАМИ
const input = document.getElementById('post-input');
input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && input.value.trim() && currentUser) {
        socket.emit('newPost', { user: currentUser, content: input.value });
        input.value = '';
    }
});

socket.on('updateFeed', (post) => {
    const div = document.createElement('div');
    div.className = 'post';
    div.innerHTML = `<div class="clan-tag">${post.user}</div><div>${post.content}</div>`;
    document.getElementById('posts-list').prepend(div);
});

socket.on('loadPosts', (posts) => {
    document.getElementById('posts-list').innerHTML = '';
    posts.forEach(post => {
        const div = document.createElement('div');
        div.className = 'post';
        div.innerHTML = `<div class="clan-tag">${post.user}</div><div>${post.content}</div>`;
        document.getElementById('posts-list').prepend(div);
    });
});
