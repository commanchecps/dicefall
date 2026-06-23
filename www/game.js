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
let nextCanvas2, nextCtx2;
let nextCanvas3, nextCtx3;
let holdCanvas, holdCtx;

let board = [];
let isPaused = false;
let isGameOver = false;
let activeScreen = 'menu'; // 'menu', 'game', 'gameover', 'shuffleIntro', 'shuffleResult', 'upgradeSelect', 'runComplete', 'runFailed', 'collection'
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

// Tetromino matrices
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

// ==========================================
// ROGUELIKE AND RUN STATE VARIABLES
// ==========================================
let currentShuffle = 0; // 0 (1º), 1 (2º), 2 (Final)
let shuffleScore = 0;
let runScore = 0;
let piecesRemaining = 0;
let nextPieces = []; // queue of upcoming pieces
let heldPiece = null;
let hasHeldThisTurn = false;

const SHUFFLES = [
    { key: 'shuffle1', target: 100, pieces: 30 },
    { key: 'shuffle2', target: 300, pieces: 25 },
    { key: 'shuffleFinal', target: 700, pieces: 20 }
];

let runState = {
    bonusChipsPerLine: 0,
    pairBonusChips: 0,
    multPerLine: 0,
    bonusPieces: 0,
    previewCount: 1,
    holdEnabled: false,
    recycleUses: 0,
    recycleUsesLeft: 0,
    bombUses: 0,
    bombUsesLeft: 0,
    transmuteUses: 0,
    transmuteUsesLeft: 0,
    jackpot6: false,
    comboStreak: false,
    comboCount: 0,
    highValueBonus: 0,
    diagonalMatch: false,
    cascadeEnabled: false,
    perfectDominoBonus: 0,
    mirrorBonus: false,
    snakeEyes: false,
    goldenLine: false,
    exponentialMult: false,
    exponentialCount: 0,
    momentumEnabled: false,
    snowballMult: false,
    snowballCount: 0,
    heatChips: 0,
    weightedHigh: false,
    wildChance: 0,
    speedMult: 1,
    addMult: 0,
    multMult: 1,
    activeUpgrades: [] // Array of upgrade IDs
};

let playerStats = {
    runsPlayed: 0,
    runsWon: 0,
    totalScore: 0,
    bestRunScore: 0,
    bestShuffleScore: 0,
    totalLinesCleared: 0,
    totalPiecesPlaced: 0,
    total6Pairs: 0,
    totalDiagonals: 0,
    maxComboInLine: 0,
    perfectShuffles: 0,
    consecutiveWins: 0,
    maxConsecutiveWins: 0,
    totalUpgradesPicked: 0,
    uniqueUpgradesSeen: 0
};

// ==========================================
// INTERNATIONALIZATION (i18n)
// ==========================================
const LANG = {
    'pt-BR': {
        startRun: 'INICIAR RUN',
        howToPlay: 'COMO JOGAR',
        settings: 'CONFIGURAÇÕES',
        language: 'IDIOMA',
        score: '🏆 PONTOS',
        target: '🎯 META',
        pieces: '🎲 PEÇAS',
        mult: '⚡ MULTIPLICADOR',
        chips: 'CHIPS',
        shuffle1: '1º EMBARALHAMENTO',
        shuffle2: '2º EMBARALHAMENTO',
        shuffleFinal: 'EMBARALHAMENTO FINAL',
        shuffleTarget: 'Meta: {0} pts',
        shufflePieces: '{0} peças disponíveis',
        shufflePassed: 'EMBARALHAMENTO COMPLETO!',
        shuffleFailed: 'EMBARALHAMENTO FALHOU',
        runComplete: 'RUN COMPLETA!',
        runFailed: 'RUN ENCERRADA',
        chooseUpgrade: 'ESCOLHA UMA MELHORIA',
        skip: 'PULAR',
        locked: 'BLOQUEADO',
        unlockReq: 'Requisito: {0}',
        runsPlayed: 'Runs Jogadas',
        bestScore: 'Melhor Pontuação',
        totalLines: 'Total de Linhas',
        gameOver: 'FIM DE JOGO',
        playAgain: 'JOGAR NOVAMENTE',
        backToMenu: 'VOLTAR AO MENU',
        paused: 'JOGO PAUSADO',
        pressP: 'Pressione P para continuar',
        dragHandle: 'ARRASTAR',
        collection: 'COLEÇÃO',
        unlockedCount: '{0}/{1} desbloqueados',
        recycle: 'RECICLAR',
        next: 'PRÓXIMA',
        startShuffle: 'JOGAR',
        proceedToUpgrades: 'MELHORIAS'
    },
    'en': {
        startRun: 'START RUN',
        howToPlay: 'HOW TO PLAY',
        settings: 'SETTINGS',
        language: 'LANGUAGE',
        score: '🏆 SCORE',
        target: '🎯 TARGET',
        pieces: '🎲 PIECES',
        mult: '⚡ MULTIPLIER',
        chips: 'CHIPS',
        shuffle1: '1ST SHUFFLE',
        shuffle2: '2ND SHUFFLE',
        shuffleFinal: 'FINAL SHUFFLE',
        shuffleTarget: 'Target: {0} pts',
        shufflePieces: '{0} pieces available',
        shufflePassed: 'SHUFFLE COMPLETE!',
        shuffleFailed: 'SHUFFLE FAILED',
        runComplete: 'RUN COMPLETE!',
        runFailed: 'RUN OVER',
        chooseUpgrade: 'CHOOSE AN UPGRADE',
        skip: 'SKIP',
        locked: 'LOCKED',
        unlockReq: 'Requires: {0}',
        runsPlayed: 'Runs Played',
        bestScore: 'Best Score',
        totalLines: 'Total Lines',
        gameOver: 'GAME OVER',
        playAgain: 'PLAY AGAIN',
        backToMenu: 'BACK TO MENU',
        paused: 'GAME PAUSED',
        pressP: 'Press P to continue',
        dragHandle: 'DRAG',
        collection: 'COLLECTION',
        unlockedCount: '{0}/{1} unlocked',
        recycle: 'DISCARD',
        next: 'NEXT',
        startShuffle: 'PLAY',
        proceedToUpgrades: 'UPGRADES'
    }
};

let currentLang = localStorage.getItem('dicefallLang') || 'pt-BR';

function t(key, ...args) {
    let str = LANG[currentLang][key] || LANG['pt-BR'][key] || key;
    args.forEach((arg, i) => { str = str.replace(`{${i}}`, arg); });
    return str;
}

