// --- Data & State ---
const symbols = ["💎", "👑", "🪙", "🍇", "🍉", "🍒", "🔔"]; 
const totalCells = 30; // 5 baris x 6 kolom
let balance = 0;
let username = "";
let isSpinning = false;
let cellElements = [];

// --- EFEK SUARA ---
const sfxClick = new Audio('sound/click.mp3');
const sfxSpin = new Audio('sound/spin.mp3');
const sfxWin = new Audio('sound/win.mp3');
const sfxJackpot = new Audio('sound/jackpot.mp3');
const sfxLose = new Audio('sound/lose2.mp3');

// Atur volume biar nggak bikin kaget
sfxSpin.volume = 0.5; 
sfxJackpot.volume = 0.8;

// Quotes Edukasi/Motivasi
const motivationalQuotes = [
    "Kekalahan ini membuktikan bahwa sistem selalu menang. Berhentilah sebelum kerugian semakin dalam.",
    "Judi tidak akan pernah membuatmu kaya, ia dirancang untuk mengambil uangmu.",
    "Bayangkan hal-hal baik yang bisa kamu beli dengan uang yang terbuang di sini. Sadarlah!",
    "Berapa banyak pun modalmu, akhirnya akan selalu sama: Nol."
];

// --- Elemen DOM ---
const loginScreen = document.getElementById('login-screen');
const gameScreen = document.getElementById('game-screen');
const bankruptModal = document.getElementById('bankrupt-modal');
const inputUsername = document.getElementById('username');
const inputInitialBalance = document.getElementById('initial-balance');
const btnStart = document.getElementById('btn-start');
const displayUser = document.getElementById('display-user');
const displayBalance = document.getElementById('display-balance');
const inputBet = document.getElementById('bet-amount');
const btnAllIn = document.getElementById('btn-all-in');
const btnSpin = document.getElementById('btn-spin');
const messageBoard = document.getElementById('message-board');
const jackpotDisplay = document.getElementById('jackpot-display');
const slotGrid = document.getElementById('slot-grid');
const motivationalText = document.getElementById('motivational-message');

// Render Grid Kosong Awal
for (let i = 0; i < totalCells; i++) {
    let cell = document.createElement('div');
    cell.classList.add('slot-cell');
    cell.innerText = "❓";
    slotGrid.appendChild(cell);
    cellElements.push(cell);
}

// Cek Sesi Sebelumnya
window.onload = () => {
    const savedUser = localStorage.getItem('slot_username');
    const savedBalance = localStorage.getItem('slot_balance');

    if (savedUser && savedBalance && parseInt(savedBalance) > 0) {
        username = savedUser;
        balance = parseInt(savedBalance);
        startGameUI();
    }
};

// Listeners
btnStart.addEventListener('click', () => {
    sfxClick.play();
    username = inputUsername.value.trim() || "Pemain Anonim";
    balance = parseInt(inputInitialBalance.value);
    localStorage.setItem('slot_username', username);
    localStorage.setItem('slot_balance', balance);
    startGameUI();
});

btnAllIn.addEventListener('click', () => {
    if(!isSpinning) {
        sfxClick.play();
        inputBet.value = balance;
    }
});

document.getElementById('btn-restart').addEventListener('click', () => {
    sfxClick.play();
    localStorage.clear();
    bankruptModal.classList.remove('active');
    gameScreen.classList.remove('active');
    loginScreen.classList.add('active');
    inputUsername.value = "";
    cellElements.forEach(cell => { cell.innerText = "❓"; cell.classList.remove('win-pop'); });
});

btnSpin.addEventListener('click', spinMachine);

function startGameUI() {
    loginScreen.classList.remove('active');
    gameScreen.classList.add('active');
    displayUser.innerText = username;
    updateBalanceUI();
}

function updateBalanceUI() {
    displayBalance.innerText = balance.toLocaleString('id-ID');
    localStorage.setItem('slot_balance', balance);
}

// --- LOGIKA UTAMA ---
function spinMachine() {
    if (isSpinning) return;
    let bet = parseInt(inputBet.value);

    if (isNaN(bet) || bet <= 0) { showMessage("Nominal taruhan tidak valid!", "#ff3366"); return; }
    if (bet > balance) { showMessage("Saldo tidak mencukupi!", "#ff3366"); return; }

    sfxClick.play();
    sfxSpin.currentTime = 0;
    sfxSpin.play();

    balance -= bet;
    updateBalanceUI();
    isSpinning = true;
    btnSpin.disabled = true;
    jackpotDisplay.classList.remove('show');
    cellElements.forEach(cell => cell.classList.remove('win-pop'));
    showMessage("Menarik tuas...", "#fff");

    cellElements.forEach(cell => cell.classList.add('spinning'));

    let finalGrid = generateFinalGrid();

    let spinTime = 0;
    const spinInterval = setInterval(() => {
        spinTime += 100;
        if (spinTime >= 1500) { 
            clearInterval(spinInterval);
            stopGrid(finalGrid, bet);
        }
    }, 100);
}

function generateFinalGrid() {
    let grid = [];
    const chance = Math.random() * 100;

    if (chance <= 4) { // Sedikit naikin chance jackpot biar gampang ngetesnya
        let winSymbol = symbols[Math.floor(Math.random() * symbols.length)];
        for(let i=0; i<12; i++) grid.push(winSymbol);
        for(let i=0; i<18; i++) grid.push(symbols[Math.floor(Math.random() * symbols.length)]);
    } else if (chance <= 20) {
        let winSymbol = symbols[Math.floor(Math.random() * symbols.length)];
        for(let i=0; i<9; i++) grid.push(winSymbol);
        for(let i=0; i<21; i++) grid.push(symbols[Math.floor(Math.random() * symbols.length)]);
    } else {
        for(let i=0; i<30; i++) grid.push(symbols[Math.floor(Math.random() * symbols.length)]);
    }
    return grid.sort(() => Math.random() - 0.5);
}

