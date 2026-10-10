import type {FC, ReactNode} from 'react';
import {AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';

export const C = {
  indigo: '#120b2e',
  crimson: '#7a0c1e',
  red: '#c8102e',
  gold: '#f5b301',
  marigold: '#ff8c1a',
  cream: '#fff4dc',
};

export const FontFace: FC = () => (
  <style>{`@font-face{font-family:'Bengali';src:url(${staticFile('fonts/bengali-700.woff2')}) format('woff2');font-weight:700;}`}</style>
);

export const ease = (f: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(f, [a, b], [from, to], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

export const Wordmark: FC<{size?: number; style?: React.CSSProperties}> = ({size = 44, style}) => (
  <div
    style={{
      fontFamily: 'Georgia, serif',
      fontWeight: 700,
      fontSize: size,
      letterSpacing: size * 0.12,
      color: C.gold,
      border: `3px solid ${C.gold}`,
      padding: `${size * 0.15}px ${size * 0.35}px`,
      borderRadius: size * 0.2,
      textShadow: `0 0 18px ${C.marigold}`,
      ...style,
    }}
  >
    TW
  </div>
);

export const Corner: FC = () => (
  <div style={{position: 'absolute', top: 70, right: 60}}>
    <Wordmark size={40} />
  </div>
);

export const Caption: FC<{bn: string; en: string; start: number; y?: number}> = ({bn, en, start, y = 1380}) => {
  const f = useCurrentFrame();
  const words = bn.split(' ');
  return (
    <div style={{position: 'absolute', top: y, left: 60, right: 60, textAlign: 'center'}}>
      <div style={{fontFamily: 'Bengali', fontSize: 78, lineHeight: 1.35, color: C.cream, textShadow: '0 4px 24px rgba(0,0,0,.8)'}}>
        {words.map((w, i) => (
          <span key={i} style={{opacity: ease(f, start + i * 5, start + i * 5 + 10), display: 'inline-block', marginRight: 18, transform: `translateY(${ease(f, start + i * 5, start + i * 5 + 10, 20, 0)}px)`}}>
            {w}
          </span>
        ))}
      </div>
      <div style={{marginTop: 24, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 40, color: C.gold, opacity: ease(f, start + words.length * 5, start + words.length * 5 + 15)}}>
        {en}
      </div>
    </div>
  );
};

export const Stars: FC<{n?: number}> = ({n = 70}) => {
  const f = useCurrentFrame();
  return (
    <>
      {Array.from({length: n}).map((_, i) => {
        const x = (i * 397) % 1080;
        const y = (i * 761) % 1920;
        const tw = 0.4 + 0.6 * Math.abs(Math.sin(f / 12 + i));
        return <div key={i} style={{position: 'absolute', left: x, top: y, width: 4, height: 4, borderRadius: 2, background: C.cream, opacity: tw * ease(f, i % 20, (i % 20) + 15)}} />;
      })}
    </>
  );
};

export const Bg: FC<{from: string; to: string; children?: ReactNode}> = ({from, to, children}) => (
  <AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%, ${from}, ${to})`}}>
    <FontFace />
    {children}
  </AbsoluteFill>
);

export const useSpring = (delay: number, damping = 14) => {
  const f = useCurrentFrame();
  const {fps} = useVideoConfig();
  return spring({frame: f - delay, fps, config: {damping}});
};
