import React from "react";
import { AbsoluteFill, interpolate, random } from "remotion";
import {
  W, H, ease, clamp, lerp, pulse, useT, Sky, Clouds, GodRays, Glow, Motes, Petals, Lightning, Mandala, Ridge, Temple,
  LightBeing, CloudBank, Cutout, TRIO, Vignette,
} from "./fx";
import { T, LIGHTNING, SPARKS } from "./timing";

/** Global time helper: scenes live inside <Sequence>, so local t + scene start = soundtrack time. */
const useG = (start: number) => {
  const { t, frame } = useT();
  return { t, g: t + start, frame };
};

/* Masked Durga + lion (Mahishasura faded into cloud below) */
const DurgaRising: React.FC<{ width: number; left: number; top: number; style?: React.CSSProperties; maskFrom?: number; maskTo?: number }> = ({
  width, left, top, style, maskFrom = 0.56, maskTo = 0.7,
}) => {
  const h = (width * TRIO.h) / TRIO.w;
  const m = `linear-gradient(180deg, #000 ${maskFrom * 100}%, transparent ${maskTo * 100}%)`;
  return (
    <div style={{ position: "absolute", left, top, width, height: h, WebkitMaskImage: m, maskImage: m, ...style }}>
      <Cutout src="durga_trio.png" style={{ left: 0, top: 0, width, height: h }} />
    </div>
  );
};

/* ================= SCENE 1 — THE SACRED BEGINNING ================= */
export const Scene1: React.FC = () => {
  const { t, frame } = useG(T.s1);
  const push = lerp(frame, 0, 170, 1.0, 1.16);
  const rise = lerp(frame, 0, 170, 40, -30);
  const sunUp = lerp(frame, 0, 170, 0.0, 1);
  return (
    <AbsoluteFill style={{ background: "#0b1030" }}>
      <AbsoluteFill style={{ transform: `scale(${push}) translateY(${rise}px)` }}>
        <Sky stops="#0d1a4a 0%, #2a2a6e 28%, #8a4a7a 52%, #e88b4a 72%, #ffd08a 86%, #ffe7b8 100%" />
        <Glow x={W / 2} y={760 - sunUp * 60} r={520} color="rgba(255,226,160,0.95)" opacity={0.6 + sunUp * 0.4} />
        <Glow x={W / 2} y={760 - sunUp * 60} r={140} color="rgba(255,250,230,1)" />
        <GodRays x="50%" y="66%" spread={170} count={30} opacity={0.35 + sunUp * 0.35} color="255,224,160" seed="s1" />
        <Clouds color="#f6c48c" opacity={0.55} speed={14} top={-60} height={620} tex="clouds_a.png" />
        <Clouds color="#7a4f8e" opacity={0.55} speed={22} top={120} height={520} tex="clouds_b.png" offset={700} />
        <Ridge seed="m1" base={860} amp={170} color="#4a3566" opacity={0.75} />
        <Temple x={420} base={900} h={300} color="#2c2048" />
        <Temple x={600} base={905} h={180} color="#2c2048" flag={false} />
        <Temple x={1480} base={900} h={340} color="#2c2048" />
        <Temple x={1290} base={905} h={170} color="#2c2048" flag={false} />
        <Ridge seed="m2" base={960} amp={90} color="#1d1532" />
        <Clouds color="#ffe2b8" opacity={0.45} speed={30} top={780} height={360} tex="mist.png" blur={4} />
        <Motes count={60} seed="s1m" speed={18} size={2.6} opacity={0.9} />
        <Petals count={14} seed="s1p" speed={55} size={20} />
      </AbsoluteFill>
      {/* lens glow */}
      <Glow x={W / 2 + Math.sin(t * 0.5) * 40} y={680} r={900} color="rgba(255,190,120,0.18)" />
      <Vignette strength={0.55} />
    </AbsoluteFill>
  );
};

/* ================= SCENE 2 — THE RISE OF MAHISHASURA ================= */
export const Scene2: React.FC = () => {
  const { t, g, frame } = useG(T.s2);
  const flash = pulse(g, LIGHTNING, 0.12);
  const quake = pulse(g, [8.615, 9.59, 9.822, 11.981], 0.1);
  const shake = quake * 9;
  const sx = Math.sin(frame * 2.7) * shake;
  const sy = Math.cos(frame * 3.3) * shake;
  const godsT = g - T.godsShot; // >0 → wide shot of the gods
  const onGods = godsT >= 0;
  const grow = lerp(frame, 0, 125, 0.96, 1.12);
  const demonW = 1280 * grow;
  const demonH = (demonW * 734) / 920;
  const dB = 0.32 + flash * 0.55;
  return (
    <AbsoluteFill style={{ background: "#05060f" }}>
      {!onGods ? (
        <AbsoluteFill style={{ transform: `translate(${sx}px,${sy}px)` }}>
          <Sky stops="#04050e 0%, #0b1430 40%, #1d1630 64%, #4a1414 82%, #6e1c10 100%" />
          <Clouds color="#1b2346" opacity={0.95} speed={70} top={-80} height={700} tex="clouds_a.png" />
          <Clouds color="#2c1424" opacity={0.85} speed={110} top={60} height={600} tex="clouds_b.png" offset={300} />
          <Glow x={W * 0.62} y={980} r={760} color="rgba(190,30,15,0.65)" />
          <Lightning times={LIGHTNING} />
          <Ridge seed="bf" base={1000} amp={120} color="#0a0608" rough={0.8} />
          {/* long shadow across the battlefield */}
          <div style={{ position: "absolute", left: 300, top: 930, width: 1500, height: 160, background: "radial-gradient(ellipse at 70% 30%, rgba(0,0,0,0.85), transparent 70%)", transform: `scaleX(${1 + lerp(frame, 0, 125, 0, 0.4)})` }} />
          {/* the demon — low angle, smouldering crimson rim */}
          <div style={{ position: "absolute", left: W / 2 - demonW * 0.44, top: H - demonH * 0.93, width: demonW, height: demonH }}>
            <Cutout src="mahishasura.png" style={{
              left: 0, top: 0, width: demonW, height: demonH,
              filter: `brightness(${dB}) contrast(1.25) saturate(0.7) drop-shadow(0 0 18px rgba(230,40,10,${0.55 + flash * 0.3})) drop-shadow(0 0 60px rgba(150,10,10,0.6))`,
            }} />
          </div>
          {/* ember rise */}
          <Motes count={80} seed="emb" color="255,90,40" speed={60} size={2.4} />
          <Clouds color="#120a10" opacity={0.9} speed={45} top={860} height={300} tex="mist.png" />
          <Vignette strength={0.85} />
        </AbsoluteFill>
      ) : (
        /* Wide: the gods watch the spreading darkness */
        <AbsoluteFill style={{ transform: `scale(${1.05 + godsT * 0.02}) translate(${sx * 0.4}px,${sy * 0.4}px)` }}>
          <Sky stops="#070a1e 0%, #141c44 45%, #2d2550 75%, #3a2236 100%" />
          <Clouds color="#2a3266" opacity={0.85} speed={40} top={-40} height={640} tex="clouds_b.png" />
          <Glow x={W / 2} y={540} r={700} color="rgba(120,140,255,0.15)" />
          <CloudBank y={830} color="rgba(120,120,190,0.9)" seed="gb" />
          {[{ x: 560, c: "#ffc861" }, { x: 960, c: "#7fa7ff" }, { x: 1360, c: "#f3f0ff" }].map((b, i) => {
            const wake = lerp(g, T.godsRealize, T.godsRealize + 0.4, 0.45, 1);
            return <LightBeing key={i} x={b.x} y={860} scale={i === 1 ? 1.15 : 1.0} color={b.c} intensity={wake} />;
          })}
          {/* the darkness creeping in from the edges */}
          <AbsoluteFill style={{ background: "radial-gradient(ellipse 60% 55% at 50% 55%, transparent 40%, rgba(20,0,10,0.9) 100%)" }} />
          <Clouds color="#120814" opacity={0.75} speed={90} top={700} height={420} tex="mist.png" />
          <Lightning times={[11.099 + 1.2]} />
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};

/* ================= SCENE 3 — THE CREATION OF MAA DURGA ================= */
export const Scene3: React.FC = () => {
  const { t, g, frame } = useG(T.s3);
  const pre = g < T.durgaBurst;
  const conv = lerp(g, T.s3, T.durgaBurst, 0, 1, ease); // beams converge
  const burst = pulse(g, [T.durgaBurst], 0.35);
  const appear = lerp(g, T.durgaBurst - 0.1, T.durgaBurst + 1.6, 0, 1);
  const roar = pulse(g, [T.lionRoar], 0.3);
  // camera: start low on the lion, slow tilt up to the crown
  const tilt = lerp(g, T.durgaBurst, T.s4, -170, 60);
  const zoom = lerp(g, T.durgaBurst, T.s4, 1.18, 1.0);
  const orbit = Math.sin((g - T.durgaBurst) * 0.55) * 9 * appear; // pseudo-orbit (rotateY)
  const dw = 940;
  const dh = (dw * TRIO.h) / TRIO.w;
  const dl = W / 2 - dw * 0.42;
  const dt = 70;
  const cx = W / 2, cy = 470;
  const sources = [
    { x: -40, y: 80, c: "255,200,90" },
    { x: 1960, y: 90, c: "140,170,255" },
    { x: 960, y: -120, c: "255,255,255" },
    { x: -60, y: 900, c: "255,70,50" },
    { x: 1980, y: 940, c: "255,70,50" },
  ];
  return (
    <AbsoluteFill style={{ background: "#120a24", perspective: 2200 }}>
      <Sky stops="#1a0f3a 0%, #4a2260 35%, #b0507a 62%, #f2a25a 85%, #ffd9a0 100%" style={{ opacity: 0.35 + appear * 0.65 }} />
      <Clouds color="#ffcf8a" opacity={0.35 + appear * 0.35} speed={18} top={-40} height={600} />
      <GodRays x="50%" y="40%" spread={360} count={48} opacity={0.15 + appear * 0.55} color="255,215,140" seed="s3" spin={8} />

      {/* converging divine energy */}
      <svg width={W} height={H} style={{ position: "absolute", mixBlendMode: "screen", opacity: pre ? 1 : Math.max(0, 1 - (g - T.durgaBurst) * 1.5) }}>
        {sources.map((s, i) => {
          const wob = Math.sin(t * 9 + i) * 3;
          const reach = 0.25 + conv * 0.75;
          const ex = s.x + (cx - s.x) * reach;
          const ey = s.y + (cy - s.y) * reach;
          const head = (t * 0.9 + i * 0.2) % 1;
          const hx = s.x + (ex - s.x) * head, hy = s.y + (ey - s.y) * head;
          return (
            <g key={i}>
              <line x1={s.x} y1={s.y} x2={ex} y2={ey + wob} stroke={`rgba(${s.c},0.5)`} strokeWidth={70} strokeLinecap="round" style={{ filter: "blur(26px)" }} />
              <line x1={s.x} y1={s.y} x2={ex} y2={ey + wob} stroke={`rgba(${s.c},0.8)`} strokeWidth={16} strokeLinecap="round" style={{ filter: "blur(5px)" }} />
              <line x1={s.x} y1={s.y} x2={ex} y2={ey + wob} stroke="rgba(255,255,255,0.95)" strokeWidth={3.5} strokeLinecap="round" />
              <circle cx={hx} cy={hy} r={26} fill="rgba(255,255,240,0.9)" style={{ filter: "blur(10px)" }} />
              <circle cx={s.x} cy={s.y} r={90 + Math.sin(t * 4 + i) * 10} fill={`rgba(${s.c},0.6)`} style={{ filter: "blur(24px)" }} />
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={30 + conv * 160} fill="rgba(255,240,200,0.85)" style={{ filter: `blur(${30 + conv * 30}px)` }} />
      </svg>

      {/* the Goddess */}
      <AbsoluteFill style={{ transform: `translateY(${-tilt}px) scale(${zoom})`, transformOrigin: "50% 40%" }}>
        <div style={{ position: "absolute", left: W / 2 - 480, top: dt + dh * TRIO.face[1] - 480, width: 960, height: 960, opacity: appear, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Glow x={480} y={480} r={480} color="rgba(255,214,130,0.9)" />
          <Mandala size={900} rot={(g - T.durgaBurst) * 10} opacity={0.85} />
        </div>
        <div style={{ position: "absolute", inset: 0, transform: `rotateY(${orbit}deg)`, transformStyle: "preserve-3d" }}>
          <DurgaRising width={dw} left={dl} top={dt} style={{
            opacity: appear,
            filter: `brightness(${1 + (1 - appear) * 2.2 + roar * 0.25}) blur(${(1 - appear) * 14}px) drop-shadow(0 0 ${20 + burst * 60}px rgba(255,210,120,0.7))`,
          }} />
          <Glow x={dl + dw * TRIO.lion[0]} y={dt + dh * TRIO.lion[1]} r={260} color="rgba(255,190,90,0.8)" opacity={roar * 0.9} />
        </div>
        <CloudBank y={dt + dh * 0.7} color="rgba(255,226,190,0.95)" seed="s3cb" opacity={appear} />
      </AbsoluteFill>

      {/* orbiting sparks: front layer */}
      <AbsoluteFill style={{ mixBlendMode: "screen", opacity: appear }}>
        {new Array(36).fill(0).map((_, i) => {
          const a = (i / 36) * Math.PI * 2 + (g - T.durgaBurst) * 0.7;
          const rx = 620 + random(`or${i}`) * 140;
          const x = W / 2 + Math.cos(a) * rx;
          const y = 520 + Math.sin(a) * 120 + (random(`oy${i}`) - 0.5) * 200;
          const front = Math.sin(a) > 0;
          const s = front ? 5 : 2.5;
          return <div key={i} style={{ position: "absolute", left: x, top: y, width: s, height: s, borderRadius: "50%", background: "#fff1c8", boxShadow: `0 0 ${s * 4}px ${s * 1.5}px rgba(255,210,120,0.8)`, opacity: front ? 1 : 0.5 }} />;
        })}
      </AbsoluteFill>
      <Motes count={70} seed="s3m" speed={30} size={3} opacity={0.4 + appear * 0.6} />
      <Petals count={18} seed="s3p" speed={70} size={22} opacity={appear} />
      <AbsoluteFill style={{ background: "#fff8e8", opacity: burst * 0.95 }} />
      <Vignette strength={0.5} />
    </AbsoluteFill>
  );
};

/* ================= SCENE 4 — THE DIVINE BATTLE ================= */
export const Scene4: React.FC = () => {
  const { t, g, frame } = useG(T.s4);
  const spark = pulse(g, SPARKS, 0.12);
  const impact = pulse(g, [T.s4, T.closeDurga, T.closeDemon, T.closeWeapons, T.clash], 0.08);
  const shake = impact * 10 + spark * 6;
  const sx = Math.sin(frame * 3.1) * shake;
  const sy = Math.cos(frame * 2.3) * shake;

  const dw = 860;
  const dh = (dw * TRIO.h) / TRIO.w;
  const demonW = 1100;
  const demonH = (demonW * 734) / 920;

  let shot: "wide" | "cuDurga" | "cuDemon" | "cuWeapons" | "two" = "wide";
  if (g >= T.twoShot) shot = "two";
  else if (g >= T.closeWeapons) shot = "cuWeapons";
  else if (g >= T.closeDemon) shot = "cuDemon";
  else if (g >= T.closeDurga) shot = "cuDurga";

  // charge: Durga rides in from the left
  const charge = lerp(g, T.s4, T.closeDurga, -720, 120, ease);
  const gallop = Math.abs(Math.sin(g * 7)) * -14;
  const twoAdvance = lerp(g, T.twoShot, T.strike, 120, 330, ease);
  const durgaX = shot === "two" ? twoAdvance : charge;
  const glowTrident = lerp(g, T.twoShot, T.strike, 0.2, 1);

  let cam = { s: 1, x: 0, y: 0 };
  if (shot === "wide") cam = { s: lerp(g, T.s4, T.closeDurga, 1.04, 1.1), x: lerp(g, T.s4, T.closeDurga, 60, -40), y: 0 };
  if (shot === "cuDurga") cam = { s: 2.3, x: -(durgaX + dw * TRIO.face[0] - W / 2) * 2.3 + 0, y: -(140 + dh * TRIO.face[1] - 420) * 2.3 };
  if (shot === "cuDemon") cam = { s: 1.9, x: -(1240 - W / 2) * 1.9, y: -(560 - 520) * 1.9 };
  if (shot === "cuWeapons") cam = { s: 1.7 + (g - T.closeWeapons) * 0.12, x: -(durgaX + dw * 0.32 - W / 2) * 1.7, y: -(140 + dh * 0.2 - 480) * 1.7 };
  if (shot === "two") cam = { s: lerp(g, T.twoShot, T.strike, 1.0, 1.14), x: lerp(g, T.twoShot, T.strike, 0, -80), y: 0 };

  // keep the frame covered: never translate further than the scaled overflow
  const mx = ((cam.s - 1) * W) / 2, my = ((cam.s - 1) * H) / 2;
  cam = { s: cam.s, x: Math.max(-mx, Math.min(mx, cam.x)), y: Math.max(-my, Math.min(my, cam.y)) };

  const slowmo = shot === "two" && g > 28.0 && g < 29.4; // brief slow motion beat
  const tipX = durgaX + dw * TRIO.tridentTip[0];
  const tipY = 140 + dh * TRIO.tridentTip[1];

  return (
    <AbsoluteFill style={{ background: "#1a0606", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `translate(${cam.x + sx}px,${cam.y + sy}px) scale(${cam.s})`, transformOrigin: "50% 50%" }}>
        <Sky stops="#1a0710 0%, #4a0f14 35%, #a8341a 65%, #f08a2a 88%, #ffc46a 100%" />
        <Clouds color="#2a0a0c" opacity={0.85} speed={slowmo ? 30 : 90} top={-60} height={620} tex="clouds_b.png" />
        <GodRays x="20%" y="20%" spread={140} opacity={0.35} color="255,200,120" seed="s4" />
        <Ridge seed="s4r" base={920} amp={110} color="#2a0b08" rough={0.8} />
        <Ridge seed="s4g" base={1010} amp={50} color="#140405" />
        {/* the demon awaits on the right */}
        <div style={{ position: "absolute", left: 1000, top: H - demonH + 40, width: demonW, height: demonH }}>
          <Cutout src="mahishasura.png" style={{ left: 0, top: 0, width: demonW, height: demonH, filter: `brightness(${0.62 + spark * 0.5}) contrast(1.15) saturate(0.85) drop-shadow(0 0 22px rgba(255,60,20,0.55))` }} />
        </div>
        {/* dust kicked up by the charging lion */}
        <Clouds color="#c8794a" opacity={0.5} speed={-200} top={760} height={340} tex="mist.png" blur={3} />
        {/* Maa Durga on her lion */}
        <div style={{ position: "absolute", left: 0, top: 0, width: W, height: H, transform: `translateY(${gallop}px)` }}>
          <Glow x={durgaX + dw * 0.4} y={140 + dh * 0.33} r={520} color="rgba(255,200,110,0.55)" />
          <DurgaRising width={dw} left={durgaX} top={140} maskFrom={0.6} maskTo={0.74}
            style={{ filter: `drop-shadow(0 0 22px rgba(255,200,120,0.6)) brightness(${1 + spark * 0.25})` }} />
          <Glow x={tipX} y={tipY} r={90 + glowTrident * 160} color="rgba(255,250,220,0.95)" opacity={glowTrident} />
        </div>
        <Clouds color="#3a120c" opacity={0.85} speed={60} top={880} height={260} tex="mist.png" />
        {/* sparks at the clash point */}
        <AbsoluteFill style={{ mixBlendMode: "screen" }}>
          {new Array(40).fill(0).map((_, i) => {
            const k = SPARKS.reduce((acc, s, j) => (g >= s ? j : acc), -1);
            if (k < 0) return null;
            const d = g - SPARKS[k];
            if (d > 0.7) return null;
            const a = random(`sa${k}${i}`) * Math.PI * 2;
            const v = 300 + random(`sv${k}${i}`) * 900;
            const ox = 1150, oy = 600;
            const x = ox + Math.cos(a) * v * d;
            const y = oy + Math.sin(a) * v * d + 400 * d * d;
            const o = 1 - d / 0.7;
            return <div key={i} style={{ position: "absolute", left: x, top: y, width: 4, height: 4, borderRadius: 2, background: "#fff2c0", boxShadow: "0 0 12px 4px rgba(255,170,60,0.9)", opacity: o }} />;
          })}
        </AbsoluteFill>
        <Motes count={90} seed="s4e" color="255,120,50" speed={slowmo ? 20 : 70} size={2.6} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: "#fff3d0", opacity: Math.max(spark * 0.55, impact * 0.35), mixBlendMode: "screen" }} />
      <Vignette strength={0.7} />
    </AbsoluteFill>
  );
};

/* ================= SCENE 5 — THE VICTORY OF LIGHT ================= */
export const Scene5: React.FC = () => {
  const { t, g, frame } = useG(T.strike);
  const clear = lerp(g, T.strike + 0.2, T.strike + 4.0, 0, 1);
  const pull = lerp(g, T.strike, T.bengal, 1.5, 1.0, ease);
  const flash = pulse(g, [T.strike], 0.25);
  const ring = g - T.strike;
  const bow = lerp(g, 32.6, 34.4, 0, 1);
  const dw = 640;
  const dh = (dw * TRIO.h) / TRIO.w;
  const dl = W / 2 - dw / 2;
  const dt = 150;
  return (
    <AbsoluteFill style={{ background: "#2a1408", overflow: "hidden" }}>
      <AbsoluteFill style={{ transform: `scale(${pull})`, transformOrigin: "50% 42%" }}>
        <Sky stops="#3a5aa8 0%, #9ab0d8 30%, #ffd9a0 62%, #ffb860 82%, #f59a40 100%" />
        <Sky stops="#140810 0%, #3a1018 50%, #5a1a12 100%" style={{ opacity: 1 - clear }} />
        <Glow x={W / 2} y={380} r={900} color="rgba(255,236,190,0.95)" opacity={0.3 + clear * 0.7} />
        <GodRays x="50%" y="30%" spread={360} count={46} opacity={0.2 + clear * 0.6} color="255,230,170" seed="s5" spin={5} />
        <Clouds color="#1e0a10" opacity={(1 - clear) * 0.95} speed={160} top={-80} height={700} tex="clouds_b.png" />
        <Clouds color="#fff0d8" opacity={clear * 0.6} speed={12} top={-40} height={520} />
        <Ridge seed="s5m" base={830} amp={200} color="#7a6aa0" opacity={0.55} />
        <Temple x={300} base={900} h={260} color="#5a4a78" style={{ opacity: 0.8 }} />
        <Temple x={1640} base={900} h={300} color="#5a4a78" style={{ opacity: 0.8 }} />
        <Ridge seed="s5n" base={940} amp={110} color="#3c2c4e" />
        <CloudBank y={300} color="rgba(255,244,226,0.9)" seed="s5l" opacity={clear} />
        {/* gods bow in gratitude */}
        {[{ x: 330, c: "#ffc861" }, { x: 1590, c: "#7fa7ff" }, { x: 1780, c: "#f3f0ff" }].map((b, i) => (
          <LightBeing key={i} x={b.x} y={420} scale={0.6} color={b.c} intensity={clear} bow={bow * (b.x > W / 2 ? -1 : 1)} />
        ))}
        <div style={{ position: "absolute", left: W / 2 - 520, top: dt + dh * 0.22 - 520, width: 1040, height: 1040, opacity: 0.4 + clear * 0.6 }}>
          <Glow x={520} y={520} r={520} color="rgba(255,226,150,0.9)" />
          <Mandala size={1000} rot={g * 8} opacity={0.7} />
        </div>
        <Cutout src="durga_trio.png" style={{ left: dl, top: dt, width: dw, height: dh, filter: `drop-shadow(0 0 30px rgba(255,214,140,0.75)) brightness(${1 + flash * 0.6})` }} />
        <Clouds color="#fff1dc" opacity={0.5 + clear * 0.3} speed={20} top={dt + dh - 240} height={360} tex="mist.png" />
        {/* shockwave of light at the decisive strike */}
        {ring < 1.2 && (
          <div style={{
            position: "absolute", left: dl + dw * TRIO.strike[0] - ring * 1400, top: dt + dh * TRIO.strike[1] - ring * 1400,
            width: ring * 2800, height: ring * 2800, borderRadius: "50%",
            border: `${30 * (1 - ring / 1.2)}px solid rgba(255,240,200,${0.8 * (1 - ring / 1.2)})`, filter: "blur(6px)", mixBlendMode: "screen",
          }} />
        )}
      </AbsoluteFill>
      <Petals count={70} seed="s5p" speed={85} size={24} opacity={clear} start={0} />
      <Motes count={70} seed="s5m" speed={22} size={3} opacity={0.5 + clear * 0.5} />
      <AbsoluteFill style={{ background: "#fffaf0", opacity: flash }} />
      <Vignette strength={0.45} color="60,20,0" />
    </AbsoluteFill>
  );
};
