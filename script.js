// КОНФИГ И ДАННЫЕ
// Глобальный перехват ошибок (чтобы игра не зависала молча)
window.onerror = function(msg, url, line) {
    console.error("Global Error:", msg, line);
    // alert("Ошибка: " + msg); // Можно включить для отладки
};
// СТАТЫ (v2.1 - Balance & Fixes)
// ОПИСАНИЯ БОЙЦОВ: Редактируй поле 'desc' внутри объекта BRAWLERS ниже.
// Значения ниже - это МАКСИМАЛЬНЫЕ статы (9 уровень). Игра сама пересчитает их в 1 уровень.
// Скорости перезарядки (кадров при 60fps): Fast=48 (0.8s), Norm=72 (1.2s), Slow=93 (1.55s)
// Скорости движения: Slow=4.5, Norm=5.5, Fast=6.5

const BRAWLERS = { 
    shelly: {n:'Shelly', rarity:'starter', desc:'Шелли - идеальный рейнджер. Она ответственная, выносливая и непревзойдённо обращается с ружьём, и ей непонятно, как Кольт перетянул всё внимание на себя..', c:'#a020f0', hp:6764, dmg:315, spd:5.5, rld:72, rng:250, spr:0.3, bul:5, superBul:9, superPush: 0.8, img:'shelly_model.png', ava:'shelly_avatar.png'}, 
    colt: {n:'Colt', rarity:'trophy', desc:'Кольт - настоящая звезда парка Старр! Его стиль, обаяние и трюки с пистолетами покорят любого(за исключением Шелли).', c:'#ff4444', hp:6014, dmg:330, spd:6.5, rld:72, rng:420, spr:0.05, bul:6, superBul:12, img:'colt_model.png', ava:'colt_avatar.png'},
    nita: {n:'Nita', rarity:'trophy', desc:'Нита - совсем малышка, но рвётся в бой с недетской яростью! Её шапка в виде плюшевого мишки как бы намекает: не будите во мне спящего медведя.', c:'#e83e3e', hp:7020, dmg:1300, spd:5.5, rld:48, rng:220, spr:0.05, bul:1, img:'nita_model.png', ava:'nita_avatar.png'},
    spike: {n:'Spike', rarity:'legendary', desc:'Все считают Спайка просто милым помощником Кольта и Шелли на ранчо, и никто не подозревает, какая боль живёт в его израненной душе.', c:'#00ff00', hp:5400, dmg:750, spd:5.5, rld:93, rng:300, spr:0, bul:1, img:'spike_model.png', ava:'spike_avatar.png'},
    mortis: {n:'Mortis', rarity:'mythic', desc:'Мортис мечтал о карьере гробовщика и по совместительству вампира, но его планам помешало то, что в парке Старр никто не умирает.', c:'#550055', hp:8000, dmg:1350, spd:6.5, rld:93, rng:150, spr:0, bul:1, img:'mortis_model.png', ava:'mortis_avatar.png'},
    stu: {n:'Stu', rarity:'epic', desc:'За свою карьеру каскадёра Сту пережил столько ударов и падений и так надышался бензином, что просто удивительно, как он вообще держится на колёсах.', c:'#0088ff', hp:6700, dmg:700, spd:6.0, rld:45, rng:350, spr:0.1, bul:2, img:'stu_model.png', ava:'stu_avatar.png'}
};

// Стоимость улучшения (Монеты, Очки силы)
const UPGRADE_COSTS = [
    {c:0, p:0}, // Lvl 1 (Base)
    {c:10, p:10}, {c:20, p:20}, {c:35, p:30}, {c:75, p:50}, 
    {c:140, p:80}, {c:290, p:130}, {c:480, p:210}, {c:800, p:340} // До 9 уровня
];

// СКИНЫ (Настройки)
const SKINS = {
    default: { n: 'Default', filter: 'none', cost: 0, color: '#fff' },
    gold: { n: 'Gold', filter: 'sepia(1) saturate(3) brightness(1.2)', cost: 500, color: '#ffd700' },
    dark: { n: 'Dark', filter: 'grayscale(1) brightness(0.6) contrast(1.2)', cost: 1000, color: '#333' }
};

// Безопасный парсинг (защита от краша при старте)
const safeParse = (key, def) => {
    try {
        const val = localStorage.getItem(key);
        if (!val || val === 'undefined' || val === 'null') return def;
        return JSON.parse(val);
    } catch (e) {
        console.warn("Сброс битых данных:", key);
        return def;
    }
};

const STATE = { 
    coins: parseInt(localStorage.getItem('bs_coins')) || 100, 
    gems: parseInt(localStorage.getItem('bs_gems')) || 0,
    tokens: parseInt(localStorage.getItem('bs_tokens')) || 0,
    starTokens: parseInt(localStorage.getItem('bs_starTokens')) || 0,
    trophies: parseInt(localStorage.getItem('bs_trophies')) || 0,
    brawlerTrophies: safeParse('bs_brawlerTrophies', {}),
    trClaimed: safeParse('bs_trClaimed', []),
    nickname: localStorage.getItem('bs_nick') || '',
    wildPP: parseInt(localStorage.getItem('bs_wildPP')) || 0, // Дикие очки силы
    unlocked: safeParse('bs_unlocked', ['shelly']), 
    ppToDistribute: 0, // Очки силы для распределения
    powerPoints: safeParse('bs_pp', {}),
    levels: safeParse('bs_levels', {}),
    skins: safeParse('bs_skins', {}),
    curSkin: safeParse('bs_curSkin', {}),
    shop: safeParse('bs_shop', { nextRefresh: 0, items: [] }),
    brawlidaysClaimed: safeParse('bs_brawlidays_claimed', false), // Статус получения
    brawlidaysExpiry: parseInt(localStorage.getItem('bs_brawlidays_expiry')) || 0, // Время окончания акции
    selected: 'shelly', inGame: false 
};
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const screens = { login: document.getElementById('loginScreen'), menu: document.getElementById('menuScreen'), box: document.getElementById('boxScreen'), game: document.getElementById('gameUI'), brawlers: document.getElementById('brawlerSelectScreen'), shop: document.getElementById('shopScreen'), trophyRoad: document.getElementById('trophyRoadScreen'), detail: document.getElementById('brawlerDetailScreen'), news: document.getElementById('newsScreen') };
const ui = { coins: document.getElementById('coinDisplay'), gems: document.getElementById('gemDisplay'), tokens: document.getElementById('tokenDisplay'), starTokens: document.getElementById('starTokenDisplay'), hp: document.getElementById('hpBar'), ammo: document.getElementById('ammoBar'), specialBar: document.getElementById('specialBar'), specialBarCont: document.getElementById('specialBarCont'), superBtn: document.getElementById('superBtn'), alive: document.getElementById('aliveCount'), gameOver: document.getElementById('gameOverMsg'), showdown: document.getElementById('showdownBanner') };

// ЗАЩИТА ДАННЫХ (Исправление битых сохранений)
if (!Array.isArray(STATE.unlocked)) STATE.unlocked = ['shelly'];
if (!Array.isArray(STATE.trClaimed)) STATE.trClaimed = [];

// МИГРАЦИЯ КУБКОВ (Если есть общие, но нет личных)
if (Object.keys(STATE.brawlerTrophies).length === 0 && STATE.trophies > 0) {
    // Записываем все существующие кубки на выбранного бойца (или Шелли по дефолту)
    STATE.brawlerTrophies[STATE.selected] = STATE.trophies;
}

// ПРИНУДИТЕЛЬНОЕ ОБНОВЛЕНИЕ МАГАЗИНА (Для применения новых цен и таймера)
if (!localStorage.getItem('bs_shop_update_v7')) {
    STATE.shop = { nextRefresh: 0, items: [] };
    localStorage.setItem('bs_shop_update_v7', 'true');
    try { generateShopItems(); } catch(e) { console.error(e); } // Генерируем СРАЗУ
    saveGame();
}

// Инициализация нулей для новых бойцов
Object.keys(BRAWLERS).forEach(k => { if (STATE.brawlerTrophies[k] === undefined) STATE.brawlerTrophies[k] = 0; });
// Инициализация скинов
Object.keys(BRAWLERS).forEach(k => { if (!STATE.skins[k]) STATE.skins[k] = ['default']; if (!STATE.curSkin[k]) STATE.curSkin[k] = 'default'; });


// НИКИ БОТОВ
const BOT_NAMES = ["Tomar753", "хочу легу", "дайте эдгара", "путь 50к", "sosy jopy", "[БЛЭТ]Лега", "Читер777", "я нуб ты труп", "твой отчим", "Hyra", "Боец", "ксюша", "димон", "DeMon😈", "[ЖМЫХ]Бан", "Мамут Рахал", "Шовхал", "JuanCarlos", "Hold Dick", "[БЛЭТ]❄️IceSpike❄️", "⛩Rzm|64", "♡zxc◊Blaze♡", "⛩️PLAY4IK🐙⛩️", "Master Smoke", "Potato", "teammate", "♡tOmAtO♡", "Байкер Ворон"];

// ПРЕДЗАГРУЗКА РЕСУРСОВ (Оптимизация памяти и лагов)
const ASSETS = {};
function loadAssets() {
    const list = ['bear_model.png', 'stu_proj.png']; // Добавили поддержку картинки снаряда
    Object.values(BRAWLERS).forEach(b => { if(!list.includes(b.img)) list.push(b.img); });
    list.forEach(src => {
        const img = new Image();
        img.src = src;
        ASSETS[src] = img;
    });
}
loadAssets();

// УПРАВЛЕНИЕ UI
function showScreen(name) {
    Object.values(screens).forEach(s => {
        s.classList.remove('active');
        s.style.display = ''; // Сброс стиля, чтобы экран игры не перекрывал меню
    });
    screens[name].classList.add('active');
    if (name === 'game') { screens.game.style.display = 'block'; startGame(); }
    
    // Музыка
    const menuMusic = document.getElementById('bgMusic');
    const battleMusic = document.getElementById('battleMusic');
    const showdownMusic = document.getElementById('showdownMusic');
    const vicMusic = document.getElementById('victoryMusic')
    const defMusic = document.getElementById('defeatMusic');

    if (name === 'game') {
        menuMusic.pause();
        showdownMusic.pause();
        battleMusic.currentTime = 0;
        battleMusic.play().catch(e => console.log("Play error"));
    } else {
        battleMusic.pause();
        showdownMusic.pause();
        vicMusic.pause(); vicMusic.currentTime = 0;
        defMusic.pause(); defMusic.currentTime = 0;
        if (menuMusic.paused) menuMusic.play().catch(e => console.log("Play error"));
    }
}
function updateMenu() {
    // Пересчет общих кубков
    STATE.trophies = Object.values(STATE.brawlerTrophies).reduce((a, b) => a + b, 0);

    ui.coins.innerText = STATE.coins;
    ui.gems.innerText = STATE.gems;
    ui.tokens.innerText = STATE.tokens;
    ui.starTokens.innerText = STATE.starTokens;
    document.getElementById('trophyDisplay').innerText = STATE.trophies;
    document.getElementById('profileName').innerText = STATE.nickname || 'PLAYER';

    // Обновление героя в лобби
    // ЗАЩИТА: Проверяем существование бойца, если нет - ставим Шелли
    if (!BRAWLERS[STATE.selected]) STATE.selected = 'shelly';

    const b = BRAWLERS[STATE.selected];
    
    // ЗАЩИТА: Проверяем скин, если битый - ставим дефолт
    let skinKey = STATE.curSkin[STATE.selected];
    if (!skinKey || !SKINS[skinKey]) skinKey = 'default';
    
    const skinData = SKINS[skinKey];
    
    document.getElementById('heroImg').src = b.img;
    document.getElementById('heroImg').style.filter = skinData.filter; // Применяем скин в лобби

    // СТУ и СПАЙК: Уменьшаем модельку в лобби, чтобы влезали
    if (STATE.selected === 'stu' || STATE.selected === 'spike') document.getElementById('heroImg').style.transform = 'scale(0.7)';
    else document.getElementById('heroImg').style.transform = 'scale(1)';
    
    document.getElementById('heroTrophies').innerHTML = `<img src="trophy_icon.png" style="width: 20px;"> ${STATE.brawlerTrophies[STATE.selected]}`;
}
function saveGame() { 
    localStorage.setItem('bs_coins', STATE.coins); 
    localStorage.setItem('bs_gems', STATE.gems);
    localStorage.setItem('bs_tokens', STATE.tokens);
    localStorage.setItem('bs_starTokens', STATE.starTokens);
    localStorage.setItem('bs_trophies', STATE.trophies);
    localStorage.setItem('bs_brawlerTrophies', JSON.stringify(STATE.brawlerTrophies));
    localStorage.setItem('bs_trClaimed', JSON.stringify(STATE.trClaimed));
    localStorage.setItem('bs_nick', STATE.nickname);
    localStorage.setItem('bs_wildPP', STATE.wildPP);
    localStorage.setItem('bs_unlocked', JSON.stringify(STATE.unlocked));
    localStorage.setItem('bs_pp', JSON.stringify(STATE.powerPoints));
    localStorage.setItem('bs_levels', JSON.stringify(STATE.levels));
    localStorage.setItem('bs_skins', JSON.stringify(STATE.skins));
    localStorage.setItem('bs_curSkin', JSON.stringify(STATE.curSkin));
    localStorage.setItem('bs_shop', JSON.stringify(STATE.shop));
    localStorage.setItem('bs_brawlidays_claimed', JSON.stringify(STATE.brawlidaysClaimed));
    localStorage.setItem('bs_brawlidays_expiry', STATE.brawlidaysExpiry);
}
// Надежное сохранение для мобильных и ПК (при закрытии/сворачивании)
window.addEventListener('pagehide', saveGame);
window.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') saveGame(); });
window.addEventListener('beforeunload', saveGame);

// БОНУС: 1000 ГЕМОВ ВСЕМ (Единоразово)
if (!localStorage.getItem('bs_bonus_1k_gems')) {
    STATE.gems += 1000;
    localStorage.setItem('bs_bonus_1k_gems', 'true');
    saveGame();
    setTimeout(() => alert("🎁 В ЧЕСТЬ ОБНОВЛЕНИЯ ВАМ НАЧИСЛЕНО 1000 ГЕМОВ!"), 1000);
}

