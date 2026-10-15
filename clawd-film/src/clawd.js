import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { clamp } from './engine.js';

// Clawd proportions, measured from the reference sprite (1 unit = one sprite pixel).
// Body 8 wide, 5.7 tall; arms stick out 1.85 at 1.9 below the top; four legs per row 2.1 tall;
// eyes ~1 square, 1.6 in from each side. World scale: U.
export const U = 0.125;
export const DIM = {
  bodyW: 8, bodyH: 5.7, bodyD: 5.2,
  legH: 2.1, legW: 1.05, legD: 1.05, legX: [-3.45, -1.45, 1.45, 3.45], legZ: [-1.55, 1.55],
  armW: 1.85, armH: 1.9, armD: 2.6, armDrop: 1.9,
  eyeW: 1.0, eyeH: 1.15, eyeX: 2.4, eyeDrop: 1.4,
};
export const HEIGHT = (DIM.legH + DIM.bodyH) * U; // ~0.975

let shared = null;
export function clawdAssets() {
  if (shared) return shared;
  const D = DIM;
  shared = {
    body: new RoundedBoxGeometry(D.bodyW * U, D.bodyH * U, D.bodyD * U, 5, 0.32 * U),
    arm: new RoundedBoxGeometry(D.armW * U + 0.2 * U, D.armH * U, D.armD * U, 4, 0.24 * U),
    leg: new RoundedBoxGeometry(D.legW * U, D.legH * U + 0.3 * U, D.legD * U, 3, 0.2 * U),
    eye: new RoundedBoxGeometry(D.eyeW * U, D.eyeH * U, 0.5 * U, 3, 0.14 * U),
    clay: new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#D2725A'), roughness: 0.38, metalness: 0.0,
      clearcoat: 0.55, clearcoatRoughness: 0.28, sheen: 0.35, sheenRoughness: 0.5, sheenColor: new THREE.Color('#ffb59a'),
      envMapIntensity: 0.9,
    }),
    eyeMat: new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#0c0a09'), roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.4 }),
  };
  // legs: pivot at the top so they can be lifted / swung
  shared.leg.translate(0, -(D.legH * U + 0.3 * U) / 2 + 0.3 * U, 0);
  // arms: pivot at the inner edge (attached to the body side)
  shared.arm.translate((D.armW * U + 0.2 * U) / 2 - 0.2 * U, 0, 0);
  return shared;
}

let sharedLow = null;
export function clawdAssetsLow() {
  if (sharedLow) return sharedLow;
  const A = clawdAssets(), D = DIM;
  sharedLow = {
    ...A,
    body: new RoundedBoxGeometry(D.bodyW * U, D.bodyH * U, D.bodyD * U, 1, 0.32 * U),
    arm: new RoundedBoxGeometry(D.armW * U + 0.2 * U, D.armH * U, D.armD * U, 1, 0.24 * U),
    leg: new RoundedBoxGeometry(D.legW * U, D.legH * U + 0.3 * U, D.legD * U, 1, 0.2 * U),
    eye: new RoundedBoxGeometry(D.eyeW * U, D.eyeH * U, 0.5 * U, 1, 0.14 * U),
  };
  sharedLow.body.translate(0, 0, 0);
  sharedLow.leg.translate(0, -(D.legH * U + 0.3 * U) / 2 + 0.3 * U, 0);
  sharedLow.arm.translate((D.armW * U + 0.2 * U) / 2 - 0.2 * U, 0, 0);
  return sharedLow;
}

export class Clawd {
  constructor({ material, eyeMaterial, castShadow = true } = {}) {
    const A = clawdAssets(), D = DIM;
    this.root = new THREE.Group();          // placed on the ground
    this.hips = new THREE.Group();          // vertical bob / hop
    this.root.add(this.hips);
    this.top = new THREE.Group();           // squash & stretch pivot at body bottom
    this.top.position.y = D.legH * U;
    this.hips.add(this.top);
    const mat = material || A.clay;
    this.body = new THREE.Mesh(A.body, mat);
    this.body.position.y = D.bodyH * U / 2;
    this.top.add(this.body);

    this.eyes = [-1, 1].map(s => {
      const e = new THREE.Mesh(A.eye, eyeMaterial || A.eyeMat);
      e.userData.baseX = s * D.eyeX * U;
      e.position.set(e.userData.baseX, (D.bodyH - D.eyeDrop) * U, D.bodyD * U / 2 + 0.04 * U);
      this.top.add(e);
      return e;
    });
    this.arms = [-1, 1].map(s => {
      const pivot = new THREE.Group();
      pivot.position.set(s * D.bodyW * U / 2, (D.bodyH - D.armDrop - D.armH / 2) * U, 0);
      const m = new THREE.Mesh(A.arm, mat);
      m.scale.x = s; // mirror
      pivot.add(m);
      this.top.add(pivot);
      pivot.userData.side = s;
      return pivot;
    });
    this.legs = [];
    for (const z of D.legZ) for (const x of D.legX) {
      const m = new THREE.Mesh(A.leg, mat);
      m.position.set(x * U, D.legH * U, z * U);
      m.userData.base = m.position.clone();
      this.hips.add(m);
      this.legs.push(m);
    }
    this.root.traverse(o => { if (o.isMesh) { o.castShadow = castShadow; o.receiveShadow = true; } });
    this.pose({});
  }

