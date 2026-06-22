// DiceFall - Domino Tetris Roguelike Game Logic

// Game Constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30; // Grid cell size in pixels

// Audio-visual FX variables
let screenShakeTime = 0;
const SCREEN_SHAKE_DURATION = 15; // frames

// Game Variables
let canvas, ctx;
let nextCanvas, nextCtx;
let board = [];
let score = 0;
let linesCompleted = 0;
let level = 1;
let currentPiece = null;
let nextPiece = null;
let isPaused = false;
let isGameOver = false;
let activeScreen = 'menu'; // 'menu', 'game', 'gameover'
let fontLoaded = false;

// Game Loop Timing
let lastTime = 0;
let dropCounter = 0;
let dropInterval = 800; // ms per drop (decreases with level)

// Animations
let isClearingAnimation = false;
let clearAnimationTimer = 0;
const CLEAR_ANIMATION_DURATION = 30; // frames (approx 500ms)
let matchingCells = []; // Cells marked for flashing and scoring
let rowsToClear = [];
let particles = []; // Particle FX active on board

// Tetromino matrices (0 represents empty space, 1 represents a block)
const SHAPES = {
    'I': [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    'O': [
        [1, 1],
        [1, 1]
    ],
    'T': [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    'S': [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
    ],
    'Z': [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
    ],
    'J': [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    'L': [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
    ]
};

// Govea Games SVG mark and Splash implementation
function getGoveaMarkSVG(size, uid) {
    return `
    <svg class="govea-mark" width="${size}" height="${size}" viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <path class="gv-hex" d="M60 10 L103 35 V85 L60 110 L17 85 V35 Z"
        stroke="#ffffff" stroke-width="5" stroke-linejoin="round"/>
      <path class="gv-g" d="M80 45 A 26 26 0 1 0 86 64 L 62 64"
        stroke="#ffffff" stroke-width="8" stroke-linecap="round"/>
      <path class="gv-spark" d="M88 30 l2.6 6.4 6.4 2.6 -6.4 2.6 -2.6 6.4 -2.6 -6.4 -6.4 -2.6 6.4 -2.6 Z"
        fill="#ffffff"/>
    </svg>`;
}

class GoveaSplash {
    constructor(parent) {
        const el = document.createElement('div');
        el.className = 'splash';
        el.innerHTML = `
          <div class="splash-inner">
            ${getGoveaMarkSVG(132, 'sp')}
            <div class="splash-word">GOVEA<span>GAMES</span></div>
            <div class="splash-presents">apresenta</div>
          </div>
          <div class="splash-shine"></div>
          <div class="splash-foot">
            <div class="splash-skip">toque para pular</div>
          </div>
        `;
        parent.appendChild(el);
        this.root = el;
        
        this.finished = new Promise(res => {
            this.done = res;
        });
        
        el.addEventListener('pointerdown', () => this.triggerDone(), { once: true });
        this.timer = 0;
    }

    triggerDone() {
        if (this.done) {
            this.done();
            this.done = null;
        }
    }

    play() {
        this.timer = window.setTimeout(() => this.triggerDone(), 3200);
        return this.finished;
    }

    async fadeOut() {
        window.clearTimeout(this.timer);
        this.root.classList.add('out');
        await new Promise(res => setTimeout(res, 480));
    }

    dispose() {
        this.root.remove();
    }
}

// Initialize Game
window.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('board-canvas');
    ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    
    nextCanvas = document.getElementById('next-canvas');
    nextCtx = nextCanvas.getContext('2d');
    nextCtx.imageSmoothingEnabled = false;

    // 1) Initialize the Govea Games Splash Screen
    const parentContainer = document.getElementById('game-container');
    const splash = new GoveaSplash(parentContainer);

    // 2) Create promises for loading font
    let fontPromise;
    if (document.fonts) {
        fontPromise = document.fonts.ready.then(() => {
            fontLoaded = true;
            console.log("Dicier fonts loaded successfully!");
        }).catch(err => {
            console.error("Font loading failed, falling back to numbers:", err);
            fontLoaded = true; // Fallback to basic numbers
        });
    } else {
        fontLoaded = true;
        fontPromise = Promise.resolve();
    }

    // 3) Promise.all: Wait for splash screen duration AND font to load
    Promise.all([splash.play(), fontPromise]).then(async () => {
        await splash.fadeOut();
        splash.dispose();
        
        // Show main menu and draw background
        showScreen('menu');
    });

    initButtonListeners();
    initKeyListeners();
    initMobileControls();
    
    // Setup empty board
    resetBoard();
});

// Setup Game Screen Transitions
function showScreen(screenId) {
    activeScreen = screenId;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    if (screenId === 'menu') {
        document.getElementById('menu-screen').classList.add('active');
        drawMenuBackground();
    } else if (screenId === 'game') {
        document.getElementById('game-screen').classList.add('active');
        startGame();
    } else if (screenId === 'gameover') {
        document.getElementById('game-over-screen').classList.add('active');
        document.getElementById('final-score').innerText = padZero(score, 6);
        document.getElementById('final-lines').innerText = linesCompleted;
    }
}

// Reset Board Array
function resetBoard() {
    board = [];
    for (let r = 0; r < ROWS; r++) {
        board[r] = [];
        for (let c = 0; c < COLS; c++) {
            board[r][c] = null;
        }
    }
}

// Button Click Handlers
function initButtonListeners() {
    document.getElementById('btn-start').addEventListener('click', () => showScreen('game'));
    document.getElementById('btn-how-to').addEventListener('click', () => {
        document.getElementById('how-to-modal').classList.add('active');
    });
    document.getElementById('btn-close-modal').addEventListener('click', () => {
        document.getElementById('how-to-modal').classList.remove('active');
    });
    document.getElementById('btn-menu-back').addEventListener('click', () => {
        isPaused = true;
        if (confirm("Quer mesmo sair do jogo e perder o progresso?")) {
            showScreen('menu');
        } else {
            isPaused = false;
        }
    });
    document.getElementById('btn-restart').addEventListener('click', () => showScreen('game'));
    document.getElementById('btn-game-over-menu').addEventListener('click', () => showScreen('menu'));
}

// Keyboard Input Handler
function initKeyListeners() {
    document.addEventListener('keydown', event => {
        if (activeScreen !== 'game' || isPaused || isGameOver || isClearingAnimation) return;

        switch (event.code) {
            case 'ArrowLeft':
            case 'KeyA':
                movePiece(-1);
                break;
            case 'ArrowRight':
            case 'KeyD':
                movePiece(1);
                break;
            case 'ArrowDown':
            case 'KeyS':
                movePieceDown();
                dropCounter = 0; // Prevent instant double-drop
                break;
            case 'ArrowUp':
            case 'KeyW':
                rotatePiece();
                break;
            case 'Space':
                hardDrop();
                break;
            case 'KeyP':
                isPaused = !isPaused;
                break;
        }
    });
}

// Mobile Touch Controls Handler
function initMobileControls() {
    const handleTouch = (btnId, action) => {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (activeScreen !== 'game' || isPaused || isGameOver || isClearingAnimation) return;
            action();
        });
    };

    handleTouch('ctrl-left', () => movePiece(-1));
    handleTouch('ctrl-right', () => movePiece(1));
    handleTouch('ctrl-rotate', () => rotatePiece());
    handleTouch('ctrl-down', () => movePieceDown());
    handleTouch('ctrl-drop', () => hardDrop());
}

