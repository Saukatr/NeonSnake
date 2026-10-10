import type {FC} from 'react';
import {Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Bg, C, Corner, Wordmark, ease, useSpring} from './shared';

const WEAPONS = ['trishul', 'chakra', 'conch', 'sword', 'bow', 'lotus', 'mace', 'axe', 'shield', 'thunder'];

const Weapon: FC<{kind: string}> = ({kind}) => {
  const s = {stroke: C.gold, strokeWidth: 6, fill: 'none'} as const;
  switch (kind) {
    case 'trishul': return <path d="M0,40 V-60 M-25,-40 Q-25,-70 0,-80 Q25,-70 25,-40 M0,-80 V-95" {...s} />;
    case 'chakra': return <g {...s}><circle r={35} /><circle r={10} />{[0, 45, 90, 135].map((r) => <line key={r} x1={-35} x2={35} transform={`rotate(${r})`} />)}</g>;
    case 'conch': return <path d="M-25,20 Q-30,-40 10,-45 Q35,-20 20,10 Q5,30 -25,20Z M0,-30 Q10,-15 0,0" {...s} />;
    case 'sword': return <path d="M0,40 V-70 L8,-55 V30 M-20,25 H20" {...s} />;
    case 'bow': return <path d="M-10,-60 Q40,0 -10,60 M-10,-60 V60" {...s} />;
    case 'lotus': return <path d="M0,20 C-25,-5 -15,-45 0,-55 C15,-45 25,-5 0,20Z" {...s} />;
    case 'mace': return <path d="M0,50 V-20 M0,-40 m-22,0 a22,22 0 1,0 44,0 a22,22 0 1,0 -44,0" {...s} />;
    case 'axe': return <path d="M0,50 V-60 M0,-50 Q35,-45 30,-15 Q15,-25 0,-20" {...s} />;
    case 'shield': return <path d="M0,-45 L35,-30 Q35,25 0,45 Q-35,25 -35,-30Z" {...s} />;
    default: return <path d="M10,-55 L-15,0 H10 L-10,55" {...s} />;
  }
};

export const IAmDurga: FC = () => {
  const f = useCurrentFrame();
  const rise = useSpring(0, 20);
  const slams = [70, 100, 130];
  const pulse = slams.reduce((a, s) => Math.max(a, f >= s ? Math.max(0, 1 - (f - s) / 18) : 0), 0);
  const end = ease(f, 175, 195);
  const endPop = useSpring(178, 11);
  return (
    <Bg from={C.marigold} to={C.crimson}>
      {/* mandala */}
      <svg width={1080} height={1920} style={{position: 'absolute', opacity: 1 - end * 0.6}}>
        <g transform={`translate(540 760) rotate(${f * (0.4 + ease(f, 140, 180) * 2)}) scale(${1 + pulse * 0.08})`}>
          {Array.from({length: 24}).map((_, i) => (
            <path key={i} d="M0,-260 C40,-330 0,-420 0,-460 C0,-420 -40,-330 0,-260Z" fill={C.gold} opacity={0.35} transform={`rotate(${i * 15})`} />
          ))}
          <circle r={250} fill="none" stroke={C.gold} strokeWidth={4} opacity={0.6} />
          <circle r={200} fill="#ffb347" opacity={0.5} />
        </g>
        {/* original goddess silhouette */}
        <g transform={`translate(540 ${760 + (1 - rise) * 500})`} opacity={1 - end}>
          {WEAPONS.map((w, i) => {
            const side = i < 5 ? -1 : 1;
            const k = i % 5;
            const ang = side * (25 + k * 28);
            const t = ease(f, 15 + i * 4, 30 + i * 4);
            return (
              <g key={w} transform={`rotate(${ang * t})`}>
                <rect x={-12} y={-300} width={24} height={240} rx={12} fill="#2a0508" />
                <g transform="translate(0 -330)" opacity={t}><Weapon kind={w} /></g>
              </g>
            );
          })}
          <path d="M-150,420 Q-120,60 -60,0 H60 Q120,60 150,420Z" fill="#2a0508" />
          <circle cy={-60} r={70} fill="#2a0508" />
          <path d="M-60,-120 L-40,-170 L-15,-130 L0,-185 L15,-130 L40,-170 L60,-120Z" fill={C.gold} />
          <circle cy={-70} r={8} fill={C.red} />
        </g>
      </svg>
      {slams.map((s, i) => (
        <div key={s} style={{position: 'absolute', left: 0, right: 0, top: 1330 + i * 0, textAlign: 'center', fontFamily: 'Bengali', fontSize: 150 + i * 40, color: i === 2 ? C.cream : C.gold, textShadow: `0 0 40px ${C.marigold}`, opacity: f >= s && f < (slams[i + 1] ?? 175) ? 1 : 0, transform: `scale(${f >= s ? 1 + Math.max(0, 1 - (f - s) / 8) * 0.6 : 1})`}}>
          দুর্গা
        </div>
      ))}
      {/* end card */}
      <div style={{position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 40, opacity: end, transform: `scale(${0.8 + endPop * 0.2})`}}>
        <div style={{fontFamily: 'Bengali', fontSize: 150, color: C.cream, textShadow: `0 0 40px ${C.gold}`}}>শুভ মহালয়া</div>
        <div style={{fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 64, color: C.gold}}>Shubho Mahalaya</div>
        <Wordmark size={90} style={{marginTop: 60}} />
      </div>
      {end < 0.5 ? <Corner /> : null}
      {slams.map((s) => <Sequence key={s} from={s}><Audio src={staticFile('sounds/Impact.mp3')} /></Sequence>)}
      <Sequence from={180}><Audio src={staticFile('sounds/aha-moment.MP3')} /></Sequence>
    </Bg>
  );
};
