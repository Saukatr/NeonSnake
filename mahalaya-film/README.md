# Mahalaya: The Triumph of Light over Darkness

A 49.75 s devotional film for Mahalaya, built entirely with local tools:
**Remotion** (master timeline, scenes 1–5, audio) and **HyperFrames** (scene 6 plus the final
"SHUBHO MAHALAYA" card). No generative video service was used. Every motion is procedural,
and every figure is cut directly from the supplied character sheet.

## Timeline (seconds on the trimmed soundtrack)

The soundtrack is the supplied recording with its leading 1.27 s of silence removed. Its first
audible note is t = 0. It ends with a 3.5 s fade-out (46.25 → 49.75). Accents come from
`hyperframes beats` (`hf/beats/soundtrack.wav.json`).

| Time | Scene | Sync points |
|---|---|---|
| 0.00 – 6.68 | 1 · Sacred beginning: dawn cosmos, god rays, temples, push-in | dissolve lands on the 6.68 accent |
| 6.68 – 13.04 | 2 · Rise of Mahishasura: storm, low-angle silhouette, lightning; the gods as pillars of light | lightning on 7.54 / 8.62 / 9.59 / 9.82; gods wake on 12.50 |
| 13.04 – 21.79 | 3 · Creation of Maa Durga: five energy streams converge, then a burst | **reveal on 15.48 (strongest hit)**, lion glow on 16.09, pseudo-orbit + tilt up |
| 21.79 – 30.01 | 4 · Divine battle: charge, close-ups, slow-motion two-shot | cuts on 24.89 / 25.26 / 25.67, clash 26.96, sparks 27.55 – 29.56 |
| 30.01 – 36.72 | 5 · Victory of light: the decisive strike flash, storm clears, gods bow, pullback | strike on 30.01 |
| 36.00 – 43.72 | 6 · Maa is coming home (HyperFrames): river dawn, kash, toran, bells, dhak, diyas, family over the water | bells/dhak on 37.50 / 37.62 / 38.28 / 38.50 |
| 43.72 – 49.75 | Final · SHUBHO MAHALAYA (HyperFrames) | title from 43.75, subtitle 45.28, fade to black 48.65 – 49.75 |

## Rebuild

```bash
npm install
# 1. character cut-outs + textures (numpy/PIL only)
python3 tools/seg.py && python3 tools/cut.py && python3 tools/tex.py
# 2. HyperFrames segment → public/hf_bengal.mp4
cd hf && npx hyperframes render . -f 24 -q high --crf 14 -o ../public/hf_bengal.mp4 && cd ..
# 3. master render (point Remotion at a local Chromium if it can't download one)
REMOTION_CHROME=/path/to/chrome-headless-shell npx remotion render src/index.ts Mahalaya out/mahalaya_1080p.mp4 \
  --codec=h264 --crf=16 --color-space=bt709 --audio-codec=aac --audio-bitrate=320k
```

`tools/seg.py` / `tools/cut.py` write their intermediate mask to `work/`. Create that folder first (`mkdir -p work`).