// ==========================================
// ALL UPGRADES CATALOG
// ==========================================
const ALL_UPGRADES = [
    // ========== COMMON — SCORE ==========
    { id: 'mult_plus1', name: { 'pt-BR': 'Dobrador', en: 'Doubler' }, 
      desc: { 'pt-BR': '+1 Mult', en: '+1 Mult' },
      icon: '×2', tier: 'common', category: 'score',
      effect: (state) => { state.addMult += 1; },
      unlock: null
    },
    { id: 'chips_plus5', name: { 'pt-BR': 'Bônus de Chips', en: 'Chip Bonus' },
      desc: { 'pt-BR': '+5 Chips por linha', en: '+5 Chips per line' },
      icon: '💰', tier: 'common', category: 'score',
      effect: (state) => { state.bonusChipsPerLine += 5; },
      unlock: null
    },
    { id: 'pair_bonus', name: { 'pt-BR': 'Par Premiado', en: 'Pair Prize' },
      desc: { 'pt-BR': '+3 Chips por par adjacente', en: '+3 Chips per adjacent pair' },
      icon: '🎯', tier: 'common', category: 'score',
      effect: (state) => { state.pairBonusChips += 3; },
      unlock: null
    },
    { id: 'line_mult', name: { 'pt-BR': 'Varredura', en: 'Sweep' },
      desc: { 'pt-BR': '+0.5 Mult por linha limpa', en: '+0.5 Mult per cleared line' },
      icon: '🧹', tier: 'common', category: 'score',
      effect: (state) => { state.multPerLine += 0.5; },
      unlock: null
    },
    
    // ========== COMMON — MECHANIC ==========
    { id: 'slow_fall', name: { 'pt-BR': 'Queda Lenta', en: 'Slow Fall' },
      desc: { 'pt-BR': 'Velocidade -30%', en: 'Speed -30%' },
      icon: '🪶', tier: 'common', category: 'mechanic',
      effect: (state) => { state.speedMult *= 1.3; },
      unlock: null
    },
    { id: 'extra_pieces3', name: { 'pt-BR': 'Reserva', en: 'Reserve' },
      desc: { 'pt-BR': '+3 peças por embaralhamento', en: '+3 pieces per shuffle' },
      icon: '📦', tier: 'common', category: 'mechanic',
      effect: (state) => { state.bonusPieces += 3; },
      unlock: null
    },
    { id: 'preview2', name: { 'pt-BR': 'Binóculo', en: 'Binoculars' },
      desc: { 'pt-BR': 'Exibe 2 próximas peças', en: 'Shows 2 next pieces' },
      icon: '🔭', tier: 'common', category: 'vision',
      effect: (state) => { state.previewCount = Math.max(state.previewCount, 2); },
      unlock: null
    },
    
    // ========== UNCOMMON — SCORE ==========
    { id: 'mult_plus2', name: { 'pt-BR': 'Triplicador', en: 'Tripler' },
      desc: { 'pt-BR': '+2 Mult', en: '+2 Mult' },
      icon: '×3', tier: 'uncommon', category: 'score',
      effect: (state) => { state.addMult += 2; },
      unlock: { stat: 'runsPlayed', value: 3, desc: { 'pt-BR': 'Jogar 3 runs', en: 'Play 3 runs' } }
    },
    { id: 'multmult15', name: { 'pt-BR': 'Amplificador', en: 'Amplifier' },
      desc: { 'pt-BR': '×1.5 Mult', en: '×1.5 Mult' },
      icon: '⚡', tier: 'uncommon', category: 'score',
      effect: (state) => { state.multMult *= 1.5; },
      unlock: { stat: 'runsPlayed', value: 5, desc: { 'pt-BR': 'Jogar 5 runs', en: 'Play 5 runs' } }
    },
    { id: 'jackpot6', name: { 'pt-BR': 'Jackpot', en: 'Jackpot' },
      desc: { 'pt-BR': 'Par 6-6 dá +10 Chips', en: '6-6 pair gives +10 Chips' },
      icon: '🎰', tier: 'uncommon', category: 'score',
      effect: (state) => { state.jackpot6 = true; },
      unlock: { stat: 'total6Pairs', value: 5, desc: { 'pt-BR': 'Fazer 5 pares de 6', en: 'Make 5 pairs of 6' } }
    },
    { id: 'combo_streak', name: { 'pt-BR': 'Sequência', en: 'Streak' },
      desc: { 'pt-BR': '+1 Mult por combo consecutivo', en: '+1 Mult per consecutive combo' },
      icon: '🔥', tier: 'uncommon', category: 'score',
      effect: (state) => { state.comboStreak = true; },
      unlock: { stat: 'totalLinesCleared', value: 20, desc: { 'pt-BR': 'Limpar 20 linhas', en: 'Clear 20 lines' } }
    },
    { id: 'high_value', name: { 'pt-BR': 'Alto Valor', en: 'High Value' },
      desc: { 'pt-BR': 'Peças de valor 5-6 dão +2 Chips cada', en: 'Dice 5-6 give +2 Chips each' },
      icon: '💎', tier: 'uncommon', category: 'score',
      effect: (state) => { state.highValueBonus = 2; },
      unlock: { stat: 'bestShuffleScore', value: 100, desc: { 'pt-BR': 'Fazer 100pts em 1 emb.', en: 'Score 100pts in 1 shuffle' } }
    },
    { id: 'weighted_high_chips', name: { 'pt-BR': 'Dados Pesados', en: 'Heavy Dice' },
      desc: { 'pt-BR': 'Par de 5-5 ou 6-6 dá +8 Chips', en: '5-5 or 6-6 pair gives +8 Chips' },
      icon: '🁫', tier: 'uncommon', category: 'score',
      effect: (state) => { state.highValueBonus += 8; },
      unlock: { stat: 'total6Pairs', value: 10, desc: { 'pt-BR': 'Fazer 10 pares de 6', en: 'Make 10 pairs of 6' } }
    },
    
    // ========== UNCOMMON — MECHANIC ==========
    { id: 'diagonal', name: { 'pt-BR': 'Diagonal+', en: 'Diagonal+' },
      desc: { 'pt-BR': 'Adjacência diagonal pontua', en: 'Diagonal adjacency scores' },
      icon: '📐', tier: 'uncommon', category: 'mechanic',
      effect: (state) => { state.diagonalMatch = true; },
      unlock: { stat: 'runsPlayed', value: 8, desc: { 'pt-BR': 'Jogar 8 runs', en: 'Play 8 runs' } }
    },
    { id: 'recycler', name: { 'pt-BR': 'Reciclador', en: 'Recycler' },
      desc: { 'pt-BR': '1× descarta peça por embaralhado', en: '1× discard current piece per shuffle' },
      icon: '♻️', tier: 'uncommon', category: 'mechanic',
      effect: (state) => { state.recycleUses += 1; },
      unlock: { stat: 'totalPiecesPlaced', value: 100, desc: { 'pt-BR': 'Colocar 100 peças', en: 'Place 100 pieces' } }
    },
    { id: 'preview3', name: { 'pt-BR': 'Telescópio', en: 'Telescope' },
      desc: { 'pt-BR': 'Exibe 3 próximas peças', en: 'Shows 3 next pieces' },
      icon: '🔭', tier: 'uncommon', category: 'vision',
      effect: (state) => { state.previewCount = Math.max(state.previewCount, 3); },
      unlock: { stat: 'runsPlayed', value: 10, desc: { 'pt-BR': 'Jogar 10 runs', en: 'Play 10 runs' } }
    },
    { id: 'hold_piece', name: { 'pt-BR': 'Reservatório', en: 'Hold Tank' },
      desc: { 'pt-BR': 'Permite guardar 1 peça (tecla H)', en: 'Hold 1 piece (H key)' },
      icon: '🗄️', tier: 'uncommon', category: 'mechanic',
      effect: (state) => { state.holdEnabled = true; },
      unlock: { stat: 'runsPlayed', value: 6, desc: { 'pt-BR': 'Jogar 6 runs', en: 'Play 6 runs' } }
    },
    
    // ========== RARE — SCORE ==========
    { id: 'mult_plus5', name: { 'pt-BR': 'Pentaplicador', en: 'Quintuple' },
      desc: { 'pt-BR': '+5 Mult', en: '+5 Mult' },
      icon: '×5', tier: 'rare', category: 'score',
      effect: (state) => { state.addMult += 5; },
      unlock: { stat: 'runsWon', value: 3, desc: { 'pt-BR': 'Vencer 3 runs', en: 'Win 3 runs' } }
    },
    { id: 'multmult2', name: { 'pt-BR': 'Duplicador Total', en: 'Total Doubler' },
      desc: { 'pt-BR': '×2 Mult', en: '×2 Mult' },
      icon: '⚡⚡', tier: 'rare', category: 'score',
      effect: (state) => { state.multMult *= 2; },
      unlock: { stat: 'bestRunScore', value: 500, desc: { 'pt-BR': 'Fazer 500pts em 1 run', en: 'Score 500pts in 1 run' } }
    },
    { id: 'cascade', name: { 'pt-BR': 'Cascata', en: 'Cascade' },
      desc: { 'pt-BR': 'Após limpar, verifica novas combinações', en: 'After clear, check new combos' },
      icon: '🌊', tier: 'rare', category: 'score',
      effect: (state) => { state.cascadeEnabled = true; },
      unlock: { stat: 'totalLinesCleared', value: 50, desc: { 'pt-BR': 'Limpar 50 linhas', en: 'Clear 50 lines' } }
    },
    { id: 'domino_perfect', name: { 'pt-BR': 'Dominó Perfeito', en: 'Perfect Domino' },
      desc: { 'pt-BR': 'Par com valores iguais (4-4) = +15 Chips', en: 'Matching domino pair (4-4) = +15 Chips' },
      icon: '🁣', tier: 'rare', category: 'score',
      effect: (state) => { state.perfectDominoBonus = 15; },
      unlock: { stat: 'runsPlayed', value: 15, desc: { 'pt-BR': 'Jogar 15 runs', en: 'Play 15 runs' } }
    },
    { id: 'mirror_bonus', name: { 'pt-BR': 'Espelho', en: 'Mirror' },
      desc: { 'pt-BR': 'Combinação simétrica = +1 ×Mult', en: 'Symmetric line match = +1 ×Mult' },
      icon: '🪞', tier: 'rare', category: 'score',
      effect: (state) => { state.mirrorBonus = true; },
      unlock: { stat: 'runsWon', value: 5, desc: { 'pt-BR': 'Vencer 5 runs', en: 'Win 5 runs' } }
    },
    { id: 'snake_eyes', name: { 'pt-BR': 'Olhos de Cobra', en: 'Snake Eyes' },
      desc: { 'pt-BR': 'Par 1-1 adjacente = ×2 nesta jogada', en: '1-1 pair = ×2 this play' },
      icon: '🐍', tier: 'rare', category: 'score',
      effect: (state) => { state.snakeEyes = true; },
      unlock: { stat: 'totalScore', value: 2000, desc: { 'pt-BR': 'Acumular 2000pts total', en: 'Accumulate 2000pts total' } }
    },
    { id: 'speed_run', name: { 'pt-BR': 'Corrida', en: 'Speedrun' }, 
      desc: { 'pt-BR': '+0.5 Mult a cada segundo restante', en: '+0.5 Mult per second remaining' }, 
      icon: '⏱️', tier: 'rare', category: 'score', 
      effect: (state) => { /* no-op */ }, 
      unlock: { stat: 'runsWon', value: 1, desc: { 'pt-BR': 'Vencer 1 run', en: 'Win 1 run' } } 
    },
    
    // ========== RARE — MECHANIC ==========
    { id: 'extra_pieces5', name: { 'pt-BR': 'Arsenal', en: 'Arsenal' },
      desc: { 'pt-BR': '+5 peças por embaralhamento', en: '+5 pieces per shuffle' },
      icon: '🏗️', tier: 'rare', category: 'mechanic',
      effect: (state) => { state.bonusPieces += 5; },
      unlock: { stat: 'runsPlayed', value: 12, desc: { 'pt-BR': 'Jogar 12 runs', en: 'Play 12 runs' } }
    },
    { id: 'recycler2', name: { 'pt-BR': 'Reciclador Pro', en: 'Pro Recycler' },
      desc: { 'pt-BR': '2× descarta peça por embaralhado', en: '2× discard piece per shuffle' },
      icon: '♻️♻️', tier: 'rare', category: 'mechanic',
      effect: (state) => { state.recycleUses += 2; },
      unlock: { stat: 'totalPiecesPlaced', value: 300, desc: { 'pt-BR': 'Colocar 300 peças', en: 'Place 300 pieces' } }
    },
    { id: 'weighted_dice', name: { 'pt-BR': 'Dado Viciado', en: 'Loaded Dice' },
      desc: { 'pt-BR': 'Peças tendem a valores altos (4-6)', en: 'Pieces lean towards higher values (4-6)' },
      icon: '🎲', tier: 'rare', category: 'mechanic',
      effect: (state) => { state.weightedHigh = true; },
      unlock: { stat: 'total6Pairs', value: 20, desc: { 'pt-BR': 'Fazer 20 pares de 6', en: 'Make 20 pairs of 6' } }
    },
    { id: 'wild_piece', name: { 'pt-BR': 'Curinga', en: 'Wild Card' },
      desc: { 'pt-BR': '10% chance de peça curinga', en: '10% chance of wild piece' },
      icon: '🃏', tier: 'rare', category: 'mechanic',
      effect: (state) => { state.wildChance = 0.10; },
      unlock: { stat: 'runsWon', value: 2, desc: { 'pt-BR': 'Vencer 2 runs', en: 'Win 2 runs' } }
    },
    { id: 'slow_fall2', name: { 'pt-BR': 'Gravidade Zero', en: 'Zero Gravity' },
      desc: { 'pt-BR': 'Velocidade -50%', en: 'Speed -50%' },
      icon: '🕊️', tier: 'rare', category: 'mechanic',
      effect: (state) => { state.speedMult *= 1.5; },
      unlock: { stat: 'totalPiecesPlaced', value: 200, desc: { 'pt-BR': 'Colocar 200 peças', en: 'Place 200 pieces' } }
    },
    
    // ========== LEGENDARY — SCORE ==========
    { id: 'mult_plus10', name: { 'pt-BR': 'Decimador', en: 'Decimator' },
      desc: { 'pt-BR': '+10 Mult', en: '+10 Mult' },
      icon: '×10', tier: 'legendary', category: 'score',
      effect: (state) => { state.addMult += 10; },
      unlock: { stat: 'runsWon', value: 10, desc: { 'pt-BR': 'Vencer 10 runs', en: 'Win 10 runs' } }
    },
    { id: 'multmult3', name: { 'pt-BR': 'Supernova', en: 'Supernova' },
      desc: { 'pt-BR': '×3 Mult', en: '×3 Mult' },
      icon: '💥', tier: 'legendary', category: 'score',
      effect: (state) => { state.multMult *= 3; },
      unlock: { stat: 'bestRunScore', value: 2000, desc: { 'pt-BR': 'Fazer 2000pts em 1 run', en: 'Score 2000pts in 1 run' } }
    },
    { id: 'full_line_bonus', name: { 'pt-BR': 'Linha Dourada', en: 'Golden Line' },
      desc: { 'pt-BR': 'Se toda a linha pontuar = ×5', en: 'If entire line scores = ×5' },
      icon: '🌟', tier: 'legendary', category: 'score',
      effect: (state) => { state.goldenLine = true; },
      unlock: { stat: 'maxComboInLine', value: 8, desc: { 'pt-BR': '8+ matches em 1 linha', en: '8+ matches in 1 line' } }
    },
    { id: 'exponential', name: { 'pt-BR': 'Exponencial', en: 'Exponential' },
      desc: { 'pt-BR': 'Mult cresce +0.1 a cada peça', en: 'Mult grows +0.1 per piece placed' },
      icon: '📈', tier: 'legendary', category: 'score',
      effect: (state) => { state.exponentialMult = true; },
      unlock: { stat: 'totalScore', value: 10000, desc: { 'pt-BR': 'Acumular 10000pts', en: 'Accumulate 10000pts total' } }
    },
    
    // ========== LEGENDARY — MECHANIC ==========
    { id: 'extra_pieces10', name: { 'pt-BR': 'Infinidade', en: 'Infinity' },
      desc: { 'pt-BR': '+10 peças por embaralhamento', en: '+10 pieces per shuffle' },
      icon: '∞', tier: 'legendary', category: 'mechanic',
      effect: (state) => { state.bonusPieces += 10; },
      unlock: { stat: 'runsPlayed', value: 30, desc: { 'pt-BR': 'Jogar 30 runs', en: 'Play 30 runs' } }
    },
    { id: 'oracle', name: { 'pt-BR': 'Oráculo', en: 'Oracle' },
      desc: { 'pt-BR': 'Exibe todas as próximas peças', en: 'Shows all upcoming pieces' },
      icon: '👁️', tier: 'legendary', category: 'vision',
      effect: (state) => { state.previewCount = 99; },
      unlock: { stat: 'runsWon', value: 8, desc: { 'pt-BR': 'Vencer 8 runs', en: 'Win 8 runs' } }
    },
    { id: 'bomb', name: { 'pt-BR': 'Detonador', en: 'Detonator' },
      desc: { 'pt-BR': '1× elimina linha mais baixa por emb.', en: '1× destroy lowest row per shuffle' },
      icon: '💣', tier: 'legendary', category: 'mechanic',
      effect: (state) => { state.bombUses += 1; },
      unlock: { stat: 'consecutiveWins', value: 3, desc: { 'pt-BR': '3 vitórias seguidas', en: '3 consecutive wins' } }
    },
    { id: 'transmute', name: { 'pt-BR': 'Transmutador', en: 'Transmuter' },
      desc: { 'pt-BR': 'Troca todos os dados de 1 valor', en: 'All pieces of 1 value become another random' },
      icon: '🌀', tier: 'legendary', category: 'mechanic',
      effect: (state) => { state.transmuteUses += 1; },
      unlock: { stat: 'totalScore', value: 5000, desc: { 'pt-BR': 'Acumular 5000pts', en: 'Accumulate 5000pts' } }
    },
    
    // ========== SCALING UPGRADES ==========
    { id: 'momentum', name: { 'pt-BR': 'Momento', en: 'Momentum' },
      desc: { 'pt-BR': '+1 Chip por peça colocada neste emb.', en: '+1 Chip per piece placed this shuffle' },
      icon: '🏃', tier: 'uncommon', category: 'score',
      effect: (state) => { state.momentumEnabled = true; },
      unlock: { stat: 'totalPiecesPlaced', value: 50, desc: { 'pt-BR': 'Colocar 50 peças', en: 'Place 50 pieces' } }
    },
    { id: 'snowball', name: { 'pt-BR': 'Bola de Neve', en: 'Snowball' },
      desc: { 'pt-BR': '+0.2 Mult a cada linha limpa nesta run', en: '+0.2 Mult per line cleared this run' },
      icon: '⛄', tier: 'rare', category: 'score',
      effect: (state) => { state.snowballMult = true; },
      unlock: { stat: 'totalLinesCleared', value: 30, desc: { 'pt-BR': 'Limpar 30 linhas', en: 'Clear 30 lines' } }
    },
    { id: 'heat', name: { 'pt-BR': 'Calor', en: 'Heat' },
      desc: { 'pt-BR': '+2 Chips quando um par pontua', en: '+2 Chips each time a pair scores' },
      icon: '🔥', tier: 'uncommon', category: 'score',
      effect: (state) => { state.heatChips = 2; },
      unlock: { stat: 'runsPlayed', value: 7, desc: { 'pt-BR': 'Jogar 7 runs', en: 'Play 7 runs' } }
    }
];

