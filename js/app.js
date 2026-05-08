/**
 * app.js — the main controller.
 *
 *   intro  ─►  stage (collect 6 memories)  ─►  gift  ─►  letter
 *
 * State is kept tiny on purpose: nothing more than what the UI needs.
 * Modules are responsible for their own DOM (audio / particles).
 */

import { MEMORIES, FINAL } from './data.js';
import { bindMusic, startMusic, chime, sparkle } from './audio.js';
import { initParticles, burst, shower } from './particles.js';

/* ---------- DOM cache ---------- */

const $ = (sel) => document.querySelector(sel);

const els = {
  intro:        $('#intro'),
  beginBtn:     $('#beginBtn'),
  stage:        $('#stage'),
  orbsLayer:    $('#orbs'),
  progressFill: $('#progressFill'),
  progressCount:$('#progressCount'),
  progressBar:  $('#progressBar'),
  giftStage:    $('#giftStage'),
  giftBtn:      $('#giftBtn'),
  modal:        $('#modal'),
  memoryBody:   $('#memoryBody'),
  memoryTpl:    $('#memoryTemplate'),
  finalTpl:     $('#finalTemplate'),
  bgMusic:      $('#bgMusic'),
  ambient:      $('#ambient-canvas'),
};

/* ---------- state ---------- */

const state = {
  collected: new Set(),
  scene: 'intro',          // intro | stage | gift | letter
  modalOpen: false,
  typewriterTimer: null,
  showGiftWhenModalCloses: false,
};

/* ---------- floating physics for orbs ---------- */

const ORB_SIZE = window.innerWidth < 640 ? 96 : 124;
const TOP_PAD = 200;       // header reserved area
const SIDE_PAD = 24;
const orbs = [];           // { el, x, y, vx, vy, collected }

function rand(min, max) { return min + Math.random() * (max - min); }

function spawnOrbs() {
  MEMORIES.forEach((memory, i) => {
    const el = document.createElement('button');
    el.type = 'button';
    el.className = 'orb';
    el.style.setProperty('--orb-size', ORB_SIZE + 'px');
    el.setAttribute('aria-label', `Open memory: ${memory.label}`);
    el.dataset.id = memory.id;
    el.innerHTML = `
      <span class="orb__halo" aria-hidden="true"></span>
      <span class="orb__shell" aria-hidden="true"></span>
      <span class="orb__icon" aria-hidden="true">${memory.icon}</span>
      <span class="orb__label">${memory.label}</span>
    `;
    el.addEventListener('click', () => collect(memory.id, el));
    els.orbsLayer.appendChild(el);

    const maxX = window.innerWidth  - ORB_SIZE - SIDE_PAD;
    const maxY = window.innerHeight - ORB_SIZE - SIDE_PAD;
    orbs.push({
      el,
      memory,
      x: rand(SIDE_PAD, maxX),
      y: rand(TOP_PAD, Math.max(TOP_PAD + 60, maxY)),
      vx: (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.6),
      vy: (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.6),
      collected: false,
      _i: i,
    });
  });
}

function physicsTick() {
  const maxX = window.innerWidth  - ORB_SIZE - SIDE_PAD;
  const maxY = window.innerHeight - ORB_SIZE - SIDE_PAD;
  for (const o of orbs) {
    if (o.collected) continue;
    o.x += o.vx;
    o.y += o.vy;
    if (o.x <= SIDE_PAD) { o.x = SIDE_PAD; o.vx = Math.abs(o.vx); }
    if (o.x >= maxX)     { o.x = maxX;     o.vx = -Math.abs(o.vx); }
    if (o.y <= TOP_PAD)  { o.y = TOP_PAD;  o.vy = Math.abs(o.vy); }
    if (o.y >= maxY)     { o.y = maxY;     o.vy = -Math.abs(o.vy); }
    o.el.style.transform = `translate3d(${o.x}px, ${o.y}px, 0)`;
  }
  requestAnimationFrame(physicsTick);
}

/* ---------- collect / progress ---------- */

