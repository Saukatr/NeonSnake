const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const overlay = document.getElementById('overlay');

const { animate, stagger } = anime;
const wrapEl = document.querySelector('.wrap');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const FX = (targets, params) => { if (!reduceMotion) return animate(targets, params); };

function popScore() {
  FX('#score', { scale: [1.8, 1], color: ['#39ff14', '#0ff'], duration: 400, ease: 'outBack' });
}

function burst(cell) {
  const x = cell.x * GRID + GRID / 2;
  const y = cell.y * GRID + GRID / 2;
  const top = canvas.offsetTop;
  const left = canvas.offsetLeft;
  const frag = document.createDocumentFragment();
  const parts = [];
  for (let i = 0; i < 12; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = (left + x - 3) + 'px';
    p.style.top = (top + y - 3) + 'px';
    frag.appendChild(p);
    parts.push(p);
  }
  wrapEl.appendChild(frag);
  const done = () => parts.forEach(p => p.remove());
  const a = FX(parts, {
    x: () => anime.utils.random(-45, 45),
    y: () => anime.utils.random(-45, 45),
    scale: [1, 0],
    opacity: [1, 0],
    duration: 600,
    ease: 'outExpo',
    onComplete: done,
  });
  if (!a) done();
}

function shake() {
  FX(canvas, { x: [0, -10, 10, -8, 8, -4, 4, 0], duration: 450, ease: 'outQuad' });
}

function showOverlay() {
  overlay.classList.remove('hidden');
  FX(overlay, { opacity: [0, 1], duration: 400, ease: 'outQuad' });
  FX(overlay.querySelectorAll('.msg > *'), {
    y: [20, 0], opacity: [0, 1], delay: stagger(100), duration: 500, ease: 'outCubic',
  });
}

const GRID = 20;
const CELLS = canvas.width / GRID;
const BASE_SPEED = 130; // ms per tick, gets faster as score grows

let snake, dir, nextDir, food, score, best, tickMs, timer, running, paused;

let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function beep({ freq = 440, duration = 0.08, type = 'square', gain = 0.15, slideTo = null }) {
  const ctx = getAudioCtx();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + duration);
  g.gain.setValueAtTime(gain, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.connect(g).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

const sfx = {
  eat: () => beep({ freq: 660, duration: 0.09, type: 'square', gain: 0.18, slideTo: 990 }),
  turn: () => beep({ freq: 220, duration: 0.03, type: 'triangle', gain: 0.05 }),
  gameOver: () => beep({ freq: 300, duration: 0.5, type: 'sawtooth', gain: 0.18, slideTo: 60 }),
  wrap: () => beep({ freq: 880, duration: 0.06, type: 'sine', gain: 0.1, slideTo: 440 }),
};

function loadBest() {
  return Number(localStorage.getItem('neonSnakeBest') || 0);
}

function saveBest(v) {
  localStorage.setItem('neonSnakeBest', String(v));
}

function reset() {
  snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
  dir = { x: 1, y: 0 };
  nextDir = dir;
  score = 0;
  tickMs = BASE_SPEED;
  best = loadBest();
  scoreEl.textContent = score;
  bestEl.textContent = best;
  placeFood();
  running = false;
  paused = false;
}

function placeFood() {
  let pos;
  do {
    pos = { x: Math.floor(Math.random() * CELLS), y: Math.floor(Math.random() * CELLS) };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  food = pos;
}

function start() {
  if (running) return;
  running = true;
  overlay.classList.add('hidden');
  clearInterval(timer);
  timer = setInterval(tick, tickMs);
}

function gameOver() {
  running = false;
  clearInterval(timer);
  if (score > best) {
    best = score;
    saveBest(best);
    bestEl.textContent = best;
  }
  overlay.querySelector('.msg').innerHTML =
    `<h2>GAME OVER</h2><p>Score: ${score} &middot; Best: ${best}</p><p>Press R to restart</p>`;
  showOverlay();
  shake();
  sfx.gameOver();
}

function tick() {
  if (paused) return;
  dir = nextDir;
  let head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

  let wrapped = false;
  if (head.x < 0) { head.x = CELLS - 1; wrapped = true; }
  else if (head.x >= CELLS) { head.x = 0; wrapped = true; }
  if (head.y < 0) { head.y = CELLS - 1; wrapped = true; }
  else if (head.y >= CELLS) { head.y = 0; wrapped = true; }
  if (wrapped) sfx.wrap();

  if (snake.some(s => s.x === head.x && s.y === head.y)) return gameOver();

  snake.unshift(head);

  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreEl.textContent = score;
    popScore();
    burst(head);
    placeFood();
    sfx.eat();
    if (score % 5 === 0 && tickMs > 60) {
      tickMs -= 10;
      clearInterval(timer);
      timer = setInterval(tick, tickMs);
    }
  } else {
    snake.pop();
  }

  draw();
}

function draw() {
  ctx.fillStyle = '#050014';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // food
  ctx.fillStyle = '#39ff14';
  ctx.shadowColor = '#39ff14';
  ctx.shadowBlur = 15;
  ctx.fillRect(food.x * GRID + 2, food.y * GRID + 2, GRID - 4, GRID - 4);

  // snake
  snake.forEach((seg, i) => {
    ctx.fillStyle = i === 0 ? '#ff2fd0' : '#0ff';
    ctx.shadowColor = i === 0 ? '#ff2fd0' : '#0ff';
    ctx.shadowBlur = 10;
    ctx.fillRect(seg.x * GRID + 1, seg.y * GRID + 1, GRID - 2, GRID - 2);
  });

  ctx.shadowBlur = 0;
}

const KEY_DIRS = {
  ArrowUp: { x: 0, y: -1 }, w: { x: 0, y: -1 }, W: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 }, s: { x: 0, y: 1 }, S: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 }, a: { x: -1, y: 0 }, A: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 }, D: { x: 1, y: 0 },
};

document.addEventListener('keydown', (e) => {
  if (e.key === 'r' || e.key === 'R') {
    reset();
    draw();
    return;
  }
  if (e.key === ' ') {
    if (running) paused = !paused;
    return;
  }
  const d = KEY_DIRS[e.key];
  if (!d) return;
  e.preventDefault();
  // prevent reversing directly into itself
  if (d.x === -dir.x && d.y === -dir.y) return;
  if (d.x !== nextDir.x || d.y !== nextDir.y) sfx.turn();
  nextDir = d;
  start();
});

reset();
draw();

// intro: title letters + HUD + canvas
const title = document.querySelector('h1');
title.innerHTML = [...title.textContent].map(c => `<span class="ch">${c === ' ' ? '&nbsp;' : c}</span>`).join('');
FX('h1 .ch', { y: [-30, 0], opacity: [0, 1], delay: stagger(60), duration: 700, ease: 'outBack' });
FX('.hud > div', { opacity: [0, 1], y: [-10, 0], delay: stagger(120, { start: 400 }), duration: 500 });
FX(canvas, { scale: [0.9, 1], opacity: [0, 1], duration: 700, delay: 300, ease: 'outCubic' });
FX('.msg > *', { y: [20, 0], opacity: [0, 1], delay: stagger(100, { start: 700 }), duration: 500 });
FX('.hint', { opacity: [0, 0.6], delay: 900, duration: 600 });
// idle neon pulse on the canvas border glow
FX(canvas, {
  borderColor: ['#ff2fd0', '#0ff'], duration: 2500, alternate: true, loop: true, ease: 'inOutSine', delay: 1000,
});
