# Mahalaya: Shubho Mahalaya (original animated film)

A 48 s original animated devotional film for Mahalaya, ending on the Tiltwave (TW) logo.

- **What's original:** every frame is drawn in code as vector "papercut" illustration. No reference footage and no character-sheet imagery appear in it.
- **What the references inspired:** the story and settings. That covers the dawn radio broadcast, the misty Ganga with the Howrah bridge and kash, the Goddess taking form against the sun, the dhakis and the boat, and the shiuli flowers.

## Tools

- **Remotion** (`src/story.tsx`, `src/art.tsx`, `src/fx.tsx`): all scenes, motion and timing, plus the audio.
- **HyperFrames** (`hf/`): beat detection (`hf/beats/`) and the animated title "শুভ মহালয়া / SHUBHO MAHALAYA". The title is rendered as a transparent RGBA PNG sequence, which Remotion overlays on the final scene.

## Audio

The supplied recording, trimmed as follows:
- The leading 1.27 s of silence is removed.
- It is cut to 48 s.
- A 5 s **quarter-sine fade-out** runs from 43 to 48 s. It reaches silence on the final frame as the picture fades to black.

## Story and sync (seconds)

| Time | Scene |
|---|---|
| 0 – 2.2 | Hook: the sun breaks the horizon over a Bengal village |
| 2.2 – 4.3 | Close-up: the radio on the windowsill comes alive (golden waves on 3.36) |
| 4.3 – 6.7 | The village wakes: waves ripple out from the radio in the house's window |
| 6.7 – 13.0 | The misty Ganga: Howrah bridge, kash, a boat; storm gathers and Mahishasura begins to form in it |
| 13.0 – 15.5 | Mahishasura condenses out of the smoke: horns, iron crown, molten cracks; eyes ignite with the lightning |
| 15.5 – 21.8 | The Goddess takes form against the sun; one arm per beat; the third eye opens |
| 21.8 – 30.0 | Light against darkness; strike on 30.01 |
| 30.0 – 32.0 | The darkness shatters to gold; the boat brings Maa home |
| 32.0 – 33.3 | The pratima carried through the kash |
| 33.3 – 34.3 | Maa rides in on the elephant |
| 34.3 – 36.7 | Close on the dhakis, drumming on the beats |
| 36.7 – 39.0 | Shiuli flowers, lotus and diyas |
| 39.0 – 43.2 | **শুভ মহালয়া / SHUBHO MAHALAYA** |
| 43.2 – 48.0 | Tiltwave logo transition: particles gather and the TW mark draws in gold |

The TW mark appears as a small watermark at the bottom right from 1 s until the title card.

## Rebuild

```bash
npm install
cd hf && npx hyperframes render . --format png-sequence -f 24 -o ../public/title && cd ..
REMOTION_CHROME=/path/to/chrome-headless-shell npx remotion render src/index.ts Mahalaya out/mahalaya_original_1080p.mp4 \
  --codec=h264 --crf=16 --color-space=bt709 --audio-codec=aac --audio-bitrate=320k
```

The earlier experiments are still in the tree but unused: `src/scenes.tsx`, `src/Mahalaya.tsx`, `src/Film.tsx` and `tools/prep_shots.py`.
