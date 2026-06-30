/* ══════════════════════════════════════════
   snake.js — Robot Snake entity
   ══════════════════════════════════════════ */

'use strict';

const Snake = (() => {
  // Direction vectors
  const DIR = {
    UP:    { x:  0, y: -1 },
    DOWN:  { x:  0, y:  1 },
    LEFT:  { x: -1, y:  0 },
    RIGHT: { x:  1, y:  0 },
  };

  // Opposite directions (disallow 180° turn)
  const OPPOSITE = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };

  let body      = [];
  let direction = DIR.RIGHT;
  let nextDir   = DIR.RIGHT;
  let dirName   = 'RIGHT';
  let grow      = 0;   // segments to add next move

  function reset(startX, startY) {
    body = [
      { x: startX,     y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ];
    direction = DIR.RIGHT;
    nextDir   = DIR.RIGHT;
    dirName   = 'RIGHT';
    grow      = 0;
  }

  function setDirection(name) {
    if (OPPOSITE[name] === dirName) return; // prevent reversal
    dirName = name;
    nextDir = DIR[name];
  }

  function move() {
    direction = nextDir;
    const head = body[0];
    const newHead = { x: head.x + direction.x, y: head.y + direction.y };
    body.unshift(newHead);
    if (grow > 0) {
      grow--;
    } else {
      body.pop();
    }
  }

  function addLength(n) { grow += n; }

  function getHead()    { return body[0]; }
  function getBody()    { return body; }
  function getLength()  { return body.length; }

  function hitsSelf() {
    const head = body[0];
    return body.slice(1).some(s => s.x === head.x && s.y === head.y);
  }

  function hitsWall(cols, rows) {
    const { x, y } = body[0];
    return x < 0 || x >= cols || y < 0 || y >= rows;
  }

  // Draw robot snake
  function draw(ctx, cellSize, tick, shieldActive) {
    if (body.length === 0) return;

    const cs  = cellSize;
    const pad = cs * 0.12;
    const sz  = cs - pad * 2;

    body.forEach((seg, i) => {
      const cx = seg.x * cs + cs / 2;
      const cy = seg.y * cs + cs / 2;
      const isHead = i === 0;

      ctx.save();

      // Glow
      const glowIntensity = isHead ? 20 : 10 - i * 0.15;
      ctx.shadowColor = shieldActive ? '#00ccff' : '#00ff88';
      ctx.shadowBlur  = Math.max(4, glowIntensity);

      // Segment color gradient
      const alpha = isHead ? 1 : Math.max(0.35, 1 - i * 0.022);
      const green = isHead ? '#00ff88' : `rgba(0,${Math.floor(200 - i * 1.5)},${Math.floor(80 + i)},${alpha})`;

      if (isHead) {
        _drawHead(ctx, cx, cy, sz, tick, shieldActive, green);
      } else {
        _drawSegment(ctx, cx, cy, sz, i, green, alpha);
      }

      ctx.restore();
    });
  }

  function _drawHead(ctx, cx, cy, sz, tick, shieldActive, color) {
    const hs = sz * 0.5;

    // Shield ring
    if (shieldActive) {
      ctx.strokeStyle = '#00ccff';
      ctx.lineWidth   = 2;
      ctx.shadowColor = '#00ccff';
      ctx.shadowBlur  = 18;
      ctx.beginPath();
      ctx.arc(cx, cy, hs * 1.35, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Head body
    ctx.fillStyle = '#0a2a1a';
    ctx.strokeStyle = color;
    ctx.lineWidth   = 2;
    _roundRect(ctx, cx - hs, cy - hs, sz, sz, 4);
    ctx.fill(); ctx.stroke();

    // Visor / eye bar
    const visH = sz * 0.22;
    const visY = cy - sz * 0.15;
    ctx.fillStyle = shieldActive ? '#00ccff44' : '#00ff8833';
    _roundRect(ctx, cx - hs * 0.7, visY - visH / 2, hs * 1.4, visH, 2);
    ctx.fill();

    // Two glowing eyes
    const eyeR = sz * 0.08;
    const eyeY = visY;
    [cx - hs * 0.3, cx + hs * 0.3].forEach(ex => {
      ctx.shadowBlur  = 12;
      ctx.shadowColor = shieldActive ? '#00ccff' : '#00ff88';
      ctx.fillStyle   = shieldActive ? '#00ccff' : '#00ff88';
      ctx.beginPath();
      ctx.arc(ex, eyeY, eyeR + 0.5 * Math.sin(tick * 0.15), 0, Math.PI * 2);
      ctx.fill();
    });

    // Antenna
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.5;
    ctx.shadowBlur  = 8;
    ctx.beginPath();
    ctx.moveTo(cx, cy - hs);
    ctx.lineTo(cx, cy - hs - sz * 0.28);
    ctx.lineTo(cx + sz * 0.12, cy - hs - sz * 0.38);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx + sz * 0.12, cy - hs - sz * 0.38, sz * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }

  function _drawSegment(ctx, cx, cy, sz, idx, color, alpha) {
    const hs = sz * 0.5;

    ctx.fillStyle = `rgba(8,20,12,${alpha})`;
    ctx.strokeStyle = color;
    ctx.lineWidth   = 1.5;
    _roundRect(ctx, cx - hs, cy - hs, sz, sz, 3);
    ctx.fill(); ctx.stroke();

    // Circuit lines for body (even segments)
    if (idx % 2 === 0) {
      ctx.strokeStyle = `rgba(0,255,136,${alpha * 0.3})`;
      ctx.lineWidth   = 1;
      ctx.beginPath();
      ctx.moveTo(cx - hs * 0.5, cy - hs * 0.25);
      ctx.lineTo(cx + hs * 0.5, cy - hs * 0.25);
      ctx.moveTo(cx - hs * 0.5, cy + hs * 0.25);
      ctx.lineTo(cx + hs * 0.5, cy + hs * 0.25);
      ctx.stroke();

      // Center dot
      ctx.fillStyle = `rgba(0,255,136,${alpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(cx, cy, sz * 0.06, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y,     x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  return { reset, setDirection, move, addLength, getHead, getBody, getLength, hitsSelf, hitsWall, draw };
})();
