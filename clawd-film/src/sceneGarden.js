// Scene B (19.92 - 46.93s): Clawd falls onto a floating garden island, trees bloom,
// the reflection in a terminal-shaped pond blinks on its own, climbs out, and the two
// Clawds divide like cells until the island is full of them.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import {
  clamp, lerp, smooth, smoother, easeOutCubic, easeInOutCubic, easeOutBack, spring, wobble, bump, rng, makeSky, envFromScene, noise1,
} from './engine.js';
import { Clawd, U, DIM } from './clawd.js';
import { Crowd } from './crowd.js';
import { Sparks } from './materials.js';
import { makeCloudSea, makePuffs } from './env.js';

export const TG = {
  start: 19.92, cut1: 20.95, impact: 21.8,
  trees: [22.55, 23.31, 24.06, 24.8, 25.57, 26.33],
  walk0: 26.75, walk1: 28.25, sit: 28.6,
  petal: 31.6, lean: 33.8, twinBlink: 36.43, startle: 36.85, breach: 37.55, twinLand: 38.3,
  splits: [39.06, 39.73, 40.4, 41.05, 41.7, 42.42],
  hops: [43.17, 43.93, 44.7], leave: 45.2, end: 46.93,
};
const SPLIT_DUR = 0.42;
const L = new THREE.Vector3(-2.3, 0, 1.7);          // landing spot
const PC = new THREE.Vector3(1.5, 0, -0.35);        // pond centre
const PW = 3.6, PD = 2.3;
const S = new THREE.Vector3(1.25, 0, PC.z - PD / 2 - 0.5);   // sitting spot (north bank, facing +z)
const B = new THREE.Vector3(S.x + 1.35, 0, S.z - 0.15);      // twin lands here
const WP = new THREE.Vector3(-1.1, 0, -2.3);        // walk waypoint around the pond
const TREES = [[-4.0, -1.2, 1.15, 1], [-2.3, -3.9, 0.95, 2], [3.9, -3.0, 1.35, 3], [4.4, 1.9, 1.05, 4], [-4.3, 2.8, 0.8, 5], [0.6, 3.9, 0.9, 6]];

const islandR = th => 6.0 * (1 + 0.05 * Math.sin(3 * th + 1) + 0.035 * Math.sin(7 * th + 2) + 0.02 * Math.sin(13 * th + 0.5));
const inPond = (x, z, m = 0) => Math.abs(x - PC.x) < PW / 2 + m && Math.abs(z - PC.z) < PD / 2 + m;

function roundedRectShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function setLayer(obj, layer) { obj.traverse(o => o.layers.set(layer)); }

