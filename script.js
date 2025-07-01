// --- Setup ---
const mainMenu = document.getElementById('mainMenu');
const gameContainer = document.getElementById('gameContainer');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreElement = document.getElementById('score');
const gameOverModal = document.getElementById('gameOverModal');
const finalScoreElement = document.getElementById('finalScore');

const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const exitButton = document.getElementById('exitButton');
const menuButton = document.getElementById('menuButton');
const easyBtn = document.getElementById('easyBtn');
const normalBtn = document.getElementById('normalBtn');
const hardBtn = document.getElementById('hardBtn');
const modeButtons = [easyBtn, normalBtn, hardBtn];

const scale = window.devicePixelRatio;
let canvasSize;

function setupCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvasSize = rect.width;
    canvas.width = canvasSize * scale;
    canvas.height = canvasSize * scale;
    ctx.scale(scale, scale);
}
window.addEventListener('resize', setupCanvas);

// --- Game State ---
const gridSize = 30; 
let snake, food, score, dx, dy, speed, changingDirection, gameActive, gameMode;

// --- Sound Synthesis using Tone.js ---
const eatSound = new Tone.Synth().toDestination();
const dieSound = new Tone.MembraneSynth().toDestination();

const musicSynth = new Tone.FMSynth({
    harmonicity: 1.5,
    modulationIndex: 1.2,
    oscillator: { type: "sine" },
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.1, release: 0.1 },
    modulation: { type: "triangle" },
    modulationEnvelope: { attack: 0.2, decay: 0.1, sustain: 0.3, release: 0.1 }
}).toDestination();
musicSynth.volume.value = -20; // Keep music in the background

const notes = ["C3", "E3", "G3", "B3", "C4", "B3", "G3", "E3"];
let noteIndex = 0;
const backgroundMusic = new Tone.Loop(time => {
    let note = notes[noteIndex % notes.length];
    musicSynth.triggerAttackRelease(note, "8n", time);
    noteIndex++;
}, "4n");


function playEatSound() { eatSound.triggerAttackRelease("C5", "8n"); }
function playDieSound() {
     stopMusic();
     dieSound.triggerAttackRelease("C2", "4n"); 
}

function startMusic() {
    noteIndex = 0;
    if (Tone.Transport.state !== 'started') {
        Tone.Transport.start();
    }
    if (backgroundMusic.state !== 'started') {
        backgroundMusic.start(0);
    }
}

function stopMusic() {
    if (Tone.Transport.state !== 'stopped') {
        Tone.Transport.stop();
    }
     if (backgroundMusic.state !== 'stopped') {
        backgroundMusic.stop();
    }
}

// --- Game Initialization ---
function setGameMode(mode) {
    gameMode = mode;
    modeButtons.forEach(btn => btn.classList.remove('selected-mode'));
    if (mode === 'easy') easyBtn.classList.add('selected-mode');
    if (mode === 'normal') normalBtn.classList.add('selected-mode');
    if (mode === 'hard') hardBtn.classList.add('selected-mode');
}

function startGame() {
    switch(gameMode) {
        case 'easy': speed = 200; break;
        case 'normal': speed = 150; break;
        case 'hard': speed = 100; break;
        default: speed = 150;
    }

    snake = [{ x: Math.floor(gridSize / 2), y: Math.floor(gridSize / 2) }];
    score = 0;
    dx = 1; dy = 0;
    changingDirection = false;
    gameActive = true;

    scoreElement.textContent = score;
    gameOverModal.style.display = 'none';
    mainMenu.style.display = 'none';
    gameContainer.style.display = 'flex';
    setupCanvas();
    generateFood();
    startMusic();
    main();
}

function main() {
    if (!gameActive) return;
    setTimeout(() => {
        changingDirection = false;
        clearCanvas();
        drawFood();
        moveSnake();
        drawSnake();
        main();
    }, speed);
}

// --- Drawing Functions ---
function clearCanvas() {
    ctx.fillStyle = '#2d3748';
    ctx.fillRect(0, 0, canvasSize, canvasSize);
}

