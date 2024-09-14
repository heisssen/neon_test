const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

context.scale(20, 20);  // Scale the canvas for better visibility

// Load sound effects
const sounds = {
    move: new Audio('sounds/move.mp3'),
    rotate: new Audio('sounds/rotate.mp3'),
    drop: new Audio('sounds/drop.mp3'),
    clear: new Audio('sounds/clear.mp3'),
};

// Game state management
let isPaused = false;

// Create the game arena (grid)
function createMatrix(width, height) {
    const matrix = [];
    while (height--) {
        matrix.push(new Array(width).fill(0));
    }
    return matrix;
}

// Create tetromino pieces
function createPiece(type) {
    switch (type) {
        case 'T': return [[0, 0, 0], [5, 5, 5], [0, 5, 0]];
        case 'O': return [[7, 7], [7, 7]];
        case 'L': return [[0, 6, 0], [0, 6, 0], [0, 6, 6]];
        case 'J': return [[0, 4, 0], [0, 4, 0], [4, 4, 0]];
        case 'I': return [[0, 3, 0, 0], [0, 3, 0, 0], [0, 3, 0, 0], [0, 3, 0, 0]];
        case 'S': return [[0, 2, 2], [2, 2, 0], [0, 0, 0]];
        case 'Z': return [[1, 1, 0], [0, 1, 1], [0, 0, 0]];
    }
}

// Create a gradient for a tetromino block
function createGradient(type) {
    const gradient = context.createLinearGradient(0, 0, 1, 1);
    switch (type) {
        case 1: // Z block
            gradient.addColorStop(0, '#FF0D72');
            gradient.addColorStop(1, '#F538FF');
            break;
        case 2: // S block
            gradient.addColorStop(0, '#0DC2FF');
            gradient.addColorStop(1, '#3877FF');
            break;
        case 3: // I block
            gradient.addColorStop(0, '#0DFF72');
            gradient.addColorStop(1, '#24F05E');
            break;
        case 4: // J block
            gradient.addColorStop(0, '#F538FF');
            gradient.addColorStop(1, '#FF8E0D');
            break;
        case 5: // T block
            gradient.addColorStop(0, '#FF8E0D');
            gradient.addColorStop(1, '#FFE138');
            break;
        case 6: // L block
            gradient.addColorStop(0, '#FFE138');
            gradient.addColorStop(1, '#FFD700');
            break;
        case 7: // O block
            gradient.addColorStop(0, '#3877FF');
            gradient.addColorStop(1, '#0DC2FF');
            break;
    }
    return gradient;
}

// Draw the game state with enhanced graphics
function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawMatrix(arena, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.pos);
}

// Draw a matrix on the canvas with shadow and gradient effects
function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = createGradient(value);  // Use the gradient for the tetromino type
                context.strokeStyle = '#000';
                context.lineWidth = 0.05;
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
                context.strokeRect(x + offset.x, y + offset.y, 1, 1); // Draw border
                context.shadowColor = 'rgba(0, 0, 0, 0.5)';
                context.shadowBlur = 5;
            }
        });
    });
}

// Collision detection
function collide(arena, player) {
    const [matrix, offset] = [player.matrix, player.pos];
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < matrix[y].length; ++x) {
            if (matrix[y][x] !== 0 && (arena[y + offset.y] && arena[y + offset.y][x + offset.x]) !== 0) {
                return true;
            }
        }
    }
    return false;
}

// Merge the player's piece into the game arena
function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value;
            }
        });
    });
}

// Reset the player's piece
function playerReset() {
    const pieces = 'ILJOTSZ';
    player.matrix = createPiece(pieces[Math.floor(Math.random() * pieces.length)]);
    player.pos.y = 0;
    player.pos.x = (Math.floor(arena[0].length / 2)) - (Math.floor(player.matrix[0].length / 2));

    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0));  // Reset the game if the piece collides at the top
        player.score = 0;
        player.lines = 0;
        player.level = 1;
        dropInterval = 1000; // Reset speed
        updateScore();
    }
}

