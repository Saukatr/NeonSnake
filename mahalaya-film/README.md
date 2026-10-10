# Mahalaya: Shubho Mahalaya (reference-footage edit)

A 44.5 s devotional film for Mahalaya, cut **only from the three supplied reference videos**
(their audio is not used). It is built with local tools:
- **ffmpeg** for shot prep: crop, watermark removal and motion-interpolated slow motion.
- **Remotion** for the master timeline, light/dust/petal overlays and audio.
- **HyperFrames** for beat detection and the final "SHUBHO MAHALAYA" card.

## Audio

The supplied recording, trimmed as follows:
- The leading 1.27 s of silence is removed, so t = 0 is the first note.
- It is cut to 44.5 s.
- A 5 s **quarter-sine fade-out** runs from 39.5 to 44.5 s. It eases out from the music and reaches true silence on the last frame, as the picture fades to black.

## Shot list (`src/shots.json`)

| Time (s) | Source | Shot |
|---|---|---|
| 0.00 – 2.80 | ref 1 | Radio tuned at dawn: the Mahalaya broadcast |
| 2.80 – 6.68 | ref 1 | Clay home glowing at first light |
| 6.68 – 9.59 | ref 1 | The family listening |
| 9.59 – 13.04 | ref 2 | Misty Ganga, Howrah bridge, kash |
| 13.04 – 15.48 | ref 3 | The Goddess takes form; arms appear |
| 15.48 – 18.64 | ref 2 | **Reveal of Maa Durga on the strongest accent** (bloom flash) |
| 18.64 – 21.79 | ref 2 | Sari, anklets, trident |
| 21.79 – 24.89 | ref 2 | The elephant strides through the mud (hard cut on the 21.8 hit) |
| 24.89 – 27.06 | ref 2 | Maa arrives on the elephant |
| 27.06 – 30.01 | ref 2 | Dhakis lead the way |
| 30.01 – 33.26 | ref 2 | Triumphant wide: Maa with the dhakis, petals begin |
| 33.26 – 36.72 | ref 1 | The idol carried home through kash |
| 36.72 – 39.00 | ref 1 | Shiuli flowers fall |
| 39.00 – 44.50 | ref 2 + HyperFrames | Maa Durga in a halo; **SHUBHO MAHALAYA**; fade to black |

Each vertical or square reference shot becomes a sharp centre panel with feathered edges, over a blurred copy of itself, to fill 16:9.
- **ref 1:** the creator's handle, avatar and screen-recording player UI are cropped out or avoided.
- **ref 2:** the logo is cropped off.
- **ref 3:** the black side bars are removed.

## Rebuild

```bash
npm install
python3 tools/prep_shots.py <folder with the three reference videos>      # → public/shots/s01..s14.mp4
cd hf && npx hyperframes render . -f 24 -q high --crf 14 -o ../public/hf_final.mp4 && cd ..
REMOTION_CHROME=/path/to/chrome-headless-shell npx remotion render src/index.ts Mahalaya out/mahalaya_ref_1080p.mp4 \
  --codec=h264 --crf=16 --color-space=bt709 --audio-codec=aac --audio-bitrate=320k
```

The final card's portrait panel (`hf/final_panel.mp4`) is ref 2 at 27.165 s, cropped to `472:816:0:36`, slowed to 0.34×,
motion-interpolated to 24 fps and scaled to 452×780.
