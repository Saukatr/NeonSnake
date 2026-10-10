// "Shubho Mahalaya": an original animated film. The story and mood are inspired by the
// reference videos (dawn radio broadcast, the misty Ganga with the Howrah bridge, kash,
// the Goddess taking form against the sun, dhakis, the boat, shiuli flowers), but every
// frame is drawn here in code. No reference footage and no character-sheet imagery.
import React from "react";
import { AbsoluteFill, Audio, Img, Sequence, interpolate, random, staticFile, useCurrentFrame } from "remotion";
import { W, H, lerp, pulse, useT, Sky, Clouds, GodRays, Glow, Motes, Petals, Lightning, Ridge, Vignette, Grain } from "./fx";
import { Durga, HornedShadow, HowrahBridge, Kash, useKash, Radio, Hut, Palm, Dhaki, Boat, ShiuliTree, ShiuliFlower, Lotus, Diya, SunMandala } from "./art";

export const FPS = 24;
export const STORY_S = 44.5; // audio: 5 s quarter-sine fade 39.5 → 44.5
export const STORY_FRAMES = Math.round(STORY_S * FPS);
const f = (s: number) => Math.round(s * FPS);

const S = { s1: 0, s2: 6.676, dark: 11.981, s3: 13.038, s4: 15.476, s5: 21.792, s6: 30.012, s7: 36.722, fin: 39.0 };
const ARM_BEATS = [16.091, 16.44, 17.31, 17.636, 17.914, 18.355, 18.715, 19.4, 20.19, 20.561];
const CLASH = [24.892, 25.263, 25.67, 25.774, 26.958, 27.55, 28.34, 28.607, 29.559];
const DHAK = [30.337, 31.103, 31.544, 31.985, 33.263, 34.342, 35.376, 35.898, 36.037, 36.722];

const useG = (start: number) => {
  const { t, frame } = useT();
  return { t, g: t + start, frame };
};
const Full: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", left: 0, top: 0, overflow: "visible", ...style }}>
    {children}
  </svg>
);

/* ============ 1 · DAWN: the Mahalaya broadcast ============ */
const Scene1: React.FC = () => {
  const { t, g } = useG(S.s1);
  const push = lerp(g, 0, 7, 1.0, 1.09);
  const wave = pulse(g, [3.355, 3.82, 4.342, 4.598, 5.433], 0.25);
  return (
    <AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: "30% 72%" }}>
      <Sky stops="#1b1d4a 0%, #4a3570 28%, #c26a7a 52%, #f4a66a 72%, #ffd59a 88%" />
      <Glow x={1320} y={760 - g * 6} r={560} color="rgba(255,214,150,0.9)" />
      <Glow x={1320} y={760 - g * 6} r={110} color="rgba(255,248,226,1)" />
      <GodRays x="69%" y="70%" spread={160} count={26} opacity={0.45} seed="d1" />
      <Clouds color="#ffc6a8" opacity={0.5} speed={10} top={-40} height={560} />
      <Full>
        <Ridge seed="v1" base={820} amp={60} color="#6a4466" opacity={0.7} />
        <Palm x={1040} base={830} s={0.9} color="#3e2440" />
        <Palm x={1660} base={835} s={1.1} color="#3e2440" lean={-1} />
        <Palm x={1760} base={840} s={0.8} color="#3e2440" />
        <Hut x={1380} base={850} s={1.15} color="#3a2036" lit={0.6 + 0.4 * Math.min(1, g / 3)} />
        <Hut x={1150} base={845} s={0.6} color="#4a2a44" lit={0.5} />
        <Ridge seed="v2" base={900} amp={30} color="#2b1626" />
      </Full>
      <Clouds color="#ffe0c4" opacity={0.5} speed={22} top={700} height={300} tex="mist.png" />
      {/* foreground: the mud ledge with the radio */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, transparent 0%, transparent 78%, #6a3f26 78.2%, #4a2a18 100%)" }} />
      <Full>
        <defs>
          <linearGradient id="radioBody" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#d9a77a" />
            <stop offset="100%" stopColor="#9a6640" />
          </linearGradient>
        </defs>
        {/* golden sound waves of the broadcast */}
        <g transform="translate(470 728)" style={{ mixBlendMode: "screen" }}>
          {new Array(6).fill(0).map((_, k) => {
            const r = ((g * 110 + k * 95) % 570) + 40;
            const o = (1 - r / 610) * (0.55 + wave * 0.45);
            return <circle key={k} r={r} fill="none" stroke="#ffd47a" strokeWidth={3 + wave * 3} opacity={o} style={{ filter: "blur(1px)" }} />;
          })}
        </g>
        <g transform="translate(560 850)">
          <Radio t={g} glow={0.6 + wave * 0.4} />
        </g>
      </Full>
      <Motes count={50} seed="s1" speed={22} size={2.6} />
      <Vignette strength={0.5} />
    </AbsoluteFill>
  );
};

/* ============ 2 · THE MISTY GANGA ============ */
const Scene2: React.FC = () => {
  const { t, g } = useG(S.s2);
  const left = useKash("k2l", 34, [-60, 520], [380, 620]);
  const right = useKash("k2r", 34, [1400, 1980], [380, 620]);
  const pan = lerp(g, S.s2, S.s3, 0, -70);
  const dark = lerp(g, S.dark, S.s3, 0, 0.85);
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
        <Boat x={480 + g * 26} y={800} s={0.85} t={g} color="#3a2a3a" />
      </Full>
      <Clouds color="#fff2e2" opacity={0.8} speed={28} top={560} height={300} tex="mist.png" />
      <Full>
        <Kash stalks={left} base={1090} t={g} />
        <Kash stalks={right} base={1090} t={g} />
      </Full>
      <Clouds color="#fff0e4" opacity={0.45} speed={-20} top={800} height={300} tex="mist.png" offset={900} />
      {/* darkness creeps in */}
      <AbsoluteFill style={{ background: "linear-gradient(180deg, #08060e, #1b0d18 55%, #2a0d10)", opacity: dark * 0.8 }} />
      <Clouds color="#0e0810" opacity={dark} speed={90} top={-60} height={640} tex="clouds_b.png" />
      <Vignette strength={0.45 + dark * 0.3} />
    </AbsoluteFill>
  );
};

/* ============ 3 · DARKNESS RISES ============ */
const Scene3: React.FC = () => {
  const { t, g, frame } = useG(S.s3);
  const strikes = [13.514, 13.874, 14.652];
  const fl = pulse(g, strikes, 0.1);
  const sh = fl * 8;
  const grow = lerp(g, S.s3, S.s4, 0.7, 1.3);
  return (
    <AbsoluteFill style={{ transform: `translate(${Math.sin(frame * 2.7) * sh}px, ${Math.cos(frame * 3.1) * sh}px)` }}>
      <Sky stops="#05040a 0%, #140a14 40%, #2e0c10 75%, #4a1210 100%" />
      <Glow x={960} y={360} r={260} color="rgba(255,190,110,0.5)" opacity={lerp(g, S.s3, S.s4, 0.6, 0.05)} />
      <Clouds color="#170b14" opacity={0.95} speed={120} top={-60} height={700} tex="clouds_b.png" />
      <Clouds color="#251018" opacity={0.85} speed={70} top={160} height={600} tex="clouds_a.png" offset={600} />
      <Full>
        <g transform={`translate(960 560)`}>
          <g style={{ filter: `brightness(${1 + fl * 2.2})` }}>
            <HornedShadow t={g} s={grow} eyes={lerp(g, 13.4, 14.2, 0, 1)} />
          </g>
        </g>
        <Ridge seed="v3" base={1000} amp={90} color="#050304" rough={0.8} />
      </Full>
      <Lightning times={strikes} />
      <Motes count={60} seed="emb3" color="255,80,40" speed={60} size={2.2} />
      <Vignette strength={0.85} />
    </AbsoluteFill>
  );
};

/* ============ 4 · THE GODDESS TAKES FORM ============ */
const Scene4: React.FC = () => {
  const { t, g } = useG(S.s4);
  const burst = lerp(g, S.s4, S.s4 + 0.9, 0, 1);
  const rise = lerp(g, S.s4, S.s4 + 1.1, 520, 0);
  const arms = ARM_BEATS.reduce((acc, b) => acc + Math.max(0, Math.min(1, (g - b) / 0.45)), 0);
  const eye = lerp(g, 20.9, 21.5, 0, 1);
  const push = lerp(g, S.s4, S.s5, 1.0, 1.07);
  const armPulse = pulse(g, ARM_BEATS, 0.15);
  const ring = g - S.s4;
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
const Scene5: React.FC = () => {
  const { t, g, frame } = useG(S.s5);
  const front = lerp(g, S.s5, S.s6, 0.44, 0.66);
  const fx = front * W;
  const spark = pulse(g, CLASH, 0.12);
  const big = pulse(g, [26.958], 0.2);
  const charge = lerp(g, 27.063, S.s6, 0, 1);
  const push = lerp(g, 27.063, S.s6, 1.0, 1.12);
  const sh = spark * 7;
  const tip = { x: 470 + 154.6 * 0.95, y: 1040 - 714 * 0.95 };
  const C = { x: fx, y: 420 + Math.sin(g * 3) * 10 };
  return (
    <AbsoluteFill style={{ transform: `translate(${Math.sin(frame * 3.1) * sh}px, ${Math.cos(frame * 2.3) * sh}px) scale(${push})`, transformOrigin: "40% 45%" }}>
      <AbsoluteFill style={{ background: `linear-gradient(90deg, #ffd27a 0%, #f39a32 ${front * 100 - 18}%, #8a2a12 ${front * 100}%, #1a0710 ${front * 100 + 16}%, #07040a 100%)` }} />
      <AbsoluteFill style={{ WebkitMaskImage: `linear-gradient(90deg, transparent ${front * 100}%, #000 ${front * 100 + 12}%)`, maskImage: `linear-gradient(90deg, transparent ${front * 100}%, #000 ${front * 100 + 12}%)` }}>
        <Clouds color="#12070c" opacity={0.95} speed={110} top={-40} height={700} tex="clouds_b.png" />
        <Clouds color="#2a0c12" opacity={0.8} speed={60} top={300} height={600} tex="clouds_a.png" />
      </AbsoluteFill>
      <GodRays x="24%" y="30%" spread={200} opacity={0.5} color="255,230,170" seed="s5" spin={4} />
      <Full>
        <g transform="translate(1460 520)">
          <HornedShadow t={g} s={1.05 + spark * 0.05} eyes={1} />
        </g>
        {/* dark tendrils reaching for the light */}
        {new Array(5).fill(0).map((_, i) => {
          const y0 = 420 + (i - 2) * 70;
          const wob = Math.sin(g * 4 + i) * 30;
          return <path key={i} d={`M1380 ${y0} Q ${(1380 + C.x) / 2} ${y0 + wob} ${C.x + 10} ${C.y + (i - 2) * 8}`} stroke="#14060c" strokeWidth={22 - Math.abs(i - 2) * 5} fill="none" strokeLinecap="round" style={{ filter: "blur(3px)" }} />;
        })}
        {/* the beam of divine light from the trident */}
        <line x1={tip.x} y1={tip.y} x2={C.x} y2={C.y} stroke="rgba(255,230,160,0.55)" strokeWidth={60 + charge * 60} strokeLinecap="round" style={{ filter: "blur(20px)" }} />
        <line x1={tip.x} y1={tip.y} x2={C.x} y2={C.y} stroke="#fff6d6" strokeWidth={6 + charge * 8} strokeLinecap="round" />
        <circle cx={C.x} cy={C.y} r={60 + spark * 90 + big * 160} fill="rgba(255,244,210,0.9)" style={{ filter: "blur(26px)" }} />
        <g transform="translate(470 1040) scale(0.95)">
          <Durga arms={10} eye={1} rim={1.2 + charge} t={g} halo={0.8} />
        </g>
        <circle cx={tip.x} cy={tip.y} r={30 + charge * 70} fill="rgba(255,250,225,0.95)" style={{ filter: "blur(14px)" }} />
        {/* sparks at the clash */}
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

/* ============ 6 · MAA IS COMING HOME ============ */
const Scene6: React.FC = () => {
  const { t, g } = useG(S.s6);
  const front = useKash("k6f", 22, [-60, 300], [320, 520]);
  const front2 = useKash("k6g", 22, [1640, 1980], [320, 520]);
  const mid = useKash("k6m", 22, [-40, 1960], [110, 180]);
  const hit = pulse(g, DHAK, 0.12);
  const shatter = g - S.s6;
  return (
    <AbsoluteFill style={{ transform: `scale(${lerp(g, S.s6, S.s7 + 0.3, 1.06, 1.0)})` }}>
      <Sky stops="#7a8ac0 0%, #e8b0a0 34%, #ffcf8a 56%, #fff0c8 62%" />
      <Glow x={980} y={600 - shatter * 8} r={620} color="rgba(255,226,160,0.95)" />
      <Glow x={980} y={600 - shatter * 8} r={120} color="rgba(255,252,236,1)" />
      <GodRays x="51%" y="56%" spread={200} count={30} opacity={0.5} seed="s6" />
      <Clouds color="#ffe4c8" opacity={0.5} speed={10} top={0} height={500} />
      <Full>
        <HowrahBridge x0={1000} x1={1980} base={640} h={170} color="#8a6a7a" opacity={0.65} />
        <Palm x={260} base={650} s={0.7} color="#6a4a5a" />
        <Palm x={360} base={652} s={0.55} color="#6a4a5a" lean={-1} />
        <rect x={-100} y={640} width={W + 200} height={240} fill="url(#river6)" />
        <defs>
          <linearGradient id="river6" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffe2b0" />
            <stop offset="100%" stopColor="#c48a7a" />
          </linearGradient>
        </defs>
        <Boat x={260 + shatter * 40} y={735} s={0.7} t={g} color="#4a2a28" />
        <path d={`M-100 ${H} L -100 860 Q 500 830 960 850 Q 1500 870 2020 840 L 2020 ${H} Z`} fill="#3a2418" />
        <Kash stalks={mid} base={872} t={g} color="#fff6ea" stem="#6a5038" />
        {new Array(5).fill(0).map((_, i) => (
          <Dhaki key={i} x={-300 + i * 260 + shatter * 95} base={960} s={1.7} t={g} phase={i * 1.3} hit={hit} />
        ))}
        <Kash stalks={front} base={1090} t={g} />
        <Kash stalks={front2} base={1090} t={g} />
      </Full>
      {/* the darkness's last fragments turn to gold */}
      {shatter < 1.2 && (
        <AbsoluteFill style={{ mixBlendMode: "screen" }}>
          {new Array(70).fill(0).map((_, i) => {
            const a = random(`sh${i}`) * Math.PI * 2;
            const v = 200 + random(`sv${i}`) * 900;
            return <div key={i} style={{ position: "absolute", left: 1460 + Math.cos(a) * v * shatter, top: 520 + Math.sin(a) * v * shatter, width: 5, height: 5, borderRadius: 3, background: "#fff2c0", boxShadow: "0 0 12px 4px rgba(255,190,90,0.9)", opacity: 1 - shatter / 1.2 }} />;
          })}
        </AbsoluteFill>
      )}
      <Petals count={40} seed="s6p" speed={80} size={20} />
      <Motes count={40} seed="s6m" speed={18} size={2.4} />
      <Vignette strength={0.4} color="60,20,0" />
    </AbsoluteFill>
  );
};

/* ============ 7 · SHIULI FLOWERS, LOTUS AND DIYAS ============ */
const Scene7: React.FC = () => {
  const { t, g } = useG(S.s7);
  return (
    <AbsoluteFill style={{ transform: `scale(${lerp(g, S.s7 - 0.3, S.fin + 0.3, 1.0, 1.07)})`, transformOrigin: "60% 50%" }}>
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
          const y = ((r("y") * 1300 + (g - S.s7 + 2) * fall) % 1300) - 150;
          const x = 900 + r("x") * 900 + Math.sin(g * (0.8 + r("f")) + i) * 40;
          return <ShiuliFlower key={i} x={x} y={y} r={7 + r("s") * 5} rot={g * (60 + r("rv") * 120) + r("r") * 360} />;
        })}
      </Full>
      <Motes count={40} seed="s7m" speed={16} size={2.4} />
      <Vignette strength={0.4} color="60,20,20" />
    </AbsoluteFill>
  );
};

/* ============ FINAL · SHUBHO MAHALAYA (title overlay from HyperFrames) ============ */
const Final: React.FC = () => {
  const { t, g } = useG(S.fin);
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse 65% 75% at 50% 36%, #ffd36a 0%, #f08a1c 26%, #b8360e 50%, #5a0c0a 75%, #1c0304 100%)" }} />
      <GodRays x="50%" y="36%" spread={360} count={44} opacity={0.35} color="255,236,180" seed="fin" spin={5} />
      <Full>
        <g transform={`translate(960 386) scale(${lerp(g, S.fin - 0.3, STORY_S, 0.96, 1.04)})`}>
          <SunMandala r={205} rot={g * 7} />
        </g>
        <g transform={`translate(960 ${764 - lerp(g, S.fin - 0.3, STORY_S, 0, 10)}) scale(0.95)`}>
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

const Fade: React.FC<{ frames: number; children: React.ReactNode }> = ({ frames, children }) => {
  const frame = useCurrentFrame();
  return <AbsoluteFill style={{ opacity: interpolate(frame, [0, frames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }) }}>{children}</AbsoluteFill>;
};

export const Story: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const flash = Math.max(pulse(t, [S.s4], 0.22) * 0.95, pulse(t, [S.s5], 0.1) * 0.5, pulse(t, [S.s6], 0.3) * 1.0, pulse(t, [S.s3], 0.1) * 0.6);
  const black = interpolate(t, [43.35, 44.45], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
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
      {seq(S.s1, S.s2, false, <Scene1 />)}
      {seq(S.s2, S.s3, true, <Scene2 />)}
      {seq(S.s3, S.s4, false, <Scene3 />)}
      {seq(S.s4, S.s5, false, <Scene4 />)}
      {seq(S.s5, S.s6, false, <Scene5 />)}
      {seq(S.s6, S.s7, false, <Scene6 />)}
      {seq(S.s7, S.fin, true, <Scene7 />)}
      <Sequence from={f(S.fin) - D / 2} durationInFrames={STORY_FRAMES - f(S.fin) + D / 2}>
        <Fade frames={D}>
          <Final />
          <TitleFrames />
        </Fade>
      </Sequence>
      <AbsoluteFill style={{ background: "#fff6e2", opacity: flash, pointerEvents: "none" }} />
      <Grain opacity={0.05} />
      <AbsoluteFill style={{ background: "#000", opacity: black }} />
      <Audio src={staticFile("soundtrack_44s.wav")} />
    </AbsoluteFill>
  );
};
