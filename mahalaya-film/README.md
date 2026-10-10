# Mahalaya: Shubho Mahalaya (original animated film)

A 44.5 s original animated devotional film for Mahalaya.

- **What's original:** every frame is drawn in code as vector "papercut" illustration. No reference footage and no character-sheet imagery appear in it.
- **What the references inspired:** the story and settings. That covers the dawn radio broadcast, the misty Ganga with the Howrah bridge and kash, the Goddess taking form against the sun, the dhakis and the boat, and the shiuli flowers.

## Tools

- **Remotion** (`src/story.tsx`, `src/art.tsx`, `src/fx.tsx`): all scenes, motion and timing, plus the audio.
- **HyperFrames** (`hf/`): beat detection (`hf/beats/`) and the animated title "শুভ মহালয়া / SHUBHO MAHALAYA". The title is rendered as a transparent RGBA PNG sequence, which Remotion overlays on the final scene.

## Audio

The supplied recording, trimmed as follows:
- The leading 1.27 s of silence is removed.
- It is cut to 44.5 s.
- A 5 s **quarter-sine fade-out** runs from 39.5 to 44.5 s. It reaches silence on the final frame as the picture fades to black.

## Story and sync (seconds)

| Time | Scene | Sync |
|---|---|---|
| 0 – 6.7 | Dawn in a Bengal village; a radio carries the Mahalaya broadcast in golden waves | waves swell on 3.4 / 3.8 / 4.3 / 4.6 / 5.4 |
| 6.7 – 13.0 | The misty Ganga: Howrah bridge, kash, a boat with a small pratima; darkness creeps in from 12.0 | dissolve on 6.7 |
| 13.0 – 15.5 | Darkness rises: storm, a horned shadow with burning eyes | lightning on 13.5 / 13.9 / 14.7 |
| 15.5 – 21.8 | The Goddess takes form against the sun; ten arms emerge, each with its weapon; the third eye opens | burst on 15.48 (strongest hit); one arm per beat 16.1 → 20.6 |
| 21.8 – 30.0 | Light against darkness: her trident's beam drives back the shadow | sparks on 24.9 – 29.6, clash 26.96, strike 30.01 |
| 30.0 – 36.7 | Maa is coming home: dhakis march through kash by the river at sunrise | drumsticks strike on the beats |
| 36.7 – 39.0 | Shiuli flowers fall; lotus and diyas | dissolve |
| 39.0 – 44.5 | The Goddess in a sun mandala; **শুভ মহালয়া / SHUBHO MAHALAYA**; fade to black | title from 39.2 |

## Rebuild

```bash
npm install
cd hf && npx hyperframes render . --format png-sequence -f 24 -o ../public/title && cd ..
REMOTION_CHROME=/path/to/chrome-headless-shell npx remotion render src/index.ts Mahalaya out/mahalaya_original_1080p.mp4 \
  --codec=h264 --crf=16 --color-space=bt709 --audio-codec=aac --audio-bitrate=320k
```

The earlier experiments are still in the tree but unused: `src/scenes.tsx`, `src/Mahalaya.tsx`, `src/Film.tsx` and `tools/prep_shots.py`.
