// Scene C (46.93 - 60.5s): the falling Clawds assemble a colossal Clawd made of Clawds
// standing on the sea of clouds. It blinks, waves, the camera dives into its eye...
// and we are back in the dark with the cursor, which turns out to be Clawd.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import {
  clamp, lerp, smooth, smoother, easeOutCubic, easeInOutCubic, easeInCubic, spring, wobble, bump, rng, makeSky, envFromScene, noise1,
} from './engine.js';
import { clawdVoxels, U, DIM } from './clawd.js';
import { Crowd } from './crowd.js';
import { Sparks, softDot } from './materials.js';
import { makeCloudSea, makePuffs } from './env.js';

export const TC = {
  start: 46.93, done: 51.43, blink: 53.68, wave: 54.3, dive0: 55.2, black: 57.05, wake: 58.3, eyes: 58.75, wink: 59.5, off: 60.15, end: 60.6,
};
const GS = 40;                       // giant scale
const VS = 0.5 * U * GS;             // voxel pitch in world units (2.5)

export const sceneColossus = {
  start: TC.start, end: 999,
  build(pipe) {
    const R = rng(29);
    const s = this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(35, pipe.W / pipe.H, 0.05, 4000);
    const sunDir = new THREE.Vector3(-0.55, 0.12, -0.83).normalize();
    const skyOpts = { top: '#1d3470', mid: '#e47e62', bottom: '#f7b484', sunDir, sunColor: '#ffd9a8', sunSize: 0.9992, clouds: 0.55, cloudColor: '#ffe9dc' };
    this.sky = makeSky(skyOpts); this.sky.material.uniforms.intensity.value = 0.72; s.add(this.sky);
    const envScene = new THREE.Scene(); envScene.add(makeSky({ ...skyOpts, clouds: 0 }));
    s.environment = envFromScene(pipe.renderer, envScene); s.environmentIntensity = 0.5;
    this.sea = makeCloudSea({ y: 1.5, top: '#ffd9c0', shade: '#4f4c86', horizon: '#f2a57c', sun: [sunDir.x, sunDir.z], scale: 0.0045, fogNear: 300, fogFar: 2600 });
    s.add(this.sea);
    makePuffs(s, { n: 40, seed: 31, rMin: 60, rMax: 900, yMin: -4, yMax: 18, sMin: 40, sMax: 120, color: '#ffe3d2', opacity: [0.45, 0.85] });
    this.footPuffs = makePuffs(s, { n: 18, seed: 33, rMin: 6, rMax: 26, yMin: 0, yMax: 4, sMin: 10, sMax: 22, color: '#fff0e6', opacity: [0.6, 0.9] });

    const sun = this.sun = new THREE.DirectionalLight('#ffd7b0', 3.0);
    sun.position.copy(sunDir).multiplyScalar(120).add(new THREE.Vector3(0, 40, 0));
    sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096);
    Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 50, bottom: -10, near: 10, far: 400 });
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.25; sun.shadow.radius = 3;
    sun.target.position.set(0, 18, 0);
    s.add(sun, sun.target);
    const front = new THREE.DirectionalLight('#ffc8a8', 1.1); front.position.set(30, 30, 80); s.add(front);
    s.add(new THREE.HemisphereLight('#9fb6ff', '#ffcfa8', 0.6));

    // ---- giant layout: shell voxels of Clawd
    const vox = clawdVoxels(0.5);
    const key = v => `${Math.round(v.p.x / (0.5 * U))},${Math.round(v.p.y / (0.5 * U))},${Math.round(v.p.z / (0.5 * U))}`;
    const set = new Set(vox.map(key));
    const shell = vox.filter(v => {
      const [x, y, z] = key(v).split(',').map(Number);
      return [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].some(([a, b, c]) => !set.has(`${x + a},${y + b},${z + c}`));
    });
    const D = DIM;
    const frontZ = Math.max(...shell.map(v => v.p.z));
    const eyeY = (D.legH + D.bodyH - D.eyeDrop) * U;
    this.items = shell.map(v => {
      const T = v.p.clone().multiplyScalar(GS);
      const isEye = v.part === 'body' && Math.abs(v.p.z - frontZ) < 1e-4 && Math.abs(Math.abs(v.p.x) - D.eyeX * U) < 0.6 * U && Math.abs(v.p.y - eyeY) < 0.62 * U;
      const armR = v.part === 'arm' && v.p.x > 0;
      return { T, isEye, armR, part: v.part };
    });
    // order: landing time by height
    let ymin = 1e9, ymax = -1e9; for (const it of this.items) { ymin = Math.min(ymin, it.T.y); ymax = Math.max(ymax, it.T.y); }
    for (const it of this.items) {
      it.land = TC.start + 0.35 + 3.0 * (it.T.y - ymin) / (ymax - ymin) + R() * 0.45;
      if (it.land > TC.done - 0.02) it.land = TC.done - 0.02 - R() * 0.1;
      const a = R() * Math.PI * 2, r = 12 + R() * 40;
      it.S = new THREE.Vector3(Math.sin(a) * r, 110 + R() * 120, Math.cos(a) * r + 10);
      it.C1 = it.S.clone().add(new THREE.Vector3((R() - .5) * 40, -40 - R() * 30, (R() - .5) * 40));
      const out = new THREE.Vector3(it.T.x, 0, it.T.z).normalize().multiplyScalar(14 + R() * 10);
      it.C2 = it.T.clone().add(out).add(new THREE.Vector3(0, 22 + R() * 14, 0));
      it.axis = new THREE.Vector3(R() - .5, R() - .5, R() - .5).normalize(); it.spin = (2 + R() * 4) * Math.PI;
      it.ph = R() * 10; it.k = 0.92 + R() * 0.12;
    }
    this.n = this.items.length;
    console.log('giant clawds', this.n);
    this.crowd = new Crowd(this.n, { lowPoly: true });
    this.crowd.enableColors();
    s.add(this.crowd.group);
    // pick the dive target: an eye voxel on the giant's left eye, near its centre
    const eyes = this.items.filter(it => it.isEye && it.T.x < 0);
    eyes.sort((a, b) => (a.T.y - b.T.y) - 0);
    this.diveTarget = eyes.reduce((best, it) => (!best || Math.abs(it.T.x + D.eyeX * U * GS) + Math.abs(it.T.y - eyeY * GS) < Math.abs(best.T.x + D.eyeX * U * GS) + Math.abs(best.T.y - eyeY * GS) ? it : best), null);

    // shockwave ring in the clouds
    this.ring = new THREE.Mesh(new THREE.RingGeometry(0.8, 1.0, 96), new THREE.MeshBasicMaterial({ color: '#fff4ea', transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide }));
    this.ring.rotation.x = -Math.PI / 2; this.ring.position.y = 2.2; s.add(this.ring);
    this.mist = new Sparks(200, { additive: false });
    this.mistP = Array.from({ length: 200 }, () => ({ a: R() * Math.PI * 2, r: 6 + R() * 14, v: 10 + R() * 25, up: 2 + R() * 10, sz: 8 + R() * 14, life: 1.5 + R() * 1.5 }));
    s.add(this.mist.points);

    // ---- ending scene: black mirror and the cursor
    const e = this.endScene = new THREE.Scene();
    this.endCam = new THREE.PerspectiveCamera(28, pipe.W / pipe.H, 0.02, 100);
    const floor = new Reflector(new THREE.PlaneGeometry(40, 40), {
      textureWidth: pipe.W >> 1, textureHeight: pipe.H >> 1, clipBias: 0.003, color: new THREE.Color('#050506'),
      shader: {
        uniforms: { color: { value: new THREE.Color('#050506') }, tDiffuse: { value: null }, textureMatrix: { value: null } },
        vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv; void main(){ vUv = textureMatrix*vec4(position,1.); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
        fragmentShader: `uniform vec3 color; uniform sampler2D tDiffuse; varying vec4 vUv;
          void main(){ vec3 r=vec3(0.); for(int i=-2;i<=2;i++) for(int j=-2;j<=2;j++) r += texture2DProj(tDiffuse, vUv + vec4(float(i),float(j),0.,0.)*0.003*vUv.w).rgb; gl_FragColor = vec4(color + r/25.*0.5, 1.); }`,
      },
    });
    floor.rotation.x = -Math.PI / 2; e.add(floor);
    this.cursorPivot = new THREE.Group(); e.add(this.cursorPivot);
    this.cursorPivot.position.set(0, 0, 0.36);   // front edge: stands up around it
    this.cur = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.14, 0.72, 2, 0.04), new THREE.MeshBasicMaterial({ color: new THREE.Color('#D97757') }));
    this.cur.position.set(0, 0.07, -0.36); this.cursorPivot.add(this.cur);
    const eyeMat = new THREE.MeshBasicMaterial({ color: '#050404' });
    this.curEyes = [-1, 1].map(sd => { const m = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.012, 0.075, 1, 0.005), eyeMat); m.position.set(sd * 0.105, 0.141, -0.52); this.cursorPivot.add(m); return m; });
    this.curGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6), new THREE.MeshBasicMaterial({ map: softDot(), color: new THREE.Color('#ff7a45'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.curGlow.rotation.x = -Math.PI / 2; this.curGlow.position.y = 0.004; e.add(this.curGlow);

    this.cues = [{ t: TC.start, type: 'rush' }];
    const lands = this.items.map(i => i.land).sort((a, b) => a - b);
    for (let i = 0; i < 26; i++) this.cues.push({ t: lands[Math.floor((i + 0.5) / 26 * lands.length)], type: 'stack', i });
    this.cues.push({ t: TC.done, type: 'giantLand' }, { t: TC.blink, type: 'giantBlink' }, { t: TC.wave, type: 'giantWave' }, { t: TC.dive0, type: 'dive' }, { t: TC.black, type: 'black' }, { t: TC.wake, type: 'cursorWake' }, { t: TC.eyes, type: 'cursorEyes' }, { t: TC.wink, type: 'wink' }, { t: TC.off, type: 'off' });
  },

  update(t, lt, pipe) {
    if (t >= TC.black) return this.updateEnd(t, pipe);
    const s = this.scene;
    this.sky.material.uniforms.time.value = t;
    this.sea.material.uniforms.time.value = t;
    const C = this.crowd;
    const landedAll = t >= TC.done;
    const drop = t < TC.done ? 0 : 0;
    const settle = landedAll ? -1.2 * wobble(t - TC.done, 1.6, 0.35) : 0;
    // giant arm wave (right arm pivots at the shoulder)
    const shoulder = new THREE.Vector3(DIM.bodyW / 2 * U * GS, (DIM.legH + DIM.bodyH - DIM.armDrop) * U * GS, 0);
    const waveA = (bump(t, TC.wave, TC.wave + 0.75) + bump(t, TC.wave + 0.75, TC.wave + 1.5)) * 0.55 + smooth(TC.wave - 0.3, TC.wave, t) * (1 - smooth(TC.wave + 1.5, TC.wave + 1.9, t)) * 0.5;
    const blinkK = bump(t, TC.blink, TC.blink + 0.28);
    const camP = this.cam.position;
    this.items.forEach((it, i) => {
      const st = {};
      const u = clamp((t - TC.start) / (it.land - TC.start));
      const e = easeInOutCubic(u);
      // cubic bezier
      const a = 1 - e;
      const P = it.S.clone().multiplyScalar(a * a * a).add(it.C1.clone().multiplyScalar(3 * a * a * e)).add(it.C2.clone().multiplyScalar(3 * a * e * e)).add(it.T.clone().multiplyScalar(e * e * e));
      if (u >= 1 && it.armR && waveA > 0) {
        const rel = P.clone().sub(shoulder); rel.applyAxisAngle(new THREE.Vector3(0, 0, 1), waveA); P.copy(shoulder).add(rel);
      }
      st.x = P.x; st.y = P.y + settle - VS * 0.4; st.z = P.z;
      const la = t - it.land;
      st.scale = 2.3 * (la > 0 ? 1 + 0.25 * wobble(la, 3, 0.35) : 0.9);
      const spin = it.spin * (1 - e);
      st.rotX = spin * it.axis.x; st.rotZ = spin * it.axis.z; st.rotY = spin * it.axis.y + (u >= 1 ? 0 : it.ph);
      st.armL = st.armR = u < 1 ? 1.1 : 0.15 * Math.sin(t * 3 + it.ph);
      st.legSpread = 0;
      // life on the surface: blink, stadium wave hops
      const bl = (t * 0.6 + it.ph) % 3.1; st.blink = bl < 0.14 ? Math.sin(bl / 0.14 * Math.PI) : 0;
      for (const hb of [52.94, 54.45]) {
        const wa = t - hb - (it.T.y / 40) * 0.7 - (it.T.x + 20) * 0.004;
        if (wa > 0 && wa < 0.35 && u >= 1) { const k = Math.sin(Math.PI * wa / 0.35); st.y += k * 0.9; st.squash = 1 + 0.15 * k; st.armL = st.armR = 0.9 * k; }
      }
      // colour: eye voxels are dark Clawds; they turn clay during the giant's blink
      let col = it.isEye ? lerp(0.13, it.k, blinkK) : it.k;
      if (it.isEye && blinkK > 0) st.squash = 1 - 0.3 * blinkK;
      C.setColor(i, new THREE.Color(col, col * (it.isEye ? 0.95 : 1), col * (it.isEye ? 0.95 : 1)));
      C.set(i, st);
    });
    C.commit();
    // impact ring & mist
    const ia = t - TC.done;
    this.ring.material.opacity = ia > 0 ? 0.55 * Math.exp(-ia * 1.3) : 0;
    this.ring.scale.setScalar(ia > 0 ? 10 + ia * 70 : 0.001);
    this.mistP.forEach((m, i) => {
      const on = ia > 0 && ia < m.life;
      const r = m.r + m.v * (1 - Math.exp(-ia * 1.5));
      const k = on ? Math.pow(1 - ia / m.life, 1.2) * 0.85 : 0;
      this.mist.set(i, Math.cos(m.a) * r, 2 + m.up * (1 - Math.exp(-ia * 2)), Math.sin(m.a) * r + 2, k > 0 ? m.sz * (1 + ia) : 0, k, k * 0.95, k * 0.9);
    });
    this.mist.commit(pipe.H);

    this.updateCamera(t, pipe);
    this.sea.material.uniforms.camPos.value.copy(this.cam.position);
    const G = pipe.grade;
    G.exposure = 0.95 + 0.3 * Math.exp(-Math.max(0, ia) * 6) * (ia > 0 ? 1 : 0);
    G.contrast = 1.08; G.saturation = 1.1; G.vignette = 0.38;
    G.lift.setRGB(0.01, 0.0, 0.02);
    pipe.bloom.strength = 0.4; pipe.bloom.radius = 0.6; pipe.bloom.threshold = 1.0;
    // the dive ends in the darkness of the eye
    G.fade = smooth(TC.black - 0.35, TC.black - 0.05, t);
    return { scene: s, camera: this.cam };
  },

  updateCamera(t, pipe) {
    const cam = this.cam;
    const gc = new THREE.Vector3(0, 20, 0);
    let p, l, fov = 35, ap = 0.02, focus = 100;
    if (t < 49.2) {
      // among the rain of Clawds, looking down at the giant forming
      const k = smoother(TC.start, 49.4, t);
      p = new THREE.Vector3(lerp(30, 45, k), lerp(95, 48, k), lerp(55, 85, k));
      l = new THREE.Vector3(0, lerp(150, 16, easeInOutCubic(clamp((t - TC.start) / 1.6))), 0);
      fov = lerp(45, 40, k);
    } else if (t < TC.done) {
      const k = smoother(49.2, TC.done, t);
      const w = smoother(49.2, 49.9, t);
      const pA = new THREE.Vector3(45, 48, 85), lA = new THREE.Vector3(0, 16, 0);
      const ang = lerp(0.62, 0.25, k);
      const pB = new THREE.Vector3(Math.sin(ang) * lerp(85, 105, k), lerp(26, 14, k), Math.cos(ang) * lerp(85, 105, k));
      p = pA.lerp(pB, w); l = lA.lerp(new THREE.Vector3(0, lerp(18, 20, k), 0), w); fov = lerp(40, 38, w);
    } else if (t < TC.dive0) {
      const k = smoother(TC.done, TC.dive0, t);
      const ang = lerp(0.25, -0.12, k);
      const d = lerp(105, 150, easeOutCubic(clamp((t - TC.done) / 1.6))) - k * 25;
      p = new THREE.Vector3(Math.sin(ang) * d, lerp(14, 9, k), Math.cos(ang) * d);
      l = new THREE.Vector3(0, lerp(20, 21, k), 0);
      fov = 34;
      const sa = t - TC.done; if (sa > 0) { const amp = 1.5 * Math.exp(-sa * 4); p.x += Math.sin(sa * 50) * amp; p.y += Math.cos(sa * 41) * amp; }
    } else {
      // dive into the eye of one dark Clawd in the giant's left eye
      const k = clamp((t - TC.dive0) / (TC.black - TC.dive0));
      const tgtClawd = this.diveTarget.T.clone();
      // the small Clawd's own left eye, in world space (front face)
      const eye = tgtClawd.clone().add(new THREE.Vector3(-DIM.eyeX * U * 2.3, (DIM.legH + DIM.bodyH - DIM.eyeDrop) * U * 2.3 - VS * 0.4, DIM.bodyD * U * 2.3 / 2));
      const startP = new THREE.Vector3(Math.sin(-0.12) * 125, 9, Math.cos(-0.12) * 125);
      const ke = easeInCubic(k) * 0.35 + easeInOutCubic(k) * 0.65;
      const dist = Math.exp(lerp(Math.log(startP.distanceTo(eye)), Math.log(0.02), ke));
      const dir = startP.clone().sub(eye).normalize().lerp(new THREE.Vector3(0, 0.05, 1).normalize(), smooth(0, 0.6, k)).normalize();
      p = eye.clone().addScaledVector(dir, dist);
      l = gc.clone().lerp(eye, smooth(0.0, 0.45, k));
      fov = lerp(34, 50, easeInCubic(k));
      ap = 0.03;
    }
    const nAmp = t < TC.dive0 ? 0.3 : 0.3 * Math.pow(1 - clamp((t - TC.dive0) / (TC.black - TC.dive0)), 3);
    p.x += noise1(t * 0.5, 4) * nAmp; p.y += noise1(t * 0.5, 7) * nAmp;
    cam.position.copy(p); cam.lookAt(l); cam.fov = fov; cam.updateProjectionMatrix();
    pipe.dof.focus = focus; pipe.dof.aperture = ap; pipe.dof.maxBlur = 10;
  },

  updateEnd(t, pipe) {
    const e = this.endScene;
    const a = t - TC.black;
    // blink like the opening; then wake: stand up, open eyes, wink, switch off
    const on = t < TC.wake ? ((a % 1.06) < 0.53 ? 1 : 0) : 1;
    const off = t >= TC.off ? 0 : 1;
    const cI = (on * 0.55 + (1 - on) * 0.02) * off;
    this.cur.material.color.setRGB(1.0 * cI, 0.27 * cI, 0.1 * cI);
    const stand = smoother(TC.wake, TC.wake + 0.35, t);
    const hop = Math.max(0, Math.sin(Math.PI * clamp((t - TC.wake) / 0.35))) * 0.08;
    this.cursorPivot.rotation.x = Math.PI / 2 * stand - 0.12 * wobble(t - TC.wake - 0.35, 2.8, 0.3);
    this.cursorPivot.position.y = hop;
    const eyesOpen = clamp(spring(t - TC.eyes, 2.5, 0.45), 0, 1.3);
    const wink = bump(t, TC.wink, TC.wink + 0.3);
    this.curEyes.forEach((m, i) => { m.visible = t > TC.eyes && off > 0; m.scale.set(1, 1, Math.max(0.05, eyesOpen * (i === 1 ? 1 - wink : 1))); });
    this.curGlow.material.color.setRGB(1.0 * cI * 0.12, 0.42 * cI * 0.12, 0.2 * cI * 0.12);
    const k = smooth(TC.black, TC.end, t);
    this.endCam.position.set(lerp(0.7, 0.05, k), lerp(0.36, 0.42, k), lerp(3.1, 2.6, k));
    this.endCam.lookAt(0, lerp(0.1, 0.36, stand), lerp(0, 0.3, stand));
    pipe.dof.focus = this.endCam.position.distanceTo(new THREE.Vector3(0, 0.15, 0)); pipe.dof.aperture = 0.3; pipe.dof.maxBlur = 14;
    const G = pipe.grade;
    G.exposure = 1; G.vignette = 0.55; G.contrast = 1.08; G.saturation = 1.0;
    G.fade = 1 - smooth(TC.black, TC.black + 0.35, t);
    if (t > TC.off) G.fade = 1;
    pipe.bloom.strength = 0.55; pipe.bloom.radius = 0.45; pipe.bloom.threshold = 1.0;
    return { scene: e, camera: this.endCam };
  },
};
