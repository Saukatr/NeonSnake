# Tilt Wave Studios - 30s Promo Reel

Procedurally generated vertical (9:16) promo animation, fully self-contained in a single HTML file with deterministic frame rendering via `window.renderAt(t)`.

## 📁 Files

- **`tilt-wave-promo.html`** – Complete promo reel (interactive preview + full animation logic)
- **`render-mp4-puppeteer.js`** – Node.js script to render MP4 via Puppeteer + ffmpeg
- **`TILT_WAVE_PROMO_README.md`** – This file

## 🎬 Specs

- **Duration:** 30 seconds
- **Format:** Vertical (9:16)
- **Resolution:** 1080×1920 pixels
- **Frame rate:** 30fps
- **Codec:** H.264 (yuv420p)
- **Total frames:** 900

## 🎨 Scenes (120 BPM sync)

| Time | Scene | Description |
|------|-------|-------------|
| 0.0–3.6s | Frequency | Pulsing dot, expanding rings, sine wave intro |
| 3.6–7.6s | Studio | Logo + animated bars, orbiting sparks, lockup reveal |
| 7.6–12.1s | Motion Graphics | Morphing polygon, orbiting pills, bouncing shapes, blob |
| 12.1–16.5s | Music Videos | Circular spectrum, film strip, waveform with playhead |
| 16.5–21.0s | Brand Identity | Grid, guide circles, logo assembly, color swatches |
| 21.0–25.6s | AI Content | Node network, data pulses, browser windows fly in |
| 25.6–29.6s | Outro | Full logo, tagline "Catch the wave" |

## 🚀 Quick Start

### View Interactive Preview

Open `tilt-wave-promo.html` in any modern browser:
- Use the slider to scrub through the animation
- Full real-time canvas rendering
- No external dependencies

```bash
open tilt-wave-promo.html  # macOS
firefox tilt-wave-promo.html  # Linux
```

### Render to MP4

#### Option 1: Puppeteer (Recommended)

**Install dependencies:**
```bash
npm install puppeteer fluent-ffmpeg ffmpeg-static
```

**Render:**
```bash
node render-mp4-puppeteer.js
```

This will:
1. Launch a headless browser
2. Step through all 900 frames (30s @ 30fps)
3. Capture each as PNG via Puppeteer
4. Pipe to ffmpeg to encode H.264 MP4
5. Output: `tilt-wave-promo.mp4`

**Expected output:**
```
🎬 Tilt Wave Studios - Promo Renderer
📐 1080×1920 @ 30fps × 30s = 900 frames
📄 Loading: file:///path/to/tilt-wave-promo.html
🖼️  Rendering 900 frames...
  ⏳ 30/900 (3.3%)
  ⏳ 60/900 (6.7%)
  ...
✅ All frames captured. Encoding to MP4...
  ⏳ Encoding: 450/900 (50.0%)
✅ MP4 saved: tilt-wave-promo.mp4
📦 File size: 28.45 MB
```

#### Option 2: Manual Frame Export + ffmpeg

If you prefer finer control:

1. **Export frames from browser DevTools Console:**
```javascript
// In browser console on tilt-wave-promo.html
const canvas = document.querySelector('canvas');
const totalFrames = 900;

for (let i = 0; i < totalFrames; i++) {
    const t = i / 30;
    window.renderAt(t);
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `frame-${String(i).padStart(6, '0')}.png`;
    // Manually click each or use batch download tool
}
```

2. **Encode with ffmpeg:**
```bash
ffmpeg -framerate 30 -i frame-%06d.png \
  -c:v libx264 -pix_fmt yuv420p -preset fast -crf 18 \
  tilt-wave-promo.mp4
```

## 🎛️ Customization

### Modify Timings

Edit `SCENES` object in the `<script>` section:
```javascript
const SCENES = {
    frequency: [0, 3.6],     // [start, end] in seconds
    studio: [3.6, 7.6],
    motion: [7.6, 12.1],
    // ...
};
```

### Change Colors

Update `CONFIG.colors`:
```javascript
const CONFIG = {
    colors: {
        bg: '#111217',
        text: '#f3efe6',
        orange: '#f58a3c',    // Modify any color
        red: '#e8365d',
        // ...
    }
};
```

### Adjust Animation Speed

Modify `CONFIG.fps` or `CONFIG.bpm`:
```javascript
const CONFIG = {
    fps: 60,          // Higher = smoother
    bpm: 120,         // Beat sync speed
    duration: 30,     // Total seconds
};
```

## 🛠️ Technical Details

### Deterministic Rendering

The `window.renderAt(t)` function renders a frame at time `t` (in seconds):

```javascript
window.renderAt(2.5);  // Render the frame at 2.5 seconds
```

This is called once per frame during MP4 encoding, ensuring:
- ✅ Bit-perfect consistency (same frame every time)
- ✅ No frame skipping or timing drift
- ✅ Resumable at any point in the video

### No External Assets

Everything is procedurally drawn:
- Logo bars animated from scratch
- All shapes, waves, and effects generated with canvas APIs
- Font loaded from Google Fonts (Bricolage Grotesque)
- No video, images, or pre-rendered assets

### Browser Compatibility

- ✅ Chrome/Edge (recommended for export)
- ✅ Firefox
- ✅ Safari (animation works; MP4 export via Puppeteer requires headless Chrome)

## 📊 Performance

**Interactive preview (browser):**
- Smooth 30fps on modern machines
- GPU-accelerated canvas rendering

**MP4 encoding (Node.js):**
- ~30–60 seconds per render (depends on CPU)
- ~25–35 MB final file size
- Single-pass H.264 encoding

## 🐛 Troubleshooting

### "ffmpeg not found"
```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg

# Windows
choco install ffmpeg
```

### Puppeteer hangs
- Ensure Chrome/Chromium is installed
- On headless systems, add `--no-sandbox` flag (already included in script)

### MP4 has artifacts
- Increase `-crf` value (lower = higher quality, default 18)
- Change `-preset` to `slower` for better compression
- Example:
```bash
ffmpeg -i frame-%06d.png -c:v libx264 -pix_fmt yuv420p -preset slower -crf 16 output.mp4
```

## 📝 Narration Script

Burn timings (0.2–29.6s):
```
0.2–3.4s   "Every idea has a frequency."
3.6–7.4s   "At Tilt Wave Studios, we turn it into motion."
7.6–11.9s  "Motion graphics and animation that refuse to sit still."
12.1–16.3s "Music videos and aftermovies, cut to every beat."
16.5–20.8s "Brand identities and logos, built to be remembered."
21–25.3s   "AI-powered content and websites, made at the speed of now."
25.6–29.6s "Tilt Wave Studios. Catch the wave."
```

## 📦 Deliverables

- `tilt-wave-promo.html` – Interactive preview & rendering source
- `tilt-wave-promo.mp4` – Final output (generated by render script)

Both are production-ready.

## 🎯 Next Steps

1. **Preview:** Open `tilt-wave-promo.html` in browser
2. **Customize:** Edit colors/timings as needed
3. **Render:** Run `node render-mp4-puppeteer.js`
4. **Deliver:** Share `tilt-wave-promo.mp4` + audio mix

---

Built for Tilt Wave Studios. Catch the wave. 🌊