// Stats Helper Functions
function loadStats() {
    const saved = localStorage.getItem('dicefallStats');
    if (saved) {
        try {
            playerStats = { ...playerStats, ...JSON.parse(saved) };
        } catch(e) {
            console.error('Failed to parse player stats', e);
        }
    }
}

function saveStats() {
    localStorage.setItem('dicefallStats', JSON.stringify(playerStats));
}

function isUpgradeUnlocked(upgrade) {
    if (!upgrade.unlock) return true;
    return playerStats[upgrade.unlock.stat] >= upgrade.unlock.value;
}

function getUnlockedUpgradesCount() {
    return ALL_UPGRADES.filter(isUpgradeUnlocked).length;
}

// Upgrade selection logic
function selectRandomUpgrades() {
    const unlocked = ALL_UPGRADES.filter(isUpgradeUnlocked);
    const chosen = [];
    const pool = [...unlocked];
    
    const getWeight = (tier) => {
        if (tier === 'common') return 50;
        if (tier === 'uncommon') return 30;
        if (tier === 'rare') return 15;
        if (tier === 'legendary') return 5;
        return 50;
    };
    
    while (chosen.length < 3 && pool.length > 0) {
        let totalWeight = 0;
        for (const item of pool) {
            totalWeight += getWeight(item.tier);
        }
        
        let rand = Math.random() * totalWeight;
        let cumulative = 0;
        let selectedIndex = -1;
        
        for (let i = 0; i < pool.length; i++) {
            cumulative += getWeight(pool[i].tier);
            if (rand <= cumulative) {
                selectedIndex = i;
                break;
            }
        }
        
        if (selectedIndex !== -1) {
            chosen.push(pool[selectedIndex]);
            pool.splice(selectedIndex, 1); // Avoid duplicates in this screen
        } else {
            break;
        }
    }
    
    return chosen;
}

