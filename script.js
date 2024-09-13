const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');

context.scale(20, 20);  // Scale the canvas for better visibility

// Load sound effects
const sounds = {
    move: new Audio('sounds/move.mp3'),
    rotate: new Audio('sounds/rotate.mp3'),
    drop: new Audio('sounds/drop.mp3'),
};

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

// Draw the game state with enhanced graphics
function draw() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawMatrix(arena, { x: 0, y: 0 });
    drawMatrix(player.matrix, player.pos);
}

// Draw a matrix on the canvas with shadow and glow effects
function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                context.fillStyle = colors[value];
                context.shadowBlur = 10;
                context.shadowColor = colors[value];
                context.fillRect(x + offset.x, y + offset.y, 1, 1);
                context.shadowBlur = 0;  // Reset shadow
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
        checkLevelUp();
        addRandomObstacle();  // Occasionally add obstacles
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
    let offset = 1;
    rotate(player.matrix, dir);
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

// Occasionally add random obstacles to the grid
function addRandomObstacle() {
    if (Math.random() < 0.1) {  // 10% chance to add an obstacle after each piece placement
        const y = Math.floor(Math.random() * 5);  // Place near the top
        const x = Math.floor(Math.random() * arena[0].length);
        if (arena[y][x] === 0) {  // Only place if space is empty
            arena[y][x] = Math.floor(Math.random() * 7) + 1;  // Random color
        }
    }
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

// Main game loop
let dropCounter = 0;
let dropInterval = 1000;

let lastTime = 0;

function update(time = 0) {
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
    if (event.key === 'ArrowLeft') {
        playerMove(-1);
    } else if (event.key === 'ArrowRight') {
        playerMove(1);
    } else if (event.key === 'ArrowDown') {
        playerDrop();
    } else if (event.key === 'q') {
        playerRotate(-1);
    } else if (event.key === 'w') {
        playerRotate(1);
    }
});

// Mobile controls
document.getElementById('left').addEventListener('click', () => playerMove(-1));
document.getElementById('right').addEventListener('click', () => playerMove(1));
document.getElementById('down').addEventListener('click', () => playerDrop());
document.getElementById('rotate').addEventListener('click', () => playerRotate(1));

// Colors for tetrominoes
const colors = [
    null,
    '#FF0D72',
    '#0DC2FF',
    '#0DFF72',
    '#F538FF',
    '#FF8E0D',
    '#FFE138',
    '#3877FF',
];

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