// ЛОГИН
document.getElementById('loginScreen').addEventListener('click', (e) => {
    try {
        // Если клик был по форме или инпуту - не перехватываем
        if (e.target.closest('#loginForm')) return;
        // Если форма открыта - игнорируем клики по фону
        if (!document.getElementById('loginForm').classList.contains('hidden')) return; 

        if (STATE.nickname) {
            showScreen('menu');
            updateMenu();
        } else {
            document.getElementById('tapToPlay').classList.add('hidden');
            document.getElementById('loginForm').classList.remove('hidden');
        }
    } catch (err) {
        console.error("Ошибка входа:", err);
        // Аварийный вход в меню, если что-то сломалось
        showScreen('menu');
    }
});
document.getElementById('confirmLoginBtn').addEventListener('click', () => {
    const nick = document.getElementById('nicknameInput').value;
    if (nick.length > 0) {
        STATE.nickname = nick;
        saveGame();
        showScreen('menu');
        updateMenu();
    } else {
        alert("Введите имя!");
    }
});

// Кнопки меню и магазина
document.getElementById('brawlBoxBtn').addEventListener('click', () => {
    if (STATE.tokens >= 20) { STATE.tokens -= 20; saveGame(); updateMenu(); showScreen('box'); openBox('small'); } else alert('Нужно 20 токенов!');
});
document.getElementById('bigBoxBtn').addEventListener('click', () => {
    if (STATE.starTokens >= 5) { STATE.starTokens -= 5; saveGame(); updateMenu(); showScreen('box'); openBox('big'); } else alert('Нужно 5 зв. токенов!');
});
// --- ВОЗВРАЩЕННЫЕ КНОПКИ МАГАЗИНА ---
document.getElementById('megaBoxBtn').addEventListener('click', () => {
    if (STATE.gems >= 80) { STATE.gems -= 80; saveGame(); updateMenu(); showScreen('box'); openBox('mega'); } else alert('Нужно 80 гемов!');
});
document.getElementById('buyCoinsBtn').addEventListener('click', () => {
    if (STATE.gems >= 10) { 
        STATE.gems -= 10; STATE.coins += 150; 
        saveGame(); updateMenu(); alert("Вы купили 150 монет!"); 
    } else alert('Нужно 10 гемов!');
});
document.getElementById('buyPpBtn').addEventListener('click', () => {
    if (STATE.gems >= 25) {
        STATE.gems -= 25;
        STATE.ppToDistribute = 250; saveGame(); updateMenu();
        renderBrawlersList(); showScreen('brawlers'); // Перекидываем на выбор бойца
    } else alert('Нужно 25 гемов!');
});
// Кнопка BRAWLIDAYS
document.getElementById('brawlidaysBtn').addEventListener('click', () => {
    if (STATE.brawlidaysClaimed) return;
    STATE.coins += 1500;
    STATE.brawlidaysClaimed = true;
    saveGame(); updateMenu(); renderShop(); alert("🎁 ВЫ ПОЛУЧИЛИ 1500 МОНЕТ!");
});
// -------------------------------------
document.getElementById('backToMenuBtn').addEventListener('click', () => showScreen('menu'));
document.getElementById('playBtn').addEventListener('click', () => showScreen('game'));
document.getElementById('shopBtn').addEventListener('click', () => {
    try {
        checkShopRefresh();
        renderShop();
    } catch (e) {
        console.warn("Ошибка магазина, сброс данных...", e);
        STATE.shop = { nextRefresh: 0, items: [] }; // Полный сброс магазина
        saveGame();
        try { checkShopRefresh(); renderShop(); } catch(e2) {}
    }
    // Открываем экран в любом случае, даже если рендер сбойнул (будет пустой, но откроется)
    showScreen('shop');
});
document.getElementById('brawlersBtn').addEventListener('click', () => {
    renderBrawlersList();
    showScreen('brawlers');
});
document.getElementById('trophyBtn').addEventListener('click', () => {
    renderTrophyRoad();
    showScreen('trophyRoad');
});

// Новости
document.querySelector('.news-btn').addEventListener('click', () => {
    renderNews('latest'); // Загружаем свежие новости
    showScreen('news');
});
// Нажатие на героя в лобби
document.querySelector('.hero-display').addEventListener('click', () => {
    renderBrawlersList();
    showScreen('brawlers');
});

// Список бойцов
function renderBrawlersList() {
    // Если мы в режиме распределения очков, меняем заголовок
    const title = document.querySelector('#brawlerSelectScreen h2');
    if (STATE.ppToDistribute > 0) title.innerText = `КОМУ НАЧИСЛИТЬ ${STATE.ppToDistribute} PP?`;
    else title.innerText = "ВЫБОР БОЙЦА";

    const list = document.getElementById('brawlersList');
    list.innerHTML = '';
    Object.keys(BRAWLERS).forEach(key => {
        // Инициализация уровня и очков если нет
        if (!STATE.levels[key]) STATE.levels[key] = 1;
        if (!STATE.powerPoints[key]) STATE.powerPoints[key] = 0;
        if (STATE.brawlerTrophies[key] === undefined) STATE.brawlerTrophies[key] = 0;

        const b = BRAWLERS[key];
        const isUnlocked = STATE.unlocked.includes(key);
        const el = document.createElement('div');
        // Добавляем защиту от кликов по закрытым бойцам визуально
        el.className = `brawler-item ${b.rarity} ${isUnlocked ? '' : 'locked'}`;
        el.innerHTML = `<img src="${b.ava}" class="brawler-avatar"><div>${b.n}</div><div class="brawler-trophies"><img src="trophy_icon.png" style="width:10px"> ${STATE.brawlerTrophies[key]}</div><div style="font-size:12px">Lvl ${STATE.levels[key]}</div>`;
        
        el.onclick = () => {
            try {
                if (!isUnlocked) {
                    alert("Этот боец еще не разблокирован! Ищите его в ящиках.");
                    return;
                }
                    if (STATE.ppToDistribute > 0) {
                        if ((STATE.levels[key] || 1) >= 9) {
                            alert("Этот боец уже максимального уровня!");
                        } else {
                            STATE.powerPoints[key] += STATE.ppToDistribute;
                            alert(`Начислено ${STATE.ppToDistribute} очков силы бойцу ${b.n}!`);
                            STATE.ppToDistribute = 0;
                            saveGame(); updateMenu(); renderBrawlersList();
                        }
                    } else {
                        showBrawlerDetails(key);
                    }
            } catch (e) {
                console.error("Ошибка выбора бойца:", e);
                alert("Сбой выбора: " + e.message);
            }
        };
        list.appendChild(el);
    });
}

function showBrawlerDetails(key) {
    try {
    const b = BRAWLERS[key];
    const lvl = STATE.levels[key] || 1;
    const pp = STATE.powerPoints[key] || 0;
    const tr = STATE.brawlerTrophies[key] || 0;
    // ЗАЩИТА: Если скин записан криво, берем дефолтный
    const currentSkin = (STATE.curSkin[key] && SKINS[STATE.curSkin[key]]) ? STATE.curSkin[key] : 'default';
    
    // Расчет статов: База = Макс / (1 + 8*Pct). Текущий = База * (1 + (Lvl-1)*Pct)
    // HP Pct = 0.07, Dmg Pct = 0.05
    const baseHp = b.hp / (1 + 8 * 0.07);
    const baseDmg = b.dmg / (1 + 8 * 0.05);
    
    const curHp = Math.floor(baseHp * (1 + (lvl - 1) * 0.07));
    const curDmg = Math.floor(baseDmg * (1 + (lvl - 1) * 0.05));
    
    document.getElementById('detailName').innerText = b.n;
    document.getElementById('detailRarity').innerText = b.rarity.toUpperCase();
    document.getElementById('detailRarity').className = b.rarity; // Для цвета можно добавить CSS
    document.getElementById('detailLevel').innerText = lvl;
    document.getElementById('detailTrophies').innerText = tr;
    document.getElementById('detailDesc').innerText = b.desc || "Нет описания.";
    
    document.getElementById('detailHp').innerText = curHp;
    document.getElementById('detailDmg').innerText = curDmg;
    
    let superDesc = "Урон от супера";
    if (key === 'shelly') superDesc = "Урон: 400 x 9";
    else if (key === 'colt') superDesc = "Урон: 330 x 12";
    else if (key === 'nita') superDesc = "Урон: " + Math.floor(600 * (1 + (lvl - 1) * 0.05)); // Урон медведя
    else if (key === 'spike') superDesc = "Урон: 261 / сек";
    else if (key === 'mortis') superDesc = "Урон: 1350";
    else if (key === 'stu') superDesc = "Урон: 150 x 6";
    document.getElementById('detailSuper').innerText = superDesc;
    document.getElementById('detailSpd').innerText = b.spd > 6 ? "Fast" : (b.spd < 5 ? "Slow" : "Norm");
    document.getElementById('detailRld').innerText = b.rld < 60 ? "Fast" : (b.rld > 80 ? "Slow" : "Norm");
    document.getElementById('detailImg').src = b.img;
    document.getElementById('detailImg').style.filter = (SKINS[currentSkin] || SKINS.default).filter; // Показываем текущий скин

    // Рендер кнопок скинов
    const skinCont = document.getElementById('skinSelector');
    if (skinCont) {
        skinCont.innerHTML = '';
        Object.keys(SKINS).forEach(sKey => {
            const sData = SKINS[sKey];
            const owned = STATE.skins[key].includes(sKey);
            const btn = document.createElement('div');
            btn.className = `skin-btn ${currentSkin === sKey ? 'selected' : ''} ${!owned ? 'locked' : ''}`;
            btn.style.backgroundColor = sData.color;
            
            btn.onclick = () => {
                if (owned) {
                    STATE.curSkin[key] = sKey;
                    saveGame(); showBrawlerDetails(key); updateMenu();
                } else {
                    if (confirm(`Купить скин "${sData.n}" за ${sData.cost} монет?`)) {
                        if (STATE.coins >= sData.cost) {
                            STATE.coins -= sData.cost;
                            STATE.skins[key].push(sKey);
                            STATE.curSkin[key] = sKey;
                            saveGame(); showBrawlerDetails(key); updateMenu(); alert("Скин куплен!");
                        } else alert("Не хватает монет!");
                    }
                }
            };
            skinCont.appendChild(btn);
        });
    }

    // Кнопка Инфо для Ниты
    const infoBtn = document.getElementById('detailInfoBtn');
    if (infoBtn) { // Защита от ошибки, если кнопки нет
        if (key === 'nita') {
            infoBtn.classList.remove('hidden');
            infoBtn.onclick = () => document.getElementById('bearModal').classList.remove('hidden');
        } else {
            infoBtn.classList.add('hidden');
        }
    }

    // Логика улучшения
    const nextLvl = lvl + 1;
    const cost = UPGRADE_COSTS[lvl]; // Индекс совпадает, т.к. массив с 0 (lvl 1 cost at index 1)
    const ppBar = document.getElementById('ppBarFill');
    const ppText = document.getElementById('ppText');
    const upgBtn = document.getElementById('upgradeBtn');
    const selectBtn = document.getElementById('selectBrawlerBtn');
    const givePpBtn = document.getElementById('givePpBtn');

    if (lvl >= 9) {
        ppBar.style.width = '100%'; ppText.innerText = 'MAX';
        upgBtn.style.display = 'none';
    } else {
        const needed = cost.p;
        const pct = Math.min(100, (pp / needed) * 100);
        ppBar.style.width = `${pct}%`;
        ppText.innerText = `${pp}/${needed}`;
        document.getElementById('upgradeCost').innerText = cost.c;
        
        upgBtn.style.display = 'flex';
        upgBtn.onclick = () => {
            if (pp >= needed && STATE.coins >= cost.c) {
                STATE.powerPoints[key] -= needed;
                STATE.coins -= cost.c;
                STATE.levels[key]++;
                saveGame();
                showBrawlerDetails(key); // Обновить
            } else {
                alert("Недостаточно монет или очков силы!");
            }
        };
    }
    
    // Режим выдачи очков силы
    if (STATE.ppToDistribute > 0) {
        selectBtn.style.display = 'none';
        givePpBtn.style.display = 'block';
        givePpBtn.innerText = `ВЫДАТЬ ${STATE.ppToDistribute} PP`;
        givePpBtn.onclick = () => {
            STATE.powerPoints[key] = (STATE.powerPoints[key] || 0) + STATE.ppToDistribute;
            alert(`Начислено ${STATE.ppToDistribute} очков силы бойцу ${b.n}!`);
            STATE.ppToDistribute = 0; // Сброс режима
            saveGame(); updateMenu(); renderBrawlersList(); showScreen('brawlers');
        };
    } else {
        selectBtn.style.display = 'block';
        givePpBtn.style.display = 'none';
        selectBtn.onclick = () => { STATE.selected = key; updateMenu(); showScreen('menu'); };
    }

    showScreen('detail');
    } catch (e) {
        console.error("Error showing details:", e);
        alert("Ошибка меню бойца: " + e.message);
    }
}