// Handle the piece drop
function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--;
        merge(arena, player);
        playerReset();
        arenaSweep();
        updateScore();
        checkSpeedIncrease();
    }
    dropCounter = 0;
    playSound('drop');
}

// Move the player's piece left or right
function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir;
    } else {
        playSound('move');
    }
}

// Rotate the player's piece
function playerRotate(dir) {
    const pos = player.pos.x;
    rotate(player.matrix, dir);
    let offset = 1;
    while (collide(arena, player)) {
        player.pos.x += offset;
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir);
            player.pos.x = pos;
            return;
        }
    }
    playSound('rotate');
}

// Rotate the matrix for piece rotation
function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [matrix[x][y], matrix[y][x]] = [matrix[y][x], matrix[x][y]];
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse());
    } else {
        matrix.reverse();
    }
}

// Clear filled rows and update the score
function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer;
            }
        }

        const row = arena.splice(y, 1)[0].fill(0);
        arena.unshift(row);
        ++y;

        player.score += rowCount * 10;
        player.lines++;
        rowCount *= 2;
        playSound('clear');  // Play clear sound on line removal
    }
}

// Check if the player has cleared enough lines to level up
function checkLevelUp() {
    if (player.lines >= player.level * 10) {  // Level up every 10 lines
        player.level++;
        dropInterval *= 0.9;  // Increase the speed by 10%
        updateLevel();
    }
}

// Increase speed based on score
function checkSpeedIncrease() {
    if (player.score >= player.level * 100) {  // Increase speed every 100 points
        dropInterval *= 0.9;
        displaySpeedIncrease();
    }
}

// Display speed increase notification
function displaySpeedIncrease() {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerText = 'Speed Increased!';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
}

// Update the score, lines, and level display
function updateScore() {
    document.getElementById('score').innerText = player.score;
    document.getElementById('lines').innerText = player.lines;
    document.getElementById('level').innerText = player.level;
}

// Play sound effects
function playSound(action) {
    if (sounds[action]) {
        sounds[action].currentTime = 0;
        sounds[action].play();
    }
}

// Toggle pause state
function togglePause() {
    isPaused = !isPaused;
    document.getElementById('pause').textContent = isPaused ? '▶️ Resume' : '⏸️ Pause';
    if (!isPaused) {
        update();  // Continue the game loop if resumed
    }
}

// Restart the game
function restartGame() {
    playerReset();
    updateScore();
    dropCounter = 0;
    dropInterval = 1000;
    isPaused = false;
    document.getElementById('pause').textContent = '⏸️ Pause';
    update();
}

// Main game loop
let dropCounter = 0;
let dropInterval = 1000;

let lastTime = 0;

function update(time = 0) {
    if (isPaused) return;  // Stop updating if the game is paused

    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop();
    }

    draw();
    requestAnimationFrame(update);
}

// Event listeners for desktop controls
document.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key.toLowerCase() === 'a') {
        playerMove(-1);
    } else if (event.key === 'ArrowRight' || event.key.toLowerCase() === 'd') {
        playerMove(1);
    } else if (event.key === 'ArrowDown' || event.key.toLowerCase() === 's') {
        playerDrop();
    } else if (event.key.toLowerCase() === 'q') {
        playerRotate(1);
    } else if (event.key === 'Escape') {
        togglePause();
    }
});

// Mobile controls
document.getElementById('left').addEventListener('click', () => playerMove(-1));
document.getElementById('right').addEventListener('click', () => playerMove(1));
document.getElementById('down').addEventListener('click', () => playerDrop());
document.getElementById('rotate').addEventListener('click', () => playerRotate(1));

// Game management controls
document.getElementById('pause').addEventListener('click', togglePause);
document.getElementById('restart').addEventListener('click', restartGame);

// Initialize the game arena and player state
const arena = createMatrix(12, 20);
const player = {
    pos: { x: 0, y: 0 },
    matrix: null,
    score: 0,
    lines: 0,
    level: 1
};

// Initialize the game state
playerReset();
updateScore();
update();  // Start the game loop