function collect(id, el) {
  if (state.collected.has(id)) return;
  const orb = orbs.find((o) => o.memory.id === id);
  if (!orb) return;

  state.collected.add(id);
  orb.collected = true;
  el.classList.add('is-collected');

  // chime + confetti from the orb's centre
  const rect = el.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  burst(cx, cy, 48);
  chime(state.collected.size - 1);

  // update progress bar
  const n = state.collected.size;
  els.progressFill.style.width = `${(n / MEMORIES.length) * 100}%`;
  els.progressCount.textContent = String(n);
  els.progressBar.setAttribute('aria-valuenow', String(n));

  // open the memory card
  openMemory(orb.memory);

  // remove the DOM after exit animation
  setTimeout(() => el.remove(), 1000);

  if (n === MEMORIES.length) {
    state.showGiftWhenModalCloses = true;
  }
}

/* ---------- modal ---------- */

function openMemory(memory) {
  els.memoryBody.innerHTML = '';
  const node = els.memoryTpl.content.cloneNode(true);
  const img = node.querySelector('img');
  img.src = memory.photo;
  img.alt = memory.label;
  node.querySelector('.memory-card__caption').textContent = memory.caption;
  node.querySelector('.memory-card__title').textContent = memory.title;
  const textEl = node.querySelector('.memory-card__text');
  textEl.classList.add('typewriter');
  els.memoryBody.appendChild(node);

  showModal();
  typewrite(textEl, memory.text, 22);
}

function openLetter() {
  els.memoryBody.innerHTML = '';
  const node = els.finalTpl.content.cloneNode(true);
  node.querySelector('img').src = FINAL.photo;
  node.querySelector('img').alt = 'Amma';
  const textEl = node.querySelector('.memory-card__text');
  textEl.classList.add('typewriter');
  els.memoryBody.appendChild(node);

  showModal();
  typewrite(textEl, FINAL.letter, 28);
}

function showModal() {
  state.modalOpen = true;
  els.modal.classList.add('is-open');
  els.modal.setAttribute('aria-hidden', 'false');
}

function closeModal() {
  state.modalOpen = false;
  els.modal.classList.remove('is-open');
  els.modal.setAttribute('aria-hidden', 'true');
  if (state.typewriterTimer) {
    clearInterval(state.typewriterTimer);
    state.typewriterTimer = null;
  }
  if (state.showGiftWhenModalCloses) {
    state.showGiftWhenModalCloses = false;
    setTimeout(showGift, 400);
  }
}

/* ---------- typewriter ---------- */

function typewrite(el, text, charsPerStep = 24) {
  if (state.typewriterTimer) clearInterval(state.typewriterTimer);
  el.textContent = '';
  el.classList.remove('is-done');
  let i = 0;
  state.typewriterTimer = setInterval(() => {
    i = Math.min(text.length, i + charsPerStep);
    el.textContent = text.slice(0, i);
    if (i >= text.length) {
      clearInterval(state.typewriterTimer);
      state.typewriterTimer = null;
      el.classList.add('is-done');
    }
  }, 60);
}

/* ---------- scene transitions ---------- */

function startStage() {
  state.scene = 'stage';
  startMusic();
  els.intro.classList.add('is-hiding');
  setTimeout(() => els.intro.classList.add('is-hidden'), 1100);
  els.stage.classList.add('is-visible');
  els.stage.setAttribute('aria-hidden', 'false');
  spawnOrbs();
  requestAnimationFrame(physicsTick);
}

function showGift() {
  closeModal();
  state.scene = 'gift';
  els.stage.classList.add('is-fading-out');
  els.stage.setAttribute('aria-hidden', 'true');
  setTimeout(() => {
    els.stage.style.display = 'none';
    els.giftStage.classList.add('is-visible');
    els.giftStage.setAttribute('aria-hidden', 'false');
    burst(window.innerWidth / 2, window.innerHeight / 2, 60);
    chime(4);
  }, 900);
}

function openGift() {
  if (state.scene === 'letter') return;
  state.scene = 'letter';
  els.giftBtn.classList.add('is-opening');
  burst(window.innerWidth / 2, window.innerHeight / 2.2, 140);
  shower(7000);
  sparkle();
  setTimeout(openLetter, 700);
}

/* ---------- bootstrap ---------- */

function init() {
  bindMusic(els.bgMusic);
  initParticles(els.ambient, { petalCount: 22 });

  els.beginBtn.addEventListener('click', startStage);
  els.giftBtn.addEventListener('click', openGift);

  // close modal handlers
  els.modal.addEventListener('click', (e) => {
    if (e.target.matches('[data-close]')) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.modalOpen) closeModal();
    if (e.key === 'Enter' && state.scene === 'intro') startStage();
  });
}

init();