function openBox(type) {
    const res = document.getElementById('boxResult');
    const title = document.getElementById('boxTitle');
    let coins = 0, gems = 0, ppDrops = [];
    let brawlerDrop = null;

    // Шансы (в процентах)
    const chances = {
        epic: { small: 14.12, big: 28.34, mega: 42.22 },
        mythic: { small: 9.11, big: 24.32, mega: 37.32 },
        legendary: { small: 3.98, big: 18.23, mega: 28.29 }
    };

    // Функция ролла бойца
    const tryRollBrawler = (boxType) => {
        const locked = Object.keys(BRAWLERS).filter(b => !STATE.unlocked.includes(b) && BRAWLERS[b].rarity !== 'starter' && BRAWLERS[b].rarity !== 'trophy');
        if (locked.length === 0) return null;

        let r = Math.random() * 100;
        let rarity = null;
        // Проверка от леги к эпику
        if (r < chances.legendary[boxType]) rarity = 'legendary';
        else if (r < chances.mythic[boxType]) rarity = 'mythic';
        else if (r < chances.epic[boxType]) rarity = 'epic';

        if (rarity) {
            const pool = locked.filter(k => BRAWLERS[k].rarity === rarity);
            if (pool.length > 0) return pool[Math.floor(Math.random() * pool.length)];
        }
        return null;
    };

    // Функция получения уникальных бойцов для очков силы (не макс лвл)
    const getPPDropsList = (count) => {
        // Берем только тех, кто не 9 уровня
        let list = STATE.unlocked.filter(k => (STATE.levels[k] || 1) < 9);
        list.sort(() => Math.random() - 0.5); // Перемешиваем
        return list.slice(0, count); // Берем первые count штук
    };

    if (type === 'small') {
        title.innerText = "ЯЩИК";
        // Маленький ящик: ИЛИ боец, ИЛИ ресурсы
        const newBrawler = tryRollBrawler('small');

        if (newBrawler) {
            brawlerDrop = BRAWLERS[newBrawler];
            STATE.unlocked.push(newBrawler);
        } else {
            coins = Math.floor(Math.random() * 40) + 20; // Больше монет (было 10-35)
            // Очки силы на 2 бойцов
            const targets = getPPDropsList(2);
            targets.forEach(b => {
                let amt = Math.floor(Math.random() * 10) + 10;
                ppDrops.push({n: BRAWLERS[b].n, a: amt});
                STATE.powerPoints[b] = (STATE.powerPoints[b] || 0) + amt;
            });
            if (Math.random() < 0.33) gems = Math.floor(Math.random() * 3) + 1; // Шанс 33%
        }
    } else {
        // Большой и Мега: Ресурсы + Шанс бойца
        const isMega = type === 'mega';
        title.innerText = isMega ? "МЕГАЯЩИК" : "БОЛЬШОЙ ЯЩИК";
        coins = isMega ? Math.floor(Math.random() * 150) + 100 : Math.floor(Math.random() * 60) + 40; // Больше монет
        
        // Очки силы (3 бойца)
        const targets = getPPDropsList(3);
        targets.forEach(b => {
            let amt = isMega ? Math.floor(Math.random() * 50) + 30 : Math.floor(Math.random() * 25) + 15;
            ppDrops.push({n: BRAWLERS[b].n, a: amt});
            STATE.powerPoints[b] = (STATE.powerPoints[b] || 0) + amt;
        });
        // Мегаящик: 100% шанс гемов (5-15). Большой: 50% шанс (3-9).
        if (isMega || Math.random() < 0.5) gems = isMega ? (Math.floor(Math.random() * 11) + 5) : (Math.floor(Math.random() * 7) + 3);

        const newBrawler = tryRollBrawler(type);
        if (newBrawler) {
            brawlerDrop = BRAWLERS[newBrawler];
            STATE.unlocked.push(newBrawler);
        }
    }

    STATE.coins += coins; STATE.gems += gems;
    saveGame();

    if (brawlerDrop) {
        res.innerHTML = `НОВЫЙ БОЕЦ:<br><span style="color:${brawlerDrop.c}; font-size:30px">${brawlerDrop.n}</span>`;
        if (coins > 0) res.innerHTML += `<br>+${coins} 💰`;
    } else {
        let ppStr = ppDrops.map(p => `+${p.a} PP ${p.n}`).join('<br>');
        let gemStr = gems > 0 ? `<br>+${gems} 💎` : '';
        res.innerHTML = `+${coins} 💰<br>${ppStr}${gemStr}`;
    }
    updateMenu();
}

// ЛОГИКА МАГАЗИНА
function checkShopRefresh() {
    const now = Date.now();
    try {
        // Если таймера нет или время вышло - обновляем
        if (!STATE.shop.nextRefresh || isNaN(STATE.shop.nextRefresh) || now > STATE.shop.nextRefresh) {
            generateShopItems();
            STATE.shop.nextRefresh = now + (3 * 60 * 60 * 1000); // +3 часа
            saveGame();
        }
    } catch (e) {
        console.error("Shop refresh error:", e);
        STATE.shop.nextRefresh = now + (1 * 60 * 60 * 1000); // Аварийный таймер на 1 час, чтобы не висело на 0
        saveGame();
    }
}

function generateShopItems() {
    // Берем только существующих бойцов (защита от багов сохранения)
    let pool = STATE.unlocked.filter(k => BRAWLERS[k]);
    if (pool.length === 0) pool = ['shelly'];

    const items = [];
    
    // 1. Подарок (Слот 1)
    const r = Math.random();
    if (r < 0.4) items.push({ type: 'gift_coins', val: Math.floor(Math.random()*40)+10, cost: 0, bought: false });
    else if (r < 0.8) {
        // Ищем бойца не макс уровня для подарка
        const giftPool = pool.filter(k => (STATE.levels[k] || 1) <= 9); // Разрешаем макс лвл
        if (giftPool.length > 0) {
            const b = giftPool[Math.floor(Math.random()*giftPool.length)];
            items.push({ type: 'gift_pp', val: Math.floor(Math.random()*15)+5, brawler: b, cost: 0, bought: false });
        } else {
            items.push({ type: 'gift_coins', val: 25, cost: 0, bought: false }); // Если все макс, даем монеты
        }
    }
    else items.push({ type: 'gift_box', val: 'small', cost: 0, bought: false });

    // 2. Мегаящик по акции (Слот 2)
    items.push({ type: 'mega_offer', val: 'mega', cost: 60, oldCost: 80, bought: false });

    // 3. Очки силы (Слоты 3-6)
    // Берем уникальных бойцов не макс уровня
    const ppPool = pool.filter(k => (STATE.levels[k] || 1) <= 9); // Разрешаем макс лвл, чтобы магазин не был пустым
    ppPool.sort(() => Math.random() - 0.5); // Перемешиваем

    for(let i=0; i<4; i++) {
        if (i >= ppPool.length) break; // Если бойцов не хватает, слотов будет меньше
        const b = ppPool[i];
        const amt = Math.floor(Math.random() * 40) + 10; // 10-50 PP
        const price = Math.ceil(amt * 1.5); // Цена ~1.5 монеты за 1 PP (Выгоднее)
        items.push({ type: 'pp_deal', brawler: b, val: amt, cost: price, bought: false });
    }
    
    STATE.shop.items = items;
}

function renderShop() {
    // ЗАЩИТА: Если товаров нет или произошел сбой сохранения, генерируем заново
    if (!STATE.shop.items || !Array.isArray(STATE.shop.items) || STATE.shop.items.length === 0) {
        generateShopItems();
    }

    // Логика отображения BRAWLIDAYS
    const brawlSection = document.getElementById('brawlidaysSection');
    const now = Date.now();
    
    if (STATE.brawlidaysClaimed || now > STATE.brawlidaysExpiry) {
        brawlSection.style.display = 'none';
    } else {
        brawlSection.style.display = 'flex';
        brawlSection.style.flexDirection = 'column';
        brawlSection.style.alignItems = 'center';
        brawlSection.style.justifyContent = 'center';
        brawlSection.style.marginRight = '80px'; // Отступ от акций
    }

    const grid = document.getElementById('dailyDealsGrid');
    grid.innerHTML = '';
    
    STATE.shop.items.forEach((item, idx) => {
        // Защита от битых товаров
        if (!item || !item.type) return;

        const el = document.createElement('div');
        el.className = `shop-card ${item.bought ? 'purchased' : ''}`;
        
        // Стилизация по типу
        if (item.type.startsWith('gift')) el.classList.add('gift');
        else if (item.type === 'mega_offer') el.classList.add('mega');
        else el.classList.add('pp');

        let content = '';
        let priceHtml = '';

        // Контент карточки
        if (item.type === 'gift_coins') {
            content = `<div class="card-title">ПОДАРОК</div><img src="coin_icon.png" class="card-icon"><div>${item.val} МОНЕТ</div>`;
            priceHtml = `<span class="free-lbl">БЕСПЛАТНО</span>`;
        } else if (item.type === 'gift_pp') {
            if (!BRAWLERS[item.brawler]) return; // Защита от ошибок
            content = `<div class="card-title">ПОДАРОК</div>
                       <img src="${BRAWLERS[item.brawler].ava}" class="card-brawler-icon">
                       <div class="pp-amount-box">+${item.val} <img src="pp_icon.png" style="width:12px"></div>`;
            priceHtml = `<span class="free-lbl">БЕСПЛАТНО</span>`;
        } else if (item.type === 'gift_box') {
            content = `<div class="card-title">ПОДАРОК</div><img src="brawl_box.png" class="card-icon"><div>ЯЩИК</div>`;
            priceHtml = `<span class="free-lbl">БЕСПЛАТНО</span>`;
        } else if (item.type === 'mega_offer') {
            content = `<div class="card-title">АКЦИЯ</div><img src="mega_box.png" class="card-icon"><div>МЕГАЯЩИК</div>`;
            priceHtml = `<span class="old-price">${item.oldCost}</span> ${item.cost} <img src="gem_icon.png" class="tiny-icon">`;
        } else if (item.type === 'pp_deal') {
            if (!BRAWLERS[item.brawler]) return; // Защита от ошибок
            content = `<div class="card-title">СИЛА</div>
                       <img src="${BRAWLERS[item.brawler].ava}" class="card-brawler-icon">
                       <div class="pp-amount-box">+${item.val} <img src="pp_icon.png" style="width:12px"></div>`;
            priceHtml = `${item.cost} <img src="coin_icon.png" class="tiny-icon">`;
        }

        el.innerHTML = `${content}<div class="card-price">${priceHtml}</div>`;
        
        if (!item.bought) {
            el.onclick = () => buyShopItem(idx);
        }
        grid.appendChild(el);
    });
}

function buyShopItem(idx) {
    const item = STATE.shop.items[idx];
    if (item.bought) return;

    let success = false;

    if (item.cost === 0) { // Подарок
        success = true;
    } else if (item.type === 'mega_offer') { // За гемы
        if (STATE.gems >= item.cost) { STATE.gems -= item.cost; success = true; }
        else alert("Не хватает гемов!");
    } else { // За монеты
        if (STATE.coins >= item.cost) { STATE.coins -= item.cost; success = true; }
        else alert("Не хватает монет!");
    }

    if (success) {
        item.bought = true;
        // Выдача награды
        if (item.type === 'gift_coins') STATE.coins += item.val;
        else if (item.type === 'gift_pp' || item.type === 'pp_deal') {
            STATE.powerPoints[item.brawler] = (STATE.powerPoints[item.brawler] || 0) + item.val;
        }
        else if (item.type === 'gift_box') { showScreen('box'); openBox('small'); }
        else if (item.type === 'mega_offer') { showScreen('box'); openBox('mega'); }

        saveGame(); updateMenu(); renderShop();
    }
}

// Таймер магазина
setInterval(() => {
    if (document.getElementById('shopScreen').classList.contains('active')) {
        let diff = STATE.shop.nextRefresh - Date.now();
        if (diff <= 0) { checkShopRefresh(); renderShop(); diff = 0; }
        let h = Math.floor(diff / 3600000);
        let m = Math.floor((diff % 3600000) / 60000);
        let s = Math.floor((diff % 60000) / 1000);
        document.getElementById('shopTimer').innerText = `Новые акции через: ${h}:${m<10?'0'+m:m}:${s<10?'0'+s:s}`;
    }
    // Таймер Brawlidays
    if (!STATE.brawlidaysClaimed && STATE.brawlidaysExpiry > Date.now()) {
        let diff = STATE.brawlidaysExpiry - Date.now();
        let h = Math.floor(diff / 3600000);
        let m = Math.floor((diff % 3600000) / 60000);
        document.getElementById('brawlidaysTimer').innerText = `Осталось: ${h}ч ${m}м`;
    }
}, 1000);

window.returnToMenu = function() {
    showScreen('menu');
    // Полная остановка боевой музыки
    document.getElementById('battleMusic').pause(); document.getElementById('battleMusic').currentTime = 0;
    document.getElementById('showdownMusic').pause(); document.getElementById('showdownMusic').currentTime = 0;
    document.getElementById('victoryMusic').pause(); document.getElementById('victoryMusic').currentTime = 0;
    document.getElementById('defeatMusic').pause(); document.getElementById('defeatMusic').currentTime = 0;
    
    STATE.inGame = false;
    updateMenu();
}

// ДОРОГА СЛАВЫ ЛОГИКА
const TROPHY_ROAD = [
    { t: 15, type: 'coins', val: 100, img: 'coin_icon.png', label: '100 монет' },
    { t: 30, type: 'brawler', val: 'nita', img: 'nita_avatar.png', label: 'Нита' },
    { t: 100, type: 'pp', val: 25, img: 'pp_icon.png', label: '25 очков силы' },
    { t: 250, type: 'box', val: 'big', img: 'big_box.png', label: 'Большой' },
    { t: 300, type: 'brawler', val: 'colt', img: 'colt_avatar.png', label: 'Кольт' },
    { t: 500, type: 'pp', val: 50, img: 'pp_icon.png', label: '50 очков силы' },
    { t: 1000, type: 'coins', val: 200, img: 'coin_icon.png', label: '200 монет' },
    { t: 2000, type: 'box', val: 'mega', img: 'mega_box.png', label: 'Мегаящик' },
    { t: 5000, type: 'gems', val: 50, img: 'gem_icon.png', label: '50 гемов' }
];

function renderTrophyRoad() {
    const list = document.getElementById('trophyRoadList');
    list.innerHTML = '';
    TROPHY_ROAD.forEach((item, idx) => {
        const claimed = STATE.trClaimed.includes(idx);
        const canClaim = STATE.trophies >= item.t && !claimed;
        
        const el = document.createElement('div');
        el.className = `road-milestone ${claimed ? 'claimed' : ''} ${canClaim ? 'active' : ''}`;
        el.innerHTML = `
            <div class="milestone-trophies">${item.t} <img src="trophy_icon.png" style="width: 24px; vertical-align: middle;"></div>
            <div class="milestone-reward"><img src="${item.img}"></div>
            <div style="font-size:12px; font-weight:bold;">${item.label}</div>
            <button class="claim-btn" ${canClaim ? '' : 'disabled'}>${claimed ? 'V' : 'Забрать'}</button>
        `;
        if (canClaim) {
            el.querySelector('button').onclick = () => {
                STATE.trClaimed.push(idx);
                if(item.type === 'box') { showScreen('box'); openBox(item.val); }
                else if(item.type === 'brawler') { STATE.unlocked.push(item.val); alert(`ВЫ ПОЛУЧИЛИ БОЙЦА: ${BRAWLERS[item.val].n}!`); }
                else if(item.type === 'coins') STATE.coins += item.val;
                else if(item.type === 'gems') STATE.gems += item.val;
                else if(item.type === 'pp') { STATE.ppToDistribute = item.val; renderBrawlersList(); showScreen('brawlers'); }
                saveGame(); updateMenu(); renderTrophyRoad();
            };
        }
        list.appendChild(el);
    });
}

// Запуск музыки при первом клике (политика браузеров)
window.addEventListener('click', () => {
    const music = document.getElementById('bgMusic');
    if (music.paused && !STATE.inGame) music.play();
}, { once: true });
window.addEventListener('click', () => { if(STATE.inGame && G.p && G.p.t === 'mortis') G.p.lastAttackTime = Date.now() - 3000; }, {once:true}); // Хак для теста мортиса