function drawSnake() {
    const partSize = canvasSize / gridSize;
    snake.forEach((segment, index) => {
        let segmentRadius = partSize / 2;
        if (index > 0) {
            const tailTaper = (snake.length - index) / snake.length;
            segmentRadius = (partSize / 2) * Math.max(tailTaper, 0.7);
            ctx.fillStyle = '#38a169';
        } else {
            ctx.fillStyle = '#48bb78';
            segmentRadius = partSize / 2 * 1.05;
        }
        ctx.beginPath();
        ctx.arc(segment.x * partSize + partSize / 2, segment.y * partSize + partSize / 2, segmentRadius, 0, 2 * Math.PI);
        ctx.fill();
    });
    const head = snake[0];
    ctx.fillStyle = '#FFFFFF';
    const eyeSize = partSize / 4;
    const pupilSize = partSize / 9;
    let eye1_x, eye1_y, eye2_x, eye2_y;
    const offset = partSize / 4.5;
    if (dx === 1) { eye1_x = head.x * partSize + partSize / 2; eye1_y = head.y * partSize + partSize / 2 - offset; eye2_x = head.x * partSize + partSize / 2; eye2_y = head.y * partSize + partSize / 2 + offset; } 
    else if (dx === -1) { eye1_x = head.x * partSize + partSize / 2; eye1_y = head.y * partSize + partSize / 2 - offset; eye2_x = head.x * partSize + partSize / 2; eye2_y = head.y * partSize + partSize / 2 + offset; } 
    else if (dy === 1) { eye1_x = head.x * partSize + partSize / 2 - offset; eye1_y = head.y * partSize + partSize / 2; eye2_x = head.x * partSize + partSize / 2 + offset; eye2_y = head.y * partSize + partSize / 2; } 
    else { eye1_x = head.x * partSize + partSize / 2 - offset; eye1_y = head.y * partSize + partSize / 2; eye2_x = head.x * partSize + partSize / 2 + offset; eye2_y = head.y * partSize + partSize / 2; }
    ctx.beginPath(); ctx.arc(eye1_x, eye1_y, eyeSize, 0, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(eye2_x, eye2_y, eyeSize, 0, 2 * Math.PI); ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath(); ctx.arc(eye1_x, eye1_y, pupilSize, 0, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(eye2_x, eye2_y, pupilSize, 0, 2 * Math.PI); ctx.fill();
}

const fruitEmojis = ['🍎', '🍇', '🍉', '🍓', '🍌', '🍒'];
let currentFruit;

function generateFood() {
    let foodX, foodY;
    while (true) {
        foodX = Math.floor(Math.random() * gridSize);
        foodY = Math.floor(Math.random() * gridSize);
        if (!snake.some(part => part.x === foodX && part.y === foodY)) break;
    }
    food = { x: foodX, y: foodY };
    currentFruit = fruitEmojis[Math.floor(Math.random() * fruitEmojis.length)];
}

function drawFood() {
    const partSize = canvasSize / gridSize;
    ctx.font = `${partSize}px Poppins`; 
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(currentFruit, food.x * partSize + partSize / 2, food.y * partSize + partSize / 2);
}

// --- Game Logic ---
function moveSnake() {
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };
    snake.unshift(head);
    if (hasGameEnded(head)) {
        gameActive = false;
        playDieSound();
        finalScoreElement.textContent = score;
        gameOverModal.style.display = 'flex';
        return;
    }
    if (snake[0].x === food.x && snake[0].y === food.y) {
        score += 10;
        scoreElement.textContent = score;
        if (speed > 70) speed -= 3;
        playEatSound();
        generateFood();
    } else {
        snake.pop();
    }
}

function hasGameEnded(head) {
    for (let i = 4; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) return true;
    }
    return head.x < 0 || head.x >= gridSize || head.y < 0 || head.y >= gridSize;
}

// --- Input & Event Handling ---
function changeDirection(event) {
    if (changingDirection) return;
    changingDirection = true;
    const keyPressed = event.key;
    const goingUp = dy === -1, goingDown = dy === 1;
    const goingRight = dx === 1, goingLeft = dx === -1;
    if ((keyPressed === "ArrowLeft" || keyPressed === "a") && !goingRight) { dx = -1; dy = 0; }
    if ((keyPressed === "ArrowUp" || keyPressed === "w") && !goingDown) { dx = 0; dy = -1; }
    if ((keyPressed === "ArrowRight" || keyPressed === "d") && !goingLeft) { dx = 1; dy = 0; }
    if ((keyPressed === "ArrowDown" || keyPressed === "s") && !goingUp) { dx = 0; dy = 1; }
}

function handleTouch(direction) {
     if (changingDirection) return;
     changingDirection = true;
     const goingUp = dy === -1, goingDown = dy === 1;
     const goingRight = dx === 1, goingLeft = dx === -1;
     if (direction === 'left' && !goingRight) { dx = -1; dy = 0; }
     if (direction === 'up' && !goingDown) { dx = 0; dy = -1; }
     if (direction === 'right' && !goingLeft) { dx = 1; dy = 0; }
     if (direction === 'down' && !goingUp) { dx = 0; dy = 1; }
}

function showMenu() {
    gameActive = false;
    stopMusic();
    gameContainer.style.display = 'none';
    gameOverModal.style.display = 'none';
    mainMenu.style.display = 'flex';
}

// --- Event Listeners ---
document.addEventListener("keydown", changeDirection);
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);
exitButton.addEventListener('click', showMenu);
menuButton.addEventListener('click', showMenu);

easyBtn.addEventListener('click', () => setGameMode('easy'));
normalBtn.addEventListener('click', () => setGameMode('normal'));
hardBtn.addEventListener('click', () => setGameMode('hard'));

document.getElementById('up').addEventListener('click', () => handleTouch('up'));
document.getElementById('down').addEventListener('click', () => handleTouch('down'));
document.getElementById('left').addEventListener('click', () => handleTouch('left'));
document.getElementById('right').addEventListener('click', () => handleTouch('right'));

// --- Start the app ---
window.onload = () => {
     document.body.addEventListener('click', async () => {
        if(Tone.context.state !== 'running') {
            await Tone.start();
            console.log('Audio context started');
        }
     }, { once: true });
    setGameMode('normal'); // Default to normal mode
    showMenu();
};