// Original vector artwork for the Mahalaya film ("papercut silhouettes at dawn").
// Everything here is drawn in code. No footage or character-sheet imagery is used.
import React, { useMemo } from "react";
import { random } from "remotion";

const GOLD = "#f4c35a";
const GOLD_D = "#b9852a";
export const INK = "#2b0b09";

const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const backOut = (x: number) => {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const c = 1.9;
  return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2);
};

/* ---------------- weapons (drawn upright, hand at 0,0) ---------------- */
const Weapon: React.FC<{ kind: string }> = ({ kind }) => {
  const st = { fill: GOLD, stroke: GOLD_D, strokeWidth: 1.5 };
  switch (kind) {
    case "trident":
      return (
        <g {...st}>
          <rect x={-3} y={-150} width={6} height={260} />
          <path d="M-30 -150 Q -30 -190 -22 -205 L -16 -160 L 16 -160 L 22 -205 Q 30 -190 30 -150 Z" />
          <path d="M-5 -150 L 0 -222 L 5 -150 Z" />
        </g>
      );
    case "sword":
      return (
        <g {...st}>
          <path d="M-5 -10 L -8 -150 L 0 -175 L 8 -150 L 5 -10 Z" fill="#f6efe0" />
          <rect x={-18} y={-12} width={36} height={6} rx={3} />
        </g>
      );
    case "chakra":
      return (
        <g transform="translate(0 -40)">
          <circle r={30} fill="none" stroke={GOLD} strokeWidth={6} />
          {new Array(8).fill(0).map((_, i) => (
            <line key={i} x1={0} y1={0} x2={30 * Math.cos((i * Math.PI) / 4)} y2={30 * Math.sin((i * Math.PI) / 4)} stroke={GOLD} strokeWidth={3} />
          ))}
          <circle r={7} fill={GOLD} />
        </g>
      );
    case "conch":
      return <path transform="translate(0 -30)" d="M-14 18 C -26 -6 -12 -36 6 -40 C 22 -30 22 -6 10 10 C 4 20 -6 24 -14 18 Z M 6 -40 L 14 -50" fill="#fff6e8" stroke={GOLD_D} strokeWidth={2} />;
    case "bow":
      return (
        <g transform="translate(0 -20)">
          <path d="M-6 -90 Q 40 0 -6 90" fill="none" stroke={GOLD} strokeWidth={6} />
          <line x1={-6} y1={-90} x2={-6} y2={90} stroke="#fff3d6" strokeWidth={1.5} />
        </g>
      );
    case "lotus":
      return (
        <g transform="translate(0 -36)">
          {[-50, -25, 0, 25, 50].map((a) => (
            <path key={a} transform={`rotate(${a})`} d="M0 10 C -10 -6 -8 -24 0 -32 C 8 -24 10 -6 0 10 Z" fill="#f38bb0" stroke="#c9507c" strokeWidth={1} />
          ))}
          <rect x={-2} y={8} width={4} height={34} fill="#5b8a3a" />
        </g>
      );
    case "mace":
      return (
        <g {...st}>
          <rect x={-3} y={-110} width={6} height={130} />
          <ellipse cx={0} cy={-124} rx={18} ry={24} />
        </g>
      );
    case "spear":
      return (
        <g {...st}>
          <rect x={-2.5} y={-170} width={5} height={210} />
          <path d="M-9 -168 L 0 -205 L 9 -168 Z" />
        </g>
      );
    case "shield":
      return (
        <g transform="translate(0 -26)">
          <circle r={32} fill={GOLD_D} stroke={GOLD} strokeWidth={4} />
          <circle r={9} fill={GOLD} />
        </g>
      );
    case "bell":
      return <path transform="translate(0 -30)" d="M-16 18 C -16 -10 -10 -24 0 -26 C 10 -24 16 -10 16 18 Z M -3 -26 L 3 -26 L 0 -34 Z" {...st} />;
    default:
      return null;
  }
};

/* ---------------- Maa Durga, papercut silhouette with ten arms ----------------
   Origin at her feet; she stands ~600 units tall. `arms` 0..10 reveals arms in order. */
const ARMS: { side: 1 | -1; ang: number; len: number; w: string }[] = [
  { side: 1, ang: -58, len: 205, w: "trident" },
  { side: -1, ang: -58, len: 205, w: "sword" },
  { side: 1, ang: -30, len: 215, w: "chakra" },
  { side: -1, ang: -30, len: 215, w: "conch" },
  { side: 1, ang: -4, len: 220, w: "bow" },
  { side: -1, ang: -4, len: 220, w: "mace" },
  { side: 1, ang: 22, len: 210, w: "lotus" },
  { side: -1, ang: 22, len: 210, w: "spear" },
  { side: 1, ang: 48, len: 195, w: "shield" },
  { side: -1, ang: 48, len: 195, w: "bell" },
];

