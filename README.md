# Neon Snake

A small synthwave-styled take on classic Snake, built with vanilla JavaScript, HTML, and CSS — no dependencies, no build step.

Play it by opening [`index.html`](index.html) in a browser.

## Controls

| Action  | Keys                |
| ------- | -------------------- |
| Move    | Arrow keys or `WASD` |
| Pause   | `Space`               |
| Restart | `R`                   |

## Features

- Neon glow visuals on an HTML5 `<canvas>`
- Screen-wrapping edges (no walls)
- Procedural sound effects via the Web Audio API
- Best score saved locally between sessions (`localStorage`)
- Snake speeds up as your score grows

## Files

- `index.html` — page structure and HUD
- `style.css` — neon/synthwave styling
- `script.js` — game loop, input handling, rendering, and sound
