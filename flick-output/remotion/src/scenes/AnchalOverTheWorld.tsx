import type {FC} from 'react';
import {Audio, Sequence, staticFile, useCurrentFrame} from 'remotion';
import {Bg, C, Caption, Corner, Stars, ease, useSpring} from './shared';

export const AnchalOverTheWorld: FC = () => {
  const f = useCurrentFrame();
  const rise = useSpring(10, 18);
  const sweep = ease(f, 40, 95);
  const zoom = 1 + ease(f, 190, 240, 0, 1.6);
  const flash = ease(f, 215, 240);
  return (
    <Bg from="#2a1a5e" to={C.indigo}>
      <Stars />
      <div style={{position: 'absolute', inset: 0, transform: `scale(${zoom})`, transformOrigin: '50% 38%'}}>
        <svg width={1080} height={1920} style={{position: 'absolute'}}>
          <defs>
            <radialGradient id="earth" cx="40%" cy="35%">
              <stop offset="0%" stopColor="#6fd3c7" />
              <stop offset="70%" stopColor="#1f6f8b" />
              <stop offset="100%" stopColor="#0d3350" />
            </radialGradient>
          </defs>
          <g transform={`translate(540 ${880 - rise * 150})`}>
            <circle r={230} fill="url(#earth)" />
            <path d="M-120,-90 q60,-40 110,0 q30,40 -20,70 q-60,20 -90,-20z M40,40 q70,-10 100,40 q-20,60 -80,40z" fill="#3fa36b" opacity={0.9} />
            <circle r={250} fill="none" stroke={C.gold} strokeWidth={4} opacity={0.4 * ease(f, 95, 130)} />
          </g>
          {/* Anchal: white drape with red border, sweeping from top-left and curling around the globe */}
          <g opacity={ease(f, 38, 48)} transform={`translate(${(1 - sweep) * -900} ${(1 - sweep) * -700})`}>
            <path d="M-100,200 C300,250 900,350 820,760 C780,980 420,1060 300,900 C440,960 680,900 700,740 C720,520 300,420 -100,420 Z" fill={C.cream} opacity={0.95} />
            <path d="M-100,200 C300,250 900,350 820,760 C780,980 420,1060 300,900" fill="none" stroke={C.red} strokeWidth={34} />
            <path d="M-100,200 C300,250 900,350 820,760 C780,980 420,1060 300,900" fill="none" stroke={C.gold} strokeWidth={6} strokeDasharray="18 14" opacity={ease(f, 95, 125)} />
          </g>
        </svg>
      </div>
      <Caption bn="আমার স্নেহের আঁচল…" en="My loving embrace shelters the whole world" start={110} />
      <Corner />
      <div style={{position: 'absolute', inset: 0, background: '#ffd27a', opacity: flash}} />
      <Sequence from={40}>
        <Audio src={staticFile('sounds/transitions.mp3')} volume={0.8} />
      </Sequence>
    </Bg>
  );
};
