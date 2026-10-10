// "Shubho Mahalaya": an original animated film. The story and mood are inspired by the
// reference videos (dawn radio broadcast, the misty Ganga with the Howrah bridge, kash,
// the Goddess taking form against the sun, the boat, the procession, the elephant, dhakis,
// shiuli flowers), but every frame is drawn here in code.
import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { W, H, lerp, pulse, useT, Sky, Clouds, GodRays, Glow, Motes, Petals, Lightning, Ridge, Vignette, Grain } from "./fx";
import {
  Durga, Demon, HowrahBridge, Kash, useKash, Radio, Hut, Palm, Dhaki, Boat, ShiuliTree, ShiuliFlower, Lotus, Diya, SunMandala,
  Elephant, Procession, TWLogo,
} from "./art";

export const FPS = 24;
export const STORY_S = 48.0; // audio: 5 s quarter-sine fade 43.0 → 48.0
export const STORY_FRAMES = Math.round(STORY_S * FPS); // 1152
const f = (s: number) => Math.round(s * FPS);

const S = {
  sun: 0, radio: 2.206, village: 4.342, river: 6.676, dark: 11.981, demon: 13.038, goddess: 15.476, battle: 21.792,
  boat: 30.012, procession: 31.985, elephant: 33.263, dhak: 34.342, shiuli: 36.722, title: 39.0, logo: 43.166,
};
const ARM_BEATS = [16.091, 16.44, 17.31, 17.636, 17.914, 18.355, 18.715, 19.4, 20.19, 20.561];
const CLASH = [24.892, 25.263, 25.67, 25.774, 26.958, 27.55, 28.34, 28.607, 29.559];
const DHAK = [30.337, 31.103, 31.544, 31.985, 33.263, 34.342, 35.376, 35.898, 36.037, 36.722];

// Cinzel 700 for the TW mark
const fontHandle = typeof document !== "undefined" ? delayRender("tw-font") : null;
if (typeof document !== "undefined") {
  const ff = new FontFace("CinzelTW", `url(${staticFile("fonts/cinzel-latin-700-normal.woff2")})`, { weight: "700" });
  ff.load().then((x) => { document.fonts.add(x); if (fontHandle !== null) continueRender(fontHandle); });
}

const useG = (start: number) => {
  const { t, frame } = useT();
  return { t, g: t + start, frame };
};
const Full: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", ...style }}>
    {children}
  </svg>
);
const RadioDefs = () => (
  <defs>
    <linearGradient id="radioBody" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#d9a77a" />
      <stop offset="100%" stopColor="#9a6640" />
    </linearGradient>
  </defs>
);

/* ============ 1a · HOOK: the sun breaks the horizon ============ */
const SceneSunrise: React.FC = () => {
  const { g } = useG(S.sun);
  const rise = lerp(g, 0, 2.5, 0, 1);
  const sunY = 830 - rise * 230;
  const flare = pulse(g, [0.441, 0.871, 1.347, 1.95], 0.25);
  return (
    <AbsoluteFill style={{ transform: `scale(${lerp(g, 0, 2.6, 1.12, 1.0)})` }}>
      <Sky stops={`#070a22 0%, #1e1a4a ${30 - rise * 10}%, #7a3a6a ${55 - rise * 8}%, #f08a4a ${74 - rise * 6}%, #ffd08a 86%`} />
      <Glow x={960} y={sunY} r={360 + rise * 500} color="rgba(255,206,130,0.95)" />
      <GodRays x="50%" y={`${(sunY / H) * 100}%`} spread={360} count={40} opacity={0.2 + rise * 0.55 + flare * 0.2} color="255,226,160" seed="hook" spin={3} />
      <Full>
        <circle cx={960} cy={sunY} r={95} fill="#fff6dc" style={{ filter: "blur(2px)" }} />
        <rect x={0} y={sunY - 3 - flare * 3} width={W} height={6 + flare * 6} fill="rgba(255,240,210,0.7)" style={{ filter: "blur(4px)" }} opacity={0.4 + flare * 0.6} />
        {new Array(5).fill(0).map((_, i) => (
          <circle key={i} cx={960 + (i - 2) * 160 * (1 + rise)} cy={sunY + (i - 2) * 50} r={14 + i * 6} fill="none" stroke="rgba(255,230,190,0.35)" strokeWidth={2} />
        ))}
        <Ridge seed="h1" base={800} amp={70} color="#2a1834" />
        <Palm x={300} base={812} s={1.1} color="#1a0e22" />
        <Palm x={420} base={815} s={0.8} color="#1a0e22" lean={-1} />
        <Hut x={1500} base={818} s={0.9} color="#1a0e22" lit={0.9} />
        <Palm x={1700} base={815} s={1.0} color="#1a0e22" lean={-1} />
        <rect x={-50} y={812} width={W + 100} height={300} fill="#140a18" />
        {new Array(6).fill(0).map((_, i) => {
          const bx = 600 + i * 70 + g * 120;
          const by = 420 + Math.sin(i * 2) * 40 - g * 20;
          const fl = Math.sin(g * 14 + i) * 5;
          return <path key={i} d={`M${bx - 14} ${by} Q ${bx - 7} ${by - 6 - fl} ${bx} ${by} Q ${bx + 7} ${by - 6 - fl} ${bx + 14} ${by}`} stroke="#1a0e22" strokeWidth={2.5} fill="none" />;
        })}
      </Full>
      <Motes count={40} seed="hk" speed={20} size={2.4} />
      <Vignette strength={0.55} />
    </AbsoluteFill>
  );
};

/* ============ 1b · the radio on the windowsill comes alive ============ */
const SceneRadio: React.FC = () => {
  const { g } = useG(S.radio);
  const wave = pulse(g, [3.355, 3.82], 0.3);
  const on = lerp(g, 2.4, 3.4, 0.3, 1);
  return (
    <AbsoluteFill style={{ transform: `scale(${lerp(g, S.radio, S.village, 1.0, 1.08)})`, transformOrigin: "45% 60%" }}>
      <Sky stops="#3a2a5a 0%, #b45a6a 40%, #f4a66a 70%, #ffd59a 100%" style={{ filter: "blur(6px)" }} />
      <Glow x={1350} y={640} r={520} color="rgba(255,214,150,0.9)" />
      {/* window frame of the house */}
      <AbsoluteFill style={{ background: "linear-gradient(90deg, #3a2014 0 9%, transparent 9% 91%, #3a2014 91%)" }} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #3a2014 0 8%, transparent 8%)" }} />
      <Full>
        <rect x={930} y={80} width={24} height={760} fill="#3a2014" />
        <rect x={172} y={420} width={1576} height={18} fill="#3a2014" opacity={0.85} />
        <rect x={0} y={840} width={W} height={260} fill="url(#sill)" />
        <defs>
          <linearGradient id="sill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8a5a36" />
            <stop offset="100%" stopColor="#3a2014" />
          </linearGradient>
        </defs>
        <RadioDefs />
        <g transform="translate(700 680)" style={{ mixBlendMode: "screen" }}>
          {new Array(7).fill(0).map((_, k) => {
            const r = ((Math.max(0, g - 3.2) * 260 + k * 110) % 900) + 30;
            const o = g < 3.2 ? 0 : (1 - r / 930) * (0.5 + wave * 0.5);
            return <circle key={k} r={r} fill="none" stroke="#ffd47a" strokeWidth={4 + wave * 6} opacity={o} style={{ filter: "blur(1.5px)" }} />;
          })}
        </g>
        <g transform="translate(790 846) scale(1.7)">
          <Radio t={g - S.radio} glow={on + wave * 0.5} />
        </g>
        <circle cx={850} cy={510} r={90 + wave * 60} fill="rgba(255,220,140,0.5)" opacity={on} style={{ filter: "blur(30px)" }} />
      </Full>
      <Motes count={50} seed="rd" speed={16} size={2.4} />
      <Vignette strength={0.55} />
    </AbsoluteFill>
  );
};

/* ============ 1c · the village wakes to the broadcast ============ */
const SceneVillage: React.FC = () => {
  const { g } = useG(S.village);
  const wave = pulse(g, [4.342, 4.598, 5.05, 5.433, 5.863], 0.25);
  const hx = 1160, hb = 860, hs = 1.6;
  const src = { x: hx + -72 * hs, y: hb - 70 * hs };
  return (
    <AbsoluteFill style={{ transform: `scale(${lerp(g, S.village, S.river + 0.3, 1.0, 1.07)})`, transformOrigin: "55% 65%" }}>
      <Sky stops="#3a4a8a 0%, #8a6a9a 26%, #e8907a 50%, #ffc07a 70%, #ffe0a8 86%" />
      <Glow x={1520} y={600 - (g - S.village) * 14} r={560} color="rgba(255,226,160,0.95)" />
      <Glow x={1520} y={600 - (g - S.village) * 14} r={90} color="rgba(255,252,236,1)" />
      <GodRays x="79%" y="56%" spread={200} count={30} opacity={0.5} seed="vl" />
      <Clouds color="#ffd2b0" opacity={0.5} speed={10} top={-40} height={560} />
      <Full>
        <Ridge seed="v1" base={800} amp={60} color="#7a5470" opacity={0.7} />
        <Palm x={420} base={820} s={1.0} color="#3e2440" />
        <Palm x={560} base={826} s={0.75} color="#3e2440" lean={-1} />
        <Hut x={700} base={840} s={0.7} color="#4a2a44" lit={0.6} />
        <Palm x={1560} base={835} s={1.1} color="#3e2440" lean={-1} />
        <Hut x={1720} base={845} s={0.55} color="#4a2a44" lit={0.5} />
        <rect x={-50} y={850} width={W + 100} height={260} fill="#3a2418" />
        <Hut x={hx} base={hb} s={hs} color="#3a2036" lit={1} />
        <RadioDefs />
        <g transform={`translate(${src.x} ${src.y + 14 * hs}) scale(0.13)`}>
          <Radio t={g} glow={1} />
        </g>
        <g transform={`translate(${src.x} ${src.y})`} style={{ mixBlendMode: "screen" }}>
          {new Array(7).fill(0).map((_, k) => {
            const r = ((g * 170 + k * 140) % 1000) + 20;
            const o = (1 - r / 1020) * (0.45 + wave * 0.5);
            return <circle key={k} r={r} fill="none" stroke="#ffd47a" strokeWidth={3 + wave * 4} opacity={o} />;
          })}
        </g>
      </Full>
      <Clouds color="#ffe6cc" opacity={0.4} speed={20} top={760} height={300} tex="mist.png" />
      <Motes count={50} seed="s1" speed={22} size={2.6} />
      <Vignette strength={0.5} />
    </AbsoluteFill>
  );
};

/* ============ 2 · THE MISTY GANGA ============ */
const SceneRiver: React.FC = () => {
  const { t, g } = useG(S.river);
  const left = useKash("k2l", 34, [-60, 520], [380, 620]);
  const right = useKash("k2r", 34, [1400, 1980], [380, 620]);
  const pan = lerp(g, S.river, S.demon, 0, -70);
  const dark = lerp(g, S.dark, S.demon, 0, 0.85);
  const form = lerp(g, 12.3, S.demon, 0, 0.35);
  return (
    <AbsoluteFill style={{ transform: `translateX(${pan}px) scale(1.07)` }}>
      <Sky stops="#56649a 0%, #b9a6b8 34%, #f3c9a0 60%, #ffe2b8 66%" />
      <Glow x={1420} y={560} r={380} color="rgba(255,236,200,0.95)" />
      <Clouds color="#f4d6c4" opacity={0.55} speed={8} top={0} height={520} />
      <Full>
        <HowrahBridge x0={160} x1={1760} base={690} h={300} color="#5c5674" opacity={0.78} />
        <rect x={-100} y={690} width={W + 200} height={H} fill="url(#river2)" />
        <defs>
          <linearGradient id="river2" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0cdb0" />
            <stop offset="40%" stopColor="#a9909e" />
            <stop offset="100%" stopColor="#3c3a5a" />
          </linearGradient>
        </defs>
        <g transform="translate(0 1380) scale(1 -1)" opacity={0.22} style={{ filter: "blur(3px)" }}>
          <HowrahBridge x0={160} x1={1760} base={690} h={300} color="#5c5674" />
        </g>
        {new Array(18).fill(0).map((_, i) => (
          <rect key={i} x={1340 + (random(`gl${i}`) - 0.5) * 120} y={700 + i * 14} width={60 + random(`gw${i}`) * 80} height={2}
            fill="#fff4dc" opacity={0.25 + 0.35 * Math.abs(Math.sin(t * 2 + i))} style={{ filter: "blur(1.5px)" }} />
        ))}
        <Boat x={480 + (g - S.river) * 26} y={800} s={0.85} t={g} color="#3a2a3a" />
      </Full>
      <Clouds color="#fff2e2" opacity={0.8} speed={28} top={560} height={300} tex="mist.png" />
      <Full>
        <Kash stalks={left} base={1090} t={g} />
        <Kash stalks={right} base={1090} t={g} />
      </Full>
      <Clouds color="#fff0e4" opacity={0.45} speed={-20} top={800} height={300} tex="mist.png" offset={900} />
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #08060e, #1b0d18 55%, #2a0d10)", opacity: dark * 0.8 }} />
      <Clouds color="#0e0810" opacity={dark} speed={90} top={-60} height={640} tex="clouds_b.png" />
      {/* the demon begins to gather inside the storm */}
      <Full>
        <g transform="translate(1030 420)" opacity={form}>
          <Demon t={g} form={form} eyes={0} s={1.0} />
        </g>
      </Full>
      <Vignette strength={0.45 + dark * 0.3} />
    </AbsoluteFill>
  );
};

/* ============ 3 · MAHISHASURA RISES ============ */
const SceneDemon: React.FC = () => {
  const { g, frame } = useG(S.demon);
  const strikes = [13.514, 13.874, 14.652];
  const fl = pulse(g, strikes, 0.1);
  const sh = fl * 8;
  const form = lerp(g, S.demon, 14.4, 0.35, 1);
  const eyes = lerp(g, 13.8, 14.25, 0, 1);
  const push = lerp(g, S.demon, S.goddess, 1.0, 1.12);
  return (
    <AbsoluteFill style={{ transform: `translate(${Math.sin(frame * 2.7) * sh}px, ${Math.cos(frame * 3.1) * sh}px) scale(${push})`, transformOrigin: "50% 40%" }}>
      <Sky stops="#05040a 0%, #170a14 40%, #3a0c10 75%, #5a1410 100%" />
      <Glow x={960} y={500} r={700} color="rgba(170,30,15,0.45)" />
      <Clouds color="#170b14" opacity={0.9} speed={120} top={-60} height={700} tex="clouds_b.png" />
      <Lightning times={strikes} />
      <Full>
        <g transform="translate(960 470)" style={{ filter: `brightness(${1 + fl * 1.6})` }}>
          <Demon t={g} form={form} eyes={eyes} s={1.25} heat={fl} />
        </g>
        <Ridge seed="v3" base={1010} amp={90} color="#050304" rough={0.8} />
      </Full>
      <Clouds color="#251018" opacity={0.6} speed={70} top={640} height={500} tex="mist.png" />
      <Motes count={80} seed="emb3" color="255,80,40" speed={70} size={2.4} />
      <Vignette strength={0.8} />
    </AbsoluteFill>
  );
};

/* ============ 4 · THE GODDESS TAKES FORM ============ */
const SceneGoddess: React.FC = () => {
  const { g } = useG(S.goddess);
  const burst = lerp(g, S.goddess, S.goddess + 0.9, 0, 1);
  const rise = lerp(g, S.goddess, S.goddess + 1.1, 520, 0);
  const arms = ARM_BEATS.reduce((acc, b) => acc + Math.max(0, Math.min(1, (g - b) / 0.45)), 0);
  const eye = lerp(g, 20.9, 21.5, 0, 1);
  const push = lerp(g, S.goddess, S.battle, 1.0, 1.07);
  const armPulse = pulse(g, ARM_BEATS, 0.15);
  const ring = g - S.goddess;
  return (
    <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: "50% 45%" }}>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 44%, #ffe08a 0%, #ffa526 26%, #e8600f 55%, #a52208 80%, #5a0c06 100%)" }} />
      <GodRays x="50%" y="44%" spread={360} count={44} opacity={0.35 + armPulse * 0.2} color="255,236,180" seed="s4" spin={6} />
      <Full>
        <g transform={`translate(960 476) scale(${0.35 + 0.65 * burst})`}>
          <SunMandala r={250} rot={g * 9} />
        </g>
        {ring < 1.4 && (
          <circle cx={960} cy={476} r={ring * 1400} fill="none" stroke="#fff4d0" strokeWidth={40 * (1 - ring / 1.4)} opacity={1 - ring / 1.4} style={{ filter: "blur(8px)" }} />
        )}
        <g transform={`translate(960 ${1068 + rise}) scale(1.45)`}>
          <Durga arms={arms} eye={eye} rim={0.6 + armPulse * 0.8} t={g} />
        </g>
      </Full>
      <Motes count={70} seed="s4m" speed={30} size={3} />
      <Vignette strength={0.45} color="60,10,0" />
    </AbsoluteFill>
  );
};

/* ============ 5 · LIGHT AGAINST DARKNESS ============ */
const SceneBattle: React.FC = () => {
  const { g, frame } = useG(S.battle);
  const front = lerp(g, S.battle, S.boat, 0.44, 0.62);
  const fx = front * W;
  const spark = pulse(g, CLASH, 0.12);
  const big = pulse(g, [26.958], 0.2);
  const charge = lerp(g, 27.063, S.boat, 0, 1);
  const push = lerp(g, 27.063, S.boat, 1.0, 1.1);
  const sh = spark * 7;
  const tip = { x: 470 + 154.6 * 0.95, y: 1040 - 714 * 0.95 };
  const C = { x: fx, y: 420 + Math.sin(g * 3) * 10 };
  return (
    <AbsoluteFill style={{ transform: `translate(${Math.sin(frame * 3.1) * sh}px, ${Math.cos(frame * 2.3) * sh}px) scale(${push})`, transformOrigin: "45% 45%" }}>
      <AbsoluteFill style={{ background: `linear-gradient(90deg, #ffd27a 0%, #f39a32 ${front * 100 - 18}%, #8a2a12 ${front * 100}%, #1a0710 ${front * 100 + 16}%, #07040a 100%)` }} />
      <AbsoluteFill style={{ WebkitMaskImage: `linear-gradient(90deg, transparent ${front * 100}%, #000 ${front * 100 + 12}%)`, maskImage: `linear-gradient(90deg, transparent ${front * 100}%, #000 ${front * 100 + 12}%)` }}>
        <Clouds color="#12070c" opacity={0.95} speed={110} top={-40} height={700} tex="clouds_b.png" />
      </AbsoluteFill>
      <GodRays x="24%" y="30%" spread={200} opacity={0.5} color="255,230,170" seed="s5" spin={4} />
      <Full>
        <g transform="translate(1500 420)">
          <Demon t={g} form={1} eyes={1} s={0.95 + spark * 0.04} heat={spark} />
        </g>
        {new Array(5).fill(0).map((_, i) => {
          const y0 = 440 + (i - 2) * 70;
          const wob = Math.sin(g * 4 + i) * 30;
          return <path key={i} d={`M1330 ${y0} Q ${(1330 + C.x) / 2} ${y0 + wob} ${C.x + 10} ${C.y + (i - 2) * 8}`} stroke="#14060c" strokeWidth={22 - Math.abs(i - 2) * 5} fill="none" strokeLinecap="round" style={{ filter: "blur(3px)" }} />;
        })}
        <line x1={tip.x} y1={tip.y} x2={C.x} y2={C.y} stroke="rgba(255,230,160,0.55)" strokeWidth={60 + charge * 60} strokeLinecap="round" style={{ filter: "blur(20px)" }} />
        <line x1={tip.x} y1={tip.y} x2={C.x} y2={C.y} stroke="#fff6d6" strokeWidth={6 + charge * 8} strokeLinecap="round" />
        <circle cx={C.x} cy={C.y} r={60 + spark * 90 + big * 160} fill="rgba(255,244,210,0.9)" style={{ filter: "blur(26px)" }} />
        <g transform="translate(470 1040) scale(0.95)">
          <Durga arms={10} eye={1} rim={1.2 + charge} t={g} halo={0.8} />
        </g>
        <circle cx={tip.x} cy={tip.y} r={30 + charge * 70} fill="rgba(255,250,225,0.95)" style={{ filter: "blur(14px)" }} />
        {(() => {
          const k = CLASH.reduce((acc, s, j) => (g >= s ? j : acc), -1);
          if (k < 0) return null;
          const d = g - CLASH[k];
          if (d > 0.7) return null;
          return new Array(36).fill(0).map((_, i) => {
            const a = random(`c${k}${i}`) * Math.PI * 2;
            const v = 250 + random(`v${k}${i}`) * 800;
            return <circle key={i} cx={C.x + Math.cos(a) * v * d} cy={C.y + Math.sin(a) * v * d + 300 * d * d} r={3} fill="#fff2c0" opacity={1 - d / 0.7} style={{ filter: "drop-shadow(0 0 6px #ffb040)" }} />;
          });
        })()}
        <Ridge seed="v5" base={1050} amp={40} color="#1a0a08" />
      </Full>
      <Motes count={70} seed="s5e" color="255,170,80" speed={50} size={2.6} />
      <AbsoluteFill style={{ background: "#fff4d8", opacity: big * 0.6, mixBlendMode: "screen" }} />
      <Vignette strength={0.6} />
    </AbsoluteFill>
  );
};

/* ============ 6a · the darkness shatters; the boat brings Maa home ============ */
const SceneBoat: React.FC = () => {
  const { g } = useG(S.boat);
  const d = g - S.boat;
  return (
    <AbsoluteFill style={{ transform: `scale(${lerp(g, S.boat, S.procession, 1.08, 1.0)})` }}>
      <Sky stops="#6a7ab8 0%, #e8a89a 34%, #ffcf8a 58%, #fff0c8 64%" />
      <Glow x={1200} y={580} r={620} color="rgba(255,226,160,0.95)" />
      <Glow x={1200} y={580} r={110} color="rgba(255,252,236,1)" />
      <GodRays x="62%" y="54%" spread={220} count={30} opacity={0.5} seed="bt" />
      <Full>
        <HowrahBridge x0={700} x1={1900} base={640} h={210} color="#8a6a7a" opacity={0.6} />
        <rect x={-100} y={640} width={W + 200} height={H} fill="url(#river6)" />
        <defs>
          <linearGradient id="river6" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffe2b0" />
            <stop offset="100%" stopColor="#b07a7a" />
          </linearGradient>
        </defs>
        {new Array(16).fill(0).map((_, i) => (
          <rect key={i} x={1130 + (random(`bg${i}`) - 0.5) * 160} y={650 + i * 22} width={80 + random(`bw${i}`) * 90} height={2.5} fill="#fff4dc" opacity={0.3 + 0.4 * Math.abs(Math.sin(g * 2 + i))} style={{ filter: "blur(1.5px)" }} />
        ))}
        {[300, 520, 820].map((x, i) => <Diya key={x} x={x + d * 18} y={930 + i * 30} s={0.9} t={g} i={i} />)}
        <Boat x={760 + d * 70} y={830} s={1.7} t={g} color="#3a1e1a" />
      </Full>
      {d < 1.2 && (
        <AbsoluteFill style={{ mixBlendMode: "screen" }}>
          {new Array(70).fill(0).map((_, i) => {
            const a = random(`sh${i}`) * Math.PI * 2;
            const v = 200 + random(`sv${i}`) * 900;
            return <div key={i} style={{ position: "absolute", left: 1460 + Math.cos(a) * v * d, top: 420 + Math.sin(a) * v * d, width: 5, height: 5, borderRadius: 3, background: "#fff2c0", boxShadow: "0 0 12px 4px rgba(255,190,90,0.9)", opacity: 1 - d / 1.2 }} />;
          })}
        </AbsoluteFill>
      )}
      <Petals count={30} seed="bp" speed={80} size={20} />
      <Vignette strength={0.4} color="60,20,0" />
    </AbsoluteFill>
  );
};

/* ============ 6b · the pratima carried through the kash ============ */
const SceneProcession: React.FC = () => {
  const { g } = useG(S.procession);
  const back = useKash("pk1", 40, [-60, 1980], [260, 380]);
  const front = useKash("pk2", 18, [-60, 1980], [520, 700]);
  const d = g - S.procession;
  const hit = pulse(g, DHAK, 0.12);
  return (
    <AbsoluteFill>
      <Sky stops="#7a8ac0 0%, #f0b8a0 40%, #ffd8a0 70%, #fff0cc 100%" />
      <Glow x={1500} y={520} r={560} color="rgba(255,230,170,0.9)" />
      <Full>
        <Ridge seed="pr" base={760} amp={40} color="#b48a90" opacity={0.6} />
        <rect x={-50} y={780} width={W + 100} height={320} fill="#5a3a24" />
        <g transform={`translate(${-d * 60} 0)`}>
          <Kash stalks={back} base={800} t={g} />
        </g>
        <g transform={`translate(${720 + d * 90} 900)`}>
          <Procession t={g} s={1.5} />
        </g>
        <Dhaki x={420 + d * 90} base={900} s={1.5} t={g} phase={0.4} hit={hit} />
        <g transform={`translate(${-d * 160} 0)`}>
          <Kash stalks={front} base={1110} t={g} blur={2} />
        </g>
      </Full>
      <Petals count={24} seed="pp" speed={70} size={18} />
      <Vignette strength={0.45} color="60,20,0" />
    </AbsoluteFill>
  );
};

/* ============ 6c · Maa rides in on the elephant ============ */
const SceneElephant: React.FC = () => {
  const { g } = useG(S.elephant);
  const d = g - S.elephant;
  const hit = pulse(g, DHAK, 0.12);
  const kash = useKash("ek", 30, [-60, 1980], [200, 320]);
  return (
    <AbsoluteFill style={{ transform: `scale(${lerp(g, S.elephant, S.dhak, 1.0, 1.05)})` }}>
      <AbsoluteFill style={{ background: "radial-gradient(circle at 52% 52%, #fff2c8 0%, #ffcf7a 18%, #f39a3a 42%, #b8451a 72%, #5a160c 100%)" }} />
      <GodRays x="52%" y="52%" spread={360} count={40} opacity={0.45} seed="el" spin={4} />
      <Full>
        <circle cx={1000} cy={560} r={300} fill="#ffe7a8" opacity={0.85} />
        <rect x={-50} y={860} width={W + 100} height={240} fill="#2a140e" />
        <Kash stalks={kash} base={880} t={g} color="#fff4e4" stem="#3a2418" />
        <g transform={`translate(${860 + d * 60} 880)`}>
          <Elephant t={g} s={1.25} />
        </g>
        <Dhaki x={420 + d * 60} base={890} s={1.3} t={g} phase={1.1} hit={hit} />
        <Dhaki x={1450 + d * 60} base={895} s={1.2} t={g} phase={2.3} hit={hit} />
      </Full>
      <Petals count={24} seed="ep" speed={70} size={18} />
      <Vignette strength={0.45} color="60,10,0" />
    </AbsoluteFill>
  );
};

/* ============ 6d · the dhak beats: close on the drummers ============ */
const SceneDhak: React.FC = () => {
  const { g } = useG(S.dhak);
  const hit = pulse(g, DHAK, 0.12);
  const kash = useKash("dk", 16, [-60, 1980], [560, 760]);
  return (
    <AbsoluteFill style={{ transform: `scale(${1.0 + hit * 0.02 + lerp(g, S.dhak, S.shiuli, 0, 0.05)})` }}>
      <Sky stops="#8a8ac0 0%, #f4b8a0 40%, #ffd8a0 68%, #fff0cc 100%" />
      <Glow x={960} y={620} r={700} color="rgba(255,236,190,0.95)" />
      <GodRays x="50%" y="58%" spread={300} count={36} opacity={0.5 + hit * 0.2} seed="dh" />
      <Full>
        <HowrahBridge x0={1100} x1={1980} base={700} h={150} color="#b08a8a" opacity={0.5} />
        <rect x={-50} y={900} width={W + 100} height={200} fill="#3a2418" />
        {[{ x: 420, s: 2.5, p: 0.2 }, { x: 980, s: 2.9, p: 1.5 }, { x: 1540, s: 2.5, p: 2.7 }].map((d2) => (
          <Dhaki key={d2.x} x={d2.x} base={1000} s={d2.s} t={g * 0.5} phase={d2.p} hit={hit} />
        ))}
        <Kash stalks={kash} base={1120} t={g} blur={3} />
      </Full>
      <Petals count={40} seed="dp" speed={90} size={22} />
      <Motes count={40} seed="dm" speed={18} size={2.4} />
      <Vignette strength={0.45} color="60,20,0" />
    </AbsoluteFill>
  );
};

/* ============ 7 · SHIULI FLOWERS, LOTUS AND DIYAS ============ */
const SceneShiuli: React.FC = () => {
  const { g } = useG(S.shiuli);
  return (
    <AbsoluteFill style={{ transform: `scale(${lerp(g, S.shiuli - 0.3, S.title + 0.3, 1.0, 1.07)})`, transformOrigin: "60% 50%" }}>
      <Sky stops="#8a8ac4 0%, #f2b8b8 40%, #ffd8b0 70%, #ffeccc 100%" />
      <Glow x={1300} y={420} r={600} color="rgba(255,236,200,0.85)" />
      <Full>
        <Ridge seed="v7" base={780} amp={40} color="#b48aa0" opacity={0.6} />
        <path d={`M-100 ${H} L -100 790 Q 700 760 1300 780 Q 1700 790 2020 770 L 2020 ${H} Z`} fill="#4a6a3a" />
        <ShiuliTree x={1260} base={900} s={1.45} color="#4a2c1e" leaf="#2f5a2e" t={g} />
        <rect x={-100} y={930} width={W + 200} height={200} fill="#c08a9a" opacity={0.85} />
        <Lotus x={520} y={990} s={0.9} />
        {[260, 420, 700, 860, 1020].map((x, i) => <Diya key={x} x={x} y={1000 + (i % 2) * 24} s={0.8} t={g} i={i} />)}
        {new Array(46).fill(0).map((_, i) => {
          const r = (k: string) => random(`sf${k}${i}`);
          const fall = 160 + r("v") * 120;
          const y = ((r("y") * 1300 + (g - S.shiuli + 2) * fall) % 1300) - 150;
          const x = 900 + r("x") * 900 + Math.sin(g * (0.8 + r("f")) + i) * 40;
          return <ShiuliFlower key={i} x={x} y={y} r={7 + r("s") * 5} rot={g * (60 + r("rv") * 120) + r("r") * 360} />;
        })}
      </Full>
      <Motes count={40} seed="s7m" speed={16} size={2.4} />
      <Vignette strength={0.4} color="60,20,20" />
    </AbsoluteFill>
  );
};

/* ============ 8 · SHUBHO MAHALAYA (title overlay from HyperFrames) ============ */
const SceneTitle: React.FC = () => {
  const { g } = useG(S.title);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 65% 75% at 50% 36%, #ffd36a 0%, #f08a1c 26%, #b8360e 50%, #5a0c0a 75%, #1c0304 100%)" }} />
      <GodRays x="50%" y="36%" spread={360} count={44} opacity={0.35} color="255,236,180" seed="fin" spin={5} />
      <Full>
        <g transform={`translate(960 386) scale(${lerp(g, S.title - 0.3, S.logo + 0.3, 0.96, 1.03)})`}>
          <SunMandala r={205} rot={g * 7} />
        </g>
        <g transform={`translate(960 ${764 - lerp(g, S.title - 0.3, S.logo + 0.3, 0, 8)}) scale(0.95)`}>
          <Durga arms={10} eye={1} rim={1.1} t={g} halo={1} />
        </g>
      </Full>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, transparent 0%, transparent 66%, rgba(28,4,4,0.85) 74%, #1a0303 100%)" }} />
      <Petals count={36} seed="finp" speed={70} size={20} />
      <Motes count={40} seed="finm" speed={14} size={2.4} />
      <Vignette strength={0.5} />
    </AbsoluteFill>
  );
};

/** HyperFrames title overlay, rendered as an RGBA PNG sequence (hf/ → public/title/). */
const TitleFrames: React.FC = () => {
  const frame = useCurrentFrame();
  const n = Math.min(138, frame + 1);
  return <Img src={staticFile(`title/frame_${String(n).padStart(6, "0")}.png`)} style={{ position: "absolute", left: 0, top: 0, width: W, height: H }} />;
};

/* ============ 9 · TILTWAVE logo finale ============ */
const SceneLogo: React.FC = () => {
  const { g } = useG(S.logo);
  const d = g - S.logo;
  const gather = Math.min(1, d / 1.1);
  const e = 1 - Math.pow(1 - gather, 3);
  const draw = lerp(g, S.logo + 0.6, S.logo + 1.6, 0, 1);
  const letters = lerp(g, S.logo + 1.1, S.logo + 1.8, 0, 1);
  const shine = lerp(g, S.logo + 2.0, S.logo + 2.9, -0.15, 1.15);
  const lw = 420, lh = lw * 0.58;
  const pop = 1 + (1 - letters) * 0.08;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 60% at 50% 50%, #3a0c08 0%, #1a0405 55%, #070102 100%)" }}>
      <Glow x={960} y={540} r={520} color="rgba(255,190,90,0.28)" opacity={0.4 + letters * 0.6} />
      <AbsoluteFill style={{ mixBlendMode: "screen" }}>
        {new Array(90).fill(0).map((_, i) => {
          const r = (k: string) => random(`lg${k}${i}`);
          const per = 2 * (lw + lh);
          let p = r("p") * per;
          let tx: number, ty: number;
          if (p < lw) { tx = p; ty = 0; } else if ((p -= lw) < lh) { tx = lw; ty = p; } else if ((p -= lh) < lw) { tx = lw - p; ty = lh; } else { tx = 0; ty = lh - (p - lw); }
          tx += 960 - lw / 2; ty += 540 - lh / 2;
          const sx = r("x") * W, sy = r("y") * H;
          const x = sx + (tx - sx) * e, y = sy + (ty - sy) * e;
          const o = (1 - Math.max(0, (d - 1.3) / 0.6)) * 0.95;
          return <div key={i} style={{ position: "absolute", left: x - 2.5, top: y - 2.5, width: 5, height: 5, borderRadius: 3, background: "#ffe8b0", boxShadow: "0 0 10px 3px rgba(255,190,90,0.8)", opacity: Math.max(0, o) }} />;
        })}
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 960 - (lw + 20) / 2, top: 540 - (lh + 20) / 2, transform: `scale(${pop})`, filter: `drop-shadow(0 0 ${12 + letters * 10}px rgba(255,190,90,0.55))` }}>
        <TWLogo w={lw} draw={draw} letters={letters} shine={shine} stroke={5} />
      </div>
      <Petals count={18} seed="lgp" speed={50} size={16} opacity={0.6} />
      <Vignette strength={0.6} />
    </AbsoluteFill>
  );
};

/* ============ watermark: the TW mark, bottom-right, clear of the action ============ */
const Watermark: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const o = interpolate(t, [0.6, 1.4, S.title - 0.4, S.title], [0, 0.62, 0.62, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <div style={{ position: "absolute", right: 46, bottom: 38, opacity: o, filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.6))" }}>
      <TWLogo w={92} stroke={2.4} />
    </div>
  );
};

const Fade: React.FC<{ frames: number; children: React.ReactNode }> = ({ frames, children }) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: interpolate(frame, [0, frames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>{children}</AbsoluteFill>;
};

export const Story: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const flash = Math.max(
    pulse(t, [S.radio, S.village], 0.08) * 0.35,
    pulse(t, [S.goddess], 0.22) * 0.95, pulse(t, [S.battle], 0.1) * 0.5, pulse(t, [S.boat], 0.3), pulse(t, [S.demon], 0.1) * 0.5,
    pulse(t, [S.procession, S.elephant, S.dhak], 0.08) * 0.3, pulse(t, [S.logo], 0.18) * 0.7,
  );
  const black = interpolate(t, [47.1, 47.95], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const D = 12;
  const seq = (a: number, b: number, fadeIn: boolean, node: React.ReactNode) => {
    const from = f(a) - (fadeIn ? D / 2 : 0);
    return (
      <Sequence from={from} durationInFrames={f(b) + D / 2 - from}>
        {fadeIn ? <Fade frames={D}>{node}</Fade> : node}
      </Sequence>
    );
  };
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {seq(S.sun, S.radio, false, <SceneSunrise />)}
      {seq(S.radio, S.village, false, <SceneRadio />)}
      {seq(S.village, S.river, false, <SceneVillage />)}
      {seq(S.river, S.demon, true, <SceneRiver />)}
      {seq(S.demon, S.goddess, true, <SceneDemon />)}
      {seq(S.goddess, S.battle, false, <SceneGoddess />)}
      {seq(S.battle, S.boat, false, <SceneBattle />)}
      {seq(S.boat, S.procession, false, <SceneBoat />)}
      {seq(S.procession, S.elephant, false, <SceneProcession />)}
      {seq(S.elephant, S.dhak, false, <SceneElephant />)}
      {seq(S.dhak, S.shiuli, false, <SceneDhak />)}
      {seq(S.shiuli, S.title, true, <SceneShiuli />)}
      <Sequence from={f(S.title) - D / 2} durationInFrames={f(S.logo) + D - (f(S.title) - D / 2)}>
        <Fade frames={D}>
          <SceneTitle />
          <TitleFrames />
        </Fade>
      </Sequence>
      <Sequence from={f(S.logo)} durationInFrames={STORY_FRAMES - f(S.logo)}>
        <Fade frames={D}>
          <SceneLogo />
        </Fade>
      </Sequence>
      <Watermark />
      <AbsoluteFill style={{ background: "#fff6e2", opacity: flash, pointerEvents: "none" }} />
      <Grain opacity={0.05} />
      <AbsoluteFill style={{ background: "#000", opacity: black }} />
      <Audio src={staticFile("soundtrack_48s.wav")} />
    </AbsoluteFill>
  );
};
