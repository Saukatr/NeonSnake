import * as THREE from 'three';
import { Pipeline } from './engine.js';
import { SHOTS } from './shots.js';

const q = new URLSearchParams(location.search);
const W = +(q.get('w') || 1920), H = +(q.get('h') || 1080);
const canvas = document.getElementById('c');
canvas.width = W; canvas.height = H;
const pipe = new Pipeline(canvas, W, H);
export const FPS = 30;

let current = null;
function shotAt(t) { return SHOTS.find(s => t >= s.start && t < s.end) || SHOTS[SHOTS.length - 1]; }

window.renderFrame = (f, quality = 0.96) => {
  const t = f / FPS;
  const shot = shotAt(t);
  if (shot !== current) {
    if (current && current.dispose) current.dispose();
    current = shot;
    if (!shot.built) { shot.build(pipe); shot.built = true; }
  }
  pipe.resetGrade();
  const { scene, camera } = shot.update(t, t - shot.start, pipe);
  pipe.render(scene, camera, f);
  return canvas.toDataURL('image/jpeg', quality);
};
window.filmReady = true;
window.getCues = () => {
  const all = [];
  for (const s of SHOTS) { if (!s.built) { s.build(pipe); s.built = true; } all.push(...(s.cues || [])); }
  return JSON.stringify(all.sort((a, b) => a.t - b.t));
};
