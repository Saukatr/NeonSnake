import type {FC} from 'react';
import {Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Bg, C, Caption, Corner, ease, useSpring} from './shared';

const Cloud: FC<{x: number; y: number; s: number}> = ({x, y, s}) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <ellipse cx={0} cy={0} rx={160} ry={70} fill="#3b3b4a" />
    <ellipse cx={-90} cy={-30} rx={90} ry={70} fill="#44445a" />
    <ellipse cx={70} cy={-50} rx={110} ry={85} fill="#4a4a60" />
  </g>
);

const Foot: FC<{flip?: boolean}> = ({flip}) => (
  <g transform={flip ? 'scale(-1 1)' : undefined}>
    <path d="M10,-120 C60,-120 70,-40 60,10 C55,50 20,60 -10,55 C-40,50 -45,10 -35,-40 C-28,-90 -15,-120 10,-120Z" fill="#e8b48c" />
    <path d="M-36,20 C-40,45 -10,58 20,56 C45,54 58,40 60,15" fill="none" stroke={C.red} strokeWidth={16} />
    <path d="M-30,-60 C0,-50 30,-50 58,-62" fill="none" stroke={C.gold} strokeWidth={8} strokeDasharray="6 8" />
  </g>
);

export const NoSorrowWhereSheStands: FC = () => {
  const f = useCurrentFrame();
  const step = useSpring(60, 12);
  const ring = ease(f, 90, 140);
  const breakUp = ease(f, 100, 150);
  const exit = ease(f, 265, 300);
  return (
    <Bg from={breakUp > 0.5 ? '#8a1a1a' : '#2a2a3a'} to={breakUp > 0.5 ? C.crimson : '#0e0e18'}>
      <svg width={1080} height={1920} style={{position: 'absolute'}}>
        <g opacity={1 - breakUp}>
          {[[200, 300, 1.2], [850, 420, 1], [520, 220, 1.4], [150, 900, 0.9], [930, 1000, 1.1]].map(([x, y, s], i) => (
            <Cloud key={i} x={x + Math.sin(f / 20 + i) * 30} y={y} s={s} />
          ))}
          {f % 40 < 3 && f < 100 ? <path d="M600,380 l-40,120 l40,0 l-50,140" stroke="#fff6a0" strokeWidth={8} fill="none" /> : null}
        </g>
        {/* marigold petals from broken clouds */}
        {Array.from({length: 40}).map((_, i) => {
          const t = ease(f, 100 + (i % 10), 300);
          const x = (i * 211) % 1080 + Math.sin(f / 15 + i) * 40;
          const y = ((i * 137) % 900) + t * 900 - (1 - exit) * 0 - exit * 1400;
          return <ellipse key={i} cx={x} cy={y} rx={14} ry={22} fill={i % 2 ? C.marigold : C.gold} opacity={breakUp} transform={`rotate(${f * 3 + i * 40} ${x} ${y})`} />;
        })}
        <circle cx={540} cy={1060} r={ring * 900} fill="none" stroke={C.gold} strokeWidth={30 * (1 - ring) + 2} opacity={1 - ring * 0.8} />
        {/* lotus */}
        <g transform="translate(540 1110)">
          {[-60, -30, 0, 30, 60].map((r, i) => (
            <path key={i} d="M0,0 C-50,-60 -30,-150 0,-180 C30,-150 50,-60 0,0Z" fill={i % 2 ? '#f48fb1' : '#f8bbd0'} transform={`rotate(${r}) scale(1.3)`} />
          ))}
        </g>
        <g transform={`translate(540 ${1000 - (1 - step) * 700})`} opacity={ease(f, 55, 65)}>
          <g transform="translate(-75 0)"><Foot flip /></g>
          <g transform="translate(75 0)"><Foot /></g>
        </g>
      </svg>
      <Caption bn="যেখানে আমি, সেখানে দুঃখ নেই" en="Where I stand, sorrow cannot stay" start={150} y={1340} />
      <Corner />
      <Sequence from={90}><Audio src={staticFile('sounds/Impact.mp3')} /></Sequence>
      <Sequence from={110}><Audio src={staticFile('sounds/aha-moment.MP3')} volume={0.7} /></Sequence>
    </Bg>
  );
};
