# For Amma — A Mother's Day Keepsake 💐

A small, handmade web keepsake. Six floating memories drift across the page;
catching each one tells a tiny story. When all are gathered, a gift appears,
and tapping it unwraps a letter.

> Live: <https://likhitha-pallerla.github.io/mothers-day/>

## Why

Made with love for Amma — a Mother's Day card that took the long way
around through HTML, CSS and a sprinkle of canvas.

## Tech

Plain HTML, CSS and ES modules. Zero dependencies, no build step.

| Area               | What's inside                                                  |
| ------------------ | -------------------------------------------------------------- |
| `index.html`       | Semantic structure, `<template>`s for the modal contents.      |
| `css/styles.css`   | Design tokens, mesh-gradient ambient bg, motion utilities.     |
| `js/app.js`        | Scene controller (intro → stage → gift → letter).              |
| `js/data.js`       | The actual memories and final letter — the heart of the app.   |
| `js/audio.js`      | Background music + Web-Audio synthesised chimes for collects.  |
| `js/particles.js`  | DPR-aware canvas: ambient petals + physical confetti bursts.   |
| `assets/`          | Photos used inside each memory and the final letter.           |

## Features

- 🌷 Six glowing **memory orbs** drifting around the page with simple physics.
- 📝 **Typewriter** text reveal for each memory.
- 🎁 Hand-drawn CSS **gift box** that unwraps with a shake-and-lift animation.
- 🎨 **Mesh-gradient** background with three slow-drifting blobs.
- ✨ Canvas **confetti & ambient petals** at device-pixel resolution.
- 🔔 Pentatonic **chime** synthesised on the fly for each collect.
- 🎶 Soft background music ("Heartwarming" by Kevin MacLeod, CC-BY).
- ♿ Respects `prefers-reduced-motion`; full keyboard support; ARIA labels.

## Run locally

Anything that serves static files works. The simplest:

```powershell
# from the project root
python -m http.server 8000
# then open http://localhost:8000
```

(Or just double-click `index.html` — modules require `http://`, so a server is
preferred.)

## Credits

- Music: *Heartwarming* by Kevin MacLeod (incompetech.com), licensed under
  Creative Commons BY 4.0.
- Photos: family photographs, used with love.

---

Made with ♡ for Amma.
