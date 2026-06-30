/* ══════════════════════════════════════════
   main.js — Entry point & event wiring
   ══════════════════════════════════════════ */

'use strict';

(function () {
  // ── Canvas Setup ──────────────────────────
  const canvas = document.getElementById('game-canvas');
  Game.init(canvas, handleGameOver);

  // ── Difficulty selection ──────────────────
  document.querySelectorAll('.diff-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      Settings.setDifficulty(btn.dataset.diff);
    });
  });

  // ── Menu buttons ──────────────────────────
  document.getElementById('btn-play').addEventListener('click', startGame);

  document.getElementById('btn-stats').addEventListener('click', () => {
    UI.renderStats();
    UI.showScreen('stats');
  });

  document.getElementById('btn-settings').addEventListener('click', () => {
    UI.renderSettings();
    UI.showScreen('settings');
  });

  // ── Game controls ─────────────────────────
  document.getElementById('btn-resume').addEventListener('click', () => {
    document.getElementById('overlay-pause').classList.add('hidden');
    Game.resume();
  });

  document.getElementById('btn-quit').addEventListener('click', () => {
    Game.stop();
    document.getElementById('overlay-pause').classList.add('hidden');
    UI.showScreen('menu');
  });

  // ── Game-over buttons ─────────────────────
  document.getElementById('btn-retry').addEventListener('click', startGame);

  document.getElementById('btn-menu-go').addEventListener('click', () => {
    UI.showScreen('menu');
  });

  // ── Stats back ────────────────────────────
  document.getElementById('btn-stats-back').addEventListener('click', () => {
    UI.showScreen('menu');
  });

  // ── Settings back & toggles ───────────────
  document.getElementById('btn-settings-back').addEventListener('click', () => {
    UI.showScreen('menu');
  });

  document.getElementById('toggle-sound').addEventListener('click', function () {
    const on = Settings.toggleSound();
    this.textContent = on ? 'ON' : 'OFF';
    this.classList.toggle('off', !on);
  });

  document.getElementById('toggle-music').addEventListener('click', function () {
    const on = Settings.toggleMusic();
    this.textContent = on ? 'ON' : 'OFF';
    this.classList.toggle('off', !on);
  });

  // ── Keyboard input ────────────────────────
  const KEY_MAP = {
    ArrowUp:    'UP',    KeyW: 'UP',
    ArrowDown:  'DOWN',  KeyS: 'DOWN',
    ArrowLeft:  'LEFT',  KeyA: 'LEFT',
    ArrowRight: 'RIGHT', KeyD: 'RIGHT',
  };

  document.addEventListener('keydown', e => {
    const dir = KEY_MAP[e.code];
    if (dir) {
      e.preventDefault();
      if (Game.isRunning()) Game.setDirection(dir);
      return;
    }
    if (e.code === 'Space' || e.code === 'Escape') {
      e.preventDefault();
      togglePause();
    }
  });

  // ── Mobile D-Pad ─────────────────────────
  const mcMap = {
    'mc-up':    'UP',
    'mc-down':  'DOWN',
    'mc-left':  'LEFT',
    'mc-right': 'RIGHT',
  };

  Object.entries(mcMap).forEach(([id, dir]) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.addEventListener('touchstart', e => {
      e.preventDefault();
      Game.setDirection(dir);
    }, { passive: false });
    btn.addEventListener('click', () => Game.setDirection(dir));
  });

  document.getElementById('mc-pause').addEventListener('click', togglePause);

  // ── Touch swipe on canvas ─────────────────
  let touchStartX = 0, touchStartY = 0;

  canvas.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  canvas.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
    if (Math.abs(dx) > Math.abs(dy)) {
      Game.setDirection(dx > 0 ? 'RIGHT' : 'LEFT');
    } else {
      Game.setDirection(dy > 0 ? 'DOWN' : 'UP');
    }
  }, { passive: true });

  // ── Window resize ─────────────────────────
  window.addEventListener('resize', () => {
    // Only matters during active game; next start will re-init
  });

  // ── Helpers ───────────────────────────────
  function startGame() {
    UI.showScreen('game');
    // Reset all power-up UI slots
    ['shield', 'magnet', 'slow', 'double'].forEach(t => UI.setPowerUpActive(t, false));
    document.getElementById('overlay-pause').classList.add('hidden');
    Game.start();
  }

  function togglePause() {
    if (!Game.isRunning()) return;
    if (Game.isPaused()) {
      document.getElementById('overlay-pause').classList.add('hidden');
      Game.resume();
    } else {
      Game.pause();
      document.getElementById('overlay-pause').classList.remove('hidden');
    }
  }

  function handleGameOver(result) {
    UI.showGameOver(result);
  }

})();
