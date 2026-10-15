// Scene A (0 - 19.92s): a cursor in the dark becomes Clawd, the terminal wakes up,
// code bars fly up into a spiral staircase and Clawd climbs into the dusk sky.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import {
  clamp, lerp, smooth, smoother, easeOutCubic, easeInOutCubic, easeOutExpo, spring, wobble, bump, rng, makeSky, envFromScene, noise1,
} from './engine.js';
import { Clawd, clawdVoxels, U, DIM } from './clawd.js';
import { heatClay, Sparks, softDot } from './materials.js';

export const T = {
  burst: 6.43, swap: 10.35, eyes: 11.0, wake: 11.73, walk0: 12.9, walk1: 14.45, stairs: 13.96,
  hops: [14.70, 15.42, 16.18, 16.95, 17.69, 18.44, 19.18], leap: 19.58, crane: 17.4, end: 19.92,
};
const C = new THREE.Vector3(-10.0, 0, 5.2);         // cursor / Clawd birth position
const HC = new THREE.Vector3(-5.8, 0, -0.8);        // stair helix centre
const HR = 6.0, DTH = 0.215, STEP_H = 0.4, NSTEPS = 12;
const WALK_END = new THREE.Vector3(-7.15, 0, 5.2);

const stepPos = k => {
  const th = k * DTH;
  return { p: new THREE.Vector3(HC.x + HR * Math.sin(th), STEP_H * (k + 1), HC.z + HR * Math.cos(th)), th };
};

function roundedRectShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}
// points along a rounded rectangle perimeter, param 0..1
function rrPerimeter(cx, cz, w, h, r, n) {
  const sh = roundedRectShape(w, h, r);
  return sh.getSpacedPoints(n).map(p => new THREE.Vector3(cx + p.x, 0, cz - p.y));
}