// ИГРОВОЙ ДВИЖОК
let G = { p: null, bul: [], en: [], cubes: [], walls: [], bushes: [], boxes: [], floatTexts: [], zones: [], w: 2200, h: 2200, cam: {x:0, y:0}, zone: 3200, showdown: false, frame: 0 };
let gameLoopId = null; // ID для контроля цикла игры
const ZOOM = 0.75; // Отдаление камеры
const keys = {};
const mouse = { x: 0, y: 0, down: false };
window.addEventListener('keydown', e => keys[e.code] = true);
window.addEventListener('keyup', e => keys[e.code] = false);
window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
// АВТОАТАКА НА ПК (Q)
window.addEventListener('keydown', e => {
    if (e.code === 'KeyQ' && G.p && !G.p.dead) {
        const target = getAutoAimTarget(G.p);
        if (target) G.p.shoot(target.x, target.y);
        else G.p.shoot(G.p.x + (G.p.lastDx||1)*100, G.p.y + (G.p.lastDy||0)*100);
    }
});

// ОБНОВЛЕННОЕ УПРАВЛЕНИЕ МЫШЬЮ (ПК)
window.addEventListener('mousedown', (e) => {
    if (e.button === 0) { // ЛКМ
        if (G.p && !G.p.dead && G.p.isSuperAiming) {
            // Если активен прицел Супера - стреляем Супером
            G.p.super((mouse.x / ZOOM) + G.cam.x, (mouse.y / ZOOM) + G.cam.y);
            G.p.isSuperAiming = false; // Выключаем режим супера
        } else {
            mouse.down = true; // Обычная стрельба
        }
    } else if (e.button === 1) { // КОЛЕСИКО (Средняя кнопка)
        e.preventDefault(); // Чтобы не скроллило
        if (G.p && !G.p.dead) {
            // Автоатака
            const target = getAutoAimTarget(G.p);
            if (target) G.p.shoot(target.x, target.y);
            else G.p.shoot(G.p.x + (G.p.lastDx||1)*100, G.p.y + (G.p.lastDy||0)*100);
        }
    } else if (e.button === 2) { // ПКМ
        // Переключение режима Супера
        if (G.p && !G.p.dead && G.p.sup >= 100) {
            G.p.isSuperAiming = !G.p.isSuperAiming;
        }
    }
});
window.addEventListener('mouseup', () => mouse.down = false);
window.addEventListener('resize', () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; });
// Отключаем контекстное меню (для мобилок)
window.addEventListener('contextmenu', e => { e.preventDefault(); return false; });

// МОБИЛЬНОЕ УПРАВЛЕНИЕ
const mobileControls = {
    move: { x: 0, y: 0, active: false, id: null, wasMoved: false },
    aim: { x: 0, y: 0, active: false, id: null, wasMoved: false },
    super: { x: 0, y: 0, active: false, id: null, wasMoved: false }
};
let isMobile = false; // Флаг мобильного устройства
window.addEventListener('touchstart', () => isMobile = true, {once:true}); // Определяем тач-устройство при первом касании

function setupJoystick(zoneId, knobId, type) {
    const zone = document.getElementById(zoneId);
    const knob = knobId ? document.getElementById(knobId) : null; // knob может не быть (для супера)
    let startX, startY;

    zone.addEventListener('touchstart', e => {
        e.preventDefault();
        // Ищем свободный палец (новый)
        const touch = e.changedTouches[0];
        
        // Если этот контрол уже занят, игнорируем
        if (mobileControls[type].active) return;

        mobileControls[type].id = touch.identifier; // Запоминаем ID пальца
        mobileControls[type].active = true;
        mobileControls[type].wasMoved = false; // Сброс флага движения
        startX = touch.clientX;
        startY = touch.clientY;
        
        if (type === 'super') G.p.isSuperAiming = true; // Включаем желтый прицел
    }, {passive: false});

    zone.addEventListener('touchmove', e => {
        e.preventDefault();
        if (!mobileControls[type].active) return;
        
        // Ищем наш палец по ID
        let touch = null;
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === mobileControls[type].id) {
                touch = e.changedTouches[i];
                break;
            }
        }
        if (!touch) return; // Это не наш палец

        let dx = touch.clientX - startX;
        let dy = touch.clientY - startY;
        const dist = Math.hypot(dx, dy);
        const maxDist = type === 'super' ? 40 : 35; // Радиус джойстика

        // Если сдвинули палец достаточно далеко, считаем это прицеливанием
        if (dist > 5) mobileControls[type].wasMoved = true;

        if (dist > maxDist) {
            dx = (dx / dist) * maxDist;
            dy = (dy / dist) * maxDist;
        }

        if (knob) knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
        else zone.style.transform = `translate(${dx}px, ${dy}px)`; // Двигаем саму кнопку (для супера)

        // Нормализуем вектор (-1 до 1)
        const normX = dx / maxDist;
        const normY = dy / maxDist;

        if (type === 'move') {
            mobileControls.move.x = normX;
            mobileControls.move.y = normY;
        } else {
            // Aim или Super
            mobileControls[type].x = normX;
            mobileControls[type].y = normY;
            
            // Обновляем "мышь" для прицеливания
            if (G.p) {
                mouse.x = (G.p.x + normX * 300 - G.cam.x) * ZOOM;
                mouse.y = (G.p.y + normY * 300 - G.cam.y) * ZOOM;
            }
        }
    }, {passive: false});

    const handleEnd = (e) => {
        e.preventDefault();
        
        // Проверяем, наш ли палец отпустили
        let touchFound = false;
        for (let i = 0; i < e.changedTouches.length; i++) {
            if (e.changedTouches[i].identifier === mobileControls[type].id) {
                touchFound = true;
                break;
            }
        }
        if (!touchFound) return;

        if (knob) knob.style.transform = `translate(-50%, -50%)`;
        else zone.style.transform = `translate(0px, 0px)`;

        const wasMoved = mobileControls[type].wasMoved;
        mobileControls[type].active = false;
        mobileControls[type].id = null;

        if (type === 'move') {
            mobileControls.move.x = 0; mobileControls.move.y = 0;
        } else if (type === 'aim') {
            // Выстрел при отпускании
            if (G.p && !G.p.dead) {
                if (wasMoved) {
                    // Ручное прицеливание
                    G.p.shoot((mouse.x / ZOOM) + G.cam.x, (mouse.y / ZOOM) + G.cam.y);
                } else {
                    // Автоатака (Тап)
                    const target = getAutoAimTarget(G.p);
                    if (target) G.p.shoot(target.x, target.y);
                    else G.p.shoot(G.p.x + (G.p.lastDx||1)*100, G.p.y + (G.p.lastDy||0)*100); // Стреляем прямо
                }
            }
        } else if (type === 'super') {
            G.p.isSuperAiming = false;
            // Супер при отпускании
            if (G.p && !G.p.dead && G.p.sup >= 100) {
                if (wasMoved) {
                    G.p.super((mouse.x / ZOOM) + G.cam.x, (mouse.y / ZOOM) + G.cam.y);
                } else {
                    // Авто-супер
                    // СТУ: Рывок всегда по направлению движения
                    if (G.p.t === 'stu') {
                        G.p.super(G.p.x + (G.p.lastDx||1)*100, G.p.y + (G.p.lastDy||0)*100);
                    } else {
                        const target = getAutoAimTarget(G.p);
                        if (target) G.p.super(target.x, target.y);
                        else G.p.super(G.p.x + (G.p.lastDx||1)*100, G.p.y + (G.p.lastDy||0)*100);
                    }
                }
            }
        }
    };

    zone.addEventListener('touchend', handleEnd, {passive: false});
    zone.addEventListener('touchcancel', handleEnd, {passive: false}); // ЗАЩИТА ОТ ЗАЛИПАНИЯ
}

function getAutoAimTarget(player) {
    // Ищем ближайшего врага или ящик
    let targets = [...G.en, ...G.boxes].filter(e => !e.dead && e.team !== player.team);
    let nearest = null;
    let minD = player.rng + 150; // Ищем чуть дальше радиуса атаки

    // Приоритет: Бойцы
    let brawlers = targets.filter(e => e instanceof Brawler);
    brawlers.forEach(e => {
        let d = Math.hypot(e.x - player.x, e.y - player.y);
        if (d < minD) { minD = d; nearest = e; }
    });

    if (nearest) return nearest;

    // Если бойцов нет, ищем ящики
    targets.filter(e => e instanceof Box).forEach(e => {
        let d = Math.hypot(e.x - player.x, e.y - player.y);
        if (d < minD) { minD = d; nearest = e; }
    });

    return nearest;
}

setupJoystick('joystickZone', 'joystickKnob', 'move');
setupJoystick('attackJoystickZone', 'attackJoystickKnob', 'aim');
setupJoystick('superBtn', null, 'super'); // Супер теперь тоже джойстик