function stopGrid(finalGrid, bet) {
    cellElements.forEach((cell, index) => {
        setTimeout(() => {
            cell.classList.remove('spinning');
            cell.innerText = finalGrid[index];

            if (index === 29) {
                checkResult(finalGrid, bet);
            }
        }, index * 40);
    });
}

function checkResult(gridResult, bet) {
    isSpinning = false;
    btnSpin.disabled = false;
    sfxSpin.pause();

    let counts = {};
    gridResult.forEach(sym => { counts[sym] = (counts[sym] || 0) + 1; });

    let highestCount = 0;
    let winningSymbol = "";

    for (const [sym, count] of Object.entries(counts)) {
        if (count > highestCount) {
            highestCount = count;
            winningSymbol = sym;
        }
    }

    if (highestCount >= 8) {
        cellElements.forEach(cell => {
            if (cell.innerText === winningSymbol) cell.classList.add('win-pop');
        });

        if (highestCount >= 12) {
            // === MODIFIKASI DISINI (PANGGIL ANIMASI) ===
            sfxJackpot.play();
            triggerJackpotAnimation(); // <-- BARU: Panggil shower koin
            
            let winAmount = bet * 30;
            balance += winAmount;
            jackpotDisplay.innerText = "JACKPOT x30!";
            jackpotDisplay.classList.add('show');
            showMessage(`SUPER JACKPOT! Menang Rp ${winAmount.toLocaleString('id-ID')}`, "#FFCC00");
        } else if (highestCount >= 10) {
            sfxWin.play();
            let winAmount = bet * 10;
            balance += winAmount;
            showMessage(`BIG WIN! Menang Rp ${winAmount.toLocaleString('id-ID')}`, "#A8E063");
        } else {
            sfxWin.play();
            let winAmount = bet * 3;
            balance += winAmount;
            showMessage(`MENANG! Rp ${winAmount.toLocaleString('id-ID')}`, "#A8E063");
        }
    } else {
        sfxLose.play();
        showMessage(`Kalah. Hanya mendapat ${highestCount} simbol yang sama.`, "#FF416C");
    }

    updateBalanceUI();

    if (balance <= 0) {
        setTimeout(() => { 
            const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
            motivationalText.innerText = `"${randomQuote}"`;
            bankruptModal.classList.add('active'); 
        }, 1200);
    }
}

function showMessage(text, color) {
    messageBoard.innerText = text;
    messageBoard.style.color = color;
}

// =========================================
// BARU: FUNGSI ANIMASI JACKPOT (KOIN JATUH)
// =========================================
function triggerJackpotAnimation() {
    // 1. Buat kontainer overlay (kalau belum ada)
    let showerContainer = document.querySelector('.coin-shower-container');
    if (!showerContainer) {
        showerContainer = document.createElement('div');
        showerContainer.classList.add('coin-shower-container');
        document.body.appendChild(showerContainer);
    }

    // List simbol yang bakal dijatuhin (pake emoji biar gampang)
    const moneySymbols = ["💰", "🪙", "💵", "🤑", "💎"];
    
    // Jumlah elemen yang mau dibuat
    const particleCount = 60; 

    for (let i = 0; i < particleCount; i++) {
        // Buat elemen koin
        const coin = document.createElement('div');
        coin.classList.add('falling-coin');
        
        // Pilih simbol acak
        coin.innerText = moneySymbols[Math.floor(Math.random() * moneySymbols.length)];

        // --- ACAK POSISI & DURASI VIA JS ---
        
        // Posisi horizontal acak (0% - 100% lebar layar)
        const randomLeft = Math.random() * 100;
        
        // Durasi jatuh acak (antara 3 sampai 6 detik) biar gak seragam
        const randomDuration = 3 + Math.random() * 3;
        
        // Delay mulai acak (antara 0 sampai 2 detik) biar gak jatuh barengan
        const randomDelay = Math.random() * 2;
        
        // Ukuran acak (scale 0.7 sampai 1.5)
        const randomScale = 0.7 + Math.random() * 0.8;
        
        // Efek putar dan geser acak di akhir animasi (via CSS Variable)
        const randomRotateEnd = (Math.random() - 0.5) * 720; // muter antara -360 sampe +360 derajat
        const randomTranslateEnd = (Math.random() - 0.5) * 200; // geser kiri-kanan dikit pas jatuh

        // Terapkan style acak
        coin.style.left = `${randomLeft}%`;
        coin.style.animationDuration = `${randomDuration}s`;
        coin.style.animationDelay = `${randomDelay}s`;
        coin.style.transform = `scale(${randomScale})`;
        
        // Inject acakan putaran/geseran ke dalam keyframe CSS via inline style
        coin.style.setProperty('--end-rotate', `${randomRotateEnd}deg`);
        coin.style.setProperty('--end-translate', `${randomTranslateEnd}px`);

        // Masukin ke kontainer
        showerContainer.appendChild(coin);

        // 2. Hapus elemen setelah animasinya selesai (biar gak ngeberatin memori)
        coin.addEventListener('animationend', () => {
            coin.remove();
            // Kalau kontainer udah kosong, hapus kontainernya juga
            if (showerContainer.children.length === 0) {
                showerContainer.remove();
            }
        });
    }
}