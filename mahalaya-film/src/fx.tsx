import React from "react";
import { AbsoluteFill, Img, random, staticFile, useCurrentFrame, useVideoConfig, interpolate, Easing } from "remotion";

export const W = 1920;
export const H = 1080;

export const ease = Easing.bezier(0.45, 0, 0.2, 1);
export const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
export const lerp = (frame: number, a: number, b: number, from: number, to: number, e = ease) =>
  interpolate(frame, [a, b], [from, to], { ...clamp, easing: e });

/** Short spike that decays after a set of accent times (seconds). */
export const pulse = (t: number, times: number[], decay = 0.18) => {
  let v = 0;
  for (const s of times) {
    const d = t - s;
    if (d >= 0 && d < decay * 6) v = Math.max(v, Math.exp(-d / decay));
  }
  return v;
};

export const useT = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return { frame, t: frame / fps };
};

/* ---------- Sky ---------- */
export const Sky: React.FC<{ stops: string; style?: React.CSSProperties }> = ({ stops, style }) => (
  <AbsoluteFill style={{ background: `linear-gradient(180deg, ${stops})`, ...style }} />
);

/* ---------- Drifting cloud layer (pre-rendered fBm texture used as a mask) ---------- */
export const Clouds: React.FC<{
  color: string;
  opacity?: number;
  speed?: number; // px per second
  scale?: number;
  top?: number;
  height?: number;
  tex?: string;
  blur?: number;
  offset?: number;
  blend?: React.CSSProperties["mixBlendMode"];
}> = ({ color, opacity = 1, speed = 20, scale = 1, top = 0, height = H, tex = "clouds_a.png", blur = 0, offset = 0, blend }) => {
  const { t } = useT();
  const tw = 2560 * scale;
  const x = -((offset + t * speed) % tw);
  const url = `url(${staticFile(tex)})`;
  return (
    <div
      style={{
        position: "absolute", left: 0, top, width: W, height,
        background: color, opacity, filter: blur ? `blur(${blur}px)` : undefined, mixBlendMode: blend,
        WebkitMaskImage: url, maskImage: url,
        WebkitMaskSize: `${tw}px ${height}px`, maskSize: `${tw}px ${height}px`,
        WebkitMaskRepeat: "repeat-x", maskRepeat: "repeat-x",
        WebkitMaskPosition: `${x}px 0px`, maskPosition: `${x}px 0px`,
      }}
    />
  );
};

/* ---------- Volumetric god rays ---------- */
export const GodRays: React.FC<{
  x?: string; y?: string; color?: string; opacity?: number; spin?: number; seed?: string; count?: number; spread?: number;
}> = ({ x = "50%", y = "-10%", color = "255,214,140", opacity = 0.55, spin = 1.5, seed = "rays", count = 26, spread = 120 }) => {
  const { t } = useT();
  const stops: string[] = [];
  let a = 0;
  const span = spread;
  for (let i = 0; i < count; i++) {
    const w = 1 + random(`${seed}w${i}`) * 4;
    const gap = (span / count) * (0.6 + random(`${seed}g${i}`) * 0.8);
    const al = 0.25 + random(`${seed}a${i}`) * 0.75;
    stops.push(`rgba(${color},0) ${a}deg`, `rgba(${color},${al}) ${a + w / 2}deg`, `rgba(${color},0) ${a + w}deg`);
    a += w + gap;
  }
  stops.push(`rgba(${color},0) ${a}deg`, `rgba(${color},0) 360deg`);
  const rot = 180 - span / 2 + Math.sin(t * 0.35) * spin;
  return (
    <AbsoluteFill
      style={{
        background: `conic-gradient(from ${rot}deg at ${x} ${y}, ${stops.join(",")})`,
        opacity, mixBlendMode: "screen", filter: "blur(7px)",
        WebkitMaskImage: `radial-gradient(ellipse 85% 95% at ${x} ${y}, #000 10%, transparent 78%)`,
        maskImage: `radial-gradient(ellipse 85% 95% at ${x} ${y}, #000 10%, transparent 78%)`,
      }}
    />
  );
};

/* ---------- Glow orb / lens bloom ---------- */
export const Glow: React.FC<{ x: number; y: number; r: number; color: string; opacity?: number; blend?: React.CSSProperties["mixBlendMode"] }> = ({
  x, y, r, color, opacity = 1, blend = "screen",
}) => (
  <div
    style={{
      position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, borderRadius: "50%",
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, opacity, mixBlendMode: blend,
    }}
  />
);

/* ---------- Floating golden motes ---------- */
export const Motes: React.FC<{
  count?: number; seed?: string; color?: string; speed?: number; size?: number; opacity?: number; rise?: boolean;
}> = ({ count = 70, seed = "m", color = "255,220,150", speed = 25, size = 3, opacity = 1, rise = true }) => {
  const { t } = useT();
  return (
    <AbsoluteFill style={{ opacity, mixBlendMode: "screen" }}>
      {new Array(count).fill(0).map((_, i) => {
        const r = (k: string) => random(`${seed}${k}${i}`);
        const s = size * (0.4 + r("s") * 1.4);
        const v = speed * (0.4 + r("v"));
        const y0 = r("y") * (H + 100);
        const y = rise ? ((y0 - v * t) % (H + 100) + H + 100) % (H + 100) - 50 : (y0 + v * t) % (H + 100) - 50;
        const x = r("x") * W + Math.sin(t * (0.3 + r("f")) + r("p") * 6.28) * 30;
        const tw = 0.55 + 0.45 * Math.sin(t * (1 + r("tw") * 3) + r("ph") * 6.28);
        return (
          <div key={i} style={{
            position: "absolute", left: x, top: y, width: s, height: s, borderRadius: "50%",
            background: `rgba(${color},${tw})`, boxShadow: `0 0 ${s * 3}px ${s}px rgba(${color},${0.5 * tw})`,
          }} />
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------- Falling flower petals ---------- */
const PETAL_COLORS = ["#d8341f", "#f08a1c", "#f7b32b", "#e9506b", "#c2181f", "#fff4e0"];
export const Petals: React.FC<{ count?: number; seed?: string; speed?: number; opacity?: number; size?: number; start?: number }> = ({
  count = 40, seed = "p", speed = 90, opacity = 1, size = 22, start = 0,
}) => {
  const { t: tt } = useT();
  const t = Math.max(0, tt - start);
  return (
    <AbsoluteFill style={{ opacity }}>
      {new Array(count).fill(0).map((_, i) => {
        const r = (k: string) => random(`${seed}${k}${i}`);
        const v = speed * (0.6 + r("v") * 0.8);
        const s = size * (0.6 + r("s") * 0.9);
        const y = ((r("y") * (H + 200) + v * t) % (H + 200)) - 100;
        const x = r("x") * W + Math.sin(t * (0.6 + r("f")) + r("p") * 6.28) * (40 + r("a") * 60);
        const rot = r("r") * 360 + t * (40 + r("rv") * 120) * (r("d") > 0.5 ? 1 : -1);
        const flip = Math.cos(t * (1.5 + r("fl") * 2) + r("ph") * 6.28);
        const c = PETAL_COLORS[Math.floor(r("c") * PETAL_COLORS.length)];
        const blur = r("z") > 0.8 ? 3 : 0;
        return (
          <svg key={i} width={s} height={s * 1.3} viewBox="0 0 20 26"
            style={{ position: "absolute", left: x, top: y, transform: `rotate(${rot}deg) scaleX(${flip})`, filter: blur ? `blur(${blur}px)` : undefined }}>
            <defs>
              <radialGradient id={`pg${seed}${i}`} cx="50%" cy="30%" r="80%">
                <stop offset="0%" stopColor="#fff3d6" stopOpacity="0.55" />
                <stop offset="45%" stopColor={c} />
                <stop offset="100%" stopColor={c} stopOpacity="0.85" />
              </radialGradient>
            </defs>
            <path d="M10 1 C17 6 19 15 10 25 C1 15 3 6 10 1 Z" fill={`url(#pg${seed}${i})`} />
          </svg>
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------- Lightning bolt + sky flash ---------- */
const boltPath = (seed: string, x0: number, y0: number, x1: number, y1: number) => {
  let pts: [number, number][] = [[x0, y0], [x1, y1]];
  let disp = 140;
  for (let it = 0; it < 6; it++) {
    const np: [number, number][] = [pts[0]];
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[i + 1];
      const mx = (ax + bx) / 2 + (random(`${seed}${it}_${i}`) - 0.5) * disp;
      const my = (ay + by) / 2;
      np.push([mx, my], pts[i + 1]);
    }
    pts = np;
    disp *= 0.55;
  }
  return pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
};

export const Lightning: React.FC<{ times: number[] }> = ({ times }) => {
  const { t } = useT();
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen" }}>
      {times.map((s, i) => {
        const d = t - s;
        if (d < 0 || d > 0.35) return null;
        const flick = d < 0.06 ? 1 : d < 0.1 ? 0.3 : d < 0.16 ? 0.9 : Math.max(0, 1 - (d - 0.16) / 0.19);
        const x = 300 + random(`lx${i}`) * 1300;
        const p = boltPath(`b${i}`, x, -20, x + (random(`lx2${i}`) - 0.5) * 500, 640 + random(`ly${i}`) * 200);
        return (
          <React.Fragment key={i}>
            <AbsoluteFill style={{ background: "rgba(170,190,255,0.35)", opacity: flick * 0.8 }} />
            <svg width={W} height={H} style={{ position: "absolute", opacity: flick }}>
              <path d={p} stroke="rgba(150,170,255,0.6)" strokeWidth={14} fill="none" style={{ filter: "blur(8px)" }} />
              <path d={p} stroke="#eef2ff" strokeWidth={3} fill="none" />
            </svg>
          </React.Fragment>
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------- Lotus mandala halo ---------- */
export const Mandala: React.FC<{ size: number; rot: number; opacity?: number; color?: string }> = ({ size, rot, opacity = 1, color = "#ffd27a" }) => {
  const petals = (n: number, r0: number, r1: number, w: number) =>
    new Array(n).fill(0).map((_, i) => {
      const a = (i / n) * 360;
      return (
        <path key={`${n}-${i}`} transform={`rotate(${a})`}
          d={`M0 ${-r0} C ${w} ${-(r0 + r1) / 2} ${w * 0.6} ${-r1} 0 ${-r1} C ${-w * 0.6} ${-r1} ${-w} ${-(r0 + r1) / 2} 0 ${-r0} Z`}
          fill="none" stroke={color} strokeWidth={1.6} />
      );
    });
  return (
    <svg width={size} height={size} viewBox="-260 -260 520 520" style={{ position: "absolute", opacity, overflow: "visible" }}>
      <g style={{ filter: `drop-shadow(0 0 6px ${color})` }}>
        <g transform={`rotate(${rot})`}>
          {petals(24, 150, 232, 22)}
          <circle r={238} fill="none" stroke={color} strokeWidth={2} />
          <circle r={246} fill="none" stroke={color} strokeWidth={0.8} strokeDasharray="2 7" />
        </g>
        <g transform={`rotate(${-rot * 1.6})`}>
          {petals(16, 92, 148, 26)}
          <circle r={150} fill="none" stroke={color} strokeWidth={1.2} />
          <circle r={88} fill="none" stroke={color} strokeWidth={1.2} strokeDasharray="1 5" />
        </g>
      </g>
    </svg>
  );
};

/* ---------- Silhouettes: mountains + temple shikharas ---------- */
export const Ridge: React.FC<{ seed: string; base: number; amp: number; color: string; opacity?: number; rough?: number; style?: React.CSSProperties }> = ({
  seed, base, amp, color, opacity = 1, rough = 0.55, style,
}) => {
  const n = 140;
  const ph = [0, 1, 2, 3].map((k) => random(`${seed}ph${k}`) * 6.28);
  const pts = new Array(n).fill(0).map((_, i) => {
    const u = i / (n - 1);
    const v =
      0.5 * Math.sin(u * 5.1 + ph[0]) + 0.28 * Math.sin(u * 11.7 + ph[1]) + 0.14 * Math.sin(u * 23.3 + ph[2]) * (1 + rough) +
      0.06 * Math.sin(u * 47 + ph[3]) * (1 + rough) + 0.03 * (random(`${seed}d${i}`) - 0.5) * rough;
    return base - amp * (0.55 + 0.45 * v);
  });
  const d = `M0 ${H} ` + pts.map((y, i) => `L${((i / (n - 1)) * (W + 40) - 20).toFixed(1)} ${y.toFixed(1)}`).join(" ") + ` L${W} ${H} Z`;
  return (
    <svg width={W} height={H} style={{ position: "absolute", opacity, ...style }}>
      <path d={d} fill={color} />
    </svg>
  );
};

/** Nagara/rekha-deul style shikhara with amalaka + kalasha + flag. */
export const Temple: React.FC<{ x: number; base: number; h: number; color: string; flag?: boolean; style?: React.CSSProperties }> = ({
  x, base, h, color, flag = true, style,
}) => {
  const w = h * 0.42;
  const tw = w * 0.42;
  const top = base - h;
  const d = [
    `M${x - w * 0.75} ${base}`, `L${x - w * 0.75} ${base - h * 0.22}`, `L${x - w * 0.5} ${base - h * 0.26}`,
    `C ${x - w * 0.5} ${base - h * 0.55}, ${x - tw * 0.7} ${top + h * 0.2}, ${x - tw * 0.5} ${top + h * 0.12}`,
    `L${x + tw * 0.5} ${top + h * 0.12}`,
    `C ${x + tw * 0.7} ${top + h * 0.2}, ${x + w * 0.5} ${base - h * 0.55}, ${x + w * 0.5} ${base - h * 0.26}`,
    `L${x + w * 0.75} ${base - h * 0.22}`, `L${x + w * 0.75} ${base}`, "Z",
  ].join(" ");
  return (
    <svg width={W} height={H} style={{ position: "absolute", overflow: "visible", ...style }}>
      <path d={d} fill={color} />
      <ellipse cx={x} cy={top + h * 0.1} rx={tw * 0.75} ry={h * 0.035} fill={color} />
      <path d={`M${x - tw * 0.18} ${top + h * 0.08} Q ${x} ${top - h * 0.02} ${x + tw * 0.18} ${top + h * 0.08} Z`} fill={color} />
      <rect x={x - 1.5} y={top - h * 0.12} width={3} height={h * 0.12} fill={color} />
      {flag && <path d={`M${x + 1.5} ${top - h * 0.12} l ${h * 0.09} ${h * 0.025} l ${-h * 0.09} ${h * 0.025} Z`} fill={color} />}
    </svg>
  );
};

/* ---------- Abstract celestial deity: a pillar of divine light (no invented character design) ---------- */
export const LightBeing: React.FC<{ x: number; y: number; scale?: number; color: string; core?: string; intensity?: number; bow?: number }> = ({
  x, y, scale = 1, color, core = "#fffaf0", intensity = 1, bow = 0,
}) => {
  const { t } = useT();
  const breathe = 1 + Math.sin(t * 2 + x) * 0.05;
  return (
    <div style={{ position: "absolute", left: x, top: y, transform: `translate(-50%,-100%) scale(${scale}) rotate(${bow * 10}deg)`, transformOrigin: "50% 100%", opacity: intensity, mixBlendMode: "screen" }}>
      {/* column of light reaching up into the heavens */}
      <div style={{ position: "absolute", left: -70, top: -900, width: 140, height: 900, background: `linear-gradient(0deg, ${color} 0%, ${color} 35%, transparent 100%)`, filter: "blur(22px)", opacity: 0.55 * breathe }} />
      <div style={{ position: "absolute", left: -14, top: -760, width: 28, height: 760, background: `linear-gradient(0deg, ${core} 0%, ${core} 40%, transparent 100%)`, filter: "blur(6px)", opacity: 0.8 }} />
      {/* luminous presence */}
      <div style={{ position: "absolute", left: -200, top: -560, width: 400, height: 560, borderRadius: "50% 50% 40% 40%", background: `radial-gradient(ellipse at 50% 42%, ${core} 0%, ${color} 30%, transparent 70%)`, filter: "blur(10px)", opacity: 0.9 * breathe }} />
      {/* halo mandala */}
      <div style={{ position: "absolute", left: -110, top: -560, width: 220, height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Mandala size={220} rot={t * 14 + x} opacity={0.75} color={core} />
      </div>
      {/* lotus pedestal glow */}
      <div style={{ position: "absolute", left: -220, top: -70, width: 440, height: 120, borderRadius: "50%", background: `radial-gradient(ellipse, ${core} 0%, ${color} 40%, transparent 70%)`, filter: "blur(8px)" }} />
    </div>
  );
};

/* ---------- Divine cloud bank (soft billows) ---------- */
export const CloudBank: React.FC<{ y: number; color: string; opacity?: number; seed?: string; drift?: number }> = ({ y, color, opacity = 1, seed = "cb", drift = 6 }) => {
  const { t } = useT();
  return (
    <AbsoluteFill style={{ opacity }}>
      {new Array(16).fill(0).map((_, i) => {
        const r = (k: string) => random(`${seed}${k}${i}`);
        const s = 260 + r("s") * 360;
        const x = (i / 15) * (W + 300) - 150 + Math.sin(t * 0.2 + i) * drift * 4;
        return (
          <div key={i} style={{
            position: "absolute", left: x - s / 2, top: y - s * 0.35 + r("y") * 80, width: s, height: s * 0.7, borderRadius: "50%",
            background: `radial-gradient(ellipse at 50% 40%, ${color} 0%, ${color} 35%, transparent 70%)`, filter: "blur(10px)",
          }} />
        );
      })}
    </AbsoluteFill>
  );
};

/* ---------- Character cutouts (from the supplied character sheet) ---------- */
// durga_trio.png is 1420x1744. Fractions below locate features within it.
export const TRIO = {
  w: 1420, h: 1744,
  face: [0.38, 0.155], lion: [0.275, 0.516], demon: [0.676, 0.642], tridentTip: [0.21, 0.05], strike: [0.6, 0.72],
} as const;

export const Cutout: React.FC<{ src: string; style?: React.CSSProperties }> = ({ src, style }) => (
  <Img src={staticFile(src)} style={{ position: "absolute", ...style }} />
);

/* ---------- Grade: vignette + warm bloom ---------- */
export const Vignette: React.FC<{ strength?: number; color?: string }> = ({ strength = 0.65, color = "0,0,0" }) => (
  <AbsoluteFill style={{ background: `radial-gradient(ellipse 75% 70% at 50% 50%, transparent 55%, rgba(${color},${strength}) 100%)`, pointerEvents: "none" }} />
);

export const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.06 }) => {
  const { frame } = useT();
  return (
    <AbsoluteFill style={{ opacity, mixBlendMode: "overlay" }}>
      <svg width={W} height={H}>
        <filter id="gr">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame % 97} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={W} height={H} filter="url(#gr)" />
      </svg>
    </AbsoluteFill>
  );
};