// КЛАССЫ
class Obj {
    constructor(x, y, s, c) { this.x=x; this.y=y; this.s=s; this.c=c; this.dead=false; }
    draw(ctx) {
        ctx.fillStyle = this.c; ctx.beginPath(); ctx.arc(this.x, this.y, this.s, 0, Math.PI*2); ctx.fill(); ctx.stroke();
    }
}
class FloatingText {
    constructor(x, y, text, color) {
        this.x = x; this.y = y; this.text = text; this.color = color;
        this.life = 30; this.vy = -2;
    }
    update() { this.y += this.vy; this.life--; }
    draw(ctx) {
        ctx.globalAlpha = this.life / 30;
        ctx.fillStyle = this.color;
        ctx.font = 'bold 20px Arial';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 3;
        ctx.strokeText(this.text, this.x, this.y);
        ctx.fillText(this.text, this.x, this.y);
        ctx.globalAlpha = 1.0;
    }
}
class Box extends Obj { // Ящики с банками
    constructor(x, y) { super(x, y, 25, '#8B4513'); this.hp = 4000; this.maxHp = 4000; }
    draw(ctx) {
        ctx.fillStyle = this.c; ctx.fillRect(this.x-25, this.y-25, 50, 50);
        ctx.strokeStyle = '#5c3a1e'; ctx.lineWidth = 4; ctx.strokeRect(this.x-25, this.y-25, 50, 50);
        // HP Bar
        if(this.hp < this.maxHp) {
            ctx.fillStyle = 'black'; ctx.fillRect(this.x-25, this.y-40, 50, 6);
            ctx.fillStyle = '#ff9900'; ctx.fillRect(this.x-25, this.y-40, Math.max(0, 50*(this.hp/this.maxHp)), 6);
        }
    }
}
class PowerCube extends Obj {
    constructor(x, y) { super(x, y, 15, '#00ff00'); this.ang = 0; }
    draw(ctx) {
        this.ang += 0.05;
        ctx.save(); ctx.translate(this.x, this.y);
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(0, 15, 10, 5, 0, 0, Math.PI*2); ctx.fill(); // Тень
        ctx.translate(0, Math.sin(this.ang)*3); // Левитация
        ctx.rotate(Math.PI/4); // Ромб
        ctx.fillStyle = '#00e000'; ctx.fillRect(-12, -12, 24, 24);
        ctx.strokeStyle = '#005000'; ctx.lineWidth = 3; ctx.strokeRect(-12, -12, 24, 24);
        ctx.rotate(-Math.PI/4); // Молния
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(3, -8); ctx.lineTo(-4, 0); ctx.lineTo(-1, 0); ctx.lineTo(-3, 8); ctx.lineTo(4, 0); ctx.lineTo(1, 0); ctx.fill();
        ctx.restore();
    }
}
class Brawler extends Obj {
    constructor(x, y, type, isBot, team) {
        const s = BRAWLERS[type];
        super(x, y, 22, s.c);
        
        // Расчет статов (Макс -> База -> Текущий)
        const lvl = isBot ? 1 : (STATE.levels[type] || 1);
        const baseHp = s.hp / (1 + 8 * 0.07);
        const baseDmg = s.dmg / (1 + 8 * 0.05);
        const curHp = Math.floor(baseHp * (1 + (lvl - 1) * 0.07));
        const curDmg = Math.floor(baseDmg * (1 + (lvl - 1) * 0.05));

        this.t = type; this.bot = isBot;
        this.team = team; // 0 - Игрок и его петы, 1 - Враги
        this.mHp = curHp; this.hp = this.mHp; this.dmg = curDmg; this.spd = s.spd;
        this.rld = s.rld; this.rng = s.rng; this.ammoProgress = 0; this.ammo = 3; this.sup = 0; this.cubes = 0; this.fireCd = 0;
        // Уникальные ники: берем из пула и удаляем, чтобы не повторялись
        this.name = isBot ? getUniqueBotName() : (STATE.nickname || "YOU");
        this.lastHit = Date.now(); this.lastAttackTime = 0; this.regenStage = 0; this.nextRegen = 0;
        this.imgObj = ASSETS[s.img]; // ОПТИМИЗАЦИЯ: Используем кэшированную картинку
        this.slowed = false; // Флаг замедления
        this.shield = 0; // Щит неуязвимости (таймер)
        this.target = null; // Текущая цель бота
        this.scanTimer = Math.floor(Math.random() * 20); // Случайная задержка сканирования
        this.isSuperAiming = false; // Режим прицеливания супером
        this.skin = isBot ? 'default' : (STATE.curSkin[type] || 'default'); // Боты теперь всегда стандартные
        this.campTimer = 0; // Таймер для сидения в кустах
        this.burnTime = 0; // Таймер горения
        this.burnTick = 0; // Тик урона от горения
        this.burnAttacker = null; // Кто поджег
    }
    update() {
        if (this.dead) return;
        // Защита от NaN координат (возможная причина зависаний)
        if (!Number.isFinite(this.x) || !Number.isFinite(this.y)) { this.dead = true; return; }
        if (this.fireCd > 0) this.fireCd--;
        
        // Эффект горения (Сту)
        if (this.burnTime > 0) {
            this.burnTime--;
            this.burnTick--;
            if (this.burnTick <= 0) {
                this.hp -= 150; // Урон от огня
                this.lastHit = Date.now(); // Сбиваем реген
                G.floatTexts.push(new FloatingText(this.x, this.y - 40, 150, '#ff6600'));
                // Зарядка ульты атакующего (4%)
                if (this.burnAttacker) this.burnAttacker.sup = Math.min(100, this.burnAttacker.sup + 4);
                this.burnTick = 60; // Урон раз в секунду
            }
        }

        // Регенерация (3% -> 5% -> 8%... от МАКСИМАЛЬНОГО HP)
        let now = Date.now();
        if (now - this.lastHit > 2000 && now - this.lastAttackTime > 2000 && !(this instanceof Bear)) { 
            if (now > this.nextRegen && this.hp < this.mHp) {
                const rates = [0.03, 0.05, 0.08, 0.13, 0.20, 0.30, 0.45, 0.65, 0.85, 1.0];
                let pct = rates[Math.min(this.regenStage, rates.length - 1)];
                this.hp = Math.min(this.mHp, this.hp + Math.ceil(this.mHp * pct)); // Хил от общего здоровья
                this.regenStage++;
                this.nextRegen = now + 1000;
            }
        } else { this.regenStage = 0; }

        // Перезарядка и Зона
        if (this.ammo < 3) {
            this.ammoProgress++;
            if (this.ammoProgress >= this.rld) { this.ammo++; this.ammoProgress = 0; }
        }
        if (Math.hypot(this.x, this.y) > G.zone) {
            this.hp -= 20;
            this.lastHit = Date.now(); // Сброс регена при уроне от зоны
        }
        
        // Щит
        if (this.shield > 0) this.shield--;

        if (this.hp <= 0) { 
            this.dead = true; 
            if (this.t !== 'bear') dropCube(this.x, this.y); // Медведь не роняет банки
            return; 
        }

        let dx = 0, dy = 0;
        if (!this.bot && this.team === 0) { // Игрок (не бот)
            if (keys['KeyW']) dy = -1; if (keys['KeyS']) dy = 1;
            if (keys['KeyA']) dx = -1; if (keys['KeyD']) dx = 1;
            // Нормализация диагонального движения
            if (dx !== 0 || dy !== 0) {
                const len = Math.hypot(dx, dy);
                dx /= len; dy /= len;
            }
            
            // Мобильное движение (перекрывает клавиатуру если активно)
            if (mobileControls.move.active) {
                dx = mobileControls.move.x;
                dy = mobileControls.move.y;
            }

            if (mouse.down && !this.isSuperAiming) this.shoot((mouse.x / ZOOM) + G.cam.x, (mouse.y / ZOOM) + G.cam.y);
            if (keys['KeyE'] && this.sup >= 100) {
                // СТУ: Рывок по направлению движения при нажатии E
                if (this.t === 'stu') {
                    this.super(this.x + (this.lastDx||1)*100, this.y + (this.lastDy||0)*100);
                } else {
                    this.super((mouse.x / ZOOM) + G.cam.x, (mouse.y / ZOOM) + G.cam.y);
                }
            }
        } else {
            // AI: Ищет ближайшую цель (игрок, бот или ящик)
            // ОПТИМИЗАЦИЯ: Строгое ограничение сканирования (раз в 15 кадров)
            this.scanTimer++;
            // ОПТИМИЗАЦИЯ: Сканируем реже (15 кадров = 0.25 сек) для лучшей реакции
            if (this.scanTimer > 15 || !this.target || this.target.dead) {
                if (this.scanTimer > 15) { 
                let minD = 1000;
                this.target = null;
                // Поиск врагов и ящиков
                [G.p, ...G.en, ...G.boxes].forEach(e => {
                    if (e === this || e.dead) return;
                    if (e instanceof Brawler && e.team === this.team) return; // Не атакуем своих
                    // Если цель в кустах и далеко - не видим её
                    if (checkBush(e.x, e.y) && Math.hypot(e.x - this.x, e.y - this.y) > 200) return;
                    // ОПТИМИЗАЦИЯ: Не проверяем стены, если цель слишком далеко
                    if (Math.hypot(e.x - this.x, e.y - this.y) > 1000) return;
                    // Проверка стен (не видим сквозь стены)
                    if (checkWallLine(this.x, this.y, e.x, e.y)) return;
                    if (this instanceof Bear && e instanceof Box) return; // Медведь игнорирует ящики
                    let d = Math.hypot(e.x - this.x, e.y - this.y);
                    if (d < minD) { minD = d; this.target = e; }
                });
                this.scanTimer = 0; // Сброс таймера
                }
            }
            
            let target = this.target;
            let minD = target ? Math.hypot(target.x - this.x, target.y - this.y) : 1000;
            
            // Поиск ближайшей банки (Power Cube)
            let targetCube = null;
            let minCubeD = 500; // Видим банки только в радиусе 500
            if (!(this instanceof Bear)) { // Медведь не собирает банки
                G.cubes.forEach(c => {
                    let d = Math.hypot(c.x - this.x, c.y - this.y);
                    if (d < minCubeD) { minCubeD = d; targetCube = c; }
                });
            }

            // 1. Боимся зоны (приоритет)
            let distToCenter = Math.hypot(this.x, this.y);
            if (distToCenter > G.zone - 300) {
                // Бежим в центр
                let angle = Math.atan2(0 - this.y, 0 - this.x);
                dx = Math.cos(angle); dy = Math.sin(angle);
                this.campTimer = 0;
            } 
            // 2. Если мало ХП - убегаем
            else if (this.hp < this.mHp * 0.3 && target && !(this instanceof Bear)) { // Медведь не убегает
                let angle = Math.atan2(target.y - this.y, target.x - this.x);
                dx = -Math.cos(angle); dy = -Math.sin(angle);
                this.campTimer = 0;
            }
            // 3. Сбор банок (если безопасно)
            else if (targetCube && (!target || minD > 300)) {
                let angle = Math.atan2(targetCube.y - this.y, targetCube.x - this.x);
                dx = Math.cos(angle); dy = Math.sin(angle);
                this.campTimer = 0;
            }
            // 4. Засада в кустах (Кемперство)
            else if (checkBush(this.x, this.y) && target && minD > 250 && minD < 600 && this.hp > this.mHp * 0.8 && !(this instanceof Bear)) {
                // Если мы в кустах, здоровы, и враг где-то рядом, но не в упор - сидим тихо
                this.campTimer++;
                if (this.campTimer < 100) { // Сидим не вечно
                    dx = 0; dy = 0; // Стоим
                    // Если враг подошел близко - В АТАКУ!
                    if (minD < 300) this.campTimer = 1000; 
                } else {
                    // Надоело сидеть, идем в атаку
                    let angle = Math.atan2(target.y - this.y, target.x - this.x);
                    dx = Math.cos(angle); dy = Math.sin(angle);
                }
            }
            // 5. Атака
            else if (target) {
                this.campTimer = 0;
                // Медведь всегда идет в атаку
                let stopDist = this.rng * 0.7; // Базовая дистанция
                let retreatDist = 100; // Базовая дистанция отступления (кайт)
                
                // ИСКЛЮЧЕНИЯ ДЛЯ БОТОВ:
                if (target instanceof Box) {
                    stopDist = 10; // К ящикам подходим ВПЛОТНУЮ
                    retreatDist = 0;
                } else {
                    // Тактика в зависимости от бойца
                    if (this.t === 'colt') {
                        stopDist = this.rng * 0.85; // Кольт держит максимальную дистанцию (Снайпер)
                        retreatDist = this.rng * 0.5; // Убегает, если враг подошел слишком близко
                    } else if (this.t === 'shelly') {
                        stopDist = 20; // Шелли идет в полный контакт (Агрессор)
                        retreatDist = 0;
                    } else if (this.t === 'mortis') {
                        stopDist = 5; // Мортис идет в упор
                        retreatDist = 0;
                    } else if (this.t === 'stu') {
                        stopDist = 220; // Сту держит среднюю дистанцию (как Шелли)
                        retreatDist = 120;
                    } else if (this.t === 'nita') {
                        stopDist = 150; // Нита держит среднюю дистанцию
                        retreatDist = 50;
                    }
                }

                if (this instanceof Bear) {
                    if (minD > this.rng * 0.7) { dx = (target.x - this.x)/minD; dy = (target.y - this.y)/minD; }
                } else {
                    // Обычные боты теперь тоже двигаются (держат дистанцию)
                    if (minD > stopDist) { dx = (target.x - this.x)/minD; dy = (target.y - this.y)/minD; } // Идем к цели
                    else if (minD < retreatDist) { dx = -(target.x - this.x)/minD; dy = -(target.y - this.y)/minD; } // Кайтим (отходим)
                    
                    // БОТЫ: Мансование (Juking)
                    if (this.bot && (dx !== 0 || dy !== 0)) {
                        let perpX = -dy;
                        let perpY = dx;
                        let juke = Math.sin(Date.now() / 200) * 0.5; // Виляние
                        dx += perpX * juke; dy += perpY * juke;
                    }
                }
                
                // Атака и Супер (Боты стали умнее)
                if (this.sup >= 100 && minD < this.rng + 100 && this.fireCd <= 0) this.super(target.x, target.y); // Используем супер, если враг в радиусе и нет КД
                else if (this.ammo > 0 && Math.random() < 0.05) this.shoot(target.x, target.y); // Стреляют чаще (0.05)
            } else {
                // Идти в центр если нет целей
                let d = Math.hypot(0-this.x, 0-this.y);
                if(d>100) { dx = -this.x/d; dy = -this.y/d; }
            }
        }
        // Движение + Коллизия со стенами
        if (dx || dy) {
            if (this.slowed) this.spd *= 0.6; // Замедление 40%
            let nx = this.x + dx * this.spd, ny = this.y + dy * this.spd;
            if (!checkWall(nx, this.y)) this.x = nx;
            if (!checkWall(this.x, ny)) this.y = ny;
            // Запоминаем направление для автоатаки
            if (dx || dy) { this.lastDx = dx; this.lastDy = dy; }
            if (this.slowed) this.spd /= 0.6; // Возвращаем скорость для следующего кадра (или просто сбрасываем флаг в конце)
        }
        this.x = Math.max(-G.w, Math.min(G.w, this.x)); this.y = Math.max(-G.h, Math.min(G.h, this.y));
        this.slowed = false; // Сброс замедления
    }
    shoot(tx, ty) {
        if (this.ammo <= 0 || this.fireCd > 0) return;
        
        // Мортис: Coiled Snake (если не атаковал 3 сек)
        let rangeMult = 1;
        if (this.t === 'mortis' && Date.now() - this.lastAttackTime > 3000) rangeMult = 1.45;

        this.ammo--; this.fireCd = 27; // КД 0.45 сек (было 21 кадр)
        this.lastAttackTime = Date.now(); 
        if (this.t === 'mortis') this.fireCd = 18; // КД 0.3 сек (18 кадров) для Мортиса
        
        const s = BRAWLERS[this.t];
        const a = Math.atan2(ty - this.y, tx - this.x);

        if (this.t === 'mortis') {
            // РЫВОК МОРТИСА (ИСПРАВЛЕННЫЙ)
            let dashDist = s.rng * rangeMult;
            let steps = 10; // Шаг проверки
            let moved = 0;
            let hitEnemies = []; // Чтобы не бить одного врага дважды за один рывок
            let safety = 0; // Защита от зависания

            while(moved < dashDist && safety < 100) {
                let nx = this.x + Math.cos(a) * steps;
                let ny = this.y + Math.sin(a) * steps;
                
                if (checkWall(nx, ny)) break; // Уперлись в стену
                
                this.x = nx; this.y = ny;
                moved += steps;

                // Проверка попадания по врагам (в радиусе модельки)
                [G.p, ...G.en, ...G.boxes].forEach(e => {
                    if (e === this || e.dead || e.team === this.team) return;
                    if (!hitEnemies.includes(e) && Math.hypot(this.x - e.x, this.y - e.y) < 60) { // Увеличили радиус попадания
                        e.hp -= this.dmg * (1 + this.cubes * 0.1);
                        e.lastHit = Date.now();
                        hitEnemies.push(e);
                        G.floatTexts.push(new FloatingText(e.x, e.y - 40, Math.floor(this.dmg), '#ff0000'));
                        
                        // Проверка на смерть (для ящиков и врагов)
                        if (e.hp <= 0) { 
                            e.dead = true; dropCube(e.x, e.y); 
                            if (e instanceof Brawler) addKillFeed(this, e); 
                        }

                        if (!(e instanceof Box)) this.sup = Math.min(100, this.sup + 15); // Не заряжаем ульту об ящики
                    }
                });
                safety++;
            }
        } else if (this.t === 'colt') {
            // КОЛЬТ: Очередь (как ульта, но меньше)
            this.fireCd = 48; // 0.3s (18 frames) + время стрельбы (30 frames) = ~48
            for(let i=0; i<6; i++) {
                setTimeout(() => {
                    if(this.dead) return;
                    G.bul.push(new Bullet(this.x, this.y, Math.cos(a)*18, Math.sin(a)*18, this.dmg*(1+this.cubes*0.1), this, s.rng));
                }, i * 82); // Интервал между пулями (чуть медленнее)
            }
        } else if (this.t === 'stu') {
            // СТУ: 2 фейерверка (Сближены, чтобы картинка не двоилась визуально)
            // Правый
            let bx1 = this.x + Math.cos(a + Math.PI/2) * 8 + Math.cos(a) * 15; // Было 20, стало 8
            let by1 = this.y + Math.sin(a + Math.PI/2) * 8 + Math.sin(a) * 15;
            // Левый
            let bx2 = this.x + Math.cos(a - Math.PI/2) * 8; // Было 20, стало 8
            let by2 = this.y + Math.sin(a - Math.PI/2) * 8;

            G.bul.push(new Bullet(bx1, by1, Math.cos(a)*16, Math.sin(a)*16, this.dmg*(1+this.cubes*0.1), this, s.rng, false, false, false, true)); // isStu=true
            G.bul.push(new Bullet(bx2, by2, Math.cos(a)*16, Math.sin(a)*16, this.dmg*(1+this.cubes*0.1), this, s.rng, false, false, false, true));
        } else {
            for(let i=0; i<s.bul; i++) {
                let fa = a + (Math.random()-0.5)*s.spr;
                let b = new Bullet(this.x, this.y, Math.cos(fa)*18, Math.sin(fa)*18, this.dmg*(1+this.cubes*0.1), this, s.rng);
                if (this.t === 'spike') b.isSpikeMain = true; // Помечаем основной снаряд Спайка
                G.bul.push(b);
            }
        }
    }
    super(tx, ty) {
        this.sup = 0;
        this.fireCd = 27; // Добавляем задержку после супера (чтобы боты не спамили)
        const a = Math.atan2(ty - this.y, tx - this.x);
        let dist = Math.hypot(tx - this.x, ty - this.y);
        
        // Ограничение дальности броска (для Спайка и других метателей)
        const maxThrowRange = 500; 
        if (dist > maxThrowRange) { tx = this.x + Math.cos(a)*maxThrowRange; ty = this.y + Math.sin(a)*maxThrowRange; }

        // ШЕЛЛИ: Супер-дробовик (сносит стены)
        if (this.t === 'shelly') {
            for(let i=0; i<9; i++) {
                let fa = a + (Math.random()-0.5)*0.5;
                G.bul.push(new Bullet(this.x, this.y, Math.cos(fa)*20, Math.sin(fa)*20, 400*(1+this.cubes*0.1), this, 350, true));
            }
        }
        // НИТА: Призыв Медведя
        else if (this.t === 'nita') {
            // Удаляем старого медведя этого игрока
            G.en = G.en.filter(e => !(e instanceof Bear && e.team === this.team));
            
            // Спавним медведя чуть впереди
            let bx = this.x + Math.cos(a)*50;
            let by = this.y + Math.sin(a)*50;
            // Если спавн в стене, ставим в точку игрока
            if (checkWall(bx, by)) { bx = this.x; by = this.y; }
            
            let bear = new Bear(bx, by, this.team);
            bear.cubes = this.cubes; // Медведь наследует банки
            bear.mHp += this.cubes * 400; bear.hp = bear.mHp;
            bear.dmg += this.cubes * 0.05 * bear.dmg;
            G.en.push(bear); // Добавляем в общий массив сущностей
        }
        // КОЛЬТ: Очередь пуль (упрощенно - одна мощная длинная очередь)
        else if (this.t === 'colt') {
             for(let i=0; i<12; i++) {
                setTimeout(() => {
                    if(this.dead) return;
                    G.bul.push(new Bullet(this.x, this.y, Math.cos(a)*22, Math.sin(a)*22, 286*(1+this.cubes*0.1), this, 600, true));
                }, i * 51); // Интервал ульты (чуть медленнее)
            }
        }
        // СПАЙК: Кактусовая ловушка
        else if (this.t === 'spike') {
            G.zones.push(new Zone(tx, ty, 261, 200, this)); // Урон 261, длительность 200, владелец
        }
        // МОРТИС: Летучие мыши (Вампиризм)
        else if (this.t === 'mortis') {
            // Один большой рой мышей (размер задается в Bullet)
            G.bul.push(new Bullet(this.x, this.y, Math.cos(a)*15, Math.sin(a)*15, 1680*(1+this.cubes*0.1), this, 600, true, false, true));
        }
        // СТУ: Рывок с огнем
        else if (this.t === 'stu') {
            let dashDist = 130; // Еще короче (было 180)
            let steps = 10;
            let moved = 0;
            while(moved < dashDist) {
                let nx = this.x + Math.cos(a) * steps;
                let ny = this.y + Math.sin(a) * steps;
                if (checkWall(nx, ny)) break;
                this.x = nx; this.y = ny;
                moved += steps;
                // Оставляем огонь каждые 30 пикселей
                if (moved % 30 === 0) G.zones.push(new Zone(this.x, this.y, 150, 150, this, 'fire', a));
            }
            // Финальный огонь
            G.zones.push(new Zone(this.x, this.y, 150, 150, this, 'fire', a));
        }
    }
    draw(ctx) {
        // ОТРИСОВКА ПРИЦЕЛА (Только для игрока)
        // Показываем, если это ПК (не мобайл) ИЛИ если активен джойстик прицеливания
        if (this === G.p && !this.dead && (!isMobile || mobileControls.aim.active || mobileControls.super.active)) {
            ctx.save();
            ctx.translate(this.x, this.y);
            
            let isSuper = this.isSuperAiming;
            let range = this.rng;
            let spread = BRAWLERS[this.t].spr;
            
            // Мортис: Визуализация длинного рывка (Coiled Snake)
            if (!isSuper && this.t === 'mortis' && Date.now() - this.lastAttackTime > 3000) {
                range *= 1.45;
            }
            
            // Параметры для Супера (примерные)
            if (isSuper) {
                if (this.t === 'shelly') { range = 350; spread = 0.5; }
                else if (this.t === 'colt') { range = 600; spread = 0.05; }
                else if (this.t === 'nita') { range = 500; spread = 0; } 
                else if (this.t === 'spike') { range = 500; spread = 0; }
                else if (this.t === 'mortis') { range = 600; spread = 0; } // Прямоугольник (spread 0)
                else if (this.t === 'stu') { range = 130; spread = 0; } // Рывок (Исправлено отображение)
            }

            // Угол к мышке
            let mx = (mouse.x / ZOOM) + G.cam.x;
            let my = (mouse.y / ZOOM) + G.cam.y;
            let angle = Math.atan2(my - this.y, mx - this.x);
            ctx.rotate(angle);

            // Стиль прицела
            // Делаем обычный прицел более заметным (0.3 opacity и яркая обводка)
            ctx.fillStyle = isSuper ? 'rgba(255, 255, 0, 0.4)' : 'rgba(255, 255, 255, 0.3)';
            ctx.strokeStyle = isSuper ? '#ffff00' : 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 2;

            if ((this.t === 'nita' || this.t === 'spike') && isSuper) {
                // Метатели (Круг в точке)
                let dist = Math.hypot(mx - this.x, my - this.y);
                if (dist > range) dist = range;
                
                ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(dist, 0); ctx.stroke(); // Линия
                ctx.beginPath(); ctx.arc(dist, 0, isSuper ? 120 : 50, 0, Math.PI*2); ctx.fill(); ctx.stroke(); // Круг
            } else {
                // Стрелки (Конус/Линия)
                ctx.beginPath();
                ctx.moveTo(0, 0);
                if (spread > 0.1) ctx.arc(0, 0, range, -spread, spread); // Конус
                else ctx.rect(0, -20, range, 40); // Линия (сделал чуть шире для видимости)
                
                // Закрываем путь корректно
                if (spread > 0.1) ctx.lineTo(0,0);
                
                ctx.fill(); ctx.stroke();
            }
            ctx.restore();
        }

        // Тень
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y, this.s, this.s * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Щит
        if (this.shield > 0) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; ctx.beginPath(); ctx.arc(this.x, this.y, this.s+10, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
        }

        if (this.imgObj && this.imgObj.complete && this.imgObj.naturalHeight !== 0) {
            const h = 90; // Высота модели
            const w = h * (this.imgObj.naturalWidth / this.imgObj.naturalHeight);
            
            // Применяем фильтр скина
            ctx.save();
            if (this.skin && SKINS[this.skin]) ctx.filter = SKINS[this.skin].filter;
            else ctx.filter = 'none'; // Сброс фильтра на всякий случай

            // Красный оттенок для вражеского медведя
            if (this.name === "Bear" && this.team !== 0) {
                // Комбинируем фильтр скина с красным оттенком (сложно, поэтому просто красный)
                ctx.filter = 'sepia(1) hue-rotate(-50deg) saturate(5)'; 
                ctx.drawImage(this.imgObj, this.x - w / 2, this.y - h + 15, w, h);
            } 
            // Уменьшаем Спайка в игре
            else if (this.t === 'spike') {
                let sw = w * 0.85, sh = h * 0.85;
                ctx.drawImage(this.imgObj, this.x - sw / 2, this.y - sh + 15, sw, sh);
            } else {
                ctx.drawImage(this.imgObj, this.x - w / 2, this.y - h + 15, w, h);
            }
            ctx.restore();
        } else {
            // Если картинка не загрузилась, рисуем круг
            super.draw(ctx);
        }
    }
    drawHP(ctx) {
        if(this.dead) return;
        // Прозрачность если в кустах
        if (this === G.p && checkBush(this.x, this.y)) ctx.globalAlpha = 0.6;
        ctx.fillStyle = 'black'; ctx.fillRect(this.x-20, this.y-85, 40, 6);
        ctx.fillStyle = this.bot ? '#ff4444' : '#00ff00'; ctx.fillRect(this.x-20, this.y-85, 40*(this.hp/this.mHp), 6);
        
        // Никнейм
        ctx.fillStyle = 'white'; ctx.font = 'bold 12px Arial'; ctx.textAlign = 'center';
        ctx.fillText(this.name, this.x, this.y-95);
        
        // Банки (иконка над головой)
        if (this.cubes > 0 && this.t !== 'bear') { // Не показываем банки над медведем
            ctx.fillStyle = '#00ff00'; ctx.font = 'bold 14px Arial';
            ctx.fillText(`🟩 ${this.cubes}`, this.x, this.y-110);
        }
        ctx.globalAlpha = 1.0;
    }
}