// Govea Games SVG mark and Splash implementation (preserved)
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

    nextCanvas2 = document.getElementById('next-canvas-2');
    nextCtx2 = nextCanvas2.getContext('2d');
    nextCtx2.imageSmoothingEnabled = false;

    nextCanvas3 = document.getElementById('next-canvas-3');
    nextCtx3 = nextCanvas3.getContext('2d');
    nextCtx3.imageSmoothingEnabled = false;

    holdCanvas = document.getElementById('hold-canvas');
    holdCtx = holdCanvas.getContext('2d');
    holdCtx.imageSmoothingEnabled = false;

    loadStats();

    // Splash screen loader
    const parentContainer = document.getElementById('game-container');
    const splash = new GoveaSplash(parentContainer);

    let fontPromise;
    if (document.fonts) {
        fontPromise = document.fonts.ready.then(() => {
            fontLoaded = true;
            console.log("Dicier fonts loaded successfully!");
        }).catch(err => {
            console.error("Font loading failed:", err);
            fontLoaded = true; // Fallback
        });
    } else {
        fontLoaded = true;
        fontPromise = Promise.resolve();
    }

    Promise.all([splash.play(), fontPromise]).then(async () => {
        await splash.fadeOut();
        splash.dispose();
        
        updateLanguageTexts();
        showScreen('menu');
    });

    initButtonListeners();
    initKeyListeners();
    initMobileControls();
    initDraggablePad();

    resetBoard();
});

// Setup Game Screen Transitions
function showScreen(screenId, extraParam = null) {
    activeScreen = screenId;
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    
    if (screenId === 'menu') {
        document.getElementById('menu-screen').classList.add('active');
        drawMenuBackground();
    } else if (screenId === 'game') {
        document.getElementById('game-screen').classList.add('active');
        startShuffleGameplay();
    } else if (screenId === 'shuffleIntro') {
        document.getElementById('shuffle-intro-screen').classList.add('active');
        showShuffleIntro();
    } else if (screenId === 'shuffleResult') {
        document.getElementById('shuffle-result-screen').classList.add('active');
        showShuffleResult();
    } else if (screenId === 'upgradeSelect') {
        document.getElementById('upgrade-select-screen').classList.add('active');
        const randCards = selectRandomUpgrades();
        renderUpgradeCards(randCards);
    } else if (screenId === 'runComplete') {
        document.getElementById('run-complete-screen').classList.add('active');
        document.getElementById('victory-score-val').innerText = padZero(runScore, 6);
        document.getElementById('vic-stat-played-val').innerText = playerStats.runsPlayed;
        document.getElementById('vic-stat-won-val').innerText = playerStats.runsWon;
    } else if (screenId === 'runFailed') {
        document.getElementById('run-failed-screen').classList.add('active');
        document.getElementById('defeat-score-val').innerText = padZero(runScore, 6);
    } else if (screenId === 'collection') {
        document.getElementById('collection-screen').classList.add('active');
        renderCollection();
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

// Language and HTML translations
function updateLanguageTexts() {
    // Menu screen
    document.getElementById('btn-start').innerText = t('startRun');
    document.getElementById('btn-how-to').innerText = t('howToPlay');
    document.getElementById('btn-collection').innerText = t('collection');
    document.getElementById('btn-lang-toggle').innerText = `🌐 ${currentLang}`;
    
    // HUD Labels
    document.getElementById('lbl-score').innerText = t('score');
    document.getElementById('lbl-target').innerText = t('target');
    document.getElementById('lbl-pieces').innerText = t('pieces');
    document.getElementById('lbl-mult').innerText = t('mult');
    document.getElementById('lbl-next').innerText = t('next');
    document.getElementById('lbl-hold').innerText = 'HOLD';
    document.getElementById('lbl-upgrades').innerText = 'MELHORIAS';
    document.getElementById('btn-menu-back').innerText = t('backToMenu');
    
    // Drag handle & mobile buttons
    const dragHandle = document.getElementById('lbl-drag-handle');
    if (dragHandle) dragHandle.innerText = t('dragHandle');
    
    // How to Play modal
    document.getElementById('modal-how-to-title').innerText = t('howToPlay');
    document.getElementById('btn-close-modal').innerText = t('backToMenu');
    updateHowToPlayText();

    // Cards and Screens headers
    document.getElementById('lbl-choose-upgrade').innerText = t('chooseUpgrade');
    document.getElementById('btn-skip-upgrade').innerText = t('skip');
    document.getElementById('btn-collection-back').innerText = t('backToMenu');
    
    document.getElementById('btn-start-shuffle').innerText = t('startShuffle');
    document.getElementById('btn-go-to-upgrades').innerText = t('proceedToUpgrades');

    document.getElementById('lbl-victory-score').innerText = t('score');
    document.getElementById('btn-victory-menu').innerText = t('backToMenu');

    document.getElementById('lbl-defeat-reason').innerText = t('shuffleFailed');
    document.getElementById('btn-defeat-menu').innerText = t('backToMenu');

    document.getElementById('lbl-vic-stat-played').innerText = t('runsPlayed');
    document.getElementById('lbl-vic-stat-won').innerText = 'Runs Vencidas'; // Runs Won

    if (activeScreen === 'menu') {
        drawMenuBackground();
    }
}

function updateHowToPlayText() {
    const el = document.getElementById('instructions-content');
    if (currentLang === 'pt-BR') {
        el.innerHTML = `
            <p><strong>1. Peças e Valores:</strong> As peças do Tetris são formadas por pares de dominós. Cada quadrado tem um valor de dado de 1 a 6.</p>
            <p><strong>2. Embaralhamentos:</strong> Cada run tem 3 embaralhamentos com metas de pontuação crescentes e peças limitadas.</p>
            <p><strong>3. Pontuação:</strong> Ao completar uma linha horizontal, os dominós com valores iguais adjacentes somam pontos e a linha é eliminada. Pontuação = Chips x Multiplicador.</p>
            <p><strong>4. Melhorias:</strong> Ao final de cada fase, escolha melhorias que modificam as regras do jogo e aumentam seus multiplicadores.</p>
        `;
    } else {
        el.innerHTML = `
            <p><strong>1. Pieces and Values:</strong> Tetris pieces are formed by domino pairs. Each cell has a die value from 1 to 6.</p>
            <p><strong>2. Shuffles:</strong> Each run has 3 shuffles with increasing score targets and limited pieces.</p>
            <p><strong>3. Scoring:</strong> When a line is cleared, adjacent dominoes with matching values score points and flash. Score = Chips x Mult.</p>
            <p><strong>4. Upgrades:</strong> At the end of each shuffle, pick upgrades that change the rules and boost your multipliers.</p>
        `;
    }
}

// Button Click Handlers
function initButtonListeners() {
    document.getElementById('btn-start').addEventListener('click', () => {
        startNewRun();
    });
    
    document.getElementById('btn-how-to').addEventListener('click', () => {
        document.getElementById('how-to-modal').classList.add('active');
    });
    
    document.getElementById('btn-close-modal').addEventListener('click', () => {
        document.getElementById('how-to-modal').classList.remove('active');
    });
    
    document.getElementById('btn-collection').addEventListener('click', () => {
        showScreen('collection');
    });
    
    document.getElementById('btn-lang-toggle').addEventListener('click', () => {
        currentLang = currentLang === 'pt-BR' ? 'en' : 'pt-BR';
        localStorage.setItem('dicefallLang', currentLang);
        updateLanguageTexts();
    });

    document.getElementById('btn-collection-back').addEventListener('click', () => {
        showScreen('menu');
    });

    document.getElementById('btn-start-shuffle').addEventListener('click', () => {
        showScreen('game');
    });

    document.getElementById('btn-go-to-upgrades').addEventListener('click', () => {
        showScreen('upgradeSelect');
    });

    document.getElementById('btn-skip-upgrade').addEventListener('click', () => {
        proceedAfterUpgrade();
    });

    document.getElementById('btn-victory-menu').addEventListener('click', () => {
        showScreen('menu');
    });

    document.getElementById('btn-defeat-menu').addEventListener('click', () => {
        showScreen('menu');
    });

    document.getElementById('btn-recycle').addEventListener('click', () => {
        recycleAction();
    });

    document.getElementById('btn-menu-back').addEventListener('click', () => {
        isPaused = true;
        if (confirm(currentLang === 'pt-BR' ? "Quer mesmo sair do jogo e perder o progresso?" : "Do you really want to quit and lose progress?")) {
            showScreen('menu');
        } else {
            isPaused = false;
        }
    });
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
            case 'KeyH':
                holdPieceAction();
                break;
        }
    });
}

// Mobile Touch Controls Handler (Floating Drag Pad)
function initMobileControls() {
    const handleTouch = (btnId, action) => {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (activeScreen !== 'game' || isPaused || isGameOver || isClearingAnimation) return;
            action();
        });
    };

    handleTouch('pad-left', () => movePiece(-1));
    handleTouch('pad-right', () => movePiece(1));
    handleTouch('pad-rot-right', () => rotatePiece());
    handleTouch('pad-rot-left', () => rotatePieceReverse());
    handleTouch('pad-up', () => rotatePiece()); // Up arrow rotates (Standard D-Pad mapping)
    handleTouch('pad-down', () => movePieceDown()); // Down arrow soft drops (Standard D-Pad mapping)
    handleTouch('pad-hold', () => holdPieceAction()); // Hold button triggers hold action
    handleTouch('pad-drop', () => hardDrop());
    handleTouch('pad-recycle', () => recycleAction());

    // Tap outside board hard drop trigger
    document.addEventListener('pointerdown', (e) => {
        if (activeScreen !== 'game' || isPaused || isGameOver || isClearingAnimation) return;
        
        const canvas = document.getElementById('board-canvas');
        const pad = document.getElementById('mobile-pad');
        const btnBack = document.getElementById('btn-menu-back');
        
        // Return if tapping canvas, mobile controls pad, or back button
        if (canvas && canvas.contains(e.target)) return;
        if (pad && pad.contains(e.target)) return;
        if (btnBack && btnBack.contains(e.target)) return;
        if (e.target.tagName === 'BUTTON') return;
        
        hardDrop();
    });
}

// Drag Pad Implementation
function initDraggablePad() {
    const pad = document.getElementById('mobile-pad');
    if (!pad) return;
    const handle = pad.querySelector('.pad-handle');
    let isDragging = false;
    let startX, startY;
    
    // Load saved position
    const savedPos = localStorage.getItem('padPosition');
    if (savedPos) {
        try {
            const { x, y } = JSON.parse(savedPos);
            pad.style.left = x + 'px';
            pad.style.bottom = 'auto';
            pad.style.top = y + 'px';
            pad.style.transform = 'none';
        } catch(e) {
            console.error('Failed to parse pad position', e);
        }
    }
    
    handle.addEventListener('touchstart', (e) => {
        isDragging = true;
        const touch = e.touches[0];
        const rect = pad.getBoundingClientRect();
        startX = touch.clientX - rect.left;
        startY = touch.clientY - rect.top;
        e.preventDefault();
    });
    
    document.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const touch = e.touches[0];
        const newX = touch.clientX - startX;
        const newY = touch.clientY - startY;
        
        const padWidth = pad.offsetWidth;
        const padHeight = pad.offsetHeight;
        
        const finalX = Math.max(0, Math.min(newX, window.innerWidth - padWidth));
        const finalY = Math.max(0, Math.min(newY, window.innerHeight - padHeight));
        
        pad.style.left = finalX + 'px';
        pad.style.top = finalY + 'px';
        pad.style.bottom = 'auto';
        pad.style.transform = 'none';
        e.preventDefault();
    }, { passive: false });
    
    document.addEventListener('touchend', () => {
        if (isDragging) {
            isDragging = false;
            const rect = pad.getBoundingClientRect();
            localStorage.setItem('padPosition', JSON.stringify({ x: rect.left, y: rect.top }));
        }
    });
}

// Reset Roguelike Run Variables
function resetRunState() {
    runState = {
        bonusChipsPerLine: 0,
        pairBonusChips: 0,
        multPerLine: 0,
        bonusPieces: 0,
        previewCount: 1,
        holdEnabled: false,
        recycleUses: 0,
        recycleUsesLeft: 0,
        bombUses: 0,
        bombUsesLeft: 0,
        transmuteUses: 0,
        transmuteUsesLeft: 0,
        jackpot6: false,
        comboStreak: false,
        comboCount: 0,
        highValueBonus: 0,
        diagonalMatch: false,
        cascadeEnabled: false,
        perfectDominoBonus: 0,
        mirrorBonus: false,
        snakeEyes: false,
        goldenLine: false,
        exponentialMult: false,
        exponentialCount: 0,
        momentumEnabled: false,
        snowballMult: false,
        snowballCount: 0,
        heatChips: 0,
        weightedHigh: false,
        wildChance: 0,
        speedMult: 1,
        addMult: 0,
        multMult: 1,
        activeUpgrades: []
    };
    heldPiece = null;
    hasHeldThisTurn = false;
}

// Start New Run State
function startNewRun() {
    resetRunState();
    runScore = 0;
    currentShuffle = 0;
    
    showScreen('shuffleIntro');
}

// Render Shuffle Result dramatic elements
function showShuffleResult() {
    const s = SHUFFLES[currentShuffle];
    document.getElementById('result-title').innerText = t('shufflePassed');
    
    const detailsEl = document.getElementById('result-details');
    if (currentLang === 'pt-BR') {
        detailsEl.innerText = `Pontuação: ${shuffleScore} / Meta: ${s.target}`;
    } else {
        detailsEl.innerText = `Score: ${shuffleScore} / Target: ${s.target}`;
    }
}

// Render Shuffle Intro dramatic elements
function showShuffleIntro() {
    const s = SHUFFLES[currentShuffle];
    const shuffleName = currentLang === 'pt-BR' ? LANG['pt-BR'][s.key] : LANG['en'][s.key];
    
    document.getElementById('intro-shuffle-title').innerText = shuffleName;
    document.getElementById('intro-shuffle-target').innerText = t('shuffleTarget', s.target);
    document.getElementById('intro-shuffle-pieces').innerText = t('shufflePieces', s.pieces + runState.bonusPieces);
}

// Start Shuffle Gameplay
function startShuffleGameplay() {
    resetBoard();
    shuffleScore = 0;
    piecesRemaining = SHUFFLES[currentShuffle].pieces + runState.bonusPieces;
    
    runState.recycleUsesLeft = runState.recycleUses;
    runState.bombUsesLeft = runState.bombUses;
    runState.transmuteUsesLeft = runState.transmuteUses;
    
    heldPiece = null;
    hasHeldThisTurn = false;
    
    isPaused = false;
    isGameOver = false;
    isClearingAnimation = false;
    matchingCells = [];
    rowsToClear = [];
    particles = [];
    
    dropInterval = Math.max(100, 800 / runState.speedMult);
    
    updateHUD();
    updateRecycleButton();
    updateHoldUI();
    
    nextPieces = [generatePiece(), generatePiece(), generatePiece()];
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

// Update Game Interface (HUD)
function formatScoreHTML(score) {
    const str = padZero(score, 6);
    let firstNonZeroIndex = str.indexOf(str.split('').find(c => c !== '0'));
    if (firstNonZeroIndex === -1) {
        return `<span class="digit-dim">${str.substring(0, 5)}</span><span class="digit-active">0</span>`;
    } else if (firstNonZeroIndex === 0) {
        return `<span class="digit-active">${str}</span>`;
    } else {
        return `<span class="digit-dim">${str.substring(0, firstNonZeroIndex)}</span><span class="digit-active">${str.substring(firstNonZeroIndex)}</span>`;
    }
}

function updateHUD() {
    document.getElementById('val-score').innerHTML = formatScoreHTML(shuffleScore);
    document.getElementById('val-target').innerText = SHUFFLES[currentShuffle].target;
    
    const totalPieces = SHUFFLES[currentShuffle].pieces + (runState.bonusPieces || 0);
    document.getElementById('val-pieces').innerText = `${piecesRemaining} / ${totalPieces}`;
    
    const totalMult = (1 + runState.addMult) * runState.multMult;
    document.getElementById('val-mult').innerText = totalMult.toFixed(1) + 'x';
    
    // Target progress bar and percentage text
    const progress = Math.min(100, (shuffleScore / SHUFFLES[currentShuffle].target) * 100);
    const pctValue = Math.floor((shuffleScore / SHUFFLES[currentShuffle].target) * 100);
    const pctElement = document.getElementById('val-target-pct');
    if (pctElement) pctElement.innerText = `${pctValue}%`;
    document.getElementById('target-progress').style.width = `${progress}%`;
    
    // Active Upgrades HUD Badges
    const activeList = document.getElementById('active-upgrades-list');
    activeList.innerHTML = '';
    runState.activeUpgrades.forEach(id => {
        const upgrade = ALL_UPGRADES.find(u => u.id === id);
        if (upgrade) {
            const badge = document.createElement('span');
            badge.className = `hud-upgrade-badge tier-${upgrade.tier}`;
            badge.title = upgrade.name[currentLang] || upgrade.name['pt-BR'];
            badge.innerText = upgrade.icon;
            activeList.appendChild(badge);
        }
    });
}

function updateRecycleButton() {
    const btn = document.getElementById('btn-recycle');
    const mobBtn = document.getElementById('pad-recycle');
    const count = runState.recycleUsesLeft;
    
    if (count > 0) {
        btn.style.display = 'block';
        btn.innerText = `♻️ ${t('recycle')} (${count})`;
        if (mobBtn) {
            mobBtn.style.display = 'block';
            mobBtn.innerText = `♻️ (${count})`;
        }
    } else {
        btn.style.display = 'none';
        if (mobBtn) {
            mobBtn.style.display = 'none';
        }
    }
}

function updateHoldUI() {
    const panel = document.getElementById('hold-panel');
    const padHold = document.getElementById('pad-hold');
    if (!panel) return;
    
    if (runState.holdEnabled) {
        panel.style.display = 'block';
        if (padHold) padHold.style.display = 'flex';
        drawHeldPiece();
    } else {
        panel.style.display = 'none';
        if (padHold) padHold.style.display = 'none';
    }
}

// Swaps current falling piece with held storage slot
function holdPieceAction() {
    if (!runState.holdEnabled || hasHeldThisTurn || isPaused || isGameOver || isClearingAnimation) return;
    
    hasHeldThisTurn = true;
    const currentType = currentPiece.type;
    
    // Reset falling piece and rotation to fresh spawn
    const newHold = generatePieceOfType(currentType);
    
    if (heldPiece === null) {
        heldPiece = newHold;
        currentPiece = nextPieces.shift();
        nextPieces.push(generatePiece());
    } else {
        const temp = heldPiece;
        heldPiece = newHold;
        currentPiece = temp;
    }
    
    currentPiece.x = Math.floor((COLS - currentPiece.matrix[0].length) / 2);
    currentPiece.y = 0;
    
    updateNextPieceUI();
    updateHoldUI();
}

function recycleAction() {
    if (runState.recycleUsesLeft <= 0 || isPaused || isGameOver || isClearingAnimation) return;
    
    runState.recycleUsesLeft--;
    currentPiece = nextPieces.shift();
    nextPieces.push(generatePiece());
    
    currentPiece.x = Math.floor((COLS - currentPiece.matrix[0].length) / 2);
    currentPiece.y = 0;
    
    updateNextPieceUI();
    updateRecycleButton();
    
    if (checkCollision(currentPiece, 0, 0)) {
        endRun(false);
    }
}

// Generate piece helper for specific shapes (Hold)
function generatePieceOfType(type) {
    const shape = SHAPES[type];
    const dominoAId = 'dom_' + Math.random().toString(36).substr(2, 9);
    const dominoBId = 'dom_' + Math.random().toString(36).substr(2, 9);
    
    const valA1 = Math.floor(Math.random() * 6) + 1;
    const valA2 = Math.floor(Math.random() * 6) + 1;
    const valB1 = Math.floor(Math.random() * 6) + 1;
    const valB2 = Math.floor(Math.random() * 6) + 1;

    let blockCount = 0;
    const matrix = [];
    
    for (let r = 0; r < shape.length; r++) {
        matrix[r] = [];
        for (let c = 0; c < shape[r].length; c++) {
            if (shape[r][c] === 1) {
                const isDominoA = blockCount < 2;
                matrix[r][c] = {
                    val: isDominoA ? (blockCount === 0 ? valA1 : valA2) : (blockCount === 2 ? valB1 : valB2),
                    dom: isDominoA ? dominoAId : dominoBId,
                    color: isDominoA ? '#ffffff' : '#e0e0e0',
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
        type: type
    };
}

// Piece Class constructor (Randomized domino tetris values)
function generatePiece() {
    const keys = Object.keys(SHAPES);
    const type = keys[Math.floor(Math.random() * keys.length)];
    return generatePieceOfType(type);
}

// Spawn falling piece
function spawnPiece() {
    if (piecesRemaining <= 0) {
        checkShuffleEnd();
        return;
    }
    
    piecesRemaining--;
    playerStats.totalPiecesPlaced++;
    saveStats();
    
    hasHeldThisTurn = false;
    currentPiece = nextPieces.shift();
    nextPieces.push(generatePiece());
    
    currentPiece.x = Math.floor((COLS - currentPiece.matrix[0].length) / 2);
    currentPiece.y = 0;
    
    updateNextPieceUI();
    updateHUD();
    
    // Check if new piece immediately collides (Game Over)
    if (checkCollision(currentPiece, 0, 0)) {
        endRun(false);
    }
}

// Canvas drawers for piece previews
function drawPreviewOnCanvas(canvasEl, ctxEl, piece) {
    const cw = canvasEl.width;
    const ch = canvasEl.height;
    ctxEl.clearRect(0, 0, cw, ch);

    if (!piece) return;

    const matrix = piece.matrix;
    const numRows = matrix.length;

    let minR = numRows, maxR = -1, minC = Infinity, maxC = -1;
    for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
            if (matrix[r][c] !== null) {
                if (r < minR) minR = r;
                if (r > maxR) maxR = r;
                if (c < minC) minC = c;
                if (c > maxC) maxC = c;
            }
        }
    }

    if (maxR === -1) return;

    const pCols = maxC - minC + 1;
    const pRows = maxR - minR + 1;
    const blockSize = BLOCK_SIZE;

    const startX = Math.floor((cw - pCols * blockSize) / 2);
    const startY = Math.floor((ch - pRows * blockSize) / 2);

    // Draw background grid lines (retro)
    ctxEl.strokeStyle = '#1e1e1e';
    ctxEl.lineWidth = 1;
    for (let x = 0; x <= pCols; x++) {
        ctxEl.beginPath();
        ctxEl.moveTo(startX + x * blockSize, startY);
        ctxEl.lineTo(startX + x * blockSize, startY + pRows * blockSize);
        ctxEl.stroke();
    }
    for (let y = 0; y <= pRows; y++) {
        ctxEl.beginPath();
        ctxEl.moveTo(startX, startY + y * blockSize);
        ctxEl.lineTo(startX + pCols * blockSize, startY + y * blockSize);
        ctxEl.stroke();
    }

    // Draw cells
    for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
            const cell = matrix[r][c];
            if (cell !== null) {
                const drawC = c - minC;
                const drawR = r - minR;
                const px = startX + drawC * blockSize;
                const py = startY + drawR * blockSize;

                ctxEl.fillStyle = '#ffffff';
                ctxEl.font = `${blockSize - 2}px Dicier`;
                ctxEl.textAlign = 'center';
                ctxEl.textBaseline = 'middle';
                ctxEl.fillText(cell.val.toString(), px + blockSize / 2, py + blockSize / 2);
            }
        }
    }

    // Draw outlines
    ctxEl.strokeStyle = '#ffffff';
    ctxEl.lineWidth = 1.5;

    const blocks = [];
    for (let r = 0; r < numRows; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
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
                const dc1 = b1.c - minC, dr1 = b1.r - minR;
                const dc2 = b2.c - minC, dr2 = b2.r - minR;
                const px1 = startX + dc1 * blockSize;
                const py1 = startY + dr1 * blockSize;
                const px2 = startX + dc2 * blockSize;
                const py2 = startY + dr2 * blockSize;

                if (dr1 === dr2 && Math.abs(dc1 - dc2) === 1) {
                    const leftPx = Math.min(px1, px2);
                    ctxEl.strokeRect(leftPx + 1, py1 + 1, blockSize * 2 - 2, blockSize - 2);
                } else if (dc1 === dc2 && Math.abs(dr1 - dr2) === 1) {
                    const topPy = Math.min(py1, py2);
                    ctxEl.strokeRect(px1 + 1, topPy + 1, blockSize - 2, blockSize * 2 - 2);
                }
            }
        }
    }
}

// Update Next Piece previews depending on BINOCULO/TELESCOPIO upgrades
function updateNextPieceUI() {
    if (!nextCanvas || !nextCtx) return;
    
    // Preview 1 (default)
    drawPreviewOnCanvas(nextCanvas, nextCtx, nextPieces[0]);

    // Preview 2 (Binóculo)
    if (runState.previewCount >= 2) {
        nextCanvas2.style.display = 'block';
        drawPreviewOnCanvas(nextCanvas2, nextCtx2, nextPieces[1]);
    } else {
        nextCanvas2.style.display = 'none';
    }

    // Preview 3 (Telescópio)
    if (runState.previewCount >= 3) {
        nextCanvas3.style.display = 'block';
        drawPreviewOnCanvas(nextCanvas3, nextCtx3, nextPieces[2]);
    } else {
        nextCanvas3.style.display = 'none';
    }
}

function drawHeldPiece() {
    if (!holdCanvas || !holdCtx) return;
    drawPreviewOnCanvas(holdCanvas, holdCtx, heldPiece);
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
        // Drop until collision
    }
    screenShakeTime = 5; // Drop screen shake
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
    
    applyRotatedMatrix(rotated);
}

// Rotate Piece Matrix (90 deg counter-clockwise / Reverse Rotation)
function rotatePieceReverse() {
    const matrix = currentPiece.matrix;
    const N = matrix.length;
    const rotated = Array(N).fill(null).map(() => Array(N).fill(null));
    
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            rotated[N - 1 - c][r] = matrix[r][c];
        }
    }
    
    applyRotatedMatrix(rotated);
}

function applyRotatedMatrix(rotated) {
    const originalMatrix = currentPiece.matrix;
    const originalX = currentPiece.x;
    currentPiece.matrix = rotated;
    
    // Wall kick
    let shift = 0;
    while (checkCollision(currentPiece, 0, 0) && Math.abs(shift) < 3) {
        shift = shift >= 0 ? -shift - 1 : -shift; // 0, -1, 1, -2, 2
        currentPiece.x = originalX + shift;
    }
    
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
        findAdjacentMatches();
        
        if (matchingCells.length > 0) {
            isClearingAnimation = true;
            clearAnimationTimer = CLEAR_ANIMATION_DURATION;
            screenShakeTime = SCREEN_SHAKE_DURATION;
        } else {
            clearRows();
            spawnPiece();
        }
    } else {
        spawnPiece();
    }
}

// Find adjacent cells with same values that touch completed lines
function findAdjacentMatches() {
    matchingCells = [];
    const matchedKeys = new Set();
    const rowsSet = new Set(rowsToClear);
    
    const dirs = [
        [0, 1],  // right
        [1, 0]   // down
    ];

    if (runState.diagonalMatch) {
        dirs.push([1, 1]);   // down-right
        dirs.push([1, -1]);  // down-left
    }
    
    for (const r of rowsSet) {
        for (let c = 0; c < COLS; c++) {
            const cell = board[r][c];
            if (cell === null) continue;
            
            for (const [dr, dc] of dirs) {
                const nr = r + dr;
                const nc = c + dc;
                
                if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
                if (!rowsSet.has(nr) && !runState.diagonalMatch) continue; // standard checks touching rows only
                
                const neighbor = board[nr][nc];
                if (neighbor === null) continue;
                
                if (cell.val === neighbor.val) {
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
    
    // Save unique pairs for stats
    if (runState.diagonalMatch) {
        playerStats.totalDiagonals += matchedKeys.size;
    }
}

// Clear completed lines and apply Roguelike Chips * Mult formula
function clearRows() {
    rowsToClear.sort((a,b) => b-a);
    
    let baseChips = 0;
    const seenCells = new Set();
    
    // Filter duplicates and collect dice sum
    for (const cell of matchingCells) {
        const key = `${cell.r},${cell.c}`;
        if (!seenCells.has(key)) {
            seenCells.add(key);
            const val = board[cell.r][cell.c].val;
            baseChips += val;
            
            // Stats check for 6-6 matches
            if (val === 6) {
                // If adjacent cell is also 6, count as a 6-6 pair
                // (approximation handled on cell scan)
            }
            
            spawnExplosion(cell.c, cell.r, val, true);
        }
    }

    // Recalculate actual 6-6 pairs for stats & jackpot
    let sixSixPairs = 0;
    const rowsSet = new Set(rowsToClear);
    const checkedKeys = new Set();
    
    for (const r of rowsSet) {
        for (let c = 0; c < COLS; c++) {
            const cell = board[r][c];
            if (cell && cell.val === 6) {
                // check right and down
                const checks = [[0,1],[1,0]];
                if (runState.diagonalMatch) checks.push([1,1],[1,-1]);
                for (const [dr, dc] of checks) {
                    const nr = r+dr, nc = c+dc;
                    if (nr>=0 && nr<ROWS && nc>=0 && nc<COLS) {
                        const neighbor = board[nr][nc];
                        if (neighbor && neighbor.val === 6) {
                            const key = `${r},${c}-${nr},${nc}`;
                            if (!checkedKeys.has(key)) {
                                checkedKeys.add(key);
                                sixSixPairs++;
                            }
                        }
                    }
                }
            }
        }
    }
    playerStats.total6Pairs += sixSixPairs;

    // Apply Upgrades Chips / Mult modifiers
    let jackpotBonus = (runState.jackpot6 && sixSixPairs > 0) ? (sixSixPairs * 10) : 0;
    let highValueDiceCount = 0;
    for (const cell of matchingCells) {
        const val = board[cell.r][cell.c].val;
        if (val >= 5) highValueDiceCount++;
    }
    let highValueBonusChips = highValueDiceCount * runState.highValueBonus;

    // Chips x Mult formula
    let totalPairs = checkedKeys.size;
    let chips = baseChips + (totalPairs * runState.pairBonusChips) + jackpotBonus + highValueBonusChips + (runState.bonusChipsPerLine * rowsToClear.length);
    let totalMult = (1 + runState.addMult + (runState.multPerLine * rowsToClear.length)) * runState.multMult;
    
    let points = Math.floor(chips * totalMult);
    
    if (points > 0) {
        shuffleScore += points;
        runScore += points;
        
        // Spawn floating text chips x mult particle
        const centerCol = Math.floor(COLS / 2);
        const centerRow = rowsToClear[Math.floor(rowsToClear.length / 2)] || Math.floor(ROWS / 2);
        particles.push({
            type: 'text',
            x: centerCol * BLOCK_SIZE + BLOCK_SIZE / 2,
            y: centerRow * BLOCK_SIZE + BLOCK_SIZE / 2,
            vx: 0,
            vy: -1.5,
            text: `${chips} × ${totalMult.toFixed(1)} = +${points}`,
            life: 60,
            maxLife: 60,
            color: '#ccaa22' // golden scoring text
        });
    }

    playerStats.totalLinesCleared += rowsToClear.length;
    if (rowsToClear.length > playerStats.maxComboInLine) {
        playerStats.maxComboInLine = rowsToClear.length;
    }
    saveStats();
    
    // Speed increases with level (lines completed / 10)
    const level = Math.floor(playerStats.totalLinesCleared / 10) + 1;
    dropInterval = Math.max(100, (800 - (level - 1) * 70) / runState.speedMult);
    
    updateHUD();
    
    // Remove lines from board
    for (const r of rowsToClear) {
        board.splice(r, 1);
        const newRow = Array(COLS).fill(null);
        board.unshift(newRow);
        
        for (let i = 0; i < rowsToClear.length; i++) {
            if (rowsToClear[i] < r) {
                rowsToClear[i]++;
            }
        }
    }
    
    matchingCells = [];
    rowsToClear = [];
}

// Check if shuffle ends (either win or lose)
function checkShuffleEnd() {
    isGameOver = true;
    const s = SHUFFLES[currentShuffle];
    
    if (shuffleScore >= s.target) {
        // Target met! Save stats.
        if (shuffleScore > playerStats.bestShuffleScore) {
            playerStats.bestShuffleScore = shuffleScore;
        }
        playerStats.totalScore += shuffleScore;
        saveStats();
        
        if (currentShuffle === 2) {
            // Passed Final Shuffle! Victory.
            endRun(true);
        } else {
            // Passed Small or Big. Show results screen.
            showScreen('shuffleResult');
        }
    } else {
        // Failed target score. Run ended.
        endRun(false);
    }
}

function proceedAfterUpgrade() {
    currentShuffle++;
    showScreen('shuffleIntro');
}

function endRun(victory) {
    isGameOver = true;
    playerStats.runsPlayed++;
    
    if (runScore > playerStats.bestRunScore) {
        playerStats.bestRunScore = runScore;
    }
    playerStats.totalScore += shuffleScore;
    
    if (victory) {
        playerStats.runsWon++;
        playerStats.consecutiveWins++;
        if (playerStats.consecutiveWins > playerStats.maxConsecutiveWins) {
            playerStats.maxConsecutiveWins = playerStats.consecutiveWins;
        }
        showScreen('runComplete');
    } else {
        playerStats.consecutiveWins = 0;
        showScreen('runFailed');
    }
    saveStats();
}

// Render dynamic upgrade selection cards
function renderUpgradeCards(upgrades) {
    const container = document.getElementById('upgrade-cards-container');
    container.innerHTML = '';

    if (upgrades.length === 0) {
        // Fallback skip
        proceedAfterUpgrade();
        return;
    }
    
    upgrades.forEach(upgrade => {
        const card = document.createElement('div');
        card.className = `upgrade-card tier-${upgrade.tier}`;
        
        const nameText = upgrade.name[currentLang] || upgrade.name['pt-BR'];
        const descText = upgrade.desc[currentLang] || upgrade.desc['pt-BR'];
        
        card.innerHTML = `
            <div class="card-tier-label">${upgrade.tier.toUpperCase()}</div>
            <div class="card-icon">${upgrade.icon}</div>
            <h3 class="card-name">${nameText}</h3>
            <p class="card-desc">${descText}</p>
        `;
        
        card.addEventListener('click', () => {
            applyUpgrade(upgrade);
            proceedAfterUpgrade();
        });
        
        container.appendChild(card);
    });
}

function applyUpgrade(upgrade) {
    runState.activeUpgrades.push(upgrade.id);
    if (upgrade.effect) {
        upgrade.effect(runState);
    }
}

// Render locked / unlocked collection screen
function renderCollection() {
    const unlockedCount = getUnlockedUpgradesCount();
    const totalCount = ALL_UPGRADES.length;
    
    document.getElementById('collection-progress-text').innerText = t('unlockedCount', unlockedCount, totalCount);
    const pct = (unlockedCount / totalCount) * 100;
    document.getElementById('collection-progress-bar').style.width = `${pct}%`;
    
    const grid = document.getElementById('collection-grid');
    grid.innerHTML = '';
    
    ALL_UPGRADES.forEach(upgrade => {
        const card = document.createElement('div');
        const unlocked = isUpgradeUnlocked(upgrade);
        
        if (unlocked) {
            card.className = `collection-card tier-${upgrade.tier}`;
            const nameText = upgrade.name[currentLang] || upgrade.name['pt-BR'];
            const descText = upgrade.desc[currentLang] || upgrade.desc['pt-BR'];
            card.innerHTML = `
                <div class="card-tier-label">${upgrade.tier.toUpperCase()}</div>
                <div class="card-icon">${upgrade.icon}</div>
                <h4 class="card-name">${nameText}</h4>
                <p class="card-desc">${descText}</p>
            `;
        } else {
            card.className = 'collection-card locked-card';
            const reqText = upgrade.unlock.desc[currentLang] || upgrade.unlock.desc['pt-BR'];
            card.innerHTML = `
                <div class="card-icon">🔒</div>
                <h4 class="card-name">${t('locked')}</h4>
                <p class="card-desc">${t('unlockReq', reqText)}</p>
            `;
        }
        
        grid.appendChild(card);
    });
}

// Draw initial static menu background using Dicier characters (preserved)
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
    
    updateParticles();

    if (isClearingAnimation) {
        clearAnimationTimer--;
        
        // Toggle flash state every 5 frames
        if (clearAnimationTimer % 5 === 0) {
            const seenToggle = new Set();
            for (const cell of matchingCells) {
                const key = `${cell.r},${cell.c}`;
                if (!seenToggle.has(key)) {
                    seenToggle.add(key);
                    if (board[cell.r][cell.c]) {
                        board[cell.r][cell.c].flash = !board[cell.r][cell.c].flash;
                    }
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
    ctx.fillStyle = 'rgba(8, 8, 8, 0.05)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '18px "Silkscreen", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t('paused'), canvas.width / 2, canvas.height / 2);
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.fillText(t('pressP'), canvas.width / 2, canvas.height / 2 + 30);
}

// Core drawing engine
function draw() {
    ctx.save();
    if (screenShakeTime > 0) {
        const dx = (Math.random() * 6 - 3) * (screenShakeTime / SCREEN_SHAKE_DURATION);
        const dy = (Math.random() * 6 - 3) * (screenShakeTime / SCREEN_SHAKE_DURATION);
        ctx.translate(dx, dy);
        
        canvas.style.transform = `translate(${dx * 0.5}px, ${dy * 0.5}px)`;
        screenShakeTime--;
    } else {
        canvas.style.transform = 'translate(0px, 0px)';
    }
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background grid lines
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
    
    drawParticles();
    
    ctx.restore();
}

// Render individual block using Dicier font
function drawCell(x, y, cell) {
    const px = x * BLOCK_SIZE;
    const py = y * BLOCK_SIZE;
    
    if (cell.match && cell.flash) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(px, py, BLOCK_SIZE, BLOCK_SIZE);
        
        ctx.fillStyle = '#080808';
        ctx.font = `${BLOCK_SIZE - 2}px Dicier`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cell.val.toString(), px + BLOCK_SIZE / 2, py + BLOCK_SIZE / 2);
    } else {
        ctx.fillStyle = '#ffffff';
        ctx.font = `${BLOCK_SIZE - 2}px Dicier`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cell.val.toString(), px + BLOCK_SIZE / 2, py + BLOCK_SIZE / 2);
    }
}

// Draw single borders enclosing domino pairs
function drawDominoOutlines() {
    const drawnPairs = new Set();
    
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = board[r][c];
            if (cell === null || !cell.dom) continue;
            
            const neighbors = [
                { r: r, c: c + 1, type: 'H' },
                { r: r + 1, c: c, type: 'V' }
            ];
            
            for (const n of neighbors) {
                if (n.r < ROWS && n.c < COLS) {
                    const neighbor = board[n.r][n.c];
                    if (neighbor !== null && neighbor.dom === cell.dom) {
                        const pairKey = [r, c, n.r, n.c].join('-');
                        if (!drawnPairs.has(pairKey)) {
                            drawnPairs.add(pairKey);
                            
                            ctx.strokeStyle = '#ffffff';
                            ctx.lineWidth = 1;
                            
                            if (n.type === 'H') {
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
    const blocks = [];
    for (let r = 0; r < p.matrix.length; r++) {
        for (let c = 0; c < p.matrix[r].length; c++) {
            if (p.matrix[r][c] !== null) {
                blocks.push({ r, c, cell: p.matrix[r][c] });
            }
        }
    }
    
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
                
                if (by1 === by2 && Math.abs(bx1 - bx2) === 1) {
                    const minX = Math.min(bx1, bx2);
                    ctx.strokeRect(minX * BLOCK_SIZE + 1, by1 * BLOCK_SIZE + 1, BLOCK_SIZE * 2 - 2, BLOCK_SIZE - 2);
                } else if (bx1 === bx2 && Math.abs(by1 - by2) === 1) {
                    const minY = Math.min(by1, by2);
                    ctx.strokeRect(bx1 * BLOCK_SIZE + 1, minY * BLOCK_SIZE + 1, BLOCK_SIZE - 2, BLOCK_SIZE * 2 - 2);
                }
            }
        }
    }
}

// Particle System for explosions
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
                vy: Math.sin(angle) * speed - 1.2,
                size: 2 + Math.floor(Math.random() * 3),
                life: 20 + Math.floor(Math.random() * 15),
                maxLife: 35,
                color: color
            });
        }
    } else {
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
            p.vy *= 0.95;
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