  // all pose params default to rest
  pose({ squash = 1, lift = 0, blink = 0, lookX = 0, lookY = 0, squint = 0, armL = 0, armR = 0, armSwing = 0,
    walk = -1, walkStride = 1, legSpread = 0, tilt = 0, lean = 0, twist = 0, eyeScale = 1, legTuck = 0, wiggle = 0 }) {
    const D = DIM;
    // squash keeps volume
    const sx = 1 / Math.sqrt(Math.max(squash, 0.05));
    this.top.scale.set(sx, squash, sx);
    this.hips.position.y = lift;
    this.top.rotation.set(lean, twist, tilt + wiggle);
    // eyes
    const eh = clamp(1 - blink, 0.06, 1) * (1 - squint * 0.62) * eyeScale;
    for (const e of this.eyes) {
      e.scale.set(eyeScale * (1 + squint * 0.15), eh, 1);
      e.position.x = e.userData.baseX + lookX * 0.55 * U;
      e.position.y = (D.bodyH - D.eyeDrop) * U + lookY * 0.5 * U - squint * 0.1 * U;
    }
    // arms rotate around their attachment
    this.arms[0].rotation.z = -armL + Math.sin(armSwing) * 0.25;
    this.arms[1].rotation.z = armR + Math.sin(armSwing + Math.PI) * 0.25;
    // legs: crab gait; legs in alternating sets lift and swing
    this.legs.forEach((m, i) => {
      const b = m.userData.base;
      const set = (i + Math.floor(i / 4)) % 2;
      let y = b.y, rx = 0, rz = 0;
      if (walk >= 0) {
        const ph = walk * Math.PI * 2 + set * Math.PI;
        const up = Math.max(0, Math.sin(ph));
        y += up * 0.55 * U * walkStride;
        rz = Math.cos(ph) * 0.28 * walkStride;
      }
      const side = Math.sign(b.x);
      rz += side * legSpread * 0.5;
      m.position.set(b.x, y, b.z);
      // squash compresses legs a bit too
      m.scale.set(1, (1 - legTuck * 0.75) * (0.85 + 0.15 * squash), 1);
      m.rotation.set(rx, 0, rz);
    });
  }
}

// voxel description of Clawd (cube centres in world units at given voxel size), used for assembly effects
export function clawdVoxels(vs = 0.5) {
  const D = DIM, out = [];
  const addBox = (cx, cy, cz, w, h, d, part) => {
    const nx = Math.max(1, Math.round(w / vs)), ny = Math.max(1, Math.round(h / vs)), nz = Math.max(1, Math.round(d / vs));
    for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) for (let k = 0; k < nz; k++) {
      out.push({
        p: new THREE.Vector3(cx - w / 2 + (i + .5) * w / nx, cy - h / 2 + (j + .5) * h / ny, cz - d / 2 + (k + .5) * d / nz).multiplyScalar(U),
        s: new THREE.Vector3(w / nx, h / ny, d / nz).multiplyScalar(U), part,
      });
    }
  };
  addBox(0, D.legH + D.bodyH / 2, 0, D.bodyW, D.bodyH, D.bodyD, 'body');
  for (const s of [-1, 1]) addBox(s * (D.bodyW / 2 + D.armW / 2), D.legH + D.bodyH - D.armDrop - D.armH / 2, 0, D.armW, D.armH, D.armD, 'arm');
  for (const z of D.legZ) for (const x of D.legX) addBox(x, D.legH / 2, z, D.legW, D.legH, D.legD, 'leg');
  return out;
}