// КЛАСС МЕДВЕДЯ
class Bear extends Brawler {
    constructor(x, y, team) {
        super(x, y, 'nita', true, team); // Используем модель Ниты как базу, но меняем параметры
        this.name = "Bear";
        this.t = 'bear'; // Уникальный тип, чтобы не использовать логику Ниты (шоквейв)
        
        // Скалирование Медведя от уровня Ниты
        const lvl = (team === 0) ? (STATE.levels['nita'] || 1) : 1; // Если игрок - берем его уровень, если бот - 1
        this.mHp = Math.floor(4000 * (1 + (lvl - 1) * 0.07)); 
        this.hp = this.mHp;
        this.dmg = Math.floor(600 * (1 + (lvl - 1) * 0.05));
        
        this.spd = 4.0; // Медленный
        this.rld = 10; this.rng = 50; // Ближний бой
        this.imgObj = ASSETS['bear_model.png']; // ОПТИМИЗАЦИЯ: Ссылка на кэш (не меняем src у Ниты!)
    }
    // Переопределяем стрельбу на укус (ближняя атака)
    shoot(tx, ty) {
        if (this.ammo <= 0 || this.fireCd > 0) return;
        this.ammo--; this.curRld = 0; this.fireCd = 15;
        // Создаем невидимую пулю с малым ренджем (удар лапой)
        let a = Math.atan2(ty - this.y, tx - this.x);
        G.bul.push(new Bullet(this.x, this.y, Math.cos(a)*10, Math.sin(a)*10, this.dmg, this, 60));
    }
}

class Bullet extends Obj {
    constructor(x, y, vx, vy, dmg, owner, rng, isSup=false, isSplash=false, isLifesteal=false, isStu=false) {
        let size = isSup ? 12 : 6;
        if (owner.t === 'mortis' && isSup) size = 25; // Увеличенный размер ульты Мортиса
        if (isStu) size = 10; // Увеличенный хитбокс для Сту
        
        super(x, y, size, isSup?'yellow':'orange');
        this.vx=vx; this.vy=vy; this.dmg=dmg; this.owner=owner; this.rng=rng; this.dist=0; this.isSup=isSup; this.isSplash=isSplash; this.isLifesteal=isLifesteal; this.isStu=isStu;
        this.hitList = []; // Список тех, кого уже задела волна (для Ниты)
        
        // Для Сту: параметры маневрирования
        if (this.isStu) {
            this.baseAngle = Math.atan2(vy, vx); // Запоминаем основное направление
            this.speed = Math.hypot(vx, vy);     // Запоминаем скорость
            this.wobblePhase = 0;                // Фаза колебания
        }
    }
    update() {
        // СТУ: Маневрирование (изменение вектора скорости)
        if (this.isStu) {
            // wave меняет угол полета. 0.05 - частота, 0.3 - амплитуда (чем больше, тем сильнее виляет)
            let wave = Math.sin(this.dist * 0.05) * 0.3; 
            let currentAngle = this.baseAngle + wave;
            
            this.vx = Math.cos(currentAngle) * this.speed;
            this.vy = Math.sin(currentAngle) * this.speed;
        }

        this.x += this.vx; this.y += this.vy; this.dist += Math.hypot(this.vx, this.vy);
        // Проверка стен
        let wIdx = G.walls.findIndex(w => this.x > w.x && this.x < w.x+w.w && this.y > w.y && this.y < w.y+w.h);
        if (wIdx !== -1) {
            if (this.isSup) { if (this.owner.t !== 'mortis') G.walls.splice(wIdx, 1); } // Ульта ломает стены (кроме Мортиса)
            else {
                this.dead = true;
                // СПАЙК: Шипы об стену
                if (this.owner.t === 'spike' && this.isSpikeMain) spawnSpikes(this);
            }
        }
        // Ульта ломает кусты
        if (this.isSup) {
            let bIdx = G.bushes.findIndex(b => this.x > b.x && this.x < b.x+b.w && this.y > b.y && this.y < b.y+b.h);
            if (bIdx !== -1 && this.owner.t !== 'mortis') G.bushes.splice(bIdx, 1);
        }
        if (this.dist >= this.rng) {
            this.dead = true;
            // СПАЙК: Разлет иголок
            if (this.owner.t === 'spike' && !this.isSup && this.isSpikeMain) spawnSpikes(this);
        }
    }
    draw(ctx) {
        if (this.owner.t === 'nita') {
            // Рисуем Шоквейв (Волну)
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(Math.atan2(this.vy, this.vx));
            ctx.fillStyle = this.owner.team === 0 ? '#00ffff' : '#ff0000'; // Голубой для своих, Красный для врагов
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(-10, 15);
            ctx.lineTo(-5, 0);
            ctx.lineTo(-10, -15);
            ctx.fill();
            ctx.restore();
        } else if (this.owner.t === 'spike') {
            ctx.fillStyle = '#005500'; ctx.beginPath(); ctx.arc(this.x, this.y, 8, 0, Math.PI*2); ctx.fill(); ctx.strokeStyle = '#00ff00'; ctx.lineWidth = 2; ctx.stroke();
        } else if (this.owner.t === 'mortis' && this.isSup) {
            // Ульта Мортиса - Прямоугольная стая мышей
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(Math.atan2(this.vy, this.vx));
            ctx.fillStyle = '#550055'; 
            ctx.fillRect(-20, -30, 40, 60); // Прямоугольник 40x60
            ctx.strokeStyle = '#ff00ff'; ctx.lineWidth = 2; 
            ctx.strokeRect(-20, -30, 40, 60);
            ctx.restore();
        } else if (this.isStu) {
            // Фейерверк Сту
            const img = ASSETS['stu_proj.png'];
            if (img && img.complete && img.naturalHeight !== 0) {
                // Если есть картинка - рисуем её
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.baseAngle); // Рисуем по основному направлению, чтобы сама картинка не дергалась дико
                ctx.drawImage(img, -30, -15, 60, 30); // Увеличенный масштаб (было 40x20)
                ctx.restore();
            } else {
                // Если картинки нет - рисуем красивую ракету
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.baseAngle);
                ctx.fillStyle = '#00ffff'; ctx.fillRect(-10, -4, 20, 8); // Тело
                ctx.fillStyle = '#ffaa00'; ctx.fillRect(-14, -2, 4, 4); // Огонь сзади
                ctx.restore();
            }
        } else {
            super.draw(ctx);
        }
    }
}