// Start Game Settings
function startGame() {
    resetBoard();
    score = 0;
    linesCompleted = 0;
    level = 1;
    dropInterval = 800;
    isPaused = false;
    isGameOver = false;
    isClearingAnimation = false;
    matchingCells = [];
    rowsToClear = [];
    particles = [];
    
    updateScoreUI();
    
    // Generate initial pieces
    nextPiece = generatePiece();
    spawnPiece();
    
    lastTime = performance.now();
    requestAnimationFrame(update);
}

// Pad scores with leading zeros
function padZero(num, size) {
    let s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
}

function updateScoreUI() {
    document.getElementById('val-score').innerText = padZero(score, 6);
    document.getElementById('val-lines').innerText = linesCompleted;
    document.getElementById('val-level').innerText = level;
}

// Piece Class constructor
function generatePiece() {
    const keys = Object.keys(SHAPES);
    const type = keys[Math.floor(Math.random() * keys.length)];
    const shape = SHAPES[type];
    
    // Create random values (1-6) for the tetromino's blocks
    // In Tetris, a tetromino has exactly 4 blocks.
    // We group them into 2 dominoes: 
    // Domino A = block 0 and 1
    // Domino B = block 2 and 3
    const dominoAId = 'dom_' + Math.random().toString(36).substr(2, 9);
    const dominoBId = 'dom_' + Math.random().toString(36).substr(2, 9);
    
    // Generate values
    const valA1 = Math.floor(Math.random() * 6) + 1; // 1-6
    const valA2 = Math.floor(Math.random() * 6) + 1;
    const valB1 = Math.floor(Math.random() * 6) + 1;
    const valB2 = Math.floor(Math.random() * 6) + 1;

    let blockCount = 0;
    const matrix = [];
    
    for (let r = 0; r < shape.length; r++) {
        matrix[r] = [];
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c] === 1) {
                // Map first 2 blocks to Domino A, next 2 to Domino B
                const isDominoA = blockCount < 2;
                matrix[r][c] = {
                    val: isDominoA ? (blockCount === 0 ? valA1 : valA2) : (blockCount === 2 ? valB1 : valB2),
                    dom: isDominoA ? dominoAId : dominoBId,
                    color: isDominoA ? '#ffffff' : '#e0e0e0', // Slightly offset shades for visual groupings
                    match: false,
                    flash: false
                };
                blockCount++;
            } else {
                matrix[r][c] = null;
            }
        }
    }
    
    return {
        matrix: matrix,
        x: 0,
        y: 0,
        type: type,
        dominoes: {
            A: { val1: valA1, val2: valA2 },
            B: { val1: valB1, val2: valB2 }
        }
    };
}

// Spawn falling piece
function spawnPiece() {
    currentPiece = nextPiece;
    // Position piece in the top center
    currentPiece.x = Math.floor((COLS - currentPiece.matrix[0].length) / 2);
    currentPiece.y = 0;
    
    // Generate next piece
    nextPiece = generatePiece();
    updateNextPieceUI();
    
    // Check if new piece immediately collides (Game Over)
    if (checkCollision(currentPiece, 0, 0)) {
        isGameOver = true;
        showScreen('gameover');
    }
}

// Update Next Piece Preview in sidebar
function updateNextPieceUI() {
    if (!nextCanvas || !nextCtx) return;
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    
    if (!nextPiece) return;
    
    const matrix = nextPiece.matrix;
    const size = matrix.length;
    
    // Find bounding box of active cells to center it
    let minR = size, maxR = -1, minC = size, maxC = -1;
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (matrix[r][c] !== null) {
                if (r < minR) minR = r;
                if (r > maxR) maxR = r;
                if (c < minC) minC = c;
                if (c > maxC) maxC = c;
            }
        }
    }
    
    if (maxR === -1) return;
    
    const pWidth = (maxC - minC + 1);
    const pHeight = (maxR - minR + 1);
    
    const blockSize = 20; // fit nicely in 100x100
    const startX = (nextCanvas.width - pWidth * blockSize) / 2;
    const startY = (nextCanvas.height - pHeight * blockSize) / 2;
    
    // Draw background grid for the preview
    nextCtx.strokeStyle = '#141414';
    nextCtx.lineWidth = 1;
    for (let x = 0; x <= pWidth; x++) {
        nextCtx.beginPath();
        nextCtx.moveTo(startX + x * blockSize, startY);
        nextCtx.lineTo(startX + x * blockSize, startY + pHeight * blockSize);
        nextCtx.stroke();
    }
    for (let y = 0; y <= pHeight; y++) {
        nextCtx.beginPath();
        nextCtx.moveTo(startX, startY + y * blockSize);
        nextCtx.lineTo(startX + pWidth * blockSize, startY + y * blockSize);
        nextCtx.stroke();
    }
    
    // Draw cells using Dicier font
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            const cell = matrix[r][c];
            if (cell !== null) {
                const drawX = (c - minC);
                const drawY = (r - minR);
                const px = startX + drawX * blockSize;
                const py = startY + drawY * blockSize;
                
                nextCtx.fillStyle = '#ffffff';
                nextCtx.font = `${blockSize - 2}px Dicier`;
                nextCtx.textAlign = 'center';
                nextCtx.textBaseline = 'middle';
                nextCtx.fillText(cell.val.toString(), px + blockSize / 2, py + blockSize / 2);
            }
        }
    }
    
    // Draw domino outlines for next piece
    nextCtx.strokeStyle = '#ffffff';
    nextCtx.lineWidth = 1.2;
    
    const blocks = [];
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (matrix[r][c] !== null) {
                blocks.push({ r, c, cell: matrix[r][c] });
            }
        }
    }
    
    for (let i = 0; i < blocks.length; i++) {
        for (let j = i + 1; j < blocks.length; j++) {
            const b1 = blocks[i];
            const b2 = blocks[j];
            
            if (b1.cell.dom === b2.cell.dom) {
                const drawX1 = b1.c - minC;
                const drawY1 = b1.r - minR;
                const drawX2 = b2.c - minC;
                const drawY2 = b2.r - minR;
                
                const px1 = startX + drawX1 * blockSize;
                const py1 = startY + drawY1 * blockSize;
                const px2 = startX + drawX2 * blockSize;
                const py2 = startY + drawY2 * blockSize;
                
                if (drawY1 === drawY2 && Math.abs(drawX1 - drawX2) === 1) {
                    const minPX = Math.min(px1, px2);
                    nextCtx.strokeRect(minPX + 1, py1 + 1, blockSize * 2 - 2, blockSize - 2);
                } else if (drawX1 === drawX2 && Math.abs(drawY1 - drawY2) === 1) {
                    const minPY = Math.min(py1, py2);
                    nextCtx.strokeRect(px1 + 1, minPY + 1, blockSize - 2, blockSize * 2 - 2);
                }
            }
        }
    }
}

// Movement left/right
function movePiece(dir) {
    currentPiece.x += dir;
    if (checkCollision(currentPiece, 0, 0)) {
        currentPiece.x -= dir; // Revert
    }
}

// Soft drop logic
function movePieceDown() {
    currentPiece.y += 1;
    if (checkCollision(currentPiece, 0, 0)) {
        currentPiece.y -= 1; // Revert
        mergePiece();
        checkCompletedLines();
        return false;
    }
    return true;
}

// Hard drop (drop instantly to bottom)
function hardDrop() {
    while (movePieceDown()) {
        // Drop until hit block
    }
    screenShakeTime = 5; // Small drop shake
}

// Rotate Piece Matrix (90 deg clockwise)
function rotatePiece() {
    const matrix = currentPiece.matrix;
    const N = matrix.length;
    const rotated = Array(N).fill(null).map(() => Array(N).fill(null));
    
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            rotated[c][N - 1 - r] = matrix[r][c];
        }
    }
    
    // Wall kick: if rotation hits wall, try shifting piece left/right to fit
    const originalMatrix = currentPiece.matrix;
    const originalX = currentPiece.x;
    currentPiece.matrix = rotated;
    
    let shift = 0;
    while (checkCollision(currentPiece, 0, 0) && Math.abs(shift) < 3) {
        shift = shift >= 0 ? -shift - 1 : -shift; // 0, -1, 1, -2, 2
        currentPiece.x = originalX + shift;
    }
    
    // If it still collides after kick, revert rotation
    if (checkCollision(currentPiece, 0, 0)) {
        currentPiece.matrix = originalMatrix;
        currentPiece.x = originalX;
    }
}

// Check if piece matrix collides with grid or walls
function checkCollision(piece, offsetX, offsetY, matrix = piece.matrix) {
    for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
            if (matrix[r][c] !== null) {
                const boardX = piece.x + c + offsetX;
                const boardY = piece.y + r + offsetY;
                
                if (boardX < 0 || boardX >= COLS || boardY >= ROWS) {
                    return true;
                }
                
                if (boardY >= 0 && board[boardY][boardX] !== null) {
                    return true;
                }
            }
        }
    }
    return false;
}

// Lock piece into board
function mergePiece() {
    for (let r = 0; r < currentPiece.matrix.length; r++) {
        for (let c = 0; c < currentPiece.matrix[r].length; c++) {
            const cell = currentPiece.matrix[r][c];
            if (cell !== null) {
                const boardX = currentPiece.x + c;
                const boardY = currentPiece.y + r;
                if (boardY >= 0) {
                    board[boardY][boardX] = {
                        val: cell.val,
                        dom: cell.dom,
                        color: cell.color,
                        match: false,
                        flash: false
                    };
                }
            }
        }
    }
}

// Identify completed lines and search for adjacent matching values
function checkCompletedLines() {
    rowsToClear = [];
    for (let r = ROWS - 1; r >= 0; r--) {
        let isFull = true;
        for (let c = 0; c < COLS; c++) {
            if (board[r][c] === null) {
                isFull = false;
                break;
            }
        }
        if (isFull) {
            rowsToClear.push(r);
        }
    }
    
    if (rowsToClear.length > 0) {
        // Scan board for matching adjacent values connected to these lines
        findAdjacentMatches();
        
        if (matchingCells.length > 0) {
            // Trigger clear animation (flashing matched cells)
            isClearingAnimation = true;
            clearAnimationTimer = CLEAR_ANIMATION_DURATION;
            screenShakeTime = SCREEN_SHAKE_DURATION;
        } else {
            // Normal clear if no domino combinations were found
            clearRows();
            spawnPiece();
        }
    } else {
        spawnPiece();
    }
}

// Find adjacent cells with same values where BOTH cells lie on a completed row
function findAdjacentMatches() {
    matchingCells = [];
    const matchedKeys = new Set();
    
    const rowsSet = new Set(rowsToClear);
    
    // Only check rightward and downward to visit each edge once
    const dirs = [
        [0, 1],  // right
        [1, 0],  // down
    ];
    
    // Only iterate over completed rows to stay strict
    for (const r of rowsSet) {
        for (let c = 0; c < COLS; c++) {
            const cell = board[r][c];
            if (cell === null) continue;
            
            for (const [dr, dc] of dirs) {
                const nr = r + dr;
                const nc = c + dc;
                
                if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
                
                // Neighbor must also be in a completed row
                if (!rowsSet.has(nr)) continue;
                
                const neighbor = board[nr][nc];
                if (neighbor === null) continue;
                
                // Score only when values are identical AND both cells are in completed rows
                if (cell.val === neighbor.val) {
                    // Canonical key: smaller (r,c) first to avoid counting direction twice
                    const key = `${r},${c}-${nr},${nc}`;
                    if (!matchedKeys.has(key)) {
                        matchedKeys.add(key);
                        
                        matchingCells.push({ r, c });
                        matchingCells.push({ r: nr, c: nc });
                        
                        board[r][c].match = true;
                        board[nr][nc].match = true;
                    }
                }
            }
        }
    }
}

// Clear completed lines and award score
function clearRows() {
    // Sort rows descending to clear from bottom to top
    rowsToClear.sort((a,b) => b-a);
    
    // Calculate scoring
    // 1. Domino pairs matched: sum values of matching pairs
    let dominoScore = 0;
    
    // Filter duplicates from matchingCells to count unique blocks
    const seenCells = new Set();
    for (const cell of matchingCells) {
        const key = `${cell.r},${cell.c}`;
        if (!seenCells.has(key)) {
            seenCells.add(key);
            const val = board[cell.r][cell.c].val;
            dominoScore += val; // Just add the face value (1-6) without multiplier!
            spawnExplosion(cell.c, cell.r, val, true);
        }
    }
    
    // Points are ONLY awarded if there are matching combinations. No base line clear score is given.
    const points = dominoScore;
    score += points;
    linesCompleted += rowsToClear.length;
    
    // Level Up every 10 lines
    level = Math.floor(linesCompleted / 10) + 1;
    dropInterval = Math.max(100, 800 - (level - 1) * 70); // speed increases
    
    updateScoreUI();
    
    // Actually remove rows from board
    for (const r of rowsToClear) {
        // Remove row and shift everything above down
        board.splice(r, 1);
        // Add new empty row at top
        const newRow = [];
        for (let c = 0; c < COLS; c++) {
            newRow.push(null);
        }
        board.unshift(newRow);
        
        // Offset row clearing index as rows move down
        for (let i = 0; i < rowsToClear.length; i++) {
            if (rowsToClear[i] < r) {
                rowsToClear[i]++;
            }
        }
    }
    
    // Reset flags
    matchingCells = [];
    rowsToClear = [];
}

// Draw initial static menu background using Dicier characters
function drawMenuBackground() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw simple retro borders on the gameplay canvas
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
    ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);
    
    // Text loading state
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px "Silkscreen", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PRONTO PARA JOGAR', canvas.width / 2, canvas.height / 2 - 20);
    
    if (fontLoaded) {
        ctx.font = '24px Dicier';
        ctx.fillText('6_6', canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText('3_4', canvas.width / 2, canvas.height / 2 + 60);
    }
}

// Game loop update tick
function update(time = 0) {
    if (activeScreen !== 'game' || isGameOver) return;
    
    if (isPaused) {
        drawPauseScreen();
        lastTime = time;
        requestAnimationFrame(update);
        return;
    }
    
    const deltaTime = time - lastTime;
    lastTime = time;
    
    // Update active particle systems
    updateParticles();

    if (isClearingAnimation) {
        // Run flashing clear animation
        clearAnimationTimer--;
        
        // Toggle flash state every 5 frames
        if (clearAnimationTimer % 5 === 0) {
            for (const cell of matchingCells) {
                if (board[cell.r][cell.c]) {
                    board[cell.r][cell.c].flash = !board[cell.r][cell.c].flash;
                }
            }
        }
        
        // Spawn sparks during flash phase
        if (matchingCells.length > 0 && Math.random() < 0.4) {
            const randomCell = matchingCells[Math.floor(Math.random() * matchingCells.length)];
            if (board[randomCell.r][randomCell.c]) {
                spawnExplosion(randomCell.c, randomCell.r, board[randomCell.r][randomCell.c].val, false);
            }
        }
        
        if (clearAnimationTimer <= 0) {
            isClearingAnimation = false;
            clearRows();
            spawnPiece();
        }
    } else {
        // Normal game drop physics
        dropCounter += deltaTime;
        if (dropCounter > dropInterval) {
            movePieceDown();
            dropCounter = 0;
        }
    }
    
    draw();
    requestAnimationFrame(update);
}

// Draw paused game state
function drawPauseScreen() {
    ctx.fillStyle = 'rgba(8, 8, 8, 0.05)'; // slight trail
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px "Silkscreen", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('JOGO PAUSADO', canvas.width / 2, canvas.height / 2);
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText('Pressione P para continuar', canvas.width / 2, canvas.height / 2 + 30);
}

// Core drawing engine
function draw() {
    // Screen shake translate
    ctx.save();
    if (screenShakeTime > 0) {
        const dx = (Math.random() * 6 - 3) * (screenShakeTime / SCREEN_SHAKE_DURATION);
        const dy = (Math.random() * 6 - 3) * (screenShakeTime / SCREEN_SHAKE_DURATION);
        ctx.translate(dx, dy);
        
        // Apply transform to the canvas element itself for CRT chassis shake
        canvas.style.transform = `translate(${dx * 0.5}px, ${dy * 0.5}px)`;
        screenShakeTime--;
    } else {
        canvas.style.transform = 'translate(0px, 0px)';
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background grid lines (retro styled)
    ctx.strokeStyle = '#141414';
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
        ctx.beginPath();
        ctx.moveTo(x * BLOCK_SIZE, 0);
        ctx.lineTo(x * BLOCK_SIZE, ROWS * BLOCK_SIZE);
        ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * BLOCK_SIZE);
        ctx.lineTo(COLS * BLOCK_SIZE, y * BLOCK_SIZE);
        ctx.stroke();
    }
    
    // Draw board blocks
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = board[r][c];
            if (cell !== null) {
                drawCell(c, r, cell);
            }
        }
    }
    
    // Draw connected domino outlines on board blocks
    drawDominoOutlines();
    
    // Draw falling piece
    if (currentPiece && !isClearingAnimation) {
        for (let r = 0; r < currentPiece.matrix.length; r++) {
            for (let c = 0; c < currentPiece.matrix[r].length; c++) {
                const cell = currentPiece.matrix[r][c];
                if (cell !== null) {
                    drawCell(currentPiece.x + c, currentPiece.y + r, cell);
                }
            }
        }
        drawPieceDominoOutlines();
    }
    
    // Draw scoring/flash particles on top
    drawParticles();
    
    ctx.restore();
}

// Render individual block using Dicier font
function drawCell(x, y, cell) {
    const px = x * BLOCK_SIZE;
    const py = y * BLOCK_SIZE;
    
    // Drawing flash inversion if matched and toggle is off
    if (cell.match && cell.flash) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px, py, BLOCK_SIZE, BLOCK_SIZE);
        
        ctx.fillStyle = '#080808';
        ctx.font = `${BLOCK_SIZE - 2}px Dicier`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cell.val.toString(), px + BLOCK_SIZE / 2, py + BLOCK_SIZE / 2);
    } else {
        // Normal cell rendering using Dicier glyphs (1-6)
        ctx.fillStyle = '#ffffff';
        ctx.font = `${BLOCK_SIZE - 2}px Dicier`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cell.val.toString(), px + BLOCK_SIZE / 2, py + BLOCK_SIZE / 2);
    }
}

// Find and draw single borders enclosing domino pairs (merging blocks visually)
function drawDominoOutlines() {
    const drawnPairs = new Set();
    
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = board[r][c];
            if (cell === null || !cell.dom) continue;
            
            // Check right and bottom neighbors for same domino ID
            const neighbors = [
                { r: r, c: c + 1, type: 'H' }, // Horizontal connection
                { r: r + 1, c: c, type: 'V' }  // Vertical connection
            ];
            
            for (const n of neighbors) {
                if (n.r < ROWS && n.c < COLS) {
                    const neighbor = board[n.r][n.c];
                    if (neighbor !== null && neighbor.dom === cell.dom) {
                        const pairKey = [r, c, n.r, n.c].join('-');
                        if (!drawnPairs.has(pairKey)) {
                            drawnPairs.add(pairKey);
                            
                            // Draw thin connecting highlight outline around the domino
                            ctx.strokeStyle = '#ffffff';
                            ctx.lineWidth = 1;
                            
                            if (n.type === 'H') {
                                // Draw single rectangle enclosing both cells
                                ctx.strokeRect(c * BLOCK_SIZE + 1, r * BLOCK_SIZE + 1, BLOCK_SIZE * 2 - 2, BLOCK_SIZE - 2);
                            } else {
                                ctx.strokeRect(c * BLOCK_SIZE + 1, r * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE * 2 - 2);
                            }
                        }
                    }
                }
            }
        }
    }
}

// Draw single borders enclosing active piece's domino blocks
function drawPieceDominoOutlines() {
    const p = currentPiece;
    const drawn = new Set();
    
    // Find all blocks in the matrix
    const blocks = [];
    for (let r = 0; r < p.matrix.length; r++) {
        for (let c = 0; c < p.matrix[r].length; c++) {
            if (p.matrix[r][c] !== null) {
                blocks.push({ r, c, cell: p.matrix[r][c] });
            }
        }
    }
    
    // Draw boundary around matching domino IDs
    for (let i = 0; i < blocks.length; i++) {
        for (let j = i + 1; j < blocks.length; j++) {
            const b1 = blocks[i];
            const b2 = blocks[j];
            
            if (b1.cell.dom === b2.cell.dom) {
                const bx1 = p.x + b1.c;
                const by1 = p.y + b1.r;
                const bx2 = p.x + b2.c;
                const by2 = p.y + b2.r;
                
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                
                // Check if they are horizontal or vertical
                if (by1 === by2 && Math.abs(bx1 - bx2) === 1) {
                    // Horizontal domino
                    const minX = Math.min(bx1, bx2);
                    ctx.strokeRect(minX * BLOCK_SIZE + 1, by1 * BLOCK_SIZE + 1, BLOCK_SIZE * 2 - 2, BLOCK_SIZE - 2);
                } else if (bx1 === bx2 && Math.abs(by1 - by2) === 1) {
                    // Vertical domino
                    const minY = Math.min(by1, by2);
                    ctx.strokeRect(bx1 * BLOCK_SIZE + 1, minY * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE * 2 - 2);
                }
            }
        }
    }
}

// Particle System implementation for Super Pixel Effects
function spawnExplosion(c, r, val, isFinalClear) {
    const cx = c * BLOCK_SIZE + BLOCK_SIZE / 2;
    const cy = r * BLOCK_SIZE + BLOCK_SIZE / 2;
    
    if (isFinalClear) {
        // 1. Expanding Ring
        particles.push({
            type: 'ring',
            x: cx,
            y: cy,
            size: BLOCK_SIZE / 2,
            maxSize: BLOCK_SIZE * 2.2,
            life: 15,
            maxLife: 15,
            color: '#ffffff'
        });
        
        // 2. Cross Burst
        particles.push({
            type: 'cross',
            x: cx,
            y: cy,
            len: 0,
            maxLen: BLOCK_SIZE * 1.5,
            life: 12,
            maxLife: 12,
            color: '#ffffff'
        });
        
        // 3. Floating Score Text
        particles.push({
            type: 'text',
            x: cx,
            y: cy - 10,
            vx: (Math.random() - 0.5) * 0.8,
            vy: -1.2,
            text: `+${val}`,
            life: 45,
            maxLife: 45,
            color: '#ffffff'
        });
        
        // 4. Spark Particles
        const numSparks = 10 + Math.floor(Math.random() * 6);
        for (let i = 0; i < numSparks; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.0 + Math.random() * 4.0;
            const colors = ['#ffffff', '#ffffff', '#e0e0e0', '#888888'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            particles.push({
                type: 'spark',
                x: cx,
                y: cy,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.2, // upward launch bias
                size: 2 + Math.floor(Math.random() * 3), // 2 to 4 pixels
                life: 20 + Math.floor(Math.random() * 15),
                maxLife: 35,
                color: color
            });
        }
    } else {
        // Spark particles during flashing
        const numSparks = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < numSparks; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 1.5;
            particles.push({
                type: 'spark',
                x: cx + (Math.random() - 0.5) * 16,
                y: cy + (Math.random() - 0.5) * 16,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 0.5,
                size: 2,
                life: 10 + Math.floor(Math.random() * 10),
                maxLife: 20,
                color: '#ffffff'
            });
        }
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.life--;
        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }
        
        if (p.type === 'spark') {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.12; // gravity
            p.vx *= 0.94; // air resistance
            p.vy *= 0.94;
        } else if (p.type === 'text') {
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.98;
            p.vy *= 0.95; // decelerate upward rise
        } else if (p.type === 'ring') {
            p.size += (p.maxSize - p.size) * 0.18;
        } else if (p.type === 'cross') {
            p.len += (p.maxLen - p.len) * 0.22;
        }
    }
}

function drawParticles() {
    for (const p of particles) {
        ctx.save();
        const alpha = Math.max(0, p.life / p.maxLife);
        
        if (p.type === 'spark') {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha;
            ctx.fillRect(Math.floor(p.x - p.size / 2), Math.floor(p.y - p.size / 2), p.size, p.size);
        } else if (p.type === 'ring') {
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = 2;
            ctx.strokeRect(Math.floor(p.x - p.size / 2), Math.floor(p.y - p.size / 2), Math.floor(p.size), Math.floor(p.size));
        } else if (p.type === 'cross') {
            ctx.strokeStyle = p.color;
            ctx.globalAlpha = alpha;
            ctx.lineWidth = 2;
            const len = Math.floor(p.len);
            
            ctx.beginPath();
            ctx.moveTo(Math.floor(p.x - len), Math.floor(p.y));
            ctx.lineTo(Math.floor(p.x + len), Math.floor(p.y));
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(Math.floor(p.x), Math.floor(p.y - len));
            ctx.lineTo(Math.floor(p.x), Math.floor(p.y + len));
            ctx.stroke();
        } else if (p.type === 'text') {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = alpha;
            ctx.font = '10px "Silkscreen", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(p.text, Math.floor(p.x), Math.floor(p.y));
        }
        ctx.restore();
    }
}
