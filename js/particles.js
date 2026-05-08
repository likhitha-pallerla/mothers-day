/**
 * particles.js — two canvas effects
 *
 *  • ambient bokeh – slow, drifting petals behind everything.
 *  • confetti      – physical, gravity-driven burst for celebrations.
 *
 * One DPR-aware canvas is shared by both layers. We draw at the device
 * pixel density so things stay crisp on retina displays.
 */

const PETAL_GLYPHS = ['🌸', '🌷', '🌺', '💮', '✿', '❀'];
const CONFETTI_COLOURS = [
  '#e75388', '#f7a9c4', '#d4a373', '#c2185b', '#ffd6e5', '#ffffff',
];

let canvas, ctx;
let dpr = 1;
let width = 0, height = 0;
let petals = [];
let confetti = [];
let animating = false;
let reduceMotion = false;

const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
reduceMotion = reducedMotionQuery.matches;
reducedMotionQuery.addEventListener('change', (e) => { reduceMotion = e.matches; });

/* ---------- setup ---------- */

function resize() {
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function makePetal() {
  return {
    x: Math.random() * width,
    y: -20 - Math.random() * height,
    size: 12 + Math.random() * 18,
    glyph: PETAL_GLYPHS[(Math.random() * PETAL_GLYPHS.length) | 0],
    vy: 0.35 + Math.random() * 0.7,
    vx: (Math.random() - 0.5) * 0.6,
    rot: Math.random() * Math.PI * 2,
    vr: (Math.random() - 0.5) * 0.02,
    alpha: 0.35 + Math.random() * 0.45,
  };
}

/* ---------- frame loop ---------- */

function tick() {
  if (!animating) return;
  ctx.clearRect(0, 0, width, height);

  // ambient petals
  for (let i = 0; i < petals.length; i++) {
    const p = petals[i];
    p.x += p.vx;
    p.y += p.vy;
    p.rot += p.vr;
    if (p.y > height + 30) {
      petals[i] = makePetal();
      petals[i].y = -30;
    }
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.globalAlpha = p.alpha;
    ctx.font = `${p.size}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.glyph, 0, 0);
    ctx.restore();
  }

  // confetti
  for (let i = confetti.length - 1; i >= 0; i--) {
    const c = confetti[i];
    c.vy += 0.18;            // gravity
    c.vx *= 0.995;           // air drag
    c.x += c.vx;
    c.y += c.vy;
    c.rot += c.vr;
    c.life--;
    if (c.life <= 0 || c.y > height + 40) {
      confetti.splice(i, 1);
      continue;
    }
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.rotate(c.rot);
    ctx.globalAlpha = Math.max(0, Math.min(1, c.life / 60));
    ctx.fillStyle = c.color;
    if (c.shape === 'rect') {
      ctx.fillRect(-c.size / 2, -c.size / 4, c.size, c.size / 2);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, c.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  requestAnimationFrame(tick);
}

/* ---------- public API ---------- */

export function initParticles(canvasEl, { petalCount = 22 } = {}) {
  canvas = canvasEl;
  ctx = canvas.getContext('2d');

  resize();
  window.addEventListener('resize', resize, { passive: true });

  if (reduceMotion) {
    petalCount = 6;
  }
  petals = Array.from({ length: petalCount }, makePetal).map((p) => ({
    ...p,
    y: Math.random() * height,
  }));

  animating = true;
  requestAnimationFrame(tick);
}

/**
 * Emit a confetti burst at a viewport coordinate.
 * @param {number} x — page x in CSS pixels
 * @param {number} y — page y in CSS pixels
 * @param {number} amount — number of particles (~ 30-150 looks good)
 */
export function burst(x, y, amount = 80) {
  if (reduceMotion) amount = Math.min(amount, 16);
  for (let i = 0; i < amount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 4 + Math.random() * 9;
    confetti.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      size: 6 + Math.random() * 8,
      color: CONFETTI_COLOURS[(Math.random() * CONFETTI_COLOURS.length) | 0],
      rot: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.4,
      shape: Math.random() < 0.55 ? 'rect' : 'circle',
      life: 90 + Math.random() * 30,
    });
  }
}

/** Continuous gentle rain of confetti from the top. */
export function shower(durationMs = 6000) {
  const start = performance.now();
  const tickShower = () => {
    if (performance.now() - start > durationMs) return;
    for (let i = 0; i < (reduceMotion ? 1 : 3); i++) {
      confetti.push({
        x: Math.random() * width,
        y: -20,
        vx: (Math.random() - 0.5) * 2,
        vy: 1 + Math.random() * 2,
        size: 6 + Math.random() * 8,
        color: CONFETTI_COLOURS[(Math.random() * CONFETTI_COLOURS.length) | 0],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        shape: Math.random() < 0.55 ? 'rect' : 'circle',
        life: 240,
      });
    }
    setTimeout(tickShower, 80);
  };
  tickShower();
}