export const sceneGarden = {
  start: TG.start, end: TG.end,
  build(pipe) {
    const R = rng(11);
    const s = this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(32, pipe.W / pipe.H, 0.05, 2000);
    this.cam.layers.enable(1);

    const sunDir = new THREE.Vector3(0.62, 0.2, -0.76).normalize();
    this.sunDir = sunDir;
    const skyOpts = { top: '#2f5fa6', mid: '#e9a27c', bottom: '#f6c49c', sunDir, sunColor: '#fff0d8', sunSize: 0.9994, clouds: 0.45, cloudColor: '#fff6ee' };
    this.sky = makeSky(skyOpts); this.sky.material.uniforms.intensity.value = 0.8; s.add(this.sky);
    const envScene = new THREE.Scene(); envScene.add(makeSky({ ...skyOpts, clouds: 0 }));
    s.environment = envFromScene(pipe.renderer, envScene);
    s.environmentIntensity = 0.55;
    this.sea = makeCloudSea({ y: -34, top: '#fff1e2', shade: '#8b8fb8', horizon: '#ffd7b0', sun: [sunDir.x, sunDir.z], scale: 0.006, fogNear: 200, fogFar: 1300 });
    s.add(this.sea);
    this.puffs = makePuffs(s, { n: 34, seed: 9, rMin: 40, rMax: 300, yMin: -30, yMax: -6, color: '#fff3ea', opacity: [0.4, 0.8] });
    // puffs along the fall column (streak past the falling camera)
    this.fallPuffs = makePuffs(s, { n: 14, seed: 21, rMin: 6, rMax: 14, yMin: 6, yMax: 26, sMin: 4, sMax: 9, color: '#fff6f0', opacity: [0.35, 0.6], center: L });

    // ---- lights
    const sun = this.sunLight = new THREE.DirectionalLight('#ffe2bf', 3.1);
    sun.position.copy(sunDir).multiplyScalar(30);
    sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
    Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 70 });
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03; sun.shadow.radius = 3;
    sun.shadow.camera.layers.enable(1);
    s.add(sun, sun.target);
    s.add(new THREE.HemisphereLight('#bcd4ff', '#6b7a3c', 0.55));
    const fill = new THREE.DirectionalLight('#a9c1ff', 0.5); fill.position.set(-6, 4, 6); s.add(fill);

    // ---- island top
    const N = 160;
    const shape = new THREE.Shape();
    for (let i = 0; i <= N; i++) { const th = i / N * Math.PI * 2, r = islandR(th); i ? shape.lineTo(Math.cos(th) * r, Math.sin(th) * r) : shape.moveTo(r, 0); }
    const topGeo = new THREE.ShapeGeometry(shape, 1); topGeo.rotateX(-Math.PI / 2);
    const top = new THREE.Mesh(topGeo, new THREE.MeshStandardMaterial({ color: '#4b6a2e', roughness: 1 }));
    top.receiveShadow = true; s.add(top);
    // underside: layered rock
    const J = 16, NS = 120;
    const pos = [], col = [];
    const strata = ['#6a4a35', '#a65e3f', '#8a4a33', '#c47a55', '#7a4430', '#b86e4c', '#5d3a2a'].map(c => new THREE.Color(c));
    const grid = [];
    for (let j = 0; j <= J; j++) {
      const f = j / J; grid.push([]);
      for (let i = 0; i <= NS; i++) {
        const th = i / NS * Math.PI * 2;
        const n = noise1(th * 5 + j * 1.3, 4) * 0.5 + noise1(th * 13 + j * 2.1, 8) * 0.25;
        const r = j === 0 ? islandR(th) : islandR(th) * Math.max(0.03, 1 - Math.pow(f, 1.25) * 0.98) * (1 + n * 0.12 * f) ;
        const y = j === 0 ? 0 : -0.25 - f * 6.2 - Math.max(0, n) * 0.4 * f;
        grid[j].push(new THREE.Vector3(Math.cos(th) * r, y, Math.sin(th) * r));
      }
    }
    for (let j = 0; j < J; j++) for (let i = 0; i < NS; i++) {
      const a = grid[j][i], b = grid[j][i + 1], c = grid[j + 1][i], d = grid[j + 1][i + 1];
      const band = j === 0 ? new THREE.Color('#3f5a27') : strata[Math.floor((j + noise1(i * 0.37, 3) * 1.4 + 7) % strata.length)];
      for (const v of [a, c, b, b, c, d]) { pos.push(v.x, v.y, v.z); col.push(band.r, band.g, band.b); }
    }
    const ug = new THREE.BufferGeometry();
    ug.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    ug.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    ug.computeVertexNormals();
    const under = new THREE.Mesh(ug, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92, flatShading: true }));
    under.castShadow = true; under.receiveShadow = true; s.add(under);
    // hanging roots / crystals under the island
    const rootMat = new THREE.MeshStandardMaterial({ color: '#5a3d2c', roughness: 0.9, flatShading: true });
    for (let i = 0; i < 26; i++) {
      const th = R() * Math.PI * 2, rr = islandR(th) * (0.2 + R() * 0.6);
      const len = 0.6 + R() * 2.2;
      const m = new THREE.Mesh(new THREE.ConeGeometry(0.06 + R() * 0.1, len, 5), rootMat);
      const depth = -0.4 - (1 - rr / 6) * 5.6;
      m.position.set(Math.cos(th) * rr, depth - len / 2 + 0.2, Math.sin(th) * rr); m.rotation.x = Math.PI + (R() - .5) * 0.3; m.rotation.z = (R() - .5) * 0.3;
      s.add(m);
    }

    // ---- grass
    const bladeGeo = (() => {
      const g = new THREE.BufferGeometry();
      const P = [], C = [], NRM = [], UV = [];
      const segs = 4;
      for (let k = 0; k <= segs; k++) {
        const v = k / segs, w = 0.045 * (1 - v * 0.92);
        const bend = v * v * 0.25;
        P.push(-w / 2, v, bend, w / 2, v, bend);
        const c0 = new THREE.Color('#2f4a1d').lerp(new THREE.Color('#c9d27a'), Math.pow(v, 1.3));
        C.push(c0.r, c0.g, c0.b, c0.r, c0.g, c0.b);
        NRM.push(0, 1, 0, 0, 1, 0); UV.push(0, v, 1, v);
      }
      const I = [];
      for (let k = 0; k < segs; k++) { const a = k * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(C, 3));
      g.setAttribute('normal', new THREE.Float32BufferAttribute(NRM, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(UV, 2));
      g.setIndex(I);
      return g;
    })();
    this.grassU = { time: { value: 0 }, impact: { value: new THREE.Vector4(L.x, L.z, TG.impact, 0) }, pusher: { value: new THREE.Vector3(0, 0, 0) } };
    const grassMat = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.75 });
    grassMat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, this.grassU);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nuniform float time; uniform vec4 impact; uniform vec3 pusher;')
        .replace('#include <project_vertex>', `
          vec4 wp = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
          float hh = uv.y; float h2 = hh*hh;
          float gust = sin(time*0.9 + wp.x*0.25 + wp.z*0.2)*0.5+0.5;
          wp.x += (sin(time*2.1 + wp.x*1.7 + wp.z*1.3)*0.035 + gust*0.05) * h2;
          wp.z += (cos(time*1.7 + wp.x*1.1 - wp.z*1.9)*0.03 + gust*0.02) * h2;
          vec2 d = wp.xz - impact.xy; float r = length(d) + 1e-4; float a = time - impact.z;
          if (a > 0.) {
            float ring = exp(-pow(r - a*5.5, 2.)*1.5) * exp(-a*1.2);
            float flat0 = exp(-r*r*1.2) * exp(-a*0.8);
            wp.xz += d/r * (ring*0.25 + flat0*0.18) * h2;
            wp.y -= flat0*0.12*hh;
          }
          vec2 dp = wp.xz - pusher.xy; float rp = length(dp) + 1e-4;
          wp.xz += dp/rp * exp(-rp*rp*6.)*0.12*h2*pusher.z;
          vec4 mvPosition = viewMatrix * wp;
          gl_Position = projectionMatrix * mvPosition;`);
    };
    const NG = 26000;
    const grass = new THREE.InstancedMesh(bladeGeo, grassMat, NG);
    grass.receiveShadow = true; grass.frustumCulled = false;
    grass.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(NG * 3), 3);
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), SC = new THREE.Vector3();
    let gi = 0;
    while (gi < NG) {
      const th = R() * Math.PI * 2, r = Math.sqrt(R()) * (islandR(th) - 0.12);
      const x = Math.cos(th) * r, z = Math.sin(th) * r;
      if (inPond(x, z, 0.12)) continue;
      const h = 0.1 + R() * 0.18 + (r > 4.8 ? R() * 0.12 : 0);
      Q.setFromAxisAngle(V.set(0, 1, 0), R() * Math.PI * 2);
      M.compose(V.set(x, 0, z), Q, SC.set(1, h, 1));
      grass.setMatrixAt(gi, M);
      const k = 0.85 + R() * 0.3; const hue = R();
      grass.instanceColor.setXYZ(gi, k * (0.95 + hue * 0.12), k, k * (0.9 - hue * 0.1));
      gi++;
    }
    s.add(grass);

    // ---- flowers
    const NF = 420;
    this.flowers = new THREE.InstancedMesh(new RoundedBoxGeometry(1, 1, 1, 1, 0.2), new THREE.MeshStandardMaterial({ roughness: 0.6 }), NF);
    this.flowers.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(NF * 3), 3);
    this.flowerData = [];
    const fcols = ['#fff3e0', '#f7c6b5', '#D97757', '#ffd36e', '#f4a28c', '#ffffff'].map(c => new THREE.Color(c));
    while (this.flowerData.length < NF) {
      const th = R() * Math.PI * 2, r = Math.sqrt(R()) * (islandR(th) - 0.3);
      const x = Math.cos(th) * r, z = Math.sin(th) * r;
      if (inPond(x, z, 0.3)) continue;
      const i = this.flowerData.length;
      this.flowerData.push({ x, z, y: 0.12 + R() * 0.16, s: 0.045 + R() * 0.035, t0: TG.trees[0] + Math.hypot(x - L.x, z - L.z) * 0.18 + R() * 0.3, rot: R() * 3 });
      const c = fcols[Math.floor(R() * fcols.length)]; this.flowers.instanceColor.setXYZ(i, c.r, c.g, c.b);
    }
    this.flowers.castShadow = true; this.flowers.frustumCulled = false; s.add(this.flowers);

    // ---- trees
    const leafCols = ['#f4b6a0', '#e98d73', '#f7d9c4', '#D97757', '#ffcfb5', '#fff1e6', '#c96a50'];
    const leafMats = leafCols.map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.55 }));
    const trunkMat = new THREE.MeshStandardMaterial({ color: '#6e4a38', roughness: 0.85, flatShading: true });
    const leafGeo = new RoundedBoxGeometry(1, 1, 1, 2, 0.16);
    this.trees = TREES.map(([x, z, h, seed], ti) => {
      const r = rng(100 + seed);
      const g = new THREE.Group(); g.position.set(x, 0, z); s.add(g);
      const trunk = new THREE.Group(); g.add(trunk);
      const pts = []; let p = new THREE.Vector3(); const lean = new THREE.Vector3((r() - .5) * 0.5, 1, (r() - .5) * 0.5).normalize();
      for (let k = 0; k < 4; k++) { pts.push(p.clone()); p = p.clone().addScaledVector(lean.clone().add(new THREE.Vector3((r() - .5) * 0.4, 0, (r() - .5) * 0.4)).normalize(), 0.55 * h); }
      pts.push(p.clone());
      const segs = [];
      for (let k = 0; k < 4; k++) {
        const a = pts[k], b = pts[k + 1], len = a.distanceTo(b);
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.11 * h * (1 - k * 0.2) * 0.75, 0.11 * h * (1 - k * 0.2), len * 1.08, 7), trunkMat);
        m.position.copy(a).add(b).multiplyScalar(0.5);
        m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
        m.castShadow = true; trunk.add(m); segs.push(m);
      }
      // canopy clusters: top + two branch ends
      const centres = [pts[4].clone().add(new THREE.Vector3(0, 0.25 * h, 0))];
      for (const k of [2, 3]) { const sd = (k === 2 ? 1 : -1); centres.push(pts[k].clone().add(new THREE.Vector3(sd * (0.55 + r() * 0.3) * h, 0.35 * h, (r() - .5) * 0.6 * h))); }
      const leaves = [];
      centres.forEach((c, ci) => {
        const n = ci === 0 ? 16 : 9;
        for (let k = 0; k < n; k++) {
          const sz = (0.22 + r() * 0.3) * h * (ci === 0 ? 1.15 : 0.9);
          const off = new THREE.Vector3((r() - .5) * 1.1, (r() - .35) * 0.65, (r() - .5) * 1.1).multiplyScalar(h * (ci === 0 ? 1 : 0.7));
          const m = new THREE.Mesh(leafGeo, leafMats[Math.floor(r() * leafMats.length)]);
          m.position.copy(c).add(off); m.rotation.set(r() * 0.6, r() * 3, r() * 0.6);
          m.castShadow = true; m.receiveShadow = true;
          m.userData = { s: sz, d: 0.15 + ci * 0.12 + r() * 0.35, base: m.position.clone() };
          g.add(m); leaves.push(m);
        }
      });
      return { g, trunk, leaves, t0: TG.trees[ti], h, centres, x, z };
    });

    // ---- pond (terminal-shaped mirror)
    const pshape = roundedRectShape(PW, PD, 0.55);
    const pg = new THREE.ShapeGeometry(pshape, 12);
    this.ripples = [new THREE.Vector4(1.2, -0.6, TG.petal, 0.6), new THREE.Vector4(S.x, S.z + 1.0, TG.breach, 1.6), new THREE.Vector4(S.x, S.z + 0.9, TG.startle, 0.5), new THREE.Vector4(0, 0, -100, 0)];
    this.water = new Reflector(pg, {
      textureWidth: Math.round(pipe.W * 0.6), textureHeight: Math.round(pipe.H * 0.6), clipBias: 0.002, color: new THREE.Color('#123038'),
      shader: {
        uniforms: { color: { value: new THREE.Color('#123038') }, tDiffuse: { value: null }, textureMatrix: { value: null }, time: { value: 0 }, ripples: { value: this.ripples }, sunDir: { value: sunDir } },
        vertexShader: /* glsl */`uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW;
          void main(){ vUv = textureMatrix*vec4(position,1.); vW = (modelMatrix*vec4(position,1.)).xyz; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
        fragmentShader: /* glsl */`uniform vec3 color; uniform sampler2D tDiffuse; uniform float time; uniform vec4 ripples[4]; uniform vec3 sunDir; varying vec4 vUv; varying vec3 vW;
          void main(){
            vec2 w = vW.xz;
            vec2 off = vec2(sin(w.x*6.+time*1.3)+sin(w.y*4.7-time*1.1), cos(w.y*5.5+time*1.6)+cos(w.x*4.1+time*0.9))*0.0018;
            for (int i=0;i<4;i++){
              vec4 r = ripples[i]; float a = time - r.z;
              if (a > 0. && a < 6.) {
                vec2 dd = w - r.xy; float d = length(dd) + 1e-4;
                float x = d - a*0.9;
                off += dd/d * sin(x*30.) * exp(-x*x*10.) * exp(-a*0.8) * r.w * 0.03;
              }
            }
            vec3 refl = texture2DProj(tDiffuse, vUv + vec4(off*vUv.w*1.0, 0., 0.)).rgb;
            vec3 V = normalize(cameraPosition - vW);
            float fr = 0.12 + 0.88*pow(1. - max(V.y, 0.), 3.);
            vec3 N = normalize(vec3(-off.x*60., 1., -off.y*60.));
            float sp = pow(max(dot(reflect(-sunDir, N), V), 0.), 300.) * 6.;
            vec3 c = mix(color, refl, 0.55 + 0.4*fr) + sp*vec3(1.,.9,.75);
            gl_FragColor = vec4(c, 1.);
          }`,
      },
    });
    this.water.rotation.x = -Math.PI / 2; this.water.position.set(PC.x, 0.035, PC.z);
    this.water.camera.layers.set(0); this.water.camera.layers.enable(2);
    s.add(this.water);
    // pond rim stones
    const stoneMats = ['#c8bba9', '#a8998a', '#ddd2c3', '#9b8d80'].map(c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.8 }));
    const stoneGeo = new RoundedBoxGeometry(1, 1, 1, 2, 0.22);
    const rim = roundedRectShape(PW + 0.28, PD + 0.28, 0.65).getSpacedPoints(46);
    rim.forEach((p, i) => {
      if (i === rim.length - 1) return;
      const m = new THREE.Mesh(stoneGeo, stoneMats[Math.floor(R() * 4)]);
      const sz = 0.16 + R() * 0.16;
      m.scale.set(sz * (1.1 + R() * 0.6), sz * 0.4, sz);
      m.position.set(PC.x + p.x, sz * 0.18, PC.z - p.y);
      m.rotation.y = R() * 3; m.castShadow = true; m.receiveShadow = true;
      s.add(m);
    });
    // lily-pad-like glowing code bars floating in the pond (callback to the terminal)
    const barCols = ['#9b9a97', '#D97757', '#8fbf73', '#7aa2f7', '#e8e2d6'];
    this.pondBars = [];
    for (let i = 0; i < 0; i++) {
      const m = new THREE.Mesh(new RoundedBoxGeometry(1, 1, 1, 1, 0.3), new THREE.MeshBasicMaterial({ color: new THREE.Color(barCols[i % 5]).multiplyScalar(0.8) }));
      const len = 0.25 + R() * 0.6;
      m.scale.set(len, 0.012, 0.07);
      m.userData = { x: PC.x - PW / 2 + 0.4 + R() * (PW - 0.8), z: PC.z + PD / 2 - 0.35 - (i % 4) * 0.13 - Math.floor(i / 4) * 0.02, ph: R() * 6 };
      s.add(m); this.pondBars.push(m);
    }

    // ---- Clawd (layer 1: main camera only) and its mirror twin (layer 2: reflection only)
    this.clawd = new Clawd(); setLayer(this.clawd.root, 1); s.add(this.clawd.root);
    this.twinR = new Clawd(); setLayer(this.twinR.root, 2); s.add(this.twinR.root);
    this.twin = new Clawd(); s.add(this.twin.root);      // physical twin after the breach

    // ---- crowd
    this.buildCrowd(R);
    this.crowd = new Crowd(128);
    this.crowd.enableColors();
    for (let i = 0; i < 128; i++) { const k = 0.93 + R() * 0.12; this.crowd.setColor(i, new THREE.Color(k, k * (0.97 + R() * 0.05), k)); }
    s.add(this.crowd.group);

    // ---- particles
    this.dust = new Sparks(160, { additive: false });
    this.dustP = Array.from({ length: 160 }, () => { const a = R() * Math.PI * 2; return { a, v: 1.2 + R() * 2.4, up: 0.4 + R() * 1.2, life: 0.8 + R() * 0.9, sz: 3 + R() * 6 }; });
    s.add(this.dust.points);
    this.splash = new Sparks(220, { additive: false });
    this.splashP = Array.from({ length: 220 }, () => { const a = R() * Math.PI * 2; return { a, v: 0.4 + R() * 1.6, up: 1.5 + R() * 3.2, life: 0.6 + R() * 0.7, sz: 0.8 + R() * 2 }; });
    s.add(this.splash.points);
    this.pollen = new Sparks(240);
    this.pollenP = Array.from({ length: 240 }, () => ({ p: new THREE.Vector3((R() - .5) * 12, 0.2 + R() * 3, (R() - .5) * 12), ph: R() * 10, sz: 0.5 + R() * 1.2 }));
    s.add(this.pollen.points);
    // petals
    const NP = 180;
    this.petals = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 0.7), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.6 }), NP);
    this.petals.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(NP * 3), 3);
    this.petalP = [];
    const pcols = ['#f7c6b5', '#fff1e6', '#f4a28c', '#ffd9c7'].map(c => new THREE.Color(c));
    for (let i = 0; i < NP; i++) {
      const tr = this.trees[i % this.trees.length];
      const c = tr.centres[0];
      this.petalP.push({ tr, start: new THREE.Vector3(tr.x + c.x + (R() - .5) * 1.4 * tr.h, c.y + R() * 0.4, tr.z + c.z + (R() - .5) * 1.4 * tr.h), t0: tr.t0 + 1.0 + R() * 22, fall: 0.25 + R() * 0.2, ph: R() * 6, s: 0.05 + R() * 0.04, drift: new THREE.Vector3(0.25 + R() * 0.2, 0, 0.12 + R() * 0.15) });
      const cc = pcols[i % 4]; this.petals.instanceColor.setXYZ(i, cc.r, cc.g, cc.b);
    }
    this.petals.frustumCulled = false; this.petals.castShadow = false; s.add(this.petals);

    // ---- audio cues
    this.cues = [{ t: TG.start + 0.05, type: 'fallWhoosh' }, { t: TG.cut1, type: 'fallWhoosh2' }, { t: TG.impact, type: 'impact' }];
    TG.trees.forEach(t => this.cues.push({ t, type: 'treeGrow' }));
    this.cues.push({ t: TG.walk0, type: 'steps', dur: TG.walk1 - TG.walk0 }, { t: TG.sit, type: 'sit' }, { t: TG.petal, type: 'drip' }, { t: TG.twinBlink, type: 'blinkTwin' }, { t: TG.startle, type: 'startle' }, { t: TG.breach, type: 'splash' }, { t: TG.twinLand, type: 'land' });
    TG.splits.forEach((t, g) => this.cues.push({ t, type: 'split', g: g + 2 }));
    TG.hops.forEach(t => this.cues.push({ t, type: 'crowdHop' }));
    this.cues.push({ t: TG.leave, type: 'stampede' });
  },

  buildCrowd(R) {
    // 128 target spots spread over the island, then a kd-tree so every split sends the
    // two halves toward the centroids of their eventual descendants.
    const pts = [];
    const sp = 0.84;
    for (let gx = -7; gx <= 7; gx += sp) for (let gz = -7; gz <= 7; gz += sp * 0.87) {
      const x = gx + ((Math.round(gz / (sp * 0.87)) & 1) ? sp / 2 : 0) + (R() - .5) * 0.12, z = gz + (R() - .5) * 0.12;
      const th = Math.atan2(z, x);
      if (Math.hypot(x, z) > islandR(th) - 0.4) continue;
      if (inPond(x, z, 0.45)) continue;
      if (TREES.some(([tx, tz]) => Math.hypot(x - tx, z - tz) < 0.62)) continue;
      pts.push(new THREE.Vector3(x, 0, z));
    }
    // keep 128, dropping the outermost extras
    pts.sort((a, b) => a.length() - b.length());
    console.log('crowd spots', pts.length);
    while (pts.length < 128) pts.push(pts[pts.length % 40].clone().add(new THREE.Vector3(0.3, 0, 0.3)));
    const leaves = pts.slice(0, 128);
    const nodes = [];   // nodes[d][k] = position
    for (let d = 0; d <= 7; d++) nodes.push(new Array(1 << d));
    const rec = (arr, d, k) => {
      const c = arr.reduce((a, p) => a.add(p), new THREE.Vector3()).divideScalar(arr.length);
      nodes[d][k] = c;
      if (d === 7) { nodes[d][k] = arr[0].clone(); return; }
      const ex = (f) => Math.max(...arr.map(f)) - Math.min(...arr.map(f));
      const ax = ex(p => p.x) > ex(p => p.z) ? 'x' : 'z';
      const sorted = arr.slice().sort((a, b) => a[ax] - b[ax]);
      rec(sorted.slice(0, arr.length / 2), d + 1, k * 2);
      rec(sorted.slice(arr.length / 2), d + 1, k * 2 + 1);
    };
    rec(leaves, 0, 0);
    // generation 1 = Clawd (sitting spot) and the twin (landing spot)
    const [a, b] = nodes[1];
    if (a.distanceTo(S) + b.distanceTo(B) <= a.distanceTo(B) + b.distanceTo(S)) { nodes[1][0] = S.clone(); nodes[1][1] = B.clone(); this.clawdIsNode = 0; }
    else { nodes[1][0] = B.clone(); nodes[1][1] = S.clone(); this.clawdIsNode = 1; }
    // keep intermediate centroids out of the pond and trees
    for (let d = 2; d < 7; d++) nodes[d] = nodes[d].map(p => {
      const q = p.clone();
      if (inPond(q.x, q.z, 0.4)) {
        const dx = q.x - PC.x, dz = q.z - PC.z;
        const px = PW / 2 + 0.5 - Math.abs(dx), pz = PD / 2 + 0.5 - Math.abs(dz);
        if (px < pz) q.x += Math.sign(dx || 1) * px; else q.z += Math.sign(dz || 1) * pz;
      }
      return q;
    });
    this.nodes = nodes;
    this.leafR = leaves.map(p => p.length());
    this.leaveT = leaves.map((p, i) => TG.leave + 0.15 + (1 - p.length() / 6) * 0.25 + R() * 0.9);
  },

  // main Clawd state
  clawdState(t) {
    const st = { pos: L.clone(), rotY: 0.35, P: {} };
    const P = st.P;
    const fallU = clamp((t - TG.start) / (TG.impact - TG.start));
    if (t < TG.impact) {
      st.pos.y = 22 * (1 - fallU * fallU);
      P.armL = P.armR = 1.1; P.armSwing = t * 14; P.eyeScale = 1.25; P.squash = 1.08; P.legSpread = 0.25;
      st.rotX = Math.sin(t * 2.3) * 0.25; st.rotZ = Math.sin(t * 1.7) * 0.2; st.rotY = 0.35 + (t - TG.start) * 0.8;
      return st;
    }
    const a = t - TG.impact;
    P.squash = 1 - 0.42 * Math.exp(-a * 5) * Math.cos(a * 18);
    P.legTuck = 0.5 * Math.exp(-a * 6);
    P.blink = bump(t, 22.2, 22.4) + bump(t, 24.4, 24.55) + bump(t, 26.0, 26.15);
    P.lookX = smooth(22.6, 22.8, t) * -1 + smooth(23.3, 23.5, t) * 2 - smooth(24.1, 24.3, t) * 1.5 + smooth(24.8, 25.0, t) * 0.5;
    P.lookY = 0.4 * bump(t, 22.4, 26.0);
    st.rotY = 0.35 + 0.5 * Math.sin(Math.min(a, 4.5) * 0.7) * smooth(22.4, 23, t);
    // happy hop when the last tree blooms
    const hopA = t - 26.0;
    if (hopA > 0 && hopA < 0.5) { st.pos.y = Math.sin(Math.PI * hopA / 0.5) * 0.35; P.squash = 1.12; P.armL = P.armR = 0.9; }
    P.squash *= 1 - 0.18 * wobble(t - 26.5, 3, 0.3);
    // walk around the pond to the sitting spot
    if (t > TG.walk0) {
      const w = clamp((t - TG.walk0) / (TG.walk1 - TG.walk0));
      const e = easeInOutCubic(w);
      const path = new THREE.CatmullRomCurve3([L, new THREE.Vector3(-1.9, 0, -0.6), WP, new THREE.Vector3(0.1, 0, -2.45), S]);
      st.pos.copy(path.getPoint(e));
      const tan = path.getTangent(Math.min(e, 0.999));
      const moveY = Math.atan2(tan.x, tan.z);
      const turn = smooth(TG.walk1 - 0.15, TG.sit, t);
      st.rotY = lerp(moveY, 0, turn);
      if (w < 1) { P.walk = (t - TG.walk0) * 4.2; P.lift = Math.abs(Math.sin(P.walk * Math.PI * 2)) * 0.015; P.wiggle = Math.sin(P.walk * Math.PI * 2) * 0.03; }
      P.lookX = 0; P.lookY = 0;
    }
    // sit at the bank
    const sit = smooth(TG.sit, TG.sit + 0.5, t);
    if (t > TG.sit) {
      P.legTuck = sit * 0.62;
      P.lift = -DIM.legH * U * 0.62 * 0.8 * sit;
      P.squash = 1 - 0.1 * wobble(t - TG.sit - 0.3, 2.5, 0.3);
      P.lookY = -0.6 * sit;
      P.blink = bump(t, 30.2, 30.38) + bump(t, 33.0, 33.17) + bump(t, 35.1, 35.27);
      P.lean = 0.12 * sit + 0.12 * smooth(TG.lean, TG.lean + 0.8, t);
      P.lookX = 0.3 * Math.sin((t - TG.sit) * 0.6) * (1 - smooth(TG.lean, TG.lean + 0.5, t));
      // petal lands: Clawd follows it
      P.lookX += -0.6 * bump(t, TG.petal - 0.8, TG.petal + 1.5);
      // startled by the twin's blink
      const sa = t - TG.startle;
      if (sa > 0) {
        P.eyeScale = 1 + 0.35 * Math.exp(-sa * 1.5) * (sa < 1.2 ? 1 : 0.3);
        st.pos.y += Math.max(0, Math.sin(Math.PI * clamp(sa / 0.35))) * 0.22;
        st.pos.z -= 0.15 * smooth(TG.startle, TG.startle + 0.3, t);
        P.lean = lerp(P.lean, -0.15, smooth(TG.startle, TG.startle + 0.2, t));
        P.armL = P.armR = 0.9 * bump(t, TG.startle, TG.startle + 0.9);
        P.lookY = lerp(-0.6, 0, smooth(TG.startle, TG.startle + 0.3, t));
        // follow the twin with its eyes as it lands to the right
        P.lookX = smooth(TG.breach, TG.twinLand, t) * 1.0;
        P.legTuck = lerp(P.legTuck, 0, smooth(TG.startle, TG.startle + 0.4, t));
        P.lift = lerp(P.lift, 0, smooth(TG.startle, TG.startle + 0.4, t));
      }
      // turn towards the twin
      st.rotY = lerp(0, 0.6, smooth(TG.twinLand - 0.2, TG.twinLand + 0.4, t));
    }
    return st;
  },

  crowdNodeState(d, k, t) {
    // position & motion of node k at depth d
    return this.nodes[d][k];
  },

  update(t, lt, pipe) {
    const s = this.scene;
    this.grassU.time.value = t;
    this.sky.material.uniforms.time.value = t;
    this.sea.material.uniforms.time.value = t;
    this.water.material.uniforms.time.value = t;

    // ---- main Clawd + twins
    const cs = this.clawdState(t);
    const crowdOn = t >= TG.splits[0];
    this.clawd.root.visible = !crowdOn;
    this.clawd.root.position.copy(cs.pos);
    this.clawd.root.rotation.set(cs.rotX || 0, cs.rotY, cs.rotZ || 0);
    this.clawd.pose(cs.P);
    this.grassU.pusher.value.set(cs.pos.x, cs.pos.z, t > TG.impact && !crowdOn ? 1 : 0);
    // mirror twin mimics Clawd except for the blink / glance
    const tw = { ...cs.P };
    tw.blink = Math.max(tw.blink || 0, bump(t, TG.twinBlink, TG.twinBlink + 0.2));
    if (t > TG.twinBlink - 0.6 && t < TG.startle) { tw.lookX = smooth(TG.twinBlink - 0.6, TG.twinBlink - 0.3, t) * 0.8; tw.lookY = -0.6; }
    if (t >= TG.startle) { tw.lookX = 0.8; tw.lookY = -0.6; tw.eyeScale = 1; tw.armL = tw.armR = 0; tw.legTuck = 0.62; tw.lift = -DIM.legH * U * 0.62 * 0.8; tw.lean = 0.24; }
    this.twinR.root.visible = t < TG.breach && !crowdOn;
    this.twinR.root.position.copy(t >= TG.startle ? S : cs.pos);
    this.twinR.root.rotation.set(cs.rotX || 0, t >= TG.startle ? 0 : cs.rotY, cs.rotZ || 0);
    this.twinR.pose(tw);
    // physical twin: backflip out of the water onto the bank
    const ba = t - TG.breach;
    this.twin.root.visible = ba > 0 && !crowdOn;
    if (this.twin.root.visible) {
      const f = clamp(ba / (TG.twinLand - TG.breach));
      const start = new THREE.Vector3(S.x, -0.9, S.z + 0.95);
      const p = start.clone().lerp(B, easeOutCubic(f)); p.y = lerp(-0.9, 0, f) + Math.sin(Math.PI * f) * 1.3;
      this.twin.root.position.copy(p);
      this.twin.root.rotation.set(-Math.PI * 2 * easeInOutCubic(f), Math.PI * (1 - easeOutCubic(f)) * 0 - 0.6 * smooth(TG.twinLand, TG.twinLand + 0.4, t), 0);
      const la = t - TG.twinLand;
      this.twin.pose({ squash: la > 0 ? 1 - 0.3 * wobble(la, 3, 0.3) : 1.15, legTuck: f < 1 ? 0.3 : 0, armL: f < 1 ? 1 : 0.3 * bump(t, 38.5, 39.0), armR: f < 1 ? 1 : 0.3 * bump(t, 38.5, 39.0), lookX: -1 * smooth(TG.twinLand, TG.twinLand + 0.3, t), blink: bump(t, 38.65, 38.8) });
    }

    // ---- crowd (mitosis)
    const C = this.crowd;
    if (crowdOn) {
      C.group.visible = true;
      let G = 1; for (let g = 0; g < TG.splits.length; g++) if (t >= TG.splits[g]) G = g + 2;
      const n = 1 << G;
      const tsG = TG.splits[G - 2];
      const nextSplit = TG.splits[G - 1];
      const camP = this.cam.position;
      for (let i = 0; i < 128; i++) {
        if (i >= n) { C.hide(i); continue; }
        const tgt = this.nodes[G][i];
        const par = this.nodes[G - 1][i >> 1];
        const f = clamp((t - tsG) / SPLIT_DUR);
        const e = easeInOutCubic(f);
        const st = { x: lerp(par.x, tgt.x, e), y: Math.sin(Math.PI * f) * (0.25 + 0.25 * par.distanceTo(tgt)), z: lerp(par.z, tgt.z, e) };
        const side = (i & 1) ? 1 : -1;
        st.squash = f < 1 ? 1 + 0.15 * Math.sin(Math.PI * f) : 1 - 0.18 * wobble(t - tsG - SPLIT_DUR, 3, 0.3);
        st.stretch = f < 0.35 ? lerp(1.5, 1, f / 0.35) : 1;
        // anticipation before next split
        if (nextSplit && t > nextSplit - 0.14) { const k = (t - (nextSplit - 0.14)) / 0.14; st.stretch = 1 + 0.4 * k; st.squash = 1 - 0.12 * k; }
        st.rotY = Math.atan2(camP.x - st.x, camP.z - st.z) + Math.sin(i * 12.9898) * 0.35;
        st.scale = G >= 6 ? lerp(1, 0.86, clamp((t - TG.splits[4]) / 0.4)) : 1;
        st.rotZ = f < 1 ? side * 0.25 * Math.sin(Math.PI * f) : 0;
        st.armL = st.armR = f < 1 ? 0.8 * Math.sin(Math.PI * f) : 0;
        const bl = (t * 0.7 + i * 0.137) % 2.9; st.blink = bl < 0.15 ? Math.sin(bl / 0.15 * Math.PI) : 0;
        // dancing on the beat
        for (const h of TG.hops) {
          const a = t - h + Math.hypot(st.x, st.z) * 0.03;
          if (a > -0.1 && a < 0.4) { st.y += Math.max(0, Math.sin(Math.PI * a / 0.4)) * 0.4; st.armL = st.armR = 0.9 * Math.max(0, Math.sin(Math.PI * a / 0.4)); st.squash = a < 0 ? 0.85 : 1.1; }
        }
        // stampede off the edge
        if (G === 7) {
          const lt0 = this.leaveT[i];
          if (t > lt0) {
            const a = t - lt0;
            const dir = new THREE.Vector3(st.x, 0, st.z); if (dir.length() < 0.2) dir.set(1, 0, 0.3); dir.normalize();
            const th = Math.atan2(dir.z, dir.x), edge = islandR(th) - 0.1;
            const r0 = Math.hypot(st.x, st.z);
            const runT = Math.max(0, (edge - r0) / 3.8);
            let r, y = 0;
            if (a < runT) { r = r0 + a * 3.8; st.walk = a * 5; }
            else { const b = a - runT; r = edge + b * 3.0; y = b * 2.6 - 4.9 * b * b; st.rotX = b * 2.2; st.armL = st.armR = 1.2; }
            st.x = dir.x * r; st.z = dir.z * r; st.y = y;
            st.rotY = Math.atan2(dir.x, dir.z);
            st.squash = 1;
            if (y < -25) { C.hide(i); continue; }
          }
        }
        C.set(i, st);
      }
      C.commit();
    } else C.group.visible = false;

    // ---- trees grow
    this.trees.forEach(tr => {
      const a = t - tr.t0;
      const gk = a > 0 ? clamp(spring(a, 1.8, 0.45), 0, 1.15) : 0;
      tr.trunk.scale.set(lerp(0.4, 1, Math.min(gk, 1)), gk, lerp(0.4, 1, Math.min(gk, 1)));
      tr.trunk.visible = gk > 0.001;
      tr.leaves.forEach(m => {
        const la = a - m.userData.d;
        const k = la > 0 ? clamp(spring(la, 2.4, 0.35), 0, 1.3) : 0;
        m.visible = k > 0.001;
        m.scale.setScalar(m.userData.s * k);
        const sway = Math.sin(t * 1.3 + tr.x) * 0.02;
        m.position.copy(m.userData.base).multiplyScalar(Math.min(gk, 1.05)); m.position.x += sway * m.userData.base.y;
      });
      tr.g.rotation.z = Math.sin(t * 1.1 + tr.z) * 0.015 * (gk > 0 ? 1 : 0);
    });
    // ---- flowers pop
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), V = new THREE.Vector3(), SC = new THREE.Vector3(), E = new THREE.Euler();
    this.flowerData.forEach((f, i) => {
      const k = t > f.t0 ? clamp(spring(t - f.t0, 3, 0.35), 0, 1.3) : 0;
      E.set(0.3, f.rot + t * 0.2, 0.2); Q.setFromEuler(E);
      M.compose(V.set(f.x + Math.sin(t * 2 + f.rot) * 0.01, f.y * Math.min(k, 1), f.z), Q, SC.setScalar(f.s * k + 1e-5));
      this.flowers.setMatrixAt(i, M);
    });
    this.flowers.instanceMatrix.needsUpdate = true;
    // ---- petals
    this.petalP.forEach((p, i) => {
      const a = t - p.t0;
      if (a < 0) { this.petals.setMatrixAt(i, M.makeScale(0, 0, 0)); return; }
      const y = Math.max(0.03, p.start.y - a * p.fall);
      const ta = Math.min(a, (p.start.y - 0.03) / p.fall);
      V.set(p.start.x + p.drift.x * ta + Math.sin(ta * 2 + p.ph) * 0.15, y, p.start.z + p.drift.z * ta + Math.cos(ta * 1.7 + p.ph) * 0.15);
      E.set(y > 0.031 ? ta * 3 + p.ph : -Math.PI / 2, ta * 2 + p.ph, y > 0.031 ? ta * 2.3 : 0); Q.setFromEuler(E);
      M.compose(V, Q, SC.setScalar(p.s));
      this.petals.setMatrixAt(i, M);
    });
    this.petals.instanceMatrix.needsUpdate = true;
    // pond bars bob gently
    this.pondBars.forEach(m => { m.position.set(m.userData.x + Math.sin(t * 0.3 + m.userData.ph) * 0.05, 0.045 + Math.sin(t * 1.5 + m.userData.ph) * 0.004, m.userData.z); });

    // ---- particles
    this.dustP.forEach((d, i) => {
      const a = t - TG.impact, on = a > 0 && a < d.life;
      const r = d.v * (1 - Math.exp(-a * 3)) / 3 * 3;
      const x = L.x + Math.cos(d.a) * (0.4 + r), z = L.z + Math.sin(d.a) * (0.4 + r), y = 0.05 + d.up * (1 - Math.exp(-a * 4)) * 0.25;
      const k = on ? Math.pow(1 - a / d.life, 1.5) * 0.9 : 0;
      this.dust.set(i, x, y, z, k > 0 ? d.sz * 0.03 * (0.6 + a) : 0, 0.85 * k, 0.75 * k, 0.6 * k);
    });
    this.dust.commit(pipe.H);
    this.splashP.forEach((d, i) => {
      const a = t - TG.breach, on = a > 0 && a < d.life;
      const x = S.x + Math.cos(d.a) * d.v * a * 0.6, z = S.z + 0.95 + Math.sin(d.a) * d.v * a * 0.6, y = 0.04 + d.up * a - 4.9 * a * a;
      const k = on && y > 0 ? 0.9 : 0;
      this.splash.set(i, x, y, z, k > 0 ? d.sz * 0.03 : 0, 0.85 * k, 0.95 * k, 1.0 * k);
    });
    this.splash.commit(pipe.H);
    this.pollenP.forEach((d, i) => {
      const x = d.p.x + noise1(t * 0.1 + d.ph, 1) * 0.6, y = d.p.y + Math.sin(t * 0.4 + d.ph) * 0.2, z = d.p.z + noise1(t * 0.12 + d.ph, 2) * 0.6;
      const k = 0.35 * (0.6 + 0.4 * Math.sin(t * 3 + d.ph * 7)) * smooth(TG.trees[0], TG.trees[3], t);
      this.pollen.set(i, x, y, z, d.sz * 0.012, k, k * 0.85, k * 0.55);
    });
    this.pollen.commit(pipe.H);

    // ---- camera
    this.updateCamera(t, cs, pipe);
    this.sea.material.uniforms.camPos.value.copy(this.cam.position);

    // ---- grade
    const G = pipe.grade;
    G.exposure = 0.92; G.contrast = 1.08; G.saturation = 1.08; G.vignette = 0.36;
    G.lift.setRGB(0.01, 0.006, 0.0); G.gain.setRGB(1.0, 0.98, 0.95);
    pipe.bloom.strength = 0.35; pipe.bloom.radius = 0.5; pipe.bloom.threshold = 1.05;
    // flash on impact
    G.exposure += 0.25 * Math.exp(-Math.max(0, t - TG.impact) * 8) * (t > TG.impact ? 1 : 0);
    return { scene: s, camera: this.cam };
  },

  updateCamera(t, cs, pipe) {
    const cam = this.cam;
    let p, l, fov = 32, focus, ap = 0.3;
    const clawdC = cs.pos.clone().add(new THREE.Vector3(0, 0.45, 0));
    if (t < TG.cut1) {
      // falling alongside Clawd
      p = cs.pos.clone().add(new THREE.Vector3(1.9, 0.45 + (t - TG.start) * 0.3, 2.4));
      l = clawdC.clone(); fov = 34; focus = p.distanceTo(l); ap = 0.25;
    } else if (t < 28.56) {
      const k0 = smoother(TG.cut1, TG.impact + 0.2, t);
      const p0 = L.clone().add(new THREE.Vector3(3.0, 0.55, 4.4));
      const l0 = L.clone().add(new THREE.Vector3(0, lerp(1.4, 0.45, k0), 0));
      // orbit around the island, keeping Clawd in frame
      const k = smoother(22.4, 28.56, t);
      const ang = lerp(0.6, -0.35, k);
      const rad = lerp(5.6, 9.5, Math.sin(Math.PI * Math.min(1, k * 1.15)) * 0.9 + k * 0.2);
      const ctr = new THREE.Vector3(lerp(L.x, 0.5, k), 0, lerp(L.z, -0.5, k));
      const p1 = ctr.clone().add(new THREE.Vector3(Math.sin(ang) * rad, lerp(1.4, 2.6, Math.sin(Math.PI * k)) + 0.4, Math.cos(ang) * rad));
      const l1 = clawdC.clone().lerp(ctr.clone().add(new THREE.Vector3(0, 0.6, 0)), 0.35 * Math.sin(Math.PI * k));
      const w = smoother(22.2, 23.6, t);
      p = p0.lerp(p1, w); l = l0.lerp(l1, w);
      fov = lerp(30, 36, Math.sin(Math.PI * k));
      focus = p.distanceTo(clawdC); ap = 0.22;
      // impact shake
      const sa = t - TG.impact;
      if (sa > 0) { const amp = 0.08 * Math.exp(-sa * 5); p.x += Math.sin(sa * 70) * amp; p.y += Math.cos(sa * 55) * amp; }
    } else if (t < TG.twinBlink) {
      // across the pond, low over the water
      const k = smoother(28.56, TG.twinBlink, t);
      p = new THREE.Vector3(lerp(S.x - 0.9, S.x - 0.35, k), lerp(1.0, 0.8, k), lerp(PC.z + 3.0, PC.z + 2.2, k));
      l = new THREE.Vector3(S.x, lerp(0.05, 0.0, k), S.z + 0.75);
      fov = lerp(30, 27, k); focus = p.distanceTo(new THREE.Vector3(S.x, 0.3, S.z)); ap = 0.3;
    } else if (t < 38.9) {
      // low over the water, close: Clawd above, its reflection below; then follow the twin out
      const k = smoother(TG.breach - 0.25, TG.twinLand + 0.1, t);
      const k0 = smooth(TG.twinBlink - 0.4, TG.breach, t);
      p = new THREE.Vector3(lerp(S.x + 0.25, S.x + 1.1, k), lerp(1.15 - k0 * 0.12, 1.1, k), lerp(S.z + 2.6 - k0 * 0.2, S.z + 4.1, k));
      l = new THREE.Vector3(lerp(S.x, S.x + 0.7, k), lerp(0.0, 0.6, k), lerp(S.z + 0.7, S.z, k));
      fov = lerp(30, 34, k);
      focus = p.distanceTo(new THREE.Vector3(lerp(S.x, S.x + 0.7, k), 0.3, S.z));
      ap = 0.22;
      const sa = t - TG.breach; if (sa > 0) { const amp = 0.04 * Math.exp(-sa * 4); p.y += Math.sin(sa * 60) * amp; }
    } else if (t < TG.splits[5]) {
      const k = smoother(38.9, TG.splits[5] + 0.3, t);
      p = new THREE.Vector3(lerp(2.4, 1.5, k), lerp(1.3, 5.6, k), lerp(S.z + 4.2, 8.6, k));
      l = new THREE.Vector3(lerp(S.x + 0.6, 0.6, k), lerp(0.35, 0.0, k), lerp(S.z, -0.6, k));
      fov = lerp(36, 40, k); focus = p.distanceTo(l); ap = lerp(0.2, 0.08, k);
    } else {
      const k = smoother(TG.splits[5], TG.end, t);
      const ang = lerp(0.15, -0.55, k);
      const rad = lerp(9.5, 15, k);
      p = new THREE.Vector3(Math.sin(ang) * rad, lerp(7.5, 11, k), Math.cos(ang) * rad);
      l = new THREE.Vector3(0.3, lerp(0, -1.5, k), -0.3);
      fov = 40; focus = p.distanceTo(l); ap = 0.05;
    }
    const amp = 0.012;
    p.x += noise1(t * 0.6, 3) * amp; p.y += noise1(t * 0.6, 9) * amp;
    cam.position.copy(p); cam.lookAt(l); cam.fov = fov; cam.updateProjectionMatrix();
    pipe.dof.focus = focus; pipe.dof.aperture = ap; pipe.dof.maxBlur = 14;
  },
};
