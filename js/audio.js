/**
 * audio.js — gentle sound design.
 *
 * Two responsibilities:
 *   1. Background music (heartwarming piano loop).
 *   2. Tiny synthesised chimes generated via the Web Audio API,
 *      so we don't ship audio files for one-off effects.
 */

const STATE = {
  ctx: null,
  bgMusic: null,
  musicStarted: false,
  enabled: true,
};

/** Lazily create a single AudioContext. */
function ensureCtx() {
  if (!STATE.ctx) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (Ctor) STATE.ctx = new Ctor();
  }
  if (STATE.ctx && STATE.ctx.state === 'suspended') {
    STATE.ctx.resume();
  }
  return STATE.ctx;
}

/** Attach the <audio> element to the player. */
export function bindMusic(audioEl) {
  STATE.bgMusic = audioEl;
  if (audioEl) audioEl.volume = 0.34;
}

/**
 * Begin background music. Browsers require a user gesture; this
 * should be called from within a click/keydown handler.
 */
export async function startMusic() {
  if (!STATE.bgMusic || STATE.musicStarted) return;
  try {
    await STATE.bgMusic.play();
    STATE.musicStarted = true;
  } catch (err) {
    /* user agent blocked autoplay – ignore silently. */
  }
}

/**
 * Soft pentatonic chime — pleasant for any combination of notes.
 * Used when a memory orb is collected.
 */
export function chime(degree = 0) {
  const ctx = ensureCtx();
  if (!ctx || !STATE.enabled) return;

  // C major pentatonic, two octaves
  const freqs = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66];
  const f = freqs[degree % freqs.length];

  const t = ctx.currentTime;
  const dur = 1.6;

  const osc = ctx.createOscillator();
  osc.type = 'sine';
  osc.frequency.value = f;

  // Add a touch of brightness with a second oscillator one octave up.
  const osc2 = ctx.createOscillator();
  osc2.type = 'triangle';
  osc2.frequency.value = f * 2;

  const mix = ctx.createGain();
  mix.gain.value = 0.0;

  // Soft pluck envelope.
  mix.gain.setValueAtTime(0.0, t);
  mix.gain.linearRampToValueAtTime(0.18, t + 0.02);
  mix.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  // Subtle low-pass to take the edge off.
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 2400;
  lp.Q.value = 0.7;

  osc.connect(mix);
  osc2.connect(mix);
  mix.connect(lp).connect(ctx.destination);

  osc.start(t);
  osc2.start(t);
  osc.stop(t + dur);
  osc2.stop(t + dur);
}

/** Soft sparkle for the final reveal — a quick arpeggio. */
export function sparkle() {
  const ctx = ensureCtx();
  if (!ctx || !STATE.enabled) return;
  [0, 2, 4, 5, 4, 2, 0].forEach((d, i) => {
    setTimeout(() => chime(d), i * 90);
  });
}
