import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame } from "remotion";
import { Scene1, Scene2, Scene3, Scene4, Scene5 } from "./scenes";
import { Grain, pulse } from "./fx";
import { T, f, FPS, TOTAL_FRAMES } from "./timing";

const DISSOLVE = 12; // frames

/** Fades its children in over the first `fadeIn` frames of the sequence. */
const FadeIn: React.FC<{ frames: number; children: React.ReactNode }> = ({ frames, children }) => {
  const frame = useCurrentFrame();
  const o = frames ? interpolate(frame, [0, frames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>;
};

export const Mahalaya: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  // white "divine" flashes that hide the hard cuts on the big accents
  const flash = Math.max(pulse(t, [T.s3], 0.16) * 0.9, pulse(t, [T.s4], 0.1) * 0.6);
  const s2 = f(T.s2), s3 = f(T.s3), s4 = f(T.s4), s5 = f(T.strike), hf = f(T.bengalIn), hfEnd = TOTAL_FRAMES;
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Sequence from={0} durationInFrames={s2}>
        <Scene1 />
      </Sequence>
      <Sequence from={s2 - DISSOLVE} durationInFrames={s3 - (s2 - DISSOLVE)}>
        <FadeIn frames={DISSOLVE}>
          <Scene2 />
        </FadeIn>
      </Sequence>
      <Sequence from={s3} durationInFrames={s4 - s3}>
        <Scene3 />
      </Sequence>
      <Sequence from={s4} durationInFrames={s5 - s4}>
        <Scene4 />
      </Sequence>
      <Sequence from={s5} durationInFrames={f(T.bengal) - s5}>
        <Scene5 />
      </Sequence>
      {/* Scene 6 + Final greeting: HyperFrames composition (hf/), rendered to public/hf_bengal.mp4 */}
      <Sequence from={hf} durationInFrames={hfEnd - hf}>
        <FadeIn frames={f(T.bengal) - hf}>
          <OffthreadVideo src={staticFile("hf_bengal.mp4")} muted />
        </FadeIn>
      </Sequence>
      <AbsoluteFill style={{ background: "#fff8ea", opacity: flash, pointerEvents: "none" }} />
      <Grain opacity={0.05} />
      <Audio src={staticFile("soundtrack.wav")} />
    </AbsoluteFill>
  );
};