export const sceneTerminal = {
  start: 0, end: T.end,
  build(pipe) {
    const R = rng(7);
    const s = this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(30, pipe.W / pipe.H, 0.05, 1500);

    // --- sky & clouds (fade in as the terminal wakes)
    const skyOpts = { top: '#060a1c', mid: '#262a58', bottom: '#ff9466', sunDir: new THREE.Vector3(-0.75, 0.03, -0.66), sunColor: '#ffa877', sunSize: 0.9996, clouds: 0.0, stars: 1 };
    this.sky = makeSky(skyOpts);
    s.add(this.sky);
    const envScene = new THREE.Scene(); envScene.add(makeSky({ ...skyOpts, stars: 0 }));
    s.environment = envFromScene(pipe.renderer, envScene);
    s.environmentIntensity = 0;

    this.cloudSea = new THREE.Mesh(new THREE.PlaneGeometry(3000, 3000, 1, 1), new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: { time: { value: 0 }, intensity: { value: 0 }, top: { value: new THREE.Color('#ffc09a') }, shade: { value: new THREE.Color('#2a2852') }, horizon: { value: new THREE.Color('#ff9466') }, camPos: { value: new THREE.Vector3() } },
      vertexShader: /* glsl */`varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
      fragmentShader: /* glsl */`
        varying vec3 vW; uniform float time, intensity; uniform vec3 top, shade, horizon, camPos;
        float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
        float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
        float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<6;i++){ s+=a*n(p); p=p*2.02+vec2(1.7,9.2); a*=.5; } return s; }
        void main(){
          vec2 p = vW.xz*0.0065 + vec2(time*0.002, 0.);
          float d = fbm(p);
          vec2 sun = normalize(vec2(-0.75, -0.66));
          float ds = fbm(p + sun*0.035);
          float cov = smoothstep(0.38, 0.66, d);
          float lit = clamp(0.55 + (d - ds) * 7.5, 0., 1.);
          float fine = fbm(p*6.0);
          vec3 c = mix(shade, top, clamp(lit*0.85 + cov*0.25 + (fine-0.5)*0.25, 0., 1.));
          c += top * pow(lit, 6.) * 0.5 * cov;
          float dist = length(vW.xz - camPos.xz);
          float fogk = smoothstep(260., 1500., dist);
          c = mix(c, horizon, fogk);
          float a = mix(0.55 + cov*0.45, 1., fogk) * intensity;
          gl_FragColor = vec4(c * intensity, a);
        }`,
    }));
    this.cloudSea.rotation.x = -Math.PI / 2; this.cloudSea.position.y = -22;
    s.add(this.cloudSea);

    // volumetric-looking cloud puffs for parallax and scale
    const puffTex = (() => {
      const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d');
      const r2 = rng(3);
      for (let i = 0; i < 70; i++) {
        const a = r2() * Math.PI * 2, d = Math.pow(r2(), 0.7) * 70, x = 128 + Math.cos(a) * d * 1.3, y = 140 + Math.sin(a) * d * 0.55 - r2() * 25;
        const rad = 30 + r2() * 45;
        const gr = g.createRadialGradient(x, y, 0, x, y, rad);
        const sh = Math.round(200 + 55 * (1 - (y - 70) / 140));
        gr.addColorStop(0, `rgba(${sh},${sh},${sh},0.35)`); gr.addColorStop(1, `rgba(${sh},${sh},${sh},0)`);
        g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
      }
      const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
    })();
    this.puffs = [];
    for (let i = 0; i < 46; i++) {
      const m = new THREE.SpriteMaterial({ map: puffTex, transparent: true, depthWrite: false, color: new THREE.Color('#ffc6a6'), opacity: 0 });
      const sp = new THREE.Sprite(m);
      const ang = R() * Math.PI * 2, dist = 40 + R() * 260;
      sp.position.set(Math.cos(ang) * dist, -6 - R() * 16, Math.sin(ang) * dist);
      const sc = 18 + R() * 30; sp.scale.set(sc * 1.8, sc, 1);
      sp.userData.base = 0.35 + R() * 0.4;
      s.add(sp); this.puffs.push(sp);
    }

    // --- terminal body
    const TW = 24.4, TD = 16.4;
    const frameGeo = new THREE.ExtrudeGeometry(roundedRectShape(TW, TD, 0.9), { depth: 0.7, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 4, curveSegments: 16 });
    frameGeo.rotateX(Math.PI / 2); frameGeo.translate(0, -0.11, -0.2);
    const frameMat = new THREE.MeshPhysicalMaterial({ color: '#1d1c1b', roughness: 0.32, metalness: 0.55, clearcoat: 0.6, clearcoatRoughness: 0.2 });
    this.frame = new THREE.Mesh(frameGeo, frameMat);
    this.frame.receiveShadow = true;
    s.add(this.frame);
    // title bar strip + traffic lights
    const bar = new THREE.Mesh(new RoundedBoxGeometry(TW - 0.4, 0.06, 1.0, 2, 0.03), new THREE.MeshStandardMaterial({ color: '#2b2928', roughness: 0.5, metalness: 0.2 }));
    bar.position.set(0, -0.0, -TD / 2 + 0.38); s.add(bar);
    this.lights3 = ['#ff5f57', '#febc2e', '#28c840'].map((c, i) => {
      const m = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.06, 32), new THREE.MeshStandardMaterial({ color: c, emissive: new THREE.Color(c), emissiveIntensity: 0, roughness: 0.3 }));
      m.position.set(-TW / 2 + 0.8 + i * 0.55, 0.03, -TD / 2 + 0.38); s.add(m); return m;
    });

    // glossy screen (planar mirror, softly blurred)
    const SW = TW - 0.8, SD = TD - 1.6;
    this.screen = new Reflector(new THREE.PlaneGeometry(SW, SD), {
      textureWidth: pipe.W >> 1, textureHeight: pipe.H >> 1, clipBias: 0.003, color: new THREE.Color('#050506'),
      shader: {
        uniforms: { color: { value: new THREE.Color('#050506') }, tDiffuse: { value: null }, textureMatrix: { value: null }, strength: { value: 0.55 }, rough: { value: 0.0035 } },
        vertexShader: /* glsl */`uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW;
          void main(){ vUv = textureMatrix*vec4(position,1.); vW = (modelMatrix*vec4(position,1.)).xyz; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
        fragmentShader: /* glsl */`uniform vec3 color; uniform sampler2D tDiffuse; uniform float strength, rough; varying vec4 vUv; varying vec3 vW;
          void main(){
            vec3 r = vec3(0.);
            for (int i=-2;i<=2;i++) for (int j=-2;j<=2;j++) r += texture2DProj(tDiffuse, vUv + vec4(float(i), float(j), 0., 0.)*rough*vUv.w).rgb;
            r /= 25.;
            vec3 V = normalize(cameraPosition - vW);
            float fr = 0.25 + 0.75*pow(1. - max(V.y, 0.), 4.);
            gl_FragColor = vec4(color + r*strength*fr, 1.);
          }`,
      },
    });
    this.screen.rotation.x = -Math.PI / 2;
    this.screen.position.set(0, 0.0, 0.42);
    s.add(this.screen);

    // --- code bars
    const pal = [['#9b9a97', 5], ['#e8e2d6', 3], ['#D97757', 2], ['#8fbf73', 1.4], ['#7aa2f7', 1.6], ['#c39bd3', 1.0], ['#e5c07b', 1.0]];
    const pick = () => { let tot = pal.reduce((a, b) => a + b[1], 0), x = R() * tot; for (const [c, w] of pal) { if ((x -= w) < 0) return c; } return pal[0][0]; };
    const bars = [];
    const addBar = (x, z, len, col, onset, kind = 'code') => bars.push({ x, z, len, col: new THREE.Color(col), onset, kind });
    // welcome box contents
    const wb = { x0: -11.0, x1: -1.2, z0: -6.4, z1: -2.6 };
    addBar(-7.7, -5.4, 3.4, '#e8e2d6', 12.55, 'wb'); addBar(-7.9, -4.75, 2.9, '#9b9a97', 12.62, 'wb'); addBar(-8.2, -4.1, 2.3, '#9b9a97', 12.7, 'wb');
    addBar(-7.3, -3.45, 4.3, '#6f6e6b', 12.78, 'wb');
    // right column: tips
    for (let i = 0; i < 5; i++) addBar(1.0 + R() * 0.4, -6.0 + i * 0.75, 2.5 + R() * 5.5, i === 0 ? '#D97757' : '#8a8986', 12.9 + i * 0.06, 'tips');
    // code rows
    let row = 0;
    for (let z = -1.6; z < 3.7; z += 0.44, row++) {
      if (R() < 0.16) continue;
      const indent = [0, 1, 1, 2, 2, 3][Math.floor(R() * 6)] * 0.62;
      let x = -11.0 + indent;
      const ntok = 1 + Math.floor(R() * 5);
      for (let k = 0; k < ntok && x < 10.5; k++) {
        const len = 0.35 + R() * R() * 3.2;
        const dist = Math.hypot(x - C.x, z - C.z);
        addBar(x + len / 2, z, Math.min(len, 10.8 - x), pick(), T.wake + 0.05 + 0.11 * dist + k * 0.035);
        x += len + 0.2;
      }
    }
    // prompt box hint bar
    this.bars = bars;
    const barGeo = new RoundedBoxGeometry(1, 1, 1, 2, 0.12);
    this.barMesh = new THREE.InstancedMesh(barGeo, new THREE.MeshBasicMaterial({ color: 0xffffff }), bars.length);
    this.barMesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(bars.length * 3), 3);
    this.barMesh.frustumCulled = false;
    s.add(this.barMesh);

    // outlines: welcome box (orange) and prompt box (grey), built from short segments
    this.outlines = [];
    const mkOutline = (cx, cz, w, h, r, col, t0, t1, n) => {
      const pts = rrPerimeter(cx, cz, w, h, r, n);
      const m = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }), n);
      m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3);
      m.frustumCulled = false;
      s.add(m);
      this.outlines.push({ m, pts, col: new THREE.Color(col), t0, t1, n });
    };
    mkOutline((wb.x0 + wb.x1) / 2, (wb.z0 + wb.z1) / 2, wb.x1 - wb.x0, wb.z1 - wb.z0, 0.45, '#D97757', T.wake + 0.15, T.wake + 1.25, 220);
    mkOutline(0, 5.2, 22.0, 1.7, 0.45, '#5b5a57', T.wake + 0.6, T.wake + 1.8, 260);

    // tiny pixel Clawd logo inside the welcome box (extruded sprite)
    const logo = [
      '..########..', '..#.####.#..', '############', '############', '..########..', '..#.#..#.#..',
    ];
    const lg = new THREE.Group();
    const px = 0.17;
    const lgMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.logoMat = lgMat;
    logo.forEach((rowS, j) => [...rowS].forEach((ch, i) => {
      if (ch !== '#') return;
      const b = new THREE.Mesh(new THREE.BoxGeometry(px * 0.94, 0.07, px * 0.94), lgMat);
      b.position.set((i - 5.5) * px, 0.035, (j - 2.5) * px);
      lg.add(b);
    }));
    lg.position.set(-10.0, 0, -4.5);
    s.add(lg);

    // --- cursor
    this.cursor = new THREE.Mesh(new RoundedBoxGeometry(0.42, 0.14, 0.72, 2, 0.04), new THREE.MeshBasicMaterial({ color: new THREE.Color('#D97757') }));
    this.cursor.position.copy(C).add(new THREE.Vector3(0, 0.07, 0));
    s.add(this.cursor);
    // glow decal under cursor (fakes light falloff on the mirror)
    this.glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: softDot(), color: new THREE.Color('#ff7a45'), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    this.glow.rotation.x = -Math.PI / 2; this.glow.position.copy(C).add(new THREE.Vector3(0, 0.004, 0));
    s.add(this.glow);
    // soft contact shadow for Clawd
    const shTex = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 128; const g = cv.getContext('2d'); const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(0,0,0,0.85)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(cv); })();
    this.contact = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.1), new THREE.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false }));
    this.contact.rotation.x = -Math.PI / 2;
    s.add(this.contact);

    // --- voxels for the assembly
    const vox = this.vox = clawdVoxels(0.5);
    let ymin = 1e9, ymax = -1e9;
    for (const v of vox) { ymin = Math.min(ymin, v.p.y); ymax = Math.max(ymax, v.p.y); }
    for (const v of vox) {
      v.target = v.p.clone().add(C);
      v.delay = 0.25 + 2.0 * (v.p.y - ymin) / (ymax - ymin) + R() * 0.35;
      v.dur = 0.95 + R() * 0.35;
      v.r = 0.5 + R() * 1.3; v.h = 0.15 + R() * 0.95; v.phi = R() * Math.PI * 2; v.w = 1.2 + R() * 1.6;
      v.axis = new THREE.Vector3(R() - .5, R() - .5, R() - .5).normalize(); v.spin = (R() * 2 + 2) * Math.PI;
      v.jit = new THREE.Vector3((R() - .5) * 0.36, R() * 0.12, (R() - .5) * 0.6);
    }
    this.landTimes = vox.map(v => T.burst + v.delay + v.dur).sort((a, b) => a - b);
    const vg = new RoundedBoxGeometry(1, 1, 1, 2, 0.14);
    this.voxMat = heatClay({ heatScale: 2.6 });
    this.voxMesh = new THREE.InstancedMesh(vg, this.voxMat, vox.length);
    this.voxHeat = new THREE.InstancedBufferAttribute(new Float32Array(vox.length), 1);
    this.voxMesh.geometry.setAttribute('aHeat', this.voxHeat);
    this.voxMesh.castShadow = true; this.voxMesh.receiveShadow = true; this.voxMesh.frustumCulled = false;
    s.add(this.voxMesh);

    // --- Clawd
    this.clayMat = new THREE.MeshPhysicalMaterial({ color: '#D2725A', roughness: 0.38, clearcoat: 0.55, clearcoatRoughness: 0.28, sheen: 0.35, sheenColor: new THREE.Color('#ffb59a'), emissive: new THREE.Color('#ff5a1f'), emissiveIntensity: 0 });
    this.clawd = new Clawd({ material: this.clayMat });
    this.clawd.root.position.copy(C);
    s.add(this.clawd.root);

    // --- stairs (bars that fly up)
    const codeBars = bars.map((b, i) => ({ b, i })).filter(o => o.b.kind === 'code' && o.b.len > 1.0);
    codeBars.sort((a, b) => Math.hypot(a.b.x - WALK_END.x, a.b.z - WALK_END.z) - Math.hypot(b.b.x - WALK_END.x, b.b.z - WALK_END.z));
    this.steps = [];
    const stepGeo = new RoundedBoxGeometry(1.35, 0.2, 1.15, 3, 0.06);
    const capGeo = new RoundedBoxGeometry(1.1, 0.05, 0.22, 2, 0.02);
    for (let k = 0; k < NSTEPS; k++) {
      const src = codeBars[k * 2 % codeBars.length];
      const g = new THREE.Group();
      const body = new THREE.Mesh(stepGeo, new THREE.MeshPhysicalMaterial({ color: '#141416', roughness: 0.25, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 }));
      body.castShadow = true; body.receiveShadow = true;
      const cap = new THREE.Mesh(capGeo, new THREE.MeshBasicMaterial({ color: src.b.col.clone().multiplyScalar(2.2) }));
      cap.position.set(0, 0.115, 0.38);
      const edge = new THREE.Mesh(new RoundedBoxGeometry(1.37, 0.03, 0.03, 1, 0.01), new THREE.MeshBasicMaterial({ color: src.b.col.clone().multiplyScalar(1.4) }));
      edge.position.set(0, 0.0, 0.58);
      g.add(body, cap, edge);
      s.add(g);
      const { p, th } = stepPos(k);
      this.steps.push({ g, src, p, th, t0: T.stairs + 0.1 * k + (k > 6 ? 0.25 : 0), dur: 0.85 });
      src.b.stairT = this.steps[k].t0;
    }

    // dust motes
    this.dust = new Sparks(260);
    this.dustP = Array.from({ length: 260 }, () => ({ p: new THREE.Vector3(C.x + (R() - .5) * 6, R() * 2.2, C.z + (R() - .5) * 5), ph: R() * 10, sz: 0.4 + R() * 1.2 }));
    s.add(this.dust.points);
    // burst sparks
    this.sparks = new Sparks(160);
    this.sparkP = Array.from({ length: 160 }, () => ({ v: new THREE.Vector3(R() - .5, R() * 0.9 + 0.1, R() - .5).normalize().multiplyScalar(1.5 + R() * 3), life: 0.5 + R() * 0.9, sz: 0.5 + R() * 1.5 }));
    s.add(this.sparks.points);

    // --- lights
    this.cursorLight = new THREE.PointLight('#ff7a45', 0, 5, 2);
    this.cursorLight.position.copy(C).add(new THREE.Vector3(0, 0.25, 0.2));
    s.add(this.cursorLight);
    this.key = new THREE.DirectionalLight('#ffe3c7', 0);
    this.key.castShadow = true; this.key.shadow.mapSize.set(2048, 2048);
    Object.assign(this.key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 40 });
    this.key.shadow.bias = -0.0005; this.key.shadow.normalBias = 0.02; this.key.shadow.radius = 5;
    s.add(this.key, this.key.target);
    this.rim = new THREE.DirectionalLight('#86a8ff', 0); s.add(this.rim, this.rim.target);
    this.hemi = new THREE.HemisphereLight('#4a5a9a', '#ff8a5c', 0); s.add(this.hemi);

    // audio cues
    this.cues = [];
    for (let i = 0; i < 6; i++) this.cues.push({ t: 0.6 + i * 1.06, type: 'cursor' });
    this.cues.push({ t: T.burst, type: 'burst' });
    // landing clicks: cluster landings into ~22 ticks
    const lt = this.landTimes; const N = 22;
    for (let i = 0; i < N; i++) this.cues.push({ t: lt[Math.floor((i + 0.5) / N * lt.length)], type: 'click', i });
    this.cues.push({ t: T.swap, type: 'swap' }, { t: T.eyes, type: 'eyes' }, { t: T.wake, type: 'wake' });
    bars.forEach(b => { if (b.onset < 15) this.cues.push({ t: b.onset, type: 'key' }); });
    this.steps.forEach(st => this.cues.push({ t: st.t0, type: 'stairUp' }, { t: st.t0 + st.dur, type: 'stairLock' }));
    T.hops.forEach((h, i) => this.cues.push({ t: h - 0.32, type: 'hop' }, { t: h, type: 'land', i }));
    this.cues.push({ t: T.leap, type: 'leap' });
  },

  // Clawd position/pose as a function of time
  clawdState(t) {
    const st = { pos: C.clone(), rotY: 0, pose: { eyeScale: 0 } };
    const P = st.pose;
    P.eyeScale = clamp(spring(t - T.eyes, 2.2, 0.45), 0, 1.4);
    // blinks
    const blinks = [T.wake, 13.3, 16.5, 18.9];
    for (const b of blinks) P.blink = Math.max(P.blink || 0, bump(t, b, b + 0.17));
    // swap shake
    const sw = t - T.swap;
    P.squash = 1 + 0.12 * wobble(sw, 3.2, 0.22);
    // look around after waking
    if (t > T.wake) {
      P.lookX = smooth(T.wake + 0.1, T.wake + 0.35, t) * -1 + smooth(12.45, 12.7, t) * 2 - smooth(12.85, 13.0, t) * 1;
      P.lookY = smooth(T.wake, T.wake + 0.3, t) * -0.3 * (1 - smooth(12.8, 13, t));
      P.squash += 0.08 * wobble(t - 12.47, 3, 0.3);
      P.armL = 0.5 * bump(t, 12.4, 13.0); P.armR = 0.5 * bump(t, 12.5, 13.1);
    }
    // crab walk to the stairs
    if (t > T.walk0) {
      const w = smoother(T.walk0, T.walk1, t);
      st.pos.lerpVectors(C, WALK_END, w);
      const moving = w > 0 && w < 1;
      P.walk = (t - T.walk0) * 3.4;
      P.walkStride = moving ? 1 : Math.max(0, 1 - (t - T.walk1) * 4);
      P.wiggle = moving ? Math.sin(P.walk * Math.PI * 2) * 0.03 : 0;
      P.lift = moving ? Math.abs(Math.sin(P.walk * Math.PI * 2)) * 0.012 : 0;
      P.lookX = (P.lookX || 0) * (1 - w) + w * 0.9 * (1 - smooth(14.2, 14.5, t));
    }
    // hops up the stairs
    let prev = { p: WALK_END.clone(), th: 0 }, prevY = 0;
    for (let j = 0; j < T.hops.length; j++) {
      const h = T.hops[j], d = 0.42, ts = h - d;
      const nxt = stepPos(j);
      const ny = nxt.p.y + 0.1;
      if (t >= ts) {
        const f = clamp((t - ts) / d);
        const e = easeInOutCubic(f);
        st.pos.set(lerp(prev.p.x, nxt.p.x, e), lerp(prevY, ny, f) + Math.sin(Math.PI * f) * 0.42, lerp(prev.p.z, nxt.p.z, e));
        st.rotY = lerp(prev.th, nxt.th, e);
        P.squash = f < 1 ? 1 + 0.16 * Math.sin(Math.PI * f) : 1 - 0.2 * wobble(t - h, 3.2, 0.3);
        P.legTuck = f < 1 ? 0.35 * Math.sin(Math.PI * f) : 0;
        P.armL = P.armR = f < 1 ? 0.6 * Math.sin(Math.PI * f) : 0;
        P.walk = -1;
      } else if (t >= ts - 0.12) {
        P.squash = 1 - 0.18 * Math.sin(Math.PI * clamp((t - ts + 0.12) / 0.12) * 0.5);
      }
      if (t >= ts) { prev = nxt; prevY = ny; }
    }
    // leap off into the sky
    if (t > T.leap - 0.16) {
      const k = clamp((t - (T.leap - 0.16)) / 0.16);
      P.squash = 1 - 0.25 * Math.sin(k * Math.PI / 2);
    }
    if (t > T.leap) {
      const f = t - T.leap;
      const out = new THREE.Vector3(Math.sin(st.rotY), 0, Math.cos(st.rotY));
      st.pos.addScaledVector(out, f * 2.2);
      st.pos.y += f * 4.5 - 4.9 * f * f;
      P.squash = 1.25; P.armL = P.armR = 1.0; P.legTuck = 0.2; P.lean = -0.3 * f;
    }
    P.lookY = (P.lookY || 0) + (t > 18.2 && t < T.leap ? 0.35 : 0);
    if (t > 18.2 && t < 19.0) P.lookX = 0;
    return st;
  },

  update(t, lt, pipe) {
    const s = this.scene;
    const stC = this.clawdState(t);

    // ---------- cursor
    const blinkOn = t < 5.4 ? ((t + 0.25) % 1.06 < 0.53 ? 1 : 0) : 1;
    const charge = smooth(5.4, T.burst, t);
    const cursorVis = t < T.burst ? 1 : 0;
    const cI = (blinkOn * (0.95 + charge * 2.2) + (1 - blinkOn) * 0.03) * cursorVis;
    this.cursor.material.color.setRGB(1.0 * cI, 0.3 * cI, 0.12 * cI);
    const jitter = charge * 0.012 * Math.sin(t * 90);
    this.cursor.position.set(C.x + jitter, 0.07, C.z);
    this.cursor.scale.setScalar(1 + charge * 0.12 * Math.sin(t * 40) * 0.5 + charge * 0.15);
    this.cursor.visible = cursorVis > 0;
    this.cursorLight.intensity = cI * 0.6;
    // glow decal
    const burstFlash = Math.exp(-Math.max(0, t - T.burst) * 4) * (t >= T.burst ? 1 : 0);
    this.glow.material.opacity = 1;
    const g = cI * 0.08 + burstFlash * 0.35;
    this.glow.material.color.setRGB(1.0 * g, 0.42 * g, 0.2 * g);
    this.glow.scale.setScalar(1.6 + burstFlash * 3);

    // ---------- voxels
    const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), Sx = new THREE.Vector3(), P = new THREE.Vector3();
    const tb = t - T.burst;
    const showVox = t >= T.burst && t < T.swap;
    this.voxMesh.visible = showVox;
    let heatSum = 0; const centroid = new THREE.Vector3(); let cn = 0;
    if (showVox) {
      const b = easeOutExpo(tb / 0.9);
      this.vox.forEach((v, i) => {
        const ang = v.phi + v.w * (1 - Math.exp(-tb * 0.8)) * 2.2 + tb * 0.6;
        const cloud = new THREE.Vector3(C.x + Math.cos(ang) * v.r * b, 0.25 + v.h * b + Math.sin(tb * 2 + v.phi) * 0.05, C.z + Math.sin(ang) * v.r * b * 0.8);
        cloud.add(v.jit.clone().multiplyScalar(1 - b));
        const f = clamp((tb - v.delay) / v.dur);
        const e = easeInOutCubic(f);
        P.lerpVectors(cloud, v.target, e);
        P.y += Math.sin(Math.PI * e) * 0.35;
        Q.setFromAxisAngle(v.axis, v.spin * (1 - e) + tb * 2 * (1 - e));
        const land = tb - v.delay - v.dur;
        const pop = land > 0 ? 1 + 0.25 * wobble(land, 4, 0.3) : 1;
        const sc = (0.35 + 0.65 * b) * (f > 0 ? lerp(0.85, 1, e) : 0.85) * pop;
        Sx.copy(v.s).multiplyScalar(sc * 0.98);
        M.compose(P, Q, Sx);
        this.voxMesh.setMatrixAt(i, M);
        const heat = land > 0 ? Math.exp(-land / 0.4) * 0.8 : 0.55 + 0.2 * Math.sin(tb * 12 + v.phi * 5);
        this.voxHeat.array[i] = heat * clamp(tb / 0.15);
        heatSum += heat; if (f < 1) { centroid.add(P); cn++; }
      });
      this.voxMesh.instanceMatrix.needsUpdate = true; this.voxHeat.needsUpdate = true;
    }
    // ---------- Clawd
    this.clawd.root.visible = t >= T.swap;
    this.clawd.root.position.copy(stC.pos);
    this.clawd.root.rotation.y = stC.rotY;
    this.clawd.pose(stC.pose);
    const glowAfter = t >= T.swap ? Math.exp(-(t - T.swap) / 0.5) : 0;
    this.clayMat.emissiveIntensity = glowAfter * 0.9;
    // contact shadow follows Clawd onto steps/screen
    const groundY = this.groundUnder(stC.pos, t);
    this.contact.position.set(stC.pos.x, groundY + 0.006, stC.pos.z);
    this.contact.rotation.z = -stC.rotY;
    const hgt = stC.pos.y - groundY;
    this.contact.material.opacity = (t > T.burst + 1.5 ? 0.8 : 0) * clamp(1 - hgt * 1.2) * (t < T.leap + 0.6 ? 1 : 0);
    this.contact.scale.setScalar(1 + hgt * 0.5);

    // ---------- bars
    const glowK = 1.0;
    this.bars.forEach((b, i) => {
      const a = clamp((t - b.onset) / 0.12);
      const flash = 1 + 1.5 * Math.exp(-Math.max(0, t - b.onset) * 6) * (a > 0 ? 1 : 0);
      let len = b.len * easeOutCubic(a);
      let vis = a > 0 ? 1 : 0;
      if (b.stairT !== undefined && t >= b.stairT) vis = 0;
      const k = (b.kind === 'wb' || b.kind === 'tips') ? 1.0 : 1.15;
      P.set(b.x - b.len / 2 + len / 2, 0.02, b.z);
      Sx.set(Math.max(len, 1e-4), 0.04, 0.2 * vis + 1e-4);
      M.compose(P, Q.identity(), Sx);
      this.barMesh.setMatrixAt(i, M);
      const c = b.col.clone().multiplyScalar(k * flash * glowK * vis);
      this.barMesh.instanceColor.setXYZ(i, c.r, c.g, c.b);
    });
    this.barMesh.instanceMatrix.needsUpdate = true; this.barMesh.instanceColor.needsUpdate = true;
    for (const o of this.outlines) {
      const p = clamp((t - o.t0) / (o.t1 - o.t0));
      for (let i = 0; i < o.n; i++) {
        const a = o.pts[i], bb = o.pts[(i + 1) % o.pts.length];
        const on = i / o.n < easeInOutCubic(p) ? 1 : 0;
        const d = bb.clone().sub(a); const L = d.length();
        P.copy(a).add(bb).multiplyScalar(0.5); P.y = 0.02;
        Q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.atan2(-d.z, d.x));
        Sx.set(L * 1.05 * on + 1e-5, 0.03 * on + 1e-5, 0.06 * on + 1e-5);
        M.compose(P, Q, Sx);
        o.m.setMatrixAt(i, M);
        const head = Math.exp(-Math.abs(i / o.n - easeInOutCubic(p)) * 60) * 3 * (p < 1 ? 1 : 0);
        o.m.instanceColor.setXYZ(i, o.col.r * (1.3 + head), o.col.g * (1.3 + head), o.col.b * (1.3 + head));
      }
      o.m.instanceMatrix.needsUpdate = true; o.m.instanceColor.needsUpdate = true;
    }
    const lgOn = smooth(12.4, 12.6, t);
    this.logoMat.color.setRGB(1.6 * lgOn, 0.75 * lgOn, 0.52 * lgOn);
    this.lights3.forEach((m, i) => { m.material.emissiveIntensity = smooth(12.0 + i * 0.12, 12.3 + i * 0.12, t) * 1.6; });

    // ---------- stairs
    this.steps.forEach((st, k) => {
      const f = clamp((t - st.t0) / st.dur);
      st.g.visible = t >= st.t0;
      if (!st.g.visible) return;
      const e = easeInOutCubic(f);
      const from = new THREE.Vector3(st.src.b.x, 0.03, st.src.b.z);
      P.lerpVectors(from, st.p, e);
      P.y = lerp(0.03, st.p.y - 0.1, e) + Math.sin(Math.PI * e) * 1.4;
      st.g.position.copy(P);
      st.g.rotation.set(Math.sin(Math.PI * e) * 0.6 * (k % 2 ? 1 : -1), lerp(0, st.th, e) + (1 - e) * 2.0, Math.sin(Math.PI * e) * 0.4);
      const sx = lerp(st.src.b.len / 1.35, 1, e), sy = lerp(0.2, 1, e), sz = lerp(0.18, 1, e);
      const settle = 1 + 0.12 * wobble(t - st.t0 - st.dur, 4, 0.3);
      st.g.scale.set(sx * settle, sy, sz * settle);
      // landing nudge when Clawd hops on
      const hk = T.hops[k];
      if (hk !== undefined) st.g.position.y -= 0.06 * wobble(t - hk, 3.5, 0.3);
    });

    // ---------- particles
    this.dustP.forEach((d, i) => {
      const x = d.p.x + noise1(t * 0.15 + d.ph, 1) * 0.5, y = d.p.y + Math.sin(t * 0.3 + d.ph) * 0.15 + t * 0.02, z = d.p.z + noise1(t * 0.13 + d.ph, 2) * 0.5;
      const dl = Math.hypot(x - C.x, y - 0.3, z - C.z);
      const lit = (cI * 0.25 + heatSum / 1500 * 0.3) / (0.2 + dl * dl) + 0.015 * smooth(11.7, 14, t);
      this.dust.set(i, x, y, z, d.sz * 0.012, lit * 1.0, lit * 0.62, lit * 0.45);
    });
    this.dust.commit(pipe.H);
    this.sparkP.forEach((sp, i) => {
      const a = t - T.burst;
      const on = a > 0 && a < sp.life;
      const x = C.x + sp.v.x * a, y = 0.1 + sp.v.y * a - 2.5 * a * a, z = C.z + sp.v.z * a;
      const k = on ? Math.pow(1 - a / sp.life, 2) * 6 : 0;
      this.sparks.set(i, x, Math.max(y, 0.01), z, sp.sz * 0.015 * (on ? 1 : 0), k, k * 0.5, k * 0.25);
    });
    this.sparks.commit(pipe.H);

    // ---------- lighting
    const wake = smooth(T.wake, T.wake + 3.5, t);
    const lightsUp = smooth(T.burst + 1.0, T.eyes, t);
    this.key.intensity = lightsUp * 2.6;
    this.key.position.copy(stC.pos).add(new THREE.Vector3(-3.5, 6.5, 4.5));
    this.key.target.position.copy(stC.pos);
    this.rim.intensity = lightsUp * 1.6 + wake * 0.8;
    this.rim.position.copy(stC.pos).add(new THREE.Vector3(3, 3, -6));
    this.rim.target.position.copy(stC.pos);
    this.hemi.intensity = wake * 0.55;
    if (cn > 0) centroid.divideScalar(cn); else centroid.copy(C).add(new THREE.Vector3(0, 0.5, 0));
    this.cursorLight.position.copy(t < T.burst ? new THREE.Vector3(C.x, 0.25, C.z + 0.2) : centroid);
    if (t >= T.burst) this.cursorLight.intensity = (heatSum / this.vox.length) * 2.2 + burstFlash * 4 + glowAfter * 0.8;
    s.environmentIntensity = 0.12 * lightsUp + wake * 0.6;
    this.sky.material.uniforms.intensity.value = smooth(12.0, 16.5, t);
    this.sky.material.uniforms.time.value = t;
    this.cloudSea.material.uniforms.intensity.value = smooth(12.5, 17.0, t);
    this.cloudSea.material.uniforms.time.value = t;
    const pk = smooth(13.0, 17.0, t);
    for (const sp of this.puffs) { sp.material.opacity = pk * sp.userData.base; const toSun = sp.position.clone().normalize().dot(new THREE.Vector3(-0.75, 0, -0.66)); sp.material.color.setRGB(1.0, 0.72 + 0.1 * toSun, 0.6 + 0.12 * toSun).multiplyScalar(0.55 + 0.45 * Math.max(0, toSun)); }

    // ---------- camera
    this.updateCamera(t, stC, pipe);
    this.cloudSea.material.uniforms.camPos.value.copy(this.cam.position);

    // ---------- grade
    const G = pipe.grade;
    G.exposure = 1.0 + burstFlash * 0.25;
    G.vignette = 0.55 - wake * 0.2;
    G.saturation = 1.0; G.contrast = 1.08;
    G.lift.setRGB(0.0, 0.004, 0.012);
    G.fade = 1 - smooth(0.0, 0.8, t);
    pipe.bloom.strength = 0.55; pipe.bloom.radius = 0.45; pipe.bloom.threshold = 1.0;
    return { scene: s, camera: this.cam };
  },

  groundUnder(p, t) {
    // highest step under Clawd that exists, else screen
    let y = 0;
    for (const st of this.steps) {
      if (t < st.t0 + st.dur) continue;
      const d = Math.hypot(p.x - st.p.x, p.z - st.p.z);
      if (d < 0.75 && st.p.y <= p.y + 0.15) y = Math.max(y, st.p.y);
    }
    return y;
  },

  updateCamera(t, stC, pipe) {
    const cam = this.cam;
    const look = new THREE.Vector3();
    const pos = new THREE.Vector3();
    let fov = 30, focusTarget = null;
    // rig 0: macro on the cursor, slow push in
    const r0 = () => {
      const k = smooth(0, T.burst, t);
      return { p: new THREE.Vector3(C.x + lerp(1.1, 0.55, k), lerp(0.42, 0.3, k), C.z + lerp(3.4, 2.5, k)), l: new THREE.Vector3(C.x, 0.12, C.z), fov: 28 };
    };
    // rig 1: orbit during assembly
    const r1 = () => {
      const k = smoother(T.burst, T.eyes + 0.4, t);
      const ang = lerp(0.42, -0.18, k), dist = lerp(3.0, 4.3, easeOutCubic(clamp((t - T.burst) / 2.2))) - k * 1.3, h = lerp(0.45, 0.72, k);
      return { p: new THREE.Vector3(C.x + Math.sin(ang) * dist, h, C.z + Math.cos(ang) * dist), l: new THREE.Vector3(C.x, lerp(0.85, 0.55, k), C.z), fov: lerp(32, 28, k) };
    };
    // rig 2: rise, Clawd in the foreground, code waking up behind
    const r2 = () => {
      const k = smoother(T.wake + 0.05, 13.5, t);
      return { p: new THREE.Vector3(C.x + lerp(-0.2, 1.6, k), lerp(0.7, 1.55, k), C.z + lerp(3.0, 3.9, k)), l: new THREE.Vector3(C.x + lerp(0, 2.6, k), lerp(0.55, 0.2, k), C.z + lerp(0, -3.4, k)), fov: lerp(28, 40, k) };
    };
    // rig 3: follow Clawd up the stairs, outside the helix
    const r3 = () => {
      const pc = stC.pos;
      const out = new THREE.Vector3(pc.x - HC.x, 0, pc.z - HC.z).normalize();
      const tan = new THREE.Vector3(out.z, 0, -out.x);
      const p = pc.clone().addScaledVector(out, 4.4).addScaledVector(tan, -1.7); p.y = pc.y + 1.5;
      return { p, l: pc.clone().add(new THREE.Vector3(0, 0.45, 0)).addScaledVector(tan, 0.7), fov: 34 };
    };
    // rig 4: huge crane back
    const r4 = () => {
      const k = smoother(T.crane, T.end + 0.3, t);
      const pc = stC.pos;
      const d = Math.exp(lerp(Math.log(4.6), Math.log(60), k));
      const dir = new THREE.Vector3(0.55, lerp(0.3, 0.2, k), 0.9).normalize();
      const p = pc.clone().addScaledVector(dir, d);
      const l = pc.clone().lerp(new THREE.Vector3(-4, 4, -6), k * 0.8); l.y += 0.5 * (1 - k);
      return { p, l, fov: lerp(34, 32, k) };
    };
    const rigs = [[r0, 0], [r1, T.burst - 0.2], [r2, T.wake], [r3, 13.4], [r4, T.crane]];
    const blendDur = [0, 0.9, 0.7, 1.1, 0.7];
    let cur = r0();
    for (let i = 1; i < rigs.length; i++) {
      const [fn, ts] = rigs[i];
      if (t < ts) break;
      const w = smoother(ts, ts + blendDur[i], t);
      const nx = fn();
      cur = { p: cur.p.clone().lerp(nx.p, w), l: cur.l.clone().lerp(nx.l, w), fov: lerp(cur.fov, nx.fov, w) };
    }
    pos.copy(cur.p); look.copy(cur.l); fov = cur.fov;
    // subtle handheld
    const amp = 0.006 + 0.02 * smooth(T.crane, T.end, t);
    pos.x += noise1(t * 0.7, 3) * amp; pos.y += noise1(t * 0.7, 9) * amp;
    cam.position.copy(pos); cam.lookAt(look); cam.fov = fov; cam.updateProjectionMatrix();
    pipe.dof.focus = cam.position.distanceTo(stC.pos.clone().add(new THREE.Vector3(0, 0.45, 0)));
    pipe.dof.aperture = t < T.burst ? 0.3 : lerp(0.32, 0.03, smooth(T.crane, T.crane + 1.2, t));
    pipe.dof.maxBlur = 16;
  },
};
