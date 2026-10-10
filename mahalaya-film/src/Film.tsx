import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import shots from "./shots.json";
import { GodRays, Grain, Motes, Petals, Vignette, pulse } from "./fx";

// Built only from the three reference videos (prepared by tools/prep_shots.py)
// plus the HyperFrames final card (hf/ → public/hf_final.mp4).
export const FPS = 24;
export const FILM_S = 44.5; // audio fades 39.5 → 44.5 (quarter-sine) and lands with the picture
export const FILM_FRAMES = Math.round(FILM_S * FPS); // 1068
const f = (s: number) => Math.round(s * FPS);
const HANDLE = 6; // frames of head/tail footage baked into every shot file (0.25 s)
const DISS = 12; // dissolve length, centred on the cut

type Shot = { ref: string; srcIn: number; rate: number; start: number; end: number; note: string };
const SHOTS = (shots as Shot[]).slice(0, 13);
// cuts that dissolve (index = outgoing shot); the rest are hard cuts on musical accents
const DISSOLVE_AFTER = new Set([0, 1, 2, 3, 10, 11]);
const ACCENTS = [15.476, 21.792, 24.892, 27.063, 30.012];

const ShotClip: React.FC<{ i: number; fadeIn: boolean; len: number; punch: boolean }> = ({ i, fadeIn, len, punch }) => {
  const frame = useCurrentFrame();
  const o = fadeIn ? interpolate(frame, [0, DISS], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  const drift = interpolate(frame, [0, len], [1.0, 1.045]);
  const kick = punch ? interpolate(frame, [0, 8], [1.035, 1], { extrapolateRight: "clamp" }) : 1;
  return (
    <AbsoluteFill style={{ opacity: o, transform: `scale(${drift * kick})` }}>
      <OffthreadVideo src={staticFile(`shots/s${String(i + 1).padStart(2, "0")}.mp4`)} startFrom={fadeIn ? HANDLE - DISS / 2 : HANDLE} muted />
    </AbsoluteFill>
  );
};

export const Film: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const reveal = pulse(t, [15.476], 0.22);
  const beat = pulse(t, ACCENTS.slice(1), 0.09);
  const dawnRays = interpolate(t, [0, 1.5, 12, 13.2], [0.25, 0.45, 0.45, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const petals = interpolate(t, [29.6, 30.4, 38.6, 39.2], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {SHOTS.map((s, i) => {
        const fadeIn = i > 0 && DISSOLVE_AFTER.has(i - 1);
        const fadeOut = DISSOLVE_AFTER.has(i) || i === SHOTS.length - 1;
        const from = f(s.start) - (fadeIn ? DISS / 2 : 0);
        const to = f(s.end) + (fadeOut ? DISS / 2 : 0);
        return (
          <Sequence key={i} from={from} durationInFrames={to - from}>
            <ShotClip i={i} fadeIn={fadeIn} len={to - from} punch={ACCENTS.includes(s.start)} />
          </Sequence>
        );
      })}
      {/* final card (HyperFrames): its t=0 is 38.75 s */}
      <Sequence from={f(38.75)} durationInFrames={FILM_FRAMES - f(38.75)}>
        <FadeIn frames={DISS}>
          <OffthreadVideo src={staticFile("hf_final.mp4")} muted />
        </FadeIn>
      </Sequence>

      {/* light + atmosphere over the footage (stops before the title card) */}
      <Sequence from={0} durationInFrames={f(38.9)}>
        <AbsoluteFill style={{ opacity: dawnRays }}>
          <GodRays x="50%" y="-15%" spread={110} count={24} opacity={1} color="255,220,160" seed="dawn" />
        </AbsoluteFill>
        <Motes count={46} seed="dust" speed={14} size={2.2} opacity={0.55} />
        <AbsoluteFill style={{ opacity: petals }}>
          <Petals count={34} seed="pf" speed={80} size={20} />
        </AbsoluteFill>
        <Vignette strength={0.45} />
      </Sequence>
      <AbsoluteFill style={{ background: "#fff6e2", opacity: Math.max(reveal * 0.95, beat * 0.22), mixBlendMode: "screen", pointerEvents: "none" }} />
      <Grain opacity={0.045} />
      <Audio src={staticFile("soundtrack_44s.wav")} />
    </AbsoluteFill>
  );
};

const FadeIn: React.FC<{ frames: number; children: React.ReactNode }> = ({ frames, children }) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame, [0, frames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};
