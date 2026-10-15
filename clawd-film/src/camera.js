import * as THREE from 'three';
import { clamp, easeInOutCubic } from './engine.js';

// Keyframed camera: keys = [{t, pos:[x,y,z], look:[x,y,z], fov, roll}]
// Positions and look targets follow centripetal Catmull-Rom splines; time is remapped
// with a monotone curve so the camera eases in/out of each key smoothly.
export class CamPath {
  constructor(keys, { ease = true } = {}) {
    this.keys = keys;
    this.pos = new THREE.CatmullRomCurve3(keys.map(k => new THREE.Vector3(...k.pos)), false, 'centripetal');
    this.look = new THREE.CatmullRomCurve3(keys.map(k => new THREE.Vector3(...k.look)), false, 'centripetal');
    this.ease = ease;
  }
  u(t) {
    const K = this.keys, n = K.length;
    if (t <= K[0].t) return 0;
    if (t >= K[n - 1].t) return 1;
    let i = 0; while (t > K[i + 1].t) i++;
    let f = (t - K[i].t) / (K[i + 1].t - K[i].t);
    const e = K[i + 1].ease ?? (this.ease ? 'io' : 'lin');
    if (e === 'io') f = easeInOutCubic(f);
    else if (e === 'in') f = f * f * f;
    else if (e === 'out') f = 1 - Math.pow(1 - f, 3);
    else if (e === 'sine') f = -(Math.cos(Math.PI * f) - 1) / 2;
    return (i + f) / (n - 1);
  }
  apply(cam, t) {
    const u = clamp(this.u(t));
    cam.position.copy(this.pos.getPoint(u));
    const L = this.look.getPoint(u);
    cam.lookAt(L);
    const K = this.keys;
    // interpolate fov / roll linearly in key-space
    const x = u * (K.length - 1), i = Math.min(K.length - 2, Math.floor(x)), f = x - i;
    const fa = K[i].fov ?? 35, fb = K[i + 1].fov ?? fa;
    cam.fov = fa + (fb - fa) * f;
    const ra = K[i].roll ?? 0, rb = K[i + 1].roll ?? ra;
    cam.rotateZ(ra + (rb - ra) * f);
    cam.updateProjectionMatrix();
    return L;
  }
}