export const Durga: React.FC<{ arms?: number; eye?: number; rim?: number; fill?: string; halo?: number; t?: number }> = ({
  arms = 10, eye = 0, rim = 1, fill = INK, halo = 0, t = 0,
}) => {
  const sway = Math.sin(t * 1.3) * 1.2;
  return (
    <g>
      {halo > 0 && (
        <g opacity={halo}>
          <circle cx={0} cy={-404} r={150} fill="none" stroke={GOLD} strokeWidth={3} />
          <circle cx={0} cy={-404} r={165} fill="none" stroke={GOLD} strokeWidth={1} strokeDasharray="2 8" />
        </g>
      )}
      <g style={{ filter: `drop-shadow(0 0 ${6 * rim}px rgba(255,200,110,${0.9 * rim}))` }}>
        {/* arms behind the body */}
        {ARMS.map((a, i) => {
          const p = Math.max(0, Math.min(1, arms - i));
          if (p <= 0) return null;
          const grow = ease(p * 1.4);
          const pop = backOut(Math.max(0, p * 1.6 - 0.6));
          const ang = a.side === 1 ? a.ang + sway * (i % 2 ? 1 : -1) : 180 - a.ang - sway * (i % 2 ? 1 : -1);
          const sx = a.side * 46;
          const L = a.len * grow;
          return (
            <g key={i} transform={`translate(${sx} -318) rotate(${ang})`}>
              <path d={`M0 -10 C ${L * 0.5} -9 ${L * 0.8} -7 ${L} -6 L ${L} 6 C ${L * 0.8} 7 ${L * 0.5} 9 0 10 Z`} fill={fill} />
              <rect x={L * 0.62} y={-8} width={7} height={16} fill={GOLD} opacity={grow} />
              <rect x={L * 0.7} y={-7.5} width={4} height={15} fill={GOLD} opacity={grow} />
              <g transform={`translate(${L} 0) rotate(${-ang}) scale(${pop})`}>
                <circle r={9} fill={fill} />
                <Weapon kind={a.w} />
              </g>
            </g>
          );
        })}
        {/* hair */}
        <path d="M-36 -402 C -80 -380 -92 -300 -104 -210 C -70 -236 -52 -290 -38 -336 Z M36 -402 C 80 -380 92 -300 104 -210 C 70 -236 52 -290 38 -336 Z" fill={fill} />
        {/* sari */}
        <path d="M-50 -338 C -80 -272 -98 -182 -120 -92 C -142 -12 -170 -6 -198 0 L 198 0 C 170 -6 142 -12 120 -92 C 98 -182 80 -272 50 -338 Z" fill={fill} />
        <path d="M-58 -330 C 10 -300 70 -240 136 -120 C 120 -170 92 -250 54 -332 Z" fill="#4a120e" />
        <path d="M-198 0 L 198 0 L 190 -18 C 120 -12 -120 -12 -190 -18 Z" fill={GOLD} opacity={0.9} />
        {[-110, -70, -30, 10, 50, 90].map((x) => (
          <path key={x} d={`M${x * 0.35} -150 Q ${x * 0.8} -70 ${x * 1.25} -4`} stroke="#5a1813" strokeWidth={3} fill="none" />
        ))}
        <path d="M-60 -250 Q 0 -232 60 -250" stroke={GOLD} strokeWidth={5} fill="none" />
        {/* neck + head */}
        <rect x={-13} y={-366} width={26} height={34} fill={fill} />
        <path d="M-44 -332 Q 0 -300 44 -332" stroke={GOLD} strokeWidth={4} fill="none" />
        {/* chalchitra-style mukut: a wide fan of gold behind and above the head */}
        <g>
          <path d="M-96 -404 A 96 96 0 0 1 96 -404 Z" fill={fill} stroke={GOLD} strokeWidth={4} />
          <path d="M-74 -404 A 74 74 0 0 1 74 -404" fill="none" stroke={GOLD} strokeWidth={2.5} />
          <path d="M-52 -404 A 52 52 0 0 1 52 -404" fill="none" stroke={GOLD} strokeWidth={2} strokeDasharray="3 5" />
          {new Array(13).fill(0).map((_, k) => {
            const a2 = Math.PI + (k / 12) * Math.PI;
            const x1 = Math.cos(a2) * 96, y1 = -404 + Math.sin(a2) * 96;
            const x2 = Math.cos(a2) * 122, y2 = -404 + Math.sin(a2) * 122;
            const pa = Math.cos(a2 + 0.08) * 100, pb = -404 + Math.sin(a2 + 0.08) * 100;
            const pc = Math.cos(a2 - 0.08) * 100, pd = -404 + Math.sin(a2 - 0.08) * 100;
            return <path key={k} d={`M${pa} ${pb} L ${x2} ${y2} L ${pc} ${pd} Z`} fill={GOLD} />;
          })}
          {new Array(7).fill(0).map((_, k) => {
            const a2 = Math.PI + ((k + 0.5) / 7) * Math.PI;
            return <circle key={k} cx={Math.cos(a2) * 85} cy={-404 + Math.sin(a2) * 85} r={4.5} fill={GOLD} />;
          })}
          <path d="M-10 -500 L 0 -540 L 10 -500 Z" fill={GOLD} />
          <circle cx={0} cy={-546} r={6} fill={GOLD} />
        </g>
        {/* face, a shade lighter than the silhouette, with a gold tikli */}
        <ellipse cx={0} cy={-392} rx={32} ry={39} fill="#4c1510" />
        <path d="M-34 -404 Q 0 -446 34 -404 Q 30 -430 0 -436 Q -30 -430 -34 -404 Z" fill={fill} />
        <path d="M-30 -418 Q 0 -432 30 -418" stroke={GOLD} strokeWidth={3} fill="none" />
        <circle cx={0} cy={-419} r={3.5} fill={GOLD} />
        <path d="M-16 -392 Q -10 -396 -4 -392 M 4 -392 Q 10 -396 16 -392" stroke={GOLD} strokeWidth={1.6} fill="none" opacity={0.85} />
        {/* earrings */}
        <circle cx={-34} cy={-376} r={7} fill={GOLD} />
        <circle cx={34} cy={-376} r={7} fill={GOLD} />
      </g>
      {/* third eye */}
      {eye > 0 && (
        <g opacity={eye}>
          <ellipse cx={0} cy={-406} rx={14 * eye} ry={22 * eye} fill="rgba(255,90,40,0.45)" style={{ filter: "blur(6px)" }} />
          <ellipse cx={0} cy={-406} rx={2.6} ry={6} fill="#ff5a2a" />
        </g>
      )}
    </g>
  );
};

/* ---------------- the horned shadow of darkness ---------------- */
export const HornedShadow: React.FC<{ t: number; s?: number; eyes?: number; break?: number }> = ({ t, s = 1, eyes = 1, break: brk = 0 }) => {
  const breathe = 1 + Math.sin(t * 2.2) * 0.02;
  const op = 1 - brk;
  return (
    <g transform={`scale(${s * breathe})`} opacity={op}>
      <g style={{ filter: "blur(14px)" }}>
        {new Array(9).fill(0).map((_, i) => {
          const a = (i / 9) * Math.PI * 2 + t * 0.3;
          return <ellipse key={i} cx={Math.cos(a) * 110} cy={60 + Math.sin(a) * 60} rx={170} ry={120} fill="#0b0406" opacity={0.85} />;
        })}
      </g>
      <path d="M-70 -40 C -160 -60 -250 -150 -230 -270 C -210 -190 -150 -130 -60 -100 Z M70 -40 C 160 -60 250 -150 230 -270 C 210 -190 150 -130 60 -100 Z" fill="#100507" style={{ filter: "blur(1.5px)" }} />
      <ellipse cx={0} cy={-10} rx={110} ry={130} fill="#0c0406" style={{ filter: "blur(3px)" }} />
      <g opacity={eyes}>
        {[-42, 42].map((x) => (
          <g key={x}>
            <ellipse cx={x} cy={-30} rx={30} ry={14} fill="rgba(255,40,20,0.45)" style={{ filter: "blur(8px)" }} />
            <path d={`M${x - 20} -34 Q ${x} -42 ${x + 20} -30 Q ${x} -24 ${x - 20} -34 Z`} fill="#ff4a1c" />
          </g>
        ))}
      </g>
    </g>
  );
};

/* ---------------- Howrah bridge silhouette ---------------- */
export const HowrahBridge: React.FC<{ x0: number; x1: number; base: number; h: number; color: string; opacity?: number }> = ({ x0, x1, base, h, color, opacity = 1 }) => {
  const span = x1 - x0;
  const ta = x0 + span * 0.24;
  const tb = x0 + span * 0.76;
  const deck = base - h * 0.16;
  const top = (x: number) => {
    if (x <= ta) return deck - (h * 0.84) * ((x - x0) / (ta - x0)) * 0.95 - h * 0.04;
    if (x >= tb) return deck - (h * 0.84) * ((x1 - x) / (x1 - tb)) * 0.95 - h * 0.04;
    const u = (x - ta) / (tb - ta);
    return base - h + h * 0.42 * Math.sin(u * Math.PI);
  };
  const xs: number[] = [];
  for (let x = x0; x <= x1 + 0.1; x += span / 48) xs.push(x);
  const topD = xs.map((x, i) => `${i ? "L" : "M"}${x.toFixed(1)} ${top(x).toFixed(1)}`).join(" ");
  const lattice = xs.slice(0, -1).map((x, i) => {
    const xn = xs[i + 1];
    return `M${x} ${deck} L ${x} ${top(x)} M ${x} ${top(x)} L ${xn} ${deck}`;
  }).join(" ");
  return (
    <g opacity={opacity} stroke={color} fill="none">
      <path d={topD} strokeWidth={4} />
      <path d={`M${x0 - 40} ${deck} L ${x1 + 40} ${deck}`} strokeWidth={6} />
      <path d={lattice} strokeWidth={1.4} />
      {[ta, tb].map((x) => (
        <path key={x} d={`M${x - 16} ${base} L ${x - 6} ${base - h - 6} L ${x + 6} ${base - h - 6} L ${x + 16} ${base} Z`} fill={color} />
      ))}
    </g>
  );
};

/* ---------------- kash flowers (Saccharum spontaneum) ---------------- */
type Stalk = { x: number; h: number; lean: number; per: number; amp: number; ph: number; d: string; plume: string };
export const useKash = (seed: string, n: number, xr: [number, number], hr: [number, number]) =>
  useMemo<Stalk[]>(() => {
    const out: Stalk[] = [];
    for (let i = 0; i < n; i++) {
      const r = (k: string) => random(`${seed}${k}${i}`);
      const h = hr[0] + r("h") * (hr[1] - hr[0]);
      const lean = (r("l") - 0.5) * 30;
      const py = -h * 0.66;
      let plume = "";
      for (let k = 0; k < 40; k++) {
        const u = k / 40;
        const yy = py - u * h * 0.32;
        const xx = lean + lean * 0.5 * u * u;
        const sp = 3 + Math.sin(Math.min(1, u * 1.3) * Math.PI) * 12;
        const dr = 10 + r(`d${k}`) * 10;
        plume += `M${xx.toFixed(1)} ${yy.toFixed(1)} q ${(-sp * 0.6).toFixed(1)} -3 ${(-sp).toFixed(1)} ${(-dr).toFixed(1)} M${xx.toFixed(1)} ${yy.toFixed(1)} q ${(sp * 0.6).toFixed(1)} -3 ${sp.toFixed(1)} ${(-dr).toFixed(1)} `;
      }
      out.push({
        x: xr[0] + r("x") * (xr[1] - xr[0]), h, lean, per: 1.4 + r("p") * 1.0, amp: 2.5 + r("a") * 3.5, ph: r("ph") * 6.28,
        d: `M0 0 Q ${lean * 0.3} ${-h * 0.35} ${lean} ${py}`, plume,
      });
    }
    return out;
  }, [seed, n, xr[0], xr[1], hr[0], hr[1]]);

export const Kash: React.FC<{ stalks: Stalk[]; base: number; t: number; color?: string; stem?: string; wind?: number; blur?: number }> = ({
  stalks, base, t, color = "#fbf5ea", stem = "#5e4a34", wind = 1, blur = 0,
}) => (
  <g style={blur ? { filter: `blur(${blur}px)` } : undefined}>
    {stalks.map((s, i) => (
      <g key={i} transform={`translate(${s.x} ${base}) rotate(${Math.sin(t * (6.283 / s.per) + s.ph) * s.amp * wind + wind * 2})`}>
        <path d={s.d} stroke={stem} strokeWidth={2.2} fill="none" />
        <path d={s.plume} stroke={color} strokeWidth={1.2} strokeLinecap="round" fill="none" opacity={0.75} />
      </g>
    ))}
  </g>
);

/* ---------------- vintage valve radio ---------------- */
export const Radio: React.FC<{ t: number; glow?: number }> = ({ t, glow = 1 }) => {
  const needle = 40 + Math.min(1, t / 2.2) * 120;
  return (
    <g>
      <path d="M-120 -230 Q 0 -330 120 -230" stroke="#5a3520" strokeWidth={12} fill="none" strokeLinecap="round" />
      <line x1={110} y1={-228} x2={190} y2={-410} stroke="#3a2416" strokeWidth={4} />
      <circle cx={190} cy={-410} r={6} fill="#3a2416" />
      <rect x={-200} y={-240} width={400} height={240} rx={34} fill="url(#radioBody)" stroke="#4a2a18" strokeWidth={4} />
      <circle cx={-90} cy={-120} r={78} fill="#4a2e1c" />
      {new Array(7).fill(0).map((_, i) => (
        <circle key={i} cx={-90} cy={-120} r={70 - i * 10} fill="none" stroke="#6e4a30" strokeWidth={2.5} />
      ))}
      <rect x={10} y={-200} width={160} height={58} rx={10} fill={`rgba(255,${200 + 30 * glow},${120 + 40 * glow},${0.55 + 0.45 * glow})`} stroke="#4a2a18" strokeWidth={3} />
      {new Array(9).fill(0).map((_, i) => (
        <line key={i} x1={24 + i * 16} y1={-192} x2={24 + i * 16} y2={i % 2 ? -182 : -176} stroke="#6a3a18" strokeWidth={1.5} />
      ))}
      <line x1={10 + needle} y1={-198} x2={10 + needle} y2={-146} stroke="#a3200e" strokeWidth={3} />
      {[50, 130].map((x, i) => (
        <g key={x} transform={`translate(${x} -80) rotate(${i === 1 ? Math.min(1, t / 2.2) * 140 : 0})`}>
          <circle r={26} fill="#3a2416" stroke="#8a5a36" strokeWidth={3} />
          <line x1={0} y1={0} x2={0} y2={-20} stroke={GOLD} strokeWidth={3} />
        </g>
      ))}
    </g>
  );
};

/* ---------------- Bengali village hut (chala roof) ---------------- */
export const Hut: React.FC<{ x: number; base: number; s: number; color: string; lit?: number }> = ({ x, base, s, color, lit = 1 }) => (
  <g transform={`translate(${x} ${base}) scale(${s})`}>
    <rect x={-120} y={-130} width={240} height={130} fill={color} />
    <path d="M-170 -118 Q 0 -150 170 -118 L 110 -220 Q 0 -240 -110 -220 Z" fill={color} />
    <rect x={-22} y={-86} width={44} height={86} fill={`rgba(255,190,90,${0.85 * lit})`} />
    <rect x={-92} y={-96} width={40} height={36} fill={`rgba(255,200,110,${0.8 * lit})`} />
    <rect x={52} y={-96} width={40} height={36} fill={`rgba(255,200,110,${0.8 * lit})`} />
    <path d="M-72 -96 L -72 -60 M 72 -96 L 72 -60" stroke={color} strokeWidth={3} />
  </g>
);

export const Palm: React.FC<{ x: number; base: number; s: number; color: string; lean?: number }> = ({ x, base, s, color, lean = 1 }) => {
  const h = 260 * s;
  const tx = x + 30 * s * lean;
  const ty = base - h;
  return (
    <g stroke={color} fill="none" strokeLinecap="round">
      <path d={`M${x} ${base} Q ${x + 6 * lean} ${base - h * 0.5} ${tx} ${ty}`} strokeWidth={8 * s} />
      {new Array(10).fill(0).map((_, k) => {
        const a = (k / 10) * Math.PI * 2 + 0.2;
        const ex = tx + Math.cos(a) * 95 * s;
        const ey = ty + Math.sin(a) * 40 * s + 34 * s;
        return <path key={k} d={`M${tx} ${ty} Q ${(tx + ex) / 2} ${Math.min(ty, ey) - 30 * s} ${ex} ${ey}`} strokeWidth={6 * s} />;
      })}
    </g>
  );
};

/* ---------------- dhaki (drummer) with plumed dhak ---------------- */
export const Dhaki: React.FC<{ x: number; base: number; s: number; t: number; phase: number; hit: number; color?: string }> = ({
  x, base, s, t, phase, hit, color = "#24110d",
}) => {
  const w = Math.sin(t * 6 + phase);
  const bob = Math.abs(Math.cos(t * 6 + phase)) * -5;
  return (
    <g transform={`translate(${x} ${base + bob}) scale(${s})`}>
      <g transform="translate(0 -78)">
        <rect x={-6} y={0} width={12} height={78} rx={6} fill={color} transform={`rotate(${w * 20})`} />
        <rect x={-6} y={0} width={12} height={78} rx={6} fill={color} transform={`rotate(${-w * 20})`} />
      </g>
      <path d="M-26 -78 L 26 -78 L 20 -150 L -20 -150 Z" fill={color} />
      <path d="M-30 -60 Q 0 -50 30 -60 L 24 -98 L -24 -98 Z" fill="#f2e6d0" opacity={0.9} />
      <circle cx={0} cy={-166} r={15} fill={color} />
      <path d="M-15 -172 Q 0 -182 15 -172" stroke="#f2e6d0" strokeWidth={5} fill="none" />
      {/* dhak drum + palok plume */}
      <g transform="translate(34 -118)">
        <ellipse cx={0} cy={0} rx={44} ry={28} fill="#5a1d12" />
        <ellipse cx={-42} cy={0} rx={7} ry={27} fill="#e9dcc0" />
        <ellipse cx={42} cy={0} rx={7} ry={27} fill="#e9dcc0" />
        {[-24, -8, 8, 24].map((dx) => <line key={dx} x1={dx - 6} y1={-26} x2={dx + 6} y2={26} stroke={GOLD_D} strokeWidth={2} />)}
        {new Array(9).fill(0).map((_, k) => {
          const a = -Math.PI / 2 + (k - 4) * 0.17 + Math.sin(t * 3 + k) * 0.05;
          return <path key={k} d={`M0 -26 Q ${Math.cos(a) * 40} ${-26 + Math.sin(a) * 60} ${Math.cos(a) * 66} ${-26 + Math.sin(a) * 104}`} stroke="#fffaf0" strokeWidth={6} fill="none" strokeLinecap="round" opacity={0.92} />;
        })}
      </g>
      <g transform={`translate(18 -140) rotate(${-40 + hit * 50})`}>
        <rect x={0} y={-5} width={46} height={10} rx={5} fill={color} />
        <rect x={40} y={-2} width={40} height={4} fill="#d8c08a" />
      </g>
    </g>
  );
};

/* ---------------- boat with a small pratima ---------------- */
export const Boat: React.FC<{ x: number; y: number; s: number; t: number; color?: string }> = ({ x, y, s, t, color = "#2a140f" }) => (
  <g transform={`translate(${x} ${y + Math.sin(t * 1.6) * 3}) rotate(${Math.sin(t * 1.2) * 1.5}) scale(${s})`}>
    <path d="M-220 -10 Q 0 40 220 -10 L 190 18 Q 0 60 -190 18 Z" fill={color} />
    <path d="M-150 -6 Q 0 -60 150 -6 Z" fill="#3c1c14" />
    <g transform="translate(0 -14) scale(0.22)">
      <Durga arms={10} rim={1.5} t={t} halo={0.9} />
    </g>
    <g transform="translate(170 -12)">
      <circle cx={0} cy={-92} r={10} fill={color} />
      <path d="M-12 -80 L 12 -80 L 10 -20 L -10 -20 Z" fill={color} />
      <line x1={-40} y1={-140} x2={30} y2={40} stroke={color} strokeWidth={4} />
    </g>
  </g>
);

/* ---------------- shiuli (night jasmine) tree ---------------- */
export const ShiuliTree: React.FC<{ x: number; base: number; s: number; color: string; leaf: string; t: number }> = ({ x, base, s, color, leaf, t }) => {
  const parts = useMemo(() => {
    const br: string[] = [];
    const leaves: { x: number; y: number; r: number }[] = [];
    const grow = (x0: number, y0: number, ang: number, len: number, w: number, d: number, id: string) => {
      const x1 = x0 + Math.cos(ang) * len;
      const y1 = y0 + Math.sin(ang) * len;
      br.push(`${x0.toFixed(1)},${y0.toFixed(1)},${x1.toFixed(1)},${y1.toFixed(1)},${w.toFixed(1)}`);
      if (d >= 6) {
        for (let k = 0; k < 14; k++) leaves.push({ x: x1 + (random(`${id}lx${k}`) - 0.5) * 90, y: y1 + (random(`${id}ly${k}`) - 0.5) * 64, r: 7 + random(`${id}lr${k}`) * 11 });
        return;
      }
      const n = 2;
      for (let k = 0; k < n; k++) {
        const da = (k === 0 ? -1 : 1) * (0.3 + random(`${id}a${k}`) * 0.35);
        grow(x1, y1, ang + da, len * (0.72 + random(`${id}l${k}`) * 0.12), w * 0.68, d + 1, `${id}${k}`);
      }
    };
    grow(0, 0, -Math.PI / 2, 150, 34, 0, "st");
    return { br, leaves };
  }, []);
  const sway = Math.sin(t * 0.8) * 0.6;
  return (
    <g transform={`translate(${x} ${base}) scale(${s}) rotate(${sway})`}>
      {parts.br.map((b, i) => {
        const [x0, y0, x1, y1, w] = b.split(",").map(Number);
        return <line key={i} x1={x0} y1={y0} x2={x1} y2={y1} stroke={color} strokeWidth={w} strokeLinecap="round" />;
      })}
      {parts.leaves.map((l, i) => (
        <g key={i}>
          <ellipse cx={l.x} cy={l.y} rx={l.r * 1.5} ry={l.r * 0.7} transform={`rotate(${(i * 47) % 180} ${l.x} ${l.y})`} fill={i % 3 === 0 ? "#3f7038" : i % 3 === 1 ? leaf : "#24461f"} opacity={0.95} />
          {i % 5 === 0 && <ShiuliFlower x={l.x + 6} y={l.y - 4} r={6} />}
        </g>
      ))}
    </g>
  );
};

export const ShiuliFlower: React.FC<{ x: number; y: number; r: number; rot?: number }> = ({ x, y, r, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    {new Array(6).fill(0).map((_, k) => (
      <ellipse key={k} cx={0} cy={-r * 0.9} rx={r * 0.42} ry={r * 0.9} fill="#fffaf2" transform={`rotate(${k * 60})`} />
    ))}
    <circle r={r * 0.32} fill="#ff7a1a" />
  </g>
);

/* ---------------- lotus + diya ---------------- */
export const Lotus: React.FC<{ x: number; y: number; s: number }> = ({ x, y, s }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={6} rx={120} ry={18} fill="#2e5a2e" />
    {[-70, -45, -22, 0, 22, 45, 70].map((a, i) => (
      <path key={a} transform={`rotate(${a})`} d="M0 0 C -26 -30 -20 -78 0 -100 C 20 -78 26 -30 0 0 Z" fill={i % 2 ? "#f7a6c4" : "#f28bb2"} stroke="#c9507c" strokeWidth={1.5} />
    ))}
  </g>
);

export const Diya: React.FC<{ x: number; y: number; s: number; t: number; i: number }> = ({ x, y, s, t, i }) => {
  const fl = 1 + Math.sin(t * 17 + i * 3) * 0.08 + Math.sin(t * 29 + i) * 0.05;
  return (
    <g transform={`translate(${x} ${y + Math.sin(t * 1.4 + i) * 3}) scale(${s})`}>
      <ellipse cx={0} cy={-22} rx={44} ry={44} fill="rgba(255,180,80,0.35)" style={{ filter: "blur(10px)" }} />
      <path d="M-26 0 Q 0 22 26 0 Z" fill="#8a3a18" />
      <path d={`M0 0 C -8 -10 -6 ${-26 * fl} 0 ${-34 * fl} C 6 ${-26 * fl} 8 -10 0 0 Z`} fill="#ffcf5a" />
      <path d={`M0 -2 C -3 -8 -2 ${-16 * fl} 0 ${-20 * fl} C 2 ${-16 * fl} 3 -8 0 -2 Z`} fill="#fff6d0" />
    </g>
  );
};

/* ---------------- radiant sun mandala ---------------- */
export const SunMandala: React.FC<{ r: number; rot: number; color?: string; core?: string }> = ({ r, rot, color = "#ffb22a", core = "#ffd36a" }) => (
  <g>
    <g transform={`rotate(${rot})`}>
      {new Array(36).fill(0).map((_, i) => (
        <path key={i} transform={`rotate(${i * 10})`} d={`M${-r * 0.07} ${-r * 0.9} L 0 ${-r * (i % 2 ? 1.28 : 1.5)} L ${r * 0.07} ${-r * 0.9} Z`} fill={color} opacity={0.9} />
      ))}
    </g>
    <circle r={r * 0.95} fill={core} />
    <circle r={r * 0.95} fill="none" stroke="#fff0b8" strokeWidth={3} opacity={0.8} />
    <circle r={r * 0.8} fill="none" stroke="#e9861a" strokeWidth={2} strokeDasharray="3 9" transform={`rotate(${-rot * 2})`} />
  </g>
);

/* ---------------- Mahishasura: the buffalo-demon of darkness (original silhouette) ----------------
   Origin at the centre of the head. `form` 0..1 condenses him out of smoke; `eyes` ignites the eyes. */
export const Demon: React.FC<{ t: number; form?: number; eyes?: number; s?: number; heat?: number }> = ({ t, form = 1, eyes = 1, s = 1, heat = 0 }) => {
  const breathe = 1 + Math.sin(t * 2.1) * 0.015;
  const blurPx = (1 - form) * 22;
  const lava = 0.55 + 0.45 * Math.sin(t * 3.3) + heat;
  return (
    <g transform={`scale(${s * (0.86 + 0.14 * form) * breathe})`}>
      {/* smoke he condenses out of */}
      <g style={{ filter: "blur(18px)" }} opacity={0.55 + (1 - form) * 0.45}>
        {new Array(10).fill(0).map((_, i) => {
          const a = (i / 10) * Math.PI * 2 + t * 0.25;
          const rr = 200 + (1 - form) * 120;
          return <ellipse key={i} cx={Math.cos(a) * rr} cy={150 + Math.sin(a) * rr * 0.55} rx={190} ry={120} fill="#0d0407" />;
        })}
      </g>
      <g opacity={form} style={{ filter: `blur(${blurPx}px) drop-shadow(0 0 ${10 + heat * 10}px rgba(255,40,16,${0.75 * form}))` }}>
        {/* shoulders + chest */}
        <path d="M-360 440 C -350 260 -280 170 -160 128 C -118 112 -96 88 -86 64 L 86 64 C 96 88 118 112 160 128 C 280 170 350 260 360 440 Z" fill="#0a0305" />
        {/* horns */}
        <path d="M-74 -96 C -160 -104 -246 -150 -276 -262 C -288 -306 -266 -340 -242 -352 C -232 -276 -190 -206 -58 -138 Z" fill="#120507" />
        <path d="M74 -96 C 160 -104 246 -150 276 -262 C 288 -306 266 -340 242 -352 C 232 -276 190 -206 58 -138 Z" fill="#120507" />
        <path d="M-240 -330 C -232 -270 -196 -210 -96 -146" stroke="#5a1410" strokeWidth={3} fill="none" opacity={0.8} />
        <path d="M240 -330 C 232 -270 196 -210 96 -146" stroke="#5a1410" strokeWidth={3} fill="none" opacity={0.8} />
        {/* ears */}
        <path d="M-92 -54 C -150 -70 -176 -40 -184 -20 C -150 -18 -118 -24 -90 -30 Z M92 -54 C 150 -70 176 -40 184 -20 C 150 -18 118 -24 90 -30 Z" fill="#0c0406" />
        {/* head + broad buffalo muzzle */}
        <path d="M-84 72 C -114 20 -116 -62 -88 -112 C -62 -154 62 -154 88 -112 C 116 -62 114 20 84 72 C 64 124 -64 124 -84 72 Z" fill="#0b0305" />
        <path d="M-62 34 C -70 104 -34 140 0 142 C 34 140 70 104 62 34 Z" fill="#0e0406" />
        <ellipse cx={-22} cy={110} rx={9} ry={6} fill="#3a0a08" />
        <ellipse cx={22} cy={110} rx={9} ry={6} fill="#3a0a08" />
        {/* iron crown */}
        <path d="M-64 -128 L -46 -176 L -26 -134 L 0 -190 L 26 -134 L 46 -176 L 64 -128 Z" fill="#1a0708" stroke="#8a2412" strokeWidth={2.5} />
        {/* molten cracks across the chest */}
        <g opacity={form * lava} style={{ filter: "drop-shadow(0 0 6px #ff3a10)" }}>
          <path d="M-150 220 L -110 260 L -128 310 L -90 360 M 140 210 L 100 262 L 124 318 L 92 372 M -20 180 L 0 236 L -14 300 L 10 360" stroke="#ff4a1a" strokeWidth={3} fill="none" />
        </g>
      </g>
      {/* eyes */}
      <g opacity={eyes * form}>
        {[-1, 1].map((d) => (
          <g key={d}>
            <ellipse cx={d * 38} cy={-38} rx={40} ry={18} fill="rgba(255,50,20,0.5)" style={{ filter: "blur(10px)" }} />
            <path d={`M${d * 14} -40 Q ${d * 38} -54 ${d * 62} -34 Q ${d * 38} -28 ${d * 14} -40 Z`} fill="#ff5a24" />
            <ellipse cx={d * 40} cy={-40} rx={5} ry={3} fill="#fff2c0" />
          </g>
        ))}
      </g>
    </g>
  );
};

/* ---------------- caparisoned elephant (side view, facing right) ---------------- */
export const Elephant: React.FC<{ t: number; s?: number; color?: string; rider?: boolean }> = ({ t, s = 1, color = "#2a1612", rider = true }) => {
  const step = (k: number) => Math.sin(t * 3.2 + k * Math.PI) * 10;
  const nod = Math.sin(t * 3.2) * 2;
  return (
    <g transform={`scale(${s})`}>
      {[-150, 70].map((x, k) => (
        <rect key={`b${x}`} x={x} y={-160} width={52} height={160} rx={18} fill="#1c0e0b" transform={`rotate(${-step(k)} ${x + 26} -160)`} />
      ))}
      <ellipse cx={-20} cy={-250} rx={210} ry={140} fill={color} />
      {[-110, 110].map((x, k) => (
        <rect key={`f${x}`} x={x} y={-170} width={56} height={170} rx={20} fill={color} transform={`rotate(${step(k + 1)} ${x + 28} -170)`} />
      ))}
      <g transform={`rotate(${nod} 170 -280)`}>
        <circle cx={180} cy={-280} r={95} fill={color} />
        <path d="M240 -250 C 290 -200 280 -120 270 -60 C 266 -30 290 -20 300 -36" stroke={color} strokeWidth={36} fill="none" strokeLinecap="round" />
        <path d="M120 -330 C 70 -330 50 -250 80 -190 C 110 -170 150 -200 160 -260 Z" fill="#3a1e18" />
        <path d="M230 -230 Q 270 -200 300 -214" stroke="#fff4e0" strokeWidth={9} fill="none" strokeLinecap="round" />
        <circle cx={208} cy={-300} r={6} fill="#120806" />
        <path d="M150 -370 Q 200 -390 240 -350 L 220 -330 Q 190 -356 160 -346 Z" fill="#b8231a" stroke={GOLD} strokeWidth={3} />
      </g>
      <path d="M-210 -270 C -230 -250 -236 -200 -228 -170" stroke={color} strokeWidth={8} fill="none" />
      {/* jhul (decorated cloth) */}
      <path d="M-150 -380 L 110 -380 L 120 -250 Q -20 -220 -160 -250 Z" fill="#b8231a" stroke={GOLD} strokeWidth={5} />
      {new Array(8).fill(0).map((_, i) => <circle key={i} cx={-140 + i * 34} cy={-246 + Math.sin(i) * 4} r={6} fill={GOLD} />)}
      {rider && (
        <g transform="translate(-20 -384) scale(0.3)">
          <Durga arms={10} rim={1.4} t={t} halo={0.9} />
        </g>
      )}
    </g>
  );
};

/* ---------------- bearers carrying the pratima on a bamboo platform ---------------- */
const Bearer: React.FC<{ x: number; t: number; phase: number; color: string }> = ({ x, t, phase, color }) => {
  const w = Math.sin(t * 5.5 + phase);
  return (
    <g transform={`translate(${x} ${Math.abs(Math.cos(t * 5.5 + phase)) * -4})`}>
      <g transform="translate(0 -78)">
        <rect x={-6} y={0} width={12} height={78} rx={6} fill={color} transform={`rotate(${w * 22})`} />
        <rect x={-6} y={0} width={12} height={78} rx={6} fill={color} transform={`rotate(${-w * 22})`} />
      </g>
      <path d="M-26 -78 L 26 -78 L 20 -150 L -20 -150 Z" fill={color} />
      <path d="M-30 -60 Q 0 -50 30 -60 L 24 -98 L -24 -98 Z" fill="#f2e6d0" opacity={0.9} />
      <circle cx={0} cy={-166} r={15} fill={color} />
      <rect x={10} y={-210} width={10} height={64} rx={5} fill={color} transform="rotate(-10 15 -150)" />
    </g>
  );
};

export const Procession: React.FC<{ t: number; s?: number; color?: string }> = ({ t, s = 1, color = "#24110d" }) => {
  const bob = Math.sin(t * 11) * 2;
  return (
    <g transform={`scale(${s})`}>
      {[-150, -55, 55, 150].map((x, i) => <Bearer key={x} x={x} t={t} phase={i * 1.7} color={color} />)}
      <g transform={`translate(0 ${-212 + bob})`}>
        <rect x={-230} y={-8} width={460} height={14} rx={7} fill="#6a4a2a" />
        <rect x={-130} y={-34} width={260} height={28} fill="#7a1c14" stroke={GOLD} strokeWidth={3} />
        <g transform="translate(0 -34) scale(0.42)">
          <Durga arms={10} rim={1.5} t={t} halo={1} />
        </g>
      </g>
    </g>
  );
};

/* ---------------- Tiltwave "TW" mark ---------------- */
export const TWLogo: React.FC<{ w: number; draw?: number; letters?: number; shine?: number; stroke?: number }> = ({ w, draw = 1, letters = 1, shine = -1, stroke = 3 }) => {
  const h = w * 0.58;
  const per = 2 * (w + h);
  return (
    <svg width={w + 20} height={h + 20} viewBox={`-10 -10 ${w + 20} ${h + 20}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="twGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffe9a8" />
          <stop offset="50%" stopColor="#f0b63c" />
          <stop offset="100%" stopColor="#c98a22" />
        </linearGradient>
        <linearGradient id="twShine" x1="0" y1="0" x2="1" y2="0">
          <stop offset={`${Math.max(0, shine - 0.12) * 100}%`} stopColor="#fff" stopOpacity={0} />
          <stop offset={`${shine * 100}%`} stopColor="#fff" stopOpacity={0.9} />
          <stop offset={`${Math.min(1, shine + 0.12) * 100}%`} stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id="twMask">
          <rect x={0} y={0} width={w} height={h} rx={w * 0.06} fill="none" stroke="#fff" strokeWidth={stroke} />
          <text x={w / 2} y={h * 0.72} textAnchor="middle" fontFamily="CinzelTW, serif" fontWeight={700} fontSize={h * 0.62} letterSpacing={h * 0.04} fill="#fff">TW</text>
        </mask>
      </defs>
      <rect x={0} y={0} width={w} height={h} rx={w * 0.06} fill="none" stroke="url(#twGold)" strokeWidth={stroke} strokeDasharray={per} strokeDashoffset={per * (1 - draw)} />
      <text x={w / 2} y={h * 0.72} textAnchor="middle" fontFamily="CinzelTW, serif" fontWeight={700} fontSize={h * 0.62} letterSpacing={h * 0.04} fill="url(#twGold)" opacity={letters}>TW</text>
      {shine >= 0 && shine <= 1.1 && <rect x={0} y={0} width={w} height={h} fill="url(#twShine)" mask="url(#twMask)" />}
    </svg>
  );
};
