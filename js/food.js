/* ══════════════════════════════════════════
   food.js — Energy Core system
   ══════════════════════════════════════════ */

'use strict';

const FoodSystem = (() => {
  const TYPE = {
    normal: { color: '#00ff88', glow: '#00ff8888', score: 10, label: 'NORMAL', rarity: 'normal' },
    rare:   { color: '#ffaa00', glow: '#ffaa0088', score: 30, label: 'RARE',   rarity: 'rare'   },
    boss:   { color: '#cc44ff', glow: '#cc44ff88', score: 80, label: 'BOSS',   rarity: 'boss'   },
  };

  // Chance weights for spawning rare/boss on top of normal
  const RARE_CHANCE = 0.18;   // 18 % chance rare appears alongside normal
  const BOSS_CHANCE = 0.05;   // 5  % chance boss appears alongside normal

  const BOSS_DURATION = 6000; // Boss disappears after 6 s

  let items = [];       // active food items on board
  let bossTimer = null;

  function _randomCell(cols, rows, occupied) {
    let attempts = 0;
    while (attempts < 500) {
      const x = Math.floor(Math.random() * cols);
      const y = Math.floor(Math.random() * rows);
      if (!occupied.some(s => s.x === x && s.y === y)) return { x, y };
      attempts++;
    }
    return null; // fallback – board is full
  }

  function _removeByType(type) {
    items = items.filter(f => f.type !== type);
    if (type === 'boss' && bossTimer) {
      clearTimeout(bossTimer);
      bossTimer = null;
    }
  }

  // Spawn food after reset or eating
  function spawn(cols, rows, snakeBody, onBossExpire) {
    // Always ensure a normal core exists
    const hasNormal = items.some(f => f.type === 'normal');
    if (!hasNormal) {
      const occupied = [...snakeBody, ...items.map(f => ({ x: f.x, y: f.y }))];
      const pos = _randomCell(cols, rows, occupied);
      if (pos) items.push({ ...pos, type: 'normal', ...TYPE.normal, pulse: 0 });
    }

    // Maybe spawn rare
    const hasRare = items.some(f => f.type === 'rare');
    if (!hasRare && Math.random() < RARE_CHANCE) {
      const occupied = [...snakeBody, ...items.map(f => ({ x: f.x, y: f.y }))];
      const pos = _randomCell(cols, rows, occupied);
      if (pos) items.push({ ...pos, type: 'rare', ...TYPE.rare, pulse: 0 });
    }

    // Maybe spawn boss (only one at a time)
    const hasBoss = items.some(f => f.type === 'boss');
    if (!hasBoss && Math.random() < BOSS_CHANCE) {
      const occupied = [...snakeBody, ...items.map(f => ({ x: f.x, y: f.y }))];
      const pos = _randomCell(cols, rows, occupied);
      if (pos) {
        items.push({ ...pos, type: 'boss', ...TYPE.boss, pulse: 0 });
        bossTimer = setTimeout(() => {
          _removeByType('boss');
          if (typeof onBossExpire === 'function') onBossExpire();
        }, BOSS_DURATION);
      }
    }
  }

  function reset() {
    if (bossTimer) clearTimeout(bossTimer);
    bossTimer = null;
    items = [];
  }

  // Returns eaten food item or null
  function checkEat(headX, headY) {
    const idx = items.findIndex(f => f.x === headX && f.y === headY);
    if (idx === -1) return null;
    const eaten = items[idx];
    items.splice(idx, 1);
    if (eaten.type === 'boss' && bossTimer) {
      clearTimeout(bossTimer);
      bossTimer = null;
    }
    return eaten;
  }

  // Check if snake head is near magnet range
  function magnetPull(headX, headY, range) {
    // Magnet moves normal food one step closer; rare/boss stay fixed
    items.forEach(f => {
      if (f.type !== 'normal') return;
      const dx = headX - f.x;
      const dy = headY - f.y;
      const dist = Math.abs(dx) + Math.abs(dy);
      if (dist > 0 && dist <= range) {
        if (Math.abs(dx) >= Math.abs(dy)) {
          f.x += dx > 0 ? 1 : -1;
        } else {
          f.y += dy > 0 ? 1 : -1;
        }
      }
    });
  }

  function getItems() { return items; }

  // Draw all food items on canvas
  function draw(ctx, cellSize, tick) {
    items.forEach(food => {
      const cx = food.x * cellSize + cellSize / 2;
      const cy = food.y * cellSize + cellSize / 2;
      const r  = cellSize * 0.36;
      const t  = tick * 0.06;

      // Pulsing glow
      const pulse = 0.7 + 0.3 * Math.sin(t + (food.x + food.y) * 0.5);

      ctx.save();

      // Outer glow
      ctx.shadowColor = food.glow;
      ctx.shadowBlur  = 18 * pulse;

      // Draw hexagonal core shape
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        const px = cx + r * Math.cos(angle) * pulse;
        const py = cy + r * Math.sin(angle) * pulse;
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      }
      ctx.closePath();

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      grad.addColorStop(0, food.color + 'ff');
      grad.addColorStop(1, food.color + '44');
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.strokeStyle = food.color;
      ctx.lineWidth   = 1.5;
      ctx.stroke();

      // Inner cross for boss
      if (food.type === 'boss') {
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - r * 0.4, cy); ctx.lineTo(cx + r * 0.4, cy);
        ctx.moveTo(cx, cy - r * 0.4); ctx.lineTo(cx, cy + r * 0.4);
        ctx.stroke();
      }

      // Rare sparkle
      if (food.type === 'rare') {
        ctx.fillStyle = '#fff8';
        const sp = r * 0.15;
        ctx.beginPath();
        ctx.arc(cx - r * 0.25, cy - r * 0.25, sp, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  return { spawn, reset, checkEat, magnetPull, getItems, draw, TYPE };
})();
