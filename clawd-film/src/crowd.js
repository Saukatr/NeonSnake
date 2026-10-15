// Many Clawds drawn with one InstancedMesh per body part.
import * as THREE from 'three';
import { clawdAssets, clawdAssetsLow, DIM, U } from './clawd.js';
import { clamp } from './engine.js';

const _m = new THREE.Matrix4(), _r = new THREE.Matrix4(), _t = new THREE.Matrix4(), _p = new THREE.Matrix4();
const _q = new THREE.Quaternion(), _v = new THREE.Vector3(), _s = new THREE.Vector3(), _e = new THREE.Euler();
const ZERO = new THREE.Matrix4().makeScale(0, 0, 0);

export class Crowd {
  constructor(n, { material, eyeMaterial, castShadow = true, lowPoly = false } = {}) {
    const A = lowPoly ? clawdAssetsLow() : clawdAssets();
    this.n = n;
    this.group = new THREE.Group();
    const mk = (geo, mat, count) => {
      const m = new THREE.InstancedMesh(geo, mat, count);
      m.castShadow = castShadow; m.receiveShadow = true; m.frustumCulled = false;
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.group.add(m);
      return m;
    };
    const clay = material || A.clay;
    this.body = mk(A.body, clay, n);
    this.eyes = mk(A.eye, eyeMaterial || A.eyeMat, n * 2);
    this.arms = mk(A.arm, clay, n * 2);
    this.legs = mk(A.leg, clay, n * 8);
    this.colors = null;
  }
  enableColors() {
    for (const m of [this.body, this.arms, this.legs]) {
      m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(m.count * 3).fill(1), 3);
    }
    this.colors = true;
  }
  setColor(i, c) {
    this.body.instanceColor.setXYZ(i, c.r, c.g, c.b);
    for (let k = 0; k < 2; k++) this.arms.instanceColor.setXYZ(i * 2 + k, c.r, c.g, c.b);
    for (let k = 0; k < 8; k++) this.legs.instanceColor.setXYZ(i * 8 + k, c.r, c.g, c.b);
  }
  hide(i) {
    this.body.setMatrixAt(i, ZERO);
    for (let k = 0; k < 2; k++) { this.eyes.setMatrixAt(i * 2 + k, ZERO); this.arms.setMatrixAt(i * 2 + k, ZERO); }
    for (let k = 0; k < 8; k++) this.legs.setMatrixAt(i * 8 + k, ZERO);
  }
  // st: {x,y,z, rotY, rotX, rotZ, scale, squash, stretch, blink, walk, armL, armR, tuck, lookX}
  set(i, st) {
    const D = DIM;
    const sc = st.scale ?? 1, sq = st.squash ?? 1, stretch = st.stretch ?? 1;
    _e.set(st.rotX ?? 0, st.rotY ?? 0, st.rotZ ?? 0, 'YXZ');
    _q.setFromEuler(_e);
    _r.compose(_v.set(st.x, st.y + (st.lift ?? 0), st.z), _q, _s.set(sc, sc, sc));
    // top (squash pivot at body bottom)
    const sx = 1 / Math.sqrt(Math.max(sq, 0.05));
    _t.compose(_v.set(0, D.legH * U, 0), _q.identity(), _s.set(sx * stretch, sq, sx));
    const top = _p.multiplyMatrices(_r, _t);
    // body
    _m.makeTranslation(0, D.bodyH * U / 2, 0);
    this.body.setMatrixAt(i, _t.multiplyMatrices(top, _m));
    // eyes
    const eh = clamp(1 - (st.blink ?? 0), 0.06, 1) * (1 - (st.squint ?? 0) * 0.6);
    for (let k = 0; k < 2; k++) {
      const s = k ? 1 : -1;
      _m.compose(_v.set(s * D.eyeX * U + (st.lookX ?? 0) * 0.55 * U, (D.bodyH - D.eyeDrop) * U, D.bodyD * U / 2 + 0.04 * U), _q.identity(), _s.set(1, eh, 1));
      this.eyes.setMatrixAt(i * 2 + k, _t.multiplyMatrices(top, _m));
    }
    // arms
    for (let k = 0; k < 2; k++) {
      const s = k ? 1 : -1;
      const a = k ? (st.armR ?? 0) : -(st.armL ?? 0);
      _q.setFromAxisAngle(_v.set(0, 0, 1), a);
      _m.compose(_v.set(s * D.bodyW * U / 2, (D.bodyH - D.armDrop - D.armH / 2) * U, 0), _q, _s.set(s, 1, 1));
      this.arms.setMatrixAt(i * 2 + k, _t.multiplyMatrices(top, _m));
    }
    // legs (attached to root)
    const tuck = st.tuck ?? 0;
    let li = 0;
    for (const z of D.legZ) for (const x of D.legX) {
      const set = (li + Math.floor(li / 4)) % 2;
      let y = D.legH * U, rz = 0;
      if (st.walk !== undefined && st.walk >= 0) {
        const ph = st.walk * Math.PI * 2 + set * Math.PI;
        y += Math.max(0, Math.sin(ph)) * 0.55 * U;
        rz = Math.cos(ph) * 0.25;
      }
      _q.setFromAxisAngle(_v.set(0, 0, 1), rz);
      _m.compose(_v.set(x * U, y, z * U), _q, _s.set(1, (1 - tuck * 0.75) * (0.85 + 0.15 * sq), 1));
      this.legs.setMatrixAt(i * 8 + li, _t.multiplyMatrices(_r, _m));
      li++;
    }
  }
  commit() {
    for (const m of [this.body, this.eyes, this.arms, this.legs]) {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    }
  }
}