// ЗОНА (Ульта Спайка и Огонь Сту)
class Zone {
    constructor(x, y, dmg, life, owner, type='spike', angle=0) {
        this.x = x; this.y = y; this.dmg = dmg; this.life = life; this.owner = owner; this.r = type==='fire'?25:120; this.type = type; this.angle = angle;
    }
    update() {
        this.life--;
    }
    draw(ctx) {
        if (this.type === 'fire') {
            // Прямой след (прямоугольник)
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);
            ctx.fillStyle = `rgba(255, 100, 0, ${this.life/150})`; 
            ctx.fillRect(-10, -20, 20, 40); // Прямоугольник вместо круга
            ctx.restore();
        } else {
            ctx.fillStyle = 'rgba(0, 255, 0, 0.3)'; ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI*2); ctx.fill();
            ctx.strokeStyle = '#005500'; ctx.lineWidth = 2; ctx.stroke();
        }
    }
}

// ГЕНЕРАЦИЯ И ЛОГИКА
function checkWall(x, y) {
    // ОПТИМИЗАЦИЯ: for вместо some (быстрее в 3 раза)
    for(let i=0; i<G.walls.length; i++) {
        let w = G.walls[i];
        if(x > w.x && x < w.x+w.w && y > w.y && y < w.y+w.h) return true;
    }
    return false;
}
function checkWallLine(x1, y1, x2, y2) {
    let d = Math.hypot(x2-x1, y2-y1);
    if (d < 10) return false; // Слишком короткая линия
    let steps = Math.min(50, d / 100); // ЗАЩИТА ОТ ЗАВИСАНИЯ: Максимум 50 шагов
    let dx = (x2-x1)/steps, dy = (y2-y1)/steps;
    for(let i=1; i<steps; i++) {
        if(checkWall(x1+dx*i, y1+dy*i)) return true;
    }
    return false;
}
function checkBush(x, y) {
    for(let i=0; i<G.bushes.length; i++) {
        let b = G.bushes[i];
        if(x > b.x && x < b.x+b.w && y > b.y && y < b.y+b.h) return true;
    }
    return false;
}
function dropCube(x, y) { G.cubes.push(new PowerCube(x, y)); }

function addKillFeed(killer, victim) {
    const feed = document.getElementById('killFeed');
    const el = document.createElement('div');
    el.className = 'kill-item';
    
    // Защита от ошибки, если картинка не прогрузилась
    if (!BRAWLERS[killer.t] || !BRAWLERS[victim.t]) return;

    const kImg = BRAWLERS[killer.t].ava;
    const vImg = BRAWLERS[victim.t].ava;
    
    el.innerHTML = `
        <div class="kill-part"><img src="${kImg}" class="kill-icon"><span class="kill-name">${killer.name}</span></div>
        <span class="flipped-gun">🔫</span>
        <div class="kill-part"><img src="${vImg}" class="kill-icon"><span class="kill-name">${victim.name}</span></div>
    `;
    feed.prepend(el); // Новые сверху (или append если нужно снизу, пользователь просил "вниз другого", значит append)
    // feed.appendChild(el); // УБРАНО: Теперь новые всегда сверху (prepend), старые уходят вниз
    if (feed.children.length > 5) feed.removeChild(feed.lastChild); // Удаляем последний (самый старый)
}

function getUniqueBotName() {
    let available = BOT_NAMES.filter(n => !G.en.some(e => e.name === n));
    if (available.length === 0) return "Bot " + Math.floor(Math.random()*1000);
    return available[Math.floor(Math.random() * available.length)];
}

function generateMap() {
    G.walls = []; G.bushes = []; G.boxes = [];
    // Стены и кусты (с проверкой наложения)
    let attempts = 0;
    // ОПТИМИЗАЦИЯ: Уменьшили кол-во стен и попыток, чтобы не зависало при старте
    while(G.walls.length < 90 && attempts < 3000) { // Больше стен (90) и попыток
        let x = (Math.random()-0.5)*G.w*1.95, y = (Math.random()-0.5)*G.h*1.95; // Разброс по всей карте
        // Проверяем, не накладывается ли стена на другую (с запасом 110px)
        if (!G.walls.some(w => Math.abs(x - w.x) < 120 && Math.abs(y - w.y) < 120)) {
            G.walls.push({x:x, y:y, w:100, h:100});
            G.bushes.push({x:x+120, y:y, w:150, h:150});
        }
        attempts++;
    }
    // Ящики
    for(let i=0; i<18; i++) {
        let bx = (Math.random()-0.5)*G.w*1.8;
        let by = (Math.random()-0.5)*G.h*1.8;
        // Проверка: не спавнить ящик ВНУТРИ стены
        let inWall = G.walls.some(w => bx > w.x - 30 && bx < w.x + w.w + 30 && by > w.y - 30 && by < w.y + w.h + 30);
        if (!inWall) G.boxes.push(new Box(bx, by));
    }
}
function startGame() {
    // Останавливаем предыдущий цикл, если он был
    if (gameLoopId) cancelAnimationFrame(gameLoopId);

    canvas.width = window.innerWidth; canvas.height = window.innerHeight;
    STATE.inGame = true;
    ui.gameOver.classList.add('hidden');
    ui.showdown.classList.add('hidden'); ui.showdown.style.animation = 'none';
    G.bul = []; G.en = []; G.cubes = []; G.floatTexts = []; G.zones = []; G.zone = 3200; G.showdown = false;
    document.getElementById('killFeed').innerHTML = ''; // Очистка фида
    generateMap();
    
    // Генерация точек спавна по кругу (по краям карты)
    let spawns = [];
    for(let i=0; i<10; i++) {
        let angle = (Math.PI * 2 / 10) * i; // 10 точек по кругу
        let r = 1800; // Радиус спавна (ближе к краю, т.к. ширина 2200)
        spawns.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r });
    }
    // Перемешиваем точки спавна
    spawns.sort(() => Math.random() - 0.5);

    // Спавн Игрока
    let pSpawn = spawns.pop();
    // Удаляем стены рядом со спавном, чтобы не застрять
    G.walls = G.walls.filter(w => Math.hypot(w.x - pSpawn.x, w.y - pSpawn.y) > 300);
    G.p = new Brawler(pSpawn.x, pSpawn.y, STATE.selected, false, 0); // Team 0 (Player)

    // 9 Ботов (каждый сам за себя, команды 1-9)
    for(let i=0; i<9; i++) {
        let t = Object.keys(BRAWLERS)[Math.floor(Math.random() * Object.keys(BRAWLERS).length)];
        let bSpawn = spawns.pop();
        G.walls = G.walls.filter(w => Math.hypot(w.x - bSpawn.x, w.y - bSpawn.y) > 300);
        G.en.push(new Brawler(bSpawn.x, bSpawn.y, t, true, i + 1)); 
    }
    gameLoopId = requestAnimationFrame(gameLoop);
}

function gameLoop() {
    // ЗАЩИТА ОТ ВЫЛЕТОВ: Если случится ошибка, игра не зависнет
    try { 
    if (!STATE.inGame) return;
    G.zone -= 0.33; // Замедлил зону на 5%
    G.frame++; // Счетчик кадров для оптимизации
    
    // Обновление
    G.p.update();
    G.en.forEach(e => e.update());
    G.bul.forEach(b => b.update());
    G.floatTexts.forEach(t => t.update());
    G.zones = G.zones.filter(z => z.life > 0); G.zones.forEach(z => z.update());
    
    // Коллизии
    G.bul.forEach(b => {
        if(b.dead) return;
        // Попадание в бойцов
        [G.p, ...G.en].forEach(t => {
            if(t !== b.owner && t.team !== b.owner.team && !t.dead) {
                // ОПТИМИЗАЦИЯ: Квадрат расстояния вместо корня (быстрее)
                let dx = b.x - t.x, dy = b.y - t.y;
                let r = t.s + b.s + 10;
                if (dx*dx + dy*dy < r*r) {
                if (t.shield > 0) { b.dead = true; return; } // Щит блокирует урон
                
                // Нанесение урона
                const dealDamage = () => {
                    t.hp -= b.dmg; t.lastHit = Date.now();
                    // Эффект тряски при получении урона ИГРОКОМ
                    if (t === G.p) {
                        screens.game.classList.remove('damage-flash'); void screens.game.offsetWidth; screens.game.classList.add('damage-flash'); // Красная вспышка
                        if (b.dmg > 2000) { screens.game.classList.remove('shake'); void screens.game.offsetWidth; screens.game.classList.add('shake'); } // Тряска только при ОЧЕНЬ сильном уроне
                    }

                    G.floatTexts.push(new FloatingText(t.x, t.y - 40, Math.floor(b.dmg), '#ff0000'));
                    if (t.hp <= 0 && !t.dead) { t.dead = true; if(t.t !== 'bear') dropCube(t.x, t.y); addKillFeed(b.owner, t); } // Убийство (Медведь без банок)
                    
                    // Зарядка ульты
                    if (b.owner.t === 'stu') b.owner.sup = 100; // Сту заряжает мгновенно
                    else if(!b.isSup && b.owner.t !== 'bear') b.owner.sup = Math.min(100, b.owner.sup + (b.owner.t === 'shelly' ? 11 : 15)); 
                    
                    // Вампиризм Мортиса
                    if (b.isLifesteal) { b.owner.hp = Math.min(b.owner.mHp, b.owner.hp + b.dmg); }
                    // Отталкивание Шелли
                    if (b.owner.t === 'shelly' && b.isSup) {
                        let a = Math.atan2(t.y - b.y, t.x - b.x);
                        t.x += Math.cos(a)*50; t.y += Math.sin(a)*50;
                    }
                };

                if (b.owner.t === 'nita' || b.owner.t === 'mortis' || b.isSplash) { // Пронзающие/Сплеш
                    if (!b.hitList.includes(t)) {
                        dealDamage(); b.hitList.push(t);
                    }
                } else {
                    dealDamage(); b.dead = true;
                    // СПАЙК: Шипы об врага
                    if (b.owner.t === 'spike' && b.isSpikeMain) spawnSpikes(b);
                }
                }
            }
        });
        // Попадание в ящики
        G.boxes.forEach(box => {
            if(!box.dead && Math.hypot(b.x-box.x, b.y-box.y) < 35) {
                if (b.owner.t === 'nita') { // Нита пробивает ящики
                     if (!b.hitList.includes(box)) {
                        box.hp -= b.dmg; b.hitList.push(box); G.floatTexts.push(new FloatingText(box.x, box.y-30, Math.floor(b.dmg), '#fff'));
                        if(box.hp <= 0) { box.dead = true; dropCube(box.x, box.y); }
                     }
                } else {
                    box.hp -= b.dmg; b.dead = true; G.floatTexts.push(new FloatingText(box.x, box.y-30, Math.floor(b.dmg), '#fff'));
                    if(box.hp <= 0) { box.dead = true; dropCube(box.x, box.y); }
                    // СПАЙК: Шипы об ящик
                    if (b.owner.t === 'spike' && b.isSpikeMain) spawnSpikes(b);
                }
            }
        });
    });

    // Зоны (Спайк)
    G.zones.forEach(z => {
        [G.p, ...G.en].forEach(t => {
            if (t !== z.owner && t.team !== z.owner.team && Math.hypot(t.x - z.x, t.y - z.y) < z.r) {
                if (z.type === 'fire') {
                    // Огонь Сту
                    t.burnTime = 360; // Поджог на 6 секунд
                    t.burnAttacker = z.owner; // Запоминаем, кто поджег
                } else {
                    // Шипы Спайка
                    t.slowed = true; // Применяем замедление
                    if (z.life % 60 === 0) { // Урон раз в секунду
                        t.hp -= z.dmg; t.lastHit = Date.now();
                        G.floatTexts.push(new FloatingText(t.x, t.y - 40, z.dmg, '#ff0000'));
                        z.owner.sup = Math.min(100, z.owner.sup + 15);
                    }
                }
            }
        });
    });
    // Подбор банок
    G.cubes.forEach(c => {
        if(!c.dead && Math.hypot(G.p.x-c.x, G.p.y-c.y) < 30) {
            c.dead = true; 
            G.p.cubes++; G.p.mHp+=400; G.p.hp+=400;
        }
        G.en.forEach(e => {
            if(!e.dead && !c.dead && Math.hypot(e.x-c.x, e.y-c.y) < 30) {
                c.dead = true; 
                e.cubes++; e.mHp+=400; e.hp+=400;
            }
        });
    });

    // Очистка
    G.bul = G.bul.filter(b => b && !b.dead);
    G.en = G.en.filter(e => e && !e.dead);
    G.cubes = G.cubes.filter(c => c && !c.dead);
    G.boxes = G.boxes.filter(b => b && !b.dead);
    G.floatTexts = G.floatTexts.filter(t => t.life > 0);

    // Камера
    G.cam.x = G.p.x - (canvas.width / ZOOM) / 2; G.cam.y = G.p.y - (canvas.height / ZOOM) / 2;

    // ОТРИСОВКА
    ctx.fillStyle = '#2c2c2c'; ctx.fillRect(0, 0, canvas.width, canvas.height); // Темный фон (Пустота)
    ctx.save();
    ctx.scale(ZOOM, ZOOM);
    ctx.translate(-G.cam.x, -G.cam.y);

    // Карта (Песчаная арена)
    // ОПТИМИЗАЦИЯ: Рисуем фон только там, где видит камера, а не всю карту целиком
    const viewX = G.cam.x;
    const viewY = G.cam.y;
    const viewW = canvas.width / ZOOM;
    const viewH = canvas.height / ZOOM;
    
    ctx.fillStyle = '#e6c288'; 
    ctx.fillRect(Math.max(-G.w, viewX), Math.max(-G.h, viewY), Math.min(G.w*2, viewW), Math.min(G.h*2, viewH));
    // На случай если камера вышла за пределы, зальем всё (фоллбэк), но основной rect теперь маленький
    if (viewX < -G.w || viewY < -G.h) ctx.fillRect(viewX, viewY, viewW, viewH);

    // Сетка
    ctx.save();
    ctx.beginPath(); ctx.rect(-G.w, -G.h, G.w*2, G.h*2); ctx.clip(); // Рисуем сетку только внутри карты
    ctx.strokeStyle = '#c9a66b'; ctx.lineWidth = 2; ctx.beginPath();
    for(let x=Math.floor(G.cam.x/100)*100; x<G.cam.x+canvas.width; x+=100) { ctx.moveTo(x, G.cam.y); ctx.lineTo(x, G.cam.y+canvas.height); }
    for(let y=Math.floor(G.cam.y/100)*100; y<G.cam.y+canvas.height; y+=100) { ctx.moveTo(G.cam.x, y); ctx.lineTo(G.cam.x+canvas.width, y); }
    ctx.stroke();
    ctx.restore();

    // Объекты (Стены и Кусты) - ОПТИМИЗАЦИЯ: Рисуем только то, что в кадре
    ctx.lineWidth = 2; ctx.strokeStyle = '#3e2723'; // Сброс стиля обводки для стен
    

    G.walls.forEach(w => { 
        if (w.x + w.w > viewX && w.x < viewX + viewW && w.y + w.h > viewY && w.y < viewY + viewH) {
            ctx.fillStyle = '#5c4033'; ctx.fillRect(w.x, w.y, w.w, w.h); ctx.strokeRect(w.x, w.y, w.w, w.h); 
        }
    });
    
    G.boxes.forEach(b => b.draw(ctx));
    G.cubes.forEach(c => c.draw(ctx));
    G.zones.forEach(z => z.draw(ctx));
    
    // Враги (рисуем только если видим)
    G.en.forEach(e => {
        // Защита от NaN координат при отрисовке
        if (!Number.isFinite(e.x) || !Number.isFinite(e.y)) return;
        let dist = Math.hypot(e.x - G.p.x, e.y - G.p.y);
        let visible = !checkBush(e.x, e.y) || dist < 200 || (checkBush(G.p.x, G.p.y) && dist < 300);
        if(visible) { e.draw(ctx); e.drawHP(ctx); }
    });

    if (!G.p.dead) G.p.draw(ctx);
    G.bul.forEach(b => b.draw(ctx));
    
    // Кусты сверху (тоже с проверкой видимости)
    G.bushes.forEach(b => { 
        if (b.x + b.w > viewX && b.x < viewX + viewW && b.y + b.h > viewY && b.y < viewY + viewH) {
            ctx.fillStyle = 'rgba(50, 205, 50, 0.8)'; ctx.fillRect(b.x, b.y, b.w, b.h); 
        }
    }); 
    
    // Зона
    ctx.strokeStyle = '#ccff00'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(0, 0, G.zone, 0, Math.PI*2); ctx.stroke();
    
    // HP игрока
    if (!G.p.dead) G.p.drawHP(ctx);

    G.floatTexts.forEach(t => t.draw(ctx));

    ctx.restore();

    // UI
    ui.hp.style.width = `${(G.p.hp/G.p.mHp)*100}%`;
    ui.ammo.style.width = `${(G.p.ammo/3)*100}%`;

    // Шкала Мортиса
    if (G.p.t === 'mortis') {
        ui.specialBarCont.style.display = 'block';
        let charge = Math.min(1, (Date.now() - G.p.lastAttackTime) / 3000);
        ui.specialBar.style.width = `${charge * 100}%`;
        ui.specialBar.style.background = charge >= 1 ? '#ffff00' : '#555';
    } else {
        ui.specialBarCont.style.display = 'none';
    }
    
    // Считаем живых врагов (без медведей)
    let aliveEnemies = G.en.filter(e => !(e instanceof Bear)).length;
    ui.alive.innerText = aliveEnemies + 1;
    
    // Шкала ульты (круговая)
    if (G.p.sup >= 100) {
        ui.superBtn.classList.add('ready'); ui.superBtn.style.background = '#ffff00'; ui.superBtn.style.color = 'black';
    } else {
        ui.superBtn.classList.remove('ready');
        ui.superBtn.style.background = `conic-gradient(#ffff00 ${G.p.sup}%, #555 0)`; // Шкала
        ui.superBtn.style.color = 'rgba(255,255,255,0.5)';
    }

    // ПРОВЕРКА НА СТОЛКНОВЕНИЕ
    if (!G.showdown && aliveEnemies + 1 <= 2 && STATE.inGame) {
        G.showdown = true;
        ui.showdown.classList.remove('hidden');
        ui.showdown.style.animation = 'showdownAnim 3s forwards';
        
        // Эффект тряски
        screens.game.classList.add('shake');
        setTimeout(() => screens.game.classList.remove('shake'), 500);

        // Звук и музыка
        document.getElementById('battleMusic').pause();
        const sfx = document.getElementById('showdownSfx');
        const music = document.getElementById('showdownMusic');
        sfx.play().catch(()=>{});
        setTimeout(() => music.play().catch(()=>{}), 1000); // Музыка через секунду после гонга
    }

    if(G.p.dead || aliveEnemies === 0) {
        STATE.inGame = false;
        let rank = aliveEnemies + 1;
        let rewardTokens = 0;
        let rewardStar = 0;
        let trophyChange = 0;

        if (!G.p.dead) {
            rank = 1;
            rewardTokens = 10;
            rewardStar = 1;
            trophyChange = 10;
        } else if (rank === 2) rewardTokens = 8;
        else if (rank === 3) rewardTokens = 5;
        else if (rank === 4) rewardTokens = 3;
        
        // Расчет кубков
        const TROPHY_REWARDS = { 1:10, 2:8, 3:6, 4:4, 5:1, 6:-1, 7:-3, 8:-6, 9:-7, 10:-8 };
        trophyChange = TROPHY_REWARDS[rank] || -8;

        // Обновляем кубки конкретного бойца
        STATE.brawlerTrophies[G.p.t] = Math.max(0, (STATE.brawlerTrophies[G.p.t] || 0) + trophyChange);

        STATE.tokens += rewardTokens;
        STATE.starTokens += rewardStar;
        // STATE.trophies обновляется автоматически в updateMenu как сумма
        saveGame();

        // Музыка победы/поражения
        document.getElementById('battleMusic').pause();
        document.getElementById('showdownMusic').pause();
        const vicMusic = document.getElementById('victoryMusic');
        const defMusic = document.getElementById('defeatMusic');
        
        if (rank === 1) vicMusic.play().catch(()=>{});
        else defMusic.play().catch(()=>{});

        // Системное уведомление вместо внутриигрового UI
        setTimeout(() => {
            alert(`ИГРА ОКОНЧЕНА!\nМесто: ${rank}\nКубки: ${trophyChange > 0 ? '+' : ''}${trophyChange}\nНаграда: +${rewardTokens} токенов`);
            returnToMenu();
        }, 500); 
    } else gameLoopId = requestAnimationFrame(gameLoop);
    
    } catch (err) {
        console.error("GAME LOOP ERROR:", err);
        // Пытаемся продолжить игру, несмотря на ошибку
        gameLoopId = requestAnimationFrame(gameLoop);
    }
}

