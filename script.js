// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

// Asset loading
const carImage = new Image();
carImage.src = 'assets/car.png';

const obstacleImage = new Image();
obstacleImage.src = 'assets/obstacle.png';

const boostImage = new Image();
boostImage.src = 'assets/boost.png';

const roadImage = new Image();
roadImage.src = 'assets/road.png';

const nitroSound = new Audio('assets/nitro.mp3');
const backgroundMusic = new Audio('assets/background-music.mp3');
backgroundMusic.loop = true;

// Game variables
let car = { ...initializeCar() };
let obstacles = [];
let speedBoosts = [];
let score = 0;
let level = 1;
let gameSpeed = 5;
let isNitroActive = false;
let gamePaused = false;
let gameRunning = false;

// Main menu and game over handling
function startGame() {
    document.getElementById('mainMenu').style.display = 'none';
    canvas.style.display = 'block';
    resetGame();
    backgroundMusic.play();
    gameLoop();
}

function showMainMenu() {
    document.getElementById('mainMenu').style.display = 'flex';
    document.getElementById('gameOverScreen').style.display = 'none';
    canvas.style.display = 'none';
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
}

function restartGame() {
    document.getElementById('gameOverScreen').style.display = 'none';
    canvas.style.display = 'block';
    resetGame();
    gameLoop();
}

function resetGame() {
    car = { ...initializeCar() };
    obstacles = [];
    speedBoosts = [];
    score = 0;
    level = 1;
    gameSpeed = 5;
    isNitroActive = false;
    gamePaused = false;
    gameRunning = true;
}

// Car initialization
function initializeCar() {
    return {
        x: canvas.width / 2 - 25,
        y: canvas.height - 150,
        width: 50,
        height: 100,
        speed: 5,
        maxSpeed: 12,
        nitroSpeed: 20,
        dx: 0,
        dy: 0,
        health: 100
    };
}

// Event listeners for controls
document.addEventListener('keydown', keyDown);
document.addEventListener('keyup', keyUp);

function keyDown(e) {
    if (!gameRunning) return;

    switch (e.key) {
        case 'ArrowRight':
        case 'd':
            car.dx = car.speed;
            break;
        case 'ArrowLeft':
        case 'a':
            car.dx = -car.speed;
            break;
        case 'ArrowUp':
        case 'w':
            car.dy = -car.speed;
            break;
        case 'ArrowDown':
        case 's':
            car.dy = car.speed;
            break;
        case ' ':
            activateNitro();
            break;
        case 'Escape':
            togglePause();
            break;
    }
}

function keyUp(e) {
    if (!gameRunning) return;

    if (['ArrowRight', 'd', 'ArrowLeft', 'a', 'ArrowUp', 'w', 'ArrowDown', 's'].includes(e.key)) {
        car.dx = 0;
        car.dy = 0;
    }
}

// Toggle pause
function togglePause() {
    gamePaused = !gamePaused;
    if (!gamePaused) {
        gameLoop();
    } else {
        displayPauseScreen();
    }
}

// Display pause screen
function displayPauseScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '40px Arial';
    ctx.fillText('Game Paused', canvas.width / 2 - 120, canvas.height / 2);
}

// Draw functions
function drawCar() {
    ctx.drawImage(carImage, car.x, car.y, car.width, car.height);
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.drawImage(obstacleImage, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        obstacle.y += gameSpeed;

        if (isColliding(car, obstacle)) {
            handleCollision();
        }
    });

    obstacles = obstacles.filter(obstacle => obstacle.y < canvas.height);
}

function drawSpeedBoosts() {
    speedBoosts.forEach(boost => {
        ctx.drawImage(boostImage, boost.x, boost.y, boost.width, boost.height);
        boost.y += gameSpeed;

        if (isColliding(car, boost)) {
            collectSpeedBoost();
            boost.collected = true;
        }
    });

    speedBoosts = speedBoosts.filter(boost => boost.y < canvas.height && !boost.collected);
}

let roadOffset = 0;
function drawRoad() {
    roadOffset += gameSpeed / 2;
    if (roadOffset > canvas.height) roadOffset = 0;

    ctx.drawImage(roadImage, 0, roadOffset - canvas.height, canvas.width, canvas.height);
    ctx.drawImage(roadImage, 0, roadOffset, canvas.width, canvas.height);
}

// Collision detection
function isColliding(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

// Handle collision
function handleCollision() {
    car.health -= 20;
    if (car.health <= 0) {
        gameOver();
    }
}

// Collect speed boost
function collectSpeedBoost() {
    car.speed = car.maxSpeed;
    setTimeout(() => {
        car.speed = 5;
    }, 3000);
}

// Activate nitro boost
function activateNitro() {
    if (!isNitroActive) {
        isNitroActive = true;
        nitroSound.play();
        car.speed = car.nitroSpeed;
        setTimeout(() => {
            car.speed = 5;
            isNitroActive = false;
        }, 2000);
    }
}

// Generate obstacles
function generateObstacles() {
    if (Math.random() < 0.05) {
        obstacles.push({
            x: Math.random() * (canvas.width - 50),
            y: -100,
            width: 50,
            height: 100,
        });
    }
}

// Generate speed boosts
function generateSpeedBoosts() {
    if (Math.random() < 0.01) {
        speedBoosts.push({
            x: Math.random() * (canvas.width - 30),
            y: -30,
            width: 30,
            height: 30,
            collected: false,
        });
    }
}

// Clear canvas
function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Update game objects
function update() {
    car.x += car.dx;
    car.y += car.dy;

    if (car.x < 0) car.x = 0;
    if (car.x + car.width > canvas.width) car.x = canvas.width - car.width;
    if (car.y < 0) car.y = 0;
    if (car.y + car.height > canvas.height) car.y = canvas.height - car.height;

    score += 1;
    if (score % 1000 === 0) {
        levelUp();
    }

    generateObstacles();
    generateSpeedBoosts();

    clear();
    drawRoad();
    drawCar();
    drawObstacles();
    drawSpeedBoosts();

    displayGameStats();
}

// Level up
function levelUp() {
    level += 1;
    gameSpeed += 1;
}

// Display game stats
function displayGameStats() {
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
    ctx.fillText(`Speed: ${car.speed}`, 10, 60);
    ctx.fillText(`Health: ${car.health}`, 10, 90);
    ctx.fillText(`Level: ${level}`, 10, 120);
}

// Handle game over
function gameOver() {
    gameRunning = false;
    document.getElementById('finalScore').textContent = `Your final score is ${score}`;
    document.getElementById('gameOverScreen').style.display = 'flex';
    canvas.style.display = 'none';
    backgroundMusic.pause();
}

// Game loop
function gameLoop() {
    if (!gamePaused && gameRunning) {
        update();
        requestAnimationFrame(gameLoop);
    }
}

