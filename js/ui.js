/* ══════════════════════════════════════════
   ui.js — Screen management & HUD
   ══════════════════════════════════════════ */

'use strict';

const UI = (() => {
  // ── Screen registry ───────────────────────
  const screens = {
    menu:     document.getElementById('screen-menu'),
    game:     document.getElementById('screen-game'),
    gameover: document.getElementById('screen-gameover'),
    stats:    document.getElementById('screen-stats'),
    settings: document.getElementById('screen-settings'),
  };

  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    if (screens[name]) screens[name].classList.add('active');
  }

  // ── HUD ───────────────────────────────────
  const hudScore = document.getElementById('hud-score');
  const hudHigh  = document.getElementById('hud-high');
  const hudLevel = document.getElementById('hud-level');

  function updateHUD(score, high, level) {
    hudScore.textContent = score;
    hudHigh.textContent  = high;
    hudLevel.textContent = level;
  }

  // ── Float score popup ─────────────────────
  let floatEl = null;
  function showFloatScore(points, color) {
    const canvas = document.getElementById('game-canvas');
    if (!canvas) return;
    if (floatEl) floatEl.remove();
    floatEl = document.createElement('div');
    floatEl.textContent = `+${points}`;
    Object.assign(floatEl.style, {
      position:   'absolute',
      top:        '50%',
      left:       '50%',
      transform:  'translate(-50%,-50%)',
      fontFamily: 'Orbitron, monospace',
      fontSize:   '1.1rem',
      fontWeight: '700',
      color:      color || '#00ff88',
      textShadow: `0 0 12px ${color || '#00ff88'}`,
      pointerEvents: 'none',
      zIndex:     '10',
      transition: 'opacity .6s, transform .6s',
    });
    canvas.parentElement.appendChild(floatEl);
    requestAnimationFrame(() => {
      floatEl.style.opacity   = '0';
      floatEl.style.transform = 'translate(-50%, -120%)';
    });
    setTimeout(() => { if (floatEl) floatEl.remove(); }, 700);
  }

  // ── Level-up banner ───────────────────────
  let lvlEl = null;
  function showLevelUp(level) {
    const wrap = document.querySelector('.canvas-wrap');
    if (!wrap) return;
    if (lvlEl) lvlEl.remove();
    lvlEl = document.createElement('div');
    lvlEl.textContent = `⬆ LEVEL ${level}`;
    Object.assign(lvlEl.style, {
      position:   'absolute',
      top:        '20%',
      left:       '50%',
      transform:  'translateX(-50%)',
      fontFamily: 'Orbitron, monospace',
      fontSize:   '1.3rem',
      fontWeight: '900',
      letterSpacing: '.12em',
      color:      '#00ccff',
      textShadow: '0 0 16px #00ccff',
      pointerEvents: 'none',
      zIndex:     '10',
      transition: 'opacity .8s 1s, transform .8s 1s',
    });
    wrap.appendChild(lvlEl);
    requestAnimationFrame(() => {
      lvlEl.style.opacity   = '0';
      lvlEl.style.transform = 'translateX(-50%) scale(1.2)';
    });
    setTimeout(() => { if (lvlEl) lvlEl.remove(); }, 2000);
  }

  // ── Power-up slots ────────────────────────
  const puSlots = {
    shield: document.getElementById('pu-shield'),
    magnet: document.getElementById('pu-magnet'),
    slow:   document.getElementById('pu-slow'),
    double: document.getElementById('pu-double'),
  };

  function setPowerUpActive(type, active) {
    const el = puSlots[type];
    if (!el) return;
    el.classList.toggle('active', active);
  }

  // ── Game-over screen ──────────────────────
  function showGameOver({ score, highScore, level, coresEaten, isNewBest }) {
    document.getElementById('go-score').textContent  = score;
    document.getElementById('go-high').textContent   = highScore;
    document.getElementById('go-level').textContent  = level;
    document.getElementById('go-eaten').textContent  = coresEaten;
    const newBestEl = document.getElementById('go-newbest');
    newBestEl.classList.toggle('hidden', !isNewBest);
    showScreen('gameover');
  }

  // ── Statistics screen ─────────────────────
  function renderStats() {
    const stats = Storage.getStats();
    const high  = Storage.getHighScore();
    const grid  = document.getElementById('stats-grid');
    if (!grid) return;

    const entries = [
      ['HIGH SCORE',    high],
      ['GAMES PLAYED',  stats.gamesPlayed],
      ['TOTAL SCORE',   stats.totalScore],
      ['CORES EATEN',   stats.coresEaten],
      ['RARES EATEN',   stats.raresEaten],
      ['BOSSES EATEN',  stats.bossesEaten],
      ['POWER-UPS',     stats.powerUpsGot],
      ['BEST LEVEL',    stats.bestLevel],
    ];

    grid.innerHTML = entries.map(([label, val]) => `
      <div class="stat-card">
        <span class="stat-card-label">${label}</span>
        <span class="stat-card-value">${val}</span>
      </div>
    `).join('');
  }

  // ── Settings screen ───────────────────────
  function renderSettings() {
    const soundBtn = document.getElementById('toggle-sound');
    const musicBtn = document.getElementById('toggle-music');
    soundBtn.textContent = Settings.getSoundEnabled() ? 'ON' : 'OFF';
    soundBtn.classList.toggle('off', !Settings.getSoundEnabled());
    musicBtn.textContent = Settings.getMusicEnabled() ? 'ON' : 'OFF';
    musicBtn.classList.toggle('off', !Settings.getMusicEnabled());
  }

  return { showScreen, updateHUD, showFloatScore, showLevelUp, setPowerUpActive, showGameOver, renderStats, renderSettings };
})();