// Инициализация при загрузке (если уже был вход)
if (STATE.nickname) {
    updateMenu();
}

// ФУНКЦИЯ СПАВНА ШИПОВ СПАЙКА
function spawnSpikes(b) {
    // 6 шипов по кругу
    for(let i=0; i<6; i++) {
        let a = (Math.PI*2/6)*i + (Math.random()*0.5); // Небольшой рандом угла
        G.bul.push(new Bullet(b.x, b.y, Math.cos(a)*15, Math.sin(a)*15, 200, b.owner, 150)); // Урон 200
    }
}

// СИСТЕМА НОВОСТЕЙ
const NEWS_DATA = {
    latest: {
        title: "🔥 ОБНОВЛЕНИЕ v3.1",
        date: "27.12.2025",
        html: `
            <h1 style="color: #ffcc00; text-align: center;">БЕЗУМНЫЙ КАСКАДЁР! [v3.1]</h1>
            <p>Встречайте нового бойца и глобальные изменения баланса.</p>

            <h2 style="color: #0088ff; border-bottom: 2px solid #fff;">НОВЫЙ БОЕЦ: СТУ</h2>
            <div style="display:flex; align-items:center; gap:10px; background:rgba(0,0,0,0.3); padding:10px;">
                <img src="stu_avatar.png" style="width:60px; border:2px solid #0088ff">
                <div>
                    <strong>СТУ (Эпический)</strong><br>
                    • <strong>Атака:</strong> Два фейерверка, летящих по спирали.<br>
                    • <strong>Супер:</strong> Короткий рывок, оставляющий огненный след. Заряжается с 1 попадания!
                </div>
            </div>

            <h2 style="color: #00ff00; border-bottom: 2px solid #fff;">ИЗМЕНЕНИЯ БАЛАНСА</h2>
            <ul style="list-style: none; padding: 0;">
                <li style="margin-bottom: 5px;">🐻 <strong>НИТА:</strong> Урон атаки увеличен с 1200 до <span style="color:#00ff00">1300</span>.</li>
                <li style="margin-bottom: 5px;">🌵 <strong>СПАЙК:</strong> Урон атаки снижен до 750. Урон шипов снижен до 200.</li>
                <li style="margin-bottom: 5px;">🔫 <strong>КОЛЬТ:</strong> Урон пули увеличен до <span style="color:#00ff00">330</span>.</li>
                <li style="margin-bottom: 5px;">🦇 <strong>МОРТИС:</strong> Урон снижен до <span style="color:#ff4444">1350</span>.</li>
            </ul>

            <h2 style="color: #ff00ff; border-bottom: 2px solid #fff;">ГЕЙМПЛЕЙ</h2>
            <p>
                • <strong>Исцеление:</strong> Теперь восстанавливает % от ОБЩЕГО здоровья. Танки ликуют!<br>
                • <strong>Задержка атаки:</strong> Глобальный кулдаун увеличен до 0.45с.<br>
                • <strong>Боты:</strong> Улучшен ИИ ботов. Добавлены возможности уклонения от выстрелов; подбор кубов усиления.
            </p>
        `
    },
    upcoming: {
        title: "🔮 СКОРО",
        date: "???",
        html: `
            <h1 style="color: #00ffff; text-align: center;">ПЛАНЫ РАЗРАБОТКИ</h1>
            <p>Наша команда разработчиков продолжает работу над улучшением стабильности и качества проекта.</p>
            
            <h2 style="color: #ff00ff; border-bottom: 2px solid #fff;">ИСКУССТВЕННЫЙ ИНТЕЛЛЕКТ</h2>
            <p>Мы получили множество отзывов касательно поведения ботов. Ввиду этого, следующая неделя будет посвящена полной переработке и оптимизации алгоритмов ИИ. В связи с этим, выпуск контентных обновлений временно приостановлен для сосредоточения на качестве игрового процесса.</p>

            <h2 style="color: #ffff00; border-bottom: 2px solid #fff;">ВИЗУАЛ И ИНТЕРФЕЙС</h2>
            <p>Ведется активная работа над улучшением графической составляющей и пользовательского интерфейса. В планах — глобальное обновление UI, внедрение новых анимаций и расширение звукового сопровождения.</p>

            <h2 style="color: #00ff00; border-bottom: 2px solid #fff;">ROADMAP</h2>
            <p>В следующих крупных обновлениях ожидается:</p>
            <ul style="list-style: none; padding: 0;">
                <li>💎 Новые режимы: <strong>"Захват кристаллов"</strong> и <strong>"Парное столкновение"</strong>.</li>
                <li>🎁 Расширение наград на Пути Славы.</li>
                <li>🆕 Выход как минимум <strong>ДВУХ</strong> новых бойцов.</li>
            </ul>
            <p style="text-align: center; margin-top: 20px;">Благодарим за вашу поддержку!</p>
        `
    },
    old: {
        title: "📜 АРХИВ 24.12",
        date: "24.12.2025",
        html: `
            <h1 style="color: #aaa; text-align: center;">ГЛОБАЛЬНОЕ ОБНОВЛЕНИЕ v2.1</h1>
            <h2 style="color: #00ff00; border-bottom: 2px solid #fff;">НОВАЯ МЕХАНИКА ИГРЫ!</h2>
            <p><strong>* Добавлена система уровней бойцов.</strong><br>
            Отныне каждый боец имеет <strong>9 уровней силы</strong>. Добавлена валюта — <strong>"Очки силы"</strong>.</p>

            <h2 style="color: #00ff00; border-bottom: 2px solid #fff;">НОВЫЕ БОЙЦЫ</h2>
            <p>
                🌵 <span style="color: #ffff00; font-weight: bold;">СПАЙК</span> (Легендарный)<br>
                🦇 <span style="color: #ff0000; font-weight: bold;">МОРТИС</span> (Мифический)
            </p>

            <h2 style="color: #00ff00; border-bottom: 2px solid #fff;">БАЛАНС</h2>
            <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px; margin-bottom: 10px;">
                <h3 style="margin: 0; color: #a020f0;">ШЕЛЛИ</h3>
                • Здоровье: 6764 ед.<br>
                • Отталкивание противников Супером.
            </div>
            <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 5px; margin-bottom: 10px;">
                <h3 style="margin: 0; color: #e83e3e;">НИТА</h3>
                • Здоровье: 7020 ед.<br>
                • Урон атаки: 1077 ед.
            </div>

            <h2 style="color: #00ff00; border-bottom: 2px solid #fff;">ПРОЧЕЕ</h2>
            <ul style="list-style-type: disc; padding-left: 20px;">
                <li>Добавлены NickName'ы.</li>
                <li>Индивидуальная перезарядка.</li>
                <li>Расширено меню выбора бойцов.</li>
            </ul>
        `
    }
};

function renderNews(id) {
    const container = document.getElementById('newsContent');
    const tabs = document.getElementById('newsTabs');
    const data = NEWS_DATA[id];

    if (!data) return;

    // Рендер вкладок
    tabs.innerHTML = `
        <div class="news-tab ${id === 'latest' ? 'active' : ''}" onclick="renderNews('latest')">
            🔥 ОБНОВЛЕНИЕ
        </div>
        <div class="news-tab ${id === 'upcoming' ? 'active' : ''}" onclick="renderNews('upcoming')">
            🔮 АНОНСЫ
        </div>
        <div class="news-tab ${id === 'old' ? 'active' : ''}" onclick="renderNews('old')">
            📜 АРХИВ
        </div>
    `;

    // Рендер контента
    container.innerHTML = data.html;
    
    // Анимация появления
    container.style.opacity = 0;
    container.style.transform = 'translateY(20px)';
    setTimeout(() => {
        container.style.transition = 'all 0.3s ease-out';
        container.style.opacity = 1;
        container.style.transform = 'translateY(0)';
    }, 50);
}