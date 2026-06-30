/* ══════════════════════════════════════════
   game.js — Core game engine
   ══════════════════════════════════════════ */

'use strict';

const Game = (() => {
  // ── Constants ────────────────────────────
  const CELL_SIZE    = 24;
  const LEVEL_THRESH = 5;  // food eaten to level up

  // Power-up types
  const POWERUP_TYPES = ['shield', 'magnet', 'slow', 'double'];
  const POWERUP_DURATION = 8000; // 8 s

  // ── State ─────────────────────────────────
  let canvas, ctx;
  let cols, rows;
  let score, highScore, level, coresEaten;
  let tick;           // frame counter
  let lastTime;       // for delta timing
  let accumulated;    // ms since last game tick
  let currentSpeed;   // ms per tick
  let running, paused, dead;
  let onGameOver;

  const powerUps = { shield: 0, magnet: 0, slow: 0, double: 0 };
  // active timers keyed by powerup name
  const powerUpTimers = {};

  // ── Init ──────────────────────────────────
  function init(canvasEl, gameOverCallback) {
    canvas = canvasEl;
    ctx    = canvas.getContext('2d');
    onGameOver = gameOverCallback;
    _resize();
  }

  function _resize() {
    const wrap = canvas.parentElement;
    const w    = wrap.clientWidth;
    const h    = wrap.clientHeight;

    // Fit grid into available space
    cols = Math.floor(w / CELL_SIZE);
    rows = Math.floor(h / CELL_SIZE);

    // Clamp to reasonable sizes
    cols = Math.max(10, Math.min(cols, 60));
    rows = Math.max(10, Math.min(rows, 40));

    canvas.width  = cols * CELL_SIZE;
    canvas.height = rows * CELL_SIZE;
  }

  // ── Start / Reset ─────────────────────────
  function start() {
    _resize();

    score      = 0;
    level      = 1;
    coresEaten = 0;
    tick       = 0;
    running    = true;
    paused     = false;
    dead       = false;
    accumulated = 0;
    lastTime    = null;
    highScore  = Storage.getHighScore();

    // Reset power-ups
    Object.keys(powerUps).forEach(k => powerUps[k] = 0);
    Object.values(powerUpTimers).forEach(clearTimeout);
    Object.keys(powerUpTimers).forEach(k => delete powerUpTimers[k]);

    const cfg = Settings.getDifficultyConfig();
    currentSpeed = cfg.baseSpeed;

    // Place snake in middle
    const midX = Math.floor(cols / 2);
    const midY = Math.floor(rows / 2);
    Snake.reset(midX, midY);

    FoodSystem.reset();
    FoodSystem.spawn(cols, rows, Snake.getBody(), _onBossExpire);

    _updateHUD();
    requestAnimationFrame(_loop);
  }

  // ── Game Loop ─────────────────────────────
  function _loop(timestamp) {
    if (!running) return;

    if (!lastTime) lastTime = timestamp;
    const delta = timestamp - lastTime;
    lastTime = timestamp;
    tick++;

    if (!paused) {
      accumulated += delta;
      const speed = powerUps.slow > 0 ? currentSpeed * 2 : currentSpeed;
      if (accumulated >= speed) {
        accumulated = 0;
        _step();
        if (dead) return;
      }
    }

    _draw();
    requestAnimationFrame(_loop);
  }

  // ── Game Step (one tick) ──────────────────
  function _step() {
    // Magnet pulls food closer every step
    if (powerUps.magnet > 0) {
      FoodSystem.magnetPull(Snake.getHead().x, Snake.getHead().y, 4);
    }

    Snake.move();
    const head = Snake.getHead();

    // Wall collision
    if (Snake.hitsWall(cols, rows)) { _die(); return; }

    // Self collision (only if no shield)
    if (powerUps.shield === 0 && Snake.hitsSelf()) { _die(); return; }

    // Eat food
    const eaten = FoodSystem.checkEat(head.x, head.y);
    if (eaten) {
      _onEat(eaten);
    }

    // Maybe spawn power-up as food (simple: re-use food spawn with chance)
    FoodSystem.spawn(cols, rows, Snake.getBody(), _onBossExpire);
    _maybePowerUpSpawn();
  }

  function _onEat(food) {
    coresEaten++;
    const cfg    = Settings.getDifficultyConfig();
    const multi  = powerUps.double > 0 ? 2 : 1;
    const points = Math.round(food.score * cfg.scoreMulti * multi);
    score += points;

    Snake.addLength(food.type === 'boss' ? 4 : food.type === 'rare' ? 2 : 1);
    if (food.type === 'rare') Storage.updateStats({ raresEaten: 1 });
    if (food.type === 'boss') Storage.updateStats({ bossesEaten: 1 });
    _checkLevelUp();
    _updateHUD();

    // Particles effect (simple flash on score)
    UI.showFloatScore(points, food.color);

    // Sound
    if (Settings.getSoundEnabled()) SoundFX.play(food.type);
  }

  function _checkLevelUp() {
    const newLevel = Math.floor(coresEaten / LEVEL_THRESH) + 1;
    if (newLevel > level) {
      level = newLevel;
      const cfg = Settings.getDifficultyConfig();
      currentSpeed = Math.max(50, cfg.baseSpeed - level * cfg.speedStep);
      UI.showLevelUp(level);
    }
  }

  // ── Power-Ups ─────────────────────────────
  // Power-ups are spawned as overlays on the canvas (not food cells)
  // Simplified: after eating food, random chance to award a power-up
  function _maybePowerUpSpawn() {
    if (Math.random() > 0.07) return; // 7% per step
    const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
    _activatePowerUp(type);
  }

  function _activatePowerUp(type) {
    powerUps[type] = 1;
    UI.setPowerUpActive(type, true);

    if (powerUpTimers[type]) clearTimeout(powerUpTimers[type]);
    powerUpTimers[type] = setTimeout(() => {
      powerUps[type] = 0;
      UI.setPowerUpActive(type, false);
    }, POWERUP_DURATION);

    Storage.updateStats({ powerUpsGot: 1 });
    if (Settings.getSoundEnabled()) SoundFX.play('powerup');
  }

  function _onBossExpire() { /* boss expired naturally */ }

  // ── Death ─────────────────────────────────
  function _die() {
    dead    = true;
    running = false;

    const isNew = score > highScore;
    if (isNew) {
      highScore = score;
      Storage.setHighScore(highScore);
    }

    Storage.updateStats({
      gamesPlayed: 1,
      totalScore:  score,
      coresEaten:  coresEaten,
      bestLevel:   level,
    });

    if (Settings.getSoundEnabled()) SoundFX.play('die');

    // Flash effect before game over
    setTimeout(() => {
      if (typeof onGameOver === 'function') {
        onGameOver({ score, highScore, level, coresEaten, isNewBest: isNew });
      }
    }, 400);
  }

  // ── Draw ──────────────────────────────────
  function _draw() {
    // Background
    ctx.fillStyle = '#060b06';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    _drawGrid();

    FoodSystem.draw(ctx, CELL_SIZE, tick);

    Snake.draw(ctx, CELL_SIZE, tick, powerUps.shield > 0);

    if (paused) _drawPauseFlash();
  }

  function _drawGrid() {
    ctx.strokeStyle = 'rgba(0,255,136,0.04)';
    ctx.lineWidth   = 0.5;
    for (let x = 0; x <= cols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(canvas.width, y * CELL_SIZE);
      ctx.stroke();
    }
  }

  function _drawPauseFlash() {
    ctx.fillStyle = 'rgba(0,255,136,0.03)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  // ── HUD Update ────────────────────────────
  function _updateHUD() {
    UI.updateHUD(score, highScore, level);
  }

  // ── Public API ────────────────────────────
  function pause()  { paused = true; }
  function resume() { paused = false; lastTime = null; }
  function stop()   { running = false; }
  function isPaused() { return paused; }
  function isRunning() { return running; }

  function setDirection(dir) {
    if (running && !paused && !dead) Snake.setDirection(dir);
  }

  return { init, start, pause, resume, stop, isPaused, isRunning, setDirection };
})();

/* ══════════════════════════════════════════
   SoundFX — simple Web Audio beeps
   ══════════════════════════════════════════ */
const SoundFX = (() => {
  let ctx = null;

  function _getCtx() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    return ctx;
  }

  function _beep(freq, duration, type = 'square', vol = 0.15) {
    try {
      const ac  = _getCtx();
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type      = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(vol, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
      osc.start(ac.currentTime);
      osc.stop(ac.currentTime + duration);
    } catch { /* silent fail if audio blocked */ }
  }

  function play(type) {
    switch (type) {
      case 'normal':  _beep(440, 0.08, 'square', 0.1); break;
      case 'rare':    _beep(660, 0.12, 'sine',   0.15); _beep(880, 0.1, 'sine', 0.12); break;
      case 'boss':    _beep(220, 0.25, 'sawtooth', 0.2); break;
      case 'powerup': _beep(550, 0.08, 'sine', 0.12); _beep(660, 0.1, 'sine', 0.1); break;
      case 'die':     _beep(200, 0.15, 'sawtooth', 0.2); _beep(150, 0.3, 'sawtooth', 0.15); break;
    }
  }

  return { play };
})();
