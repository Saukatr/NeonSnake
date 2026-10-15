import * as THREE from 'three';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';

// ---------- math helpers ----------
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, x) => clamp((x - a) / (b - a));
export const smooth = (a, b, x) => { const t = invLerp(a, b, x); return t * t * (3 - 2 * t); };
export const smoother = (a, b, x) => { const t = invLerp(a, b, x); return t * t * t * (t * (t * 6 - 15) + 10); };
export const easeOutCubic = t => 1 - Math.pow(1 - clamp(t), 3);
export const easeInCubic = t => Math.pow(clamp(t), 3);
export const easeInOutCubic = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
export const easeOutExpo = t => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * clamp(t)));
export const easeInOutSine = t => -(Math.cos(Math.PI * clamp(t)) - 1) / 2;
export const easeOutBack = (t, s = 1.70158) => { t = clamp(t) - 1; return t * t * ((s + 1) * t + s) + 1; };
// damped spring step response, 0 -> 1 with overshoot
export const spring = (t, freq = 3, damp = 0.35) => {
  if (t <= 0) return 0;
  const w = 2 * Math.PI * freq;
  return 1 - Math.exp(-damp * w * t) * Math.cos(w * Math.sqrt(1 - damp * damp) * t);
};
// impulse that rings and decays (for squash wobble). starts at 0, peaks ~1
export const wobble = (t, freq = 3, damp = 0.25) => (t <= 0 ? 0 : Math.exp(-damp * 2 * Math.PI * freq * t) * Math.sin(2 * Math.PI * freq * t));
export const bump = (t, a, b) => (t <= a || t >= b ? 0 : Math.sin(Math.PI * (t - a) / (b - a)));

export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
// smooth 1D value noise for handheld camera
export function noise1(x, seed = 0) {
  const h = n => { const s = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453; return s - Math.floor(s); };
  const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return lerp(h(i), h(i + 1), u) * 2 - 1;
}
export const shake = (t, amp, freq = 0.6, seed = 0) =>
  new THREE.Vector3(noise1(t * freq, seed) * amp, noise1(t * freq, seed + 7) * amp, noise1(t * freq, seed + 13) * amp * 0.5);

// ---------- palette ----------
export const PAL = {
  clay: new THREE.Color('#D97757'),
  clayDeep: new THREE.Color('#B85C3E'),
  cream: new THREE.Color('#F4EDE4'),
  ink: new THREE.Color('#141413'),
  slate: new THREE.Color('#1F1E1D'),
};

// ---------- renderer / post pipeline ----------
const quadGeo = new THREE.PlaneGeometry(2, 2);
const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
function fsPass(material) {
  const scene = new THREE.Scene();
  const mesh = new THREE.Mesh(quadGeo, material);
  mesh.frustumCulled = false;
  scene.add(mesh);
  return { scene, material, render(renderer, target) { renderer.setRenderTarget(target); renderer.render(scene, quadCam); } };
}

const vs = /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0., 1.); }`;

export class Pipeline {
  constructor(canvas, W, H) {
    this.W = W; this.H = H;
    const r = this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    r.setPixelRatio(1);
    r.setSize(W, H, false);
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.toneMapping = THREE.NoToneMapping;
    r.outputColorSpace = THREE.LinearSRGBColorSpace;

    const depthTexture = new THREE.DepthTexture(W, H);
    depthTexture.type = THREE.FloatType;
    this.sceneRT = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples: 4, depthTexture, colorSpace: THREE.LinearSRGBColorSpace });
    const half = { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: false };
    this.cocRT = new THREE.WebGLRenderTarget(W >> 1, H >> 1, half);
    this.blurRT = new THREE.WebGLRenderTarget(W >> 1, H >> 1, half);
    this.compRT = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, depthBuffer: false });

    this.dof = { enabled: true, focus: 5, aperture: 0.6, maxBlur: 14 };
    this.grade = { exposure: 1.0, contrast: 1.05, saturation: 1.05, vignette: 0.35, grain: 0.035, ca: 0.0015, lift: new THREE.Color(0, 0, 0), gain: new THREE.Color(1, 1, 1), fade: 0.0, flash: 0.0 };

    // CoC + downsample
    this.cocPass = fsPass(new THREE.ShaderMaterial({
      vertexShader: vs,
      uniforms: { tColor: { value: null }, tDepth: { value: null }, near: { value: 0.1 }, far: { value: 100 }, focus: { value: 5 }, aperture: { value: 1 }, maxBlur: { value: 14 }, texel: { value: new THREE.Vector2() } },
      fragmentShader: /* glsl */`
        varying vec2 vUv; uniform sampler2D tColor, tDepth; uniform float near, far, focus, aperture, maxBlur; uniform vec2 texel;
        float lin(float d){ float z = d*2.-1.; return 2.*near*far/(far+near-z*(far-near)); }
        void main(){
          vec3 c = vec3(0.); float dmin = 1e9;
          for(int i=0;i<4;i++){ vec2 o = (vec2(i&1, i>>1)-.5)*texel; c += texture2D(tColor, vUv+o).rgb; dmin = min(dmin, lin(texture2D(tDepth, vUv+o).r)); }
          c *= .25;
          float coc = aperture * abs(dmin - focus) / dmin * 40.;
          gl_FragColor = vec4(c, clamp(coc, 0., maxBlur));
        }`,
    }));
    // gather bokeh (half res)
    this.blurPass = fsPass(new THREE.ShaderMaterial({
      vertexShader: vs,
      uniforms: { tCoc: { value: null }, texel: { value: new THREE.Vector2() }, maxBlur: { value: 14 } },
      fragmentShader: /* glsl */`
        varying vec2 vUv; uniform sampler2D tCoc; uniform vec2 texel; uniform float maxBlur;
        const float GA = 2.39996323;
        void main(){
          vec4 cen = texture2D(tCoc, vUv);
          vec3 col = cen.rgb; float tot = 1.;
          float rad = 1.0;
          for (int i = 0; i < 90; i++) {
            if (rad >= maxBlur) break;
            float ang = float(i) * GA;
            vec4 s = texture2D(tCoc, vUv + vec2(cos(ang), sin(ang)) * texel * rad);
            float m = smoothstep(rad - 1.0, rad + 1.0, s.a);
            // bright highlights get more weight -> nicer bokeh balls
            float w = mix(1., 1. + 2.*smoothstep(1.2, 4., dot(s.rgb, vec3(.3,.5,.2))), m);
            col += mix(col / tot, s.rgb, m) * w;
            tot += w;
            rad += 1.6 / rad + 0.32;
          }
          gl_FragColor = vec4(col / tot, cen.a);
        }`,
    }));
    // composite sharp + blurred
    this.compPass = fsPass(new THREE.ShaderMaterial({
      vertexShader: vs,
      uniforms: { tColor: { value: null }, tBlur: { value: null }, tDepth: { value: null }, near: { value: .1 }, far: { value: 100 }, focus: { value: 5 }, aperture: { value: 1 }, maxBlur: { value: 14 } },
      fragmentShader: /* glsl */`
        varying vec2 vUv; uniform sampler2D tColor, tBlur, tDepth; uniform float near, far, focus, aperture, maxBlur;
        float lin(float d){ float z = d*2.-1.; return 2.*near*far/(far+near-z*(far-near)); }
        void main(){
          vec3 sharp = texture2D(tColor, vUv).rgb;
          vec4 b = texture2D(tBlur, vUv);
          float z = lin(texture2D(tDepth, vUv).r);
          float coc = clamp(aperture * abs(z - focus) / z * 40., 0., maxBlur);
          float k = smoothstep(0.6, 2.5, max(coc, b.a * 0.85));
          gl_FragColor = vec4(mix(sharp, b.rgb, k), 1.);
        }`,
    }));

    this.bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.6, 0.6, 0.9);

    this.finalPass = fsPass(new THREE.ShaderMaterial({
      vertexShader: vs,
      uniforms: {
        tColor: { value: null }, exposure: { value: 1 }, contrast: { value: 1 }, saturation: { value: 1 }, vignette: { value: .3 },
        grain: { value: .03 }, ca: { value: .001 }, seed: { value: 0 }, lift: { value: new THREE.Color() }, gain: { value: new THREE.Color(1, 1, 1) },
        fade: { value: 0 }, flash: { value: 0 }, aspect: { value: W / H },
      },
      fragmentShader: /* glsl */`
        varying vec2 vUv; uniform sampler2D tColor; uniform float exposure, contrast, saturation, vignette, grain, ca, seed, fade, flash, aspect;
        uniform vec3 lift, gain;
        vec3 aces(vec3 x){ // Narkowicz fit
          const float a=2.51,b=.03,c=2.43,d=.59,e=.14; return clamp((x*(a*x+b))/(x*(c*x+d)+e),0.,1.); }
        vec3 toSRGB(vec3 c){ return mix(c*12.92, 1.055*pow(c, vec3(1./2.4))-.055, step(.0031308, c)); }
        float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32+seed); return fract(p.x*p.y); }
        void main(){
          vec2 d = vUv - .5;
          float r2 = dot(d*vec2(aspect,1.), d*vec2(aspect,1.));
          vec2 off = d * ca * (1. + r2*2.);
          vec3 c;
          c.r = texture2D(tColor, vUv - off).r;
          c.g = texture2D(tColor, vUv).g;
          c.b = texture2D(tColor, vUv + off).b;
          c *= exposure;
          c = aces(c);
          // grade in display-ish space
          float l = dot(c, vec3(.2126,.7152,.0722));
          c = mix(vec3(l), c, saturation);
          c = (c - .5) * contrast + .5;
          c = c * gain + lift * (1. - c);
          c *= 1. - vignette * smoothstep(.2, 1.1, r2*1.3);
          c = clamp(c, 0., 1.);
          c = toSRGB(c);
          float g = hash(vUv*1000. + seed) - .5;
          c += g * grain * (1.2 - dot(c, vec3(.33)));
          c = mix(c, vec3(1.), flash);
          c *= 1. - fade;
          gl_FragColor = vec4(c, 1.);
        }`,
    }));
  }

  render(scene, camera, frame) {
    const r = this.renderer;
    r.setRenderTarget(this.sceneRT);
    r.clear();
    r.render(scene, camera);
    let src = this.sceneRT;
    const D = this.dof;
    if (D.enabled) {
      for (const p of [this.cocPass, this.compPass]) {
        const u = p.material.uniforms;
        u.near.value = camera.near; u.far.value = camera.far; u.focus.value = D.focus; u.aperture.value = D.aperture; u.maxBlur.value = D.maxBlur;
      }
      const cu = this.cocPass.material.uniforms;
      cu.tColor.value = this.sceneRT.texture; cu.tDepth.value = this.sceneRT.depthTexture; cu.texel.value.set(1 / this.W, 1 / this.H);
      this.cocPass.render(r, this.cocRT);
      const bu = this.blurPass.material.uniforms;
      bu.tCoc.value = this.cocRT.texture; bu.texel.value.set(2 / this.W, 2 / this.H); bu.maxBlur.value = D.maxBlur / 2;
      this.blurPass.render(r, this.blurRT);
      const mu = this.compPass.material.uniforms;
      mu.tColor.value = this.sceneRT.texture; mu.tBlur.value = this.blurRT.texture; mu.tDepth.value = this.sceneRT.depthTexture;
      this.compPass.render(r, this.compRT);
      src = this.compRT;
    } else {
      // copy into compRT so bloom can write in place
      const mu = this.compPass.material.uniforms;
      mu.tColor.value = this.sceneRT.texture; mu.tBlur.value = this.sceneRT.texture; mu.tDepth.value = this.sceneRT.depthTexture;
      mu.aperture.value = 0;
      this.compPass.render(r, this.compRT);
      src = this.compRT;
    }
    if (this.bloom.strength > 0.001) this.bloom.render(r, null, src, 0, false);
    const G = this.grade, fu = this.finalPass.material.uniforms;
    fu.tColor.value = src.texture;
    fu.exposure.value = G.exposure; fu.contrast.value = G.contrast; fu.saturation.value = G.saturation; fu.vignette.value = G.vignette;
    fu.grain.value = G.grain; fu.ca.value = G.ca; fu.seed.value = (frame * 0.6180339) % 1; fu.lift.value.copy(G.lift); fu.gain.value.copy(G.gain);
    fu.fade.value = G.fade; fu.flash.value = G.flash;
    this.finalPass.render(r, null);
  }

  resetGrade() {
    Object.assign(this.grade, { exposure: 1.0, contrast: 1.05, saturation: 1.05, vignette: 0.35, grain: 0.035, ca: 0.0015, fade: 0, flash: 0 });
    this.grade.lift.setRGB(0, 0, 0); this.grade.gain.setRGB(1, 1, 1);
    Object.assign(this.dof, { enabled: true, focus: 5, aperture: 0.6, maxBlur: 14 });
    this.bloom.strength = 0.6; this.bloom.radius = 0.6; this.bloom.threshold = 0.9;
  }
}

// gradient sky dome with sun glow and soft procedural clouds
export function makeSky({ top = '#1b2a4a', mid = '#e9a07a', bottom = '#f6d7b0', sunDir = new THREE.Vector3(0.3, 0.15, -1), sunColor = '#fff1d6', sunSize = 0.9995, clouds = 0.5, cloudColor = '#ffffff', stars = 0 } = {}) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: {
      top: { value: new THREE.Color(top) }, mid: { value: new THREE.Color(mid) }, bottom: { value: new THREE.Color(bottom) },
      sunDir: { value: sunDir.clone().normalize() }, sunColor: { value: new THREE.Color(sunColor) }, sunSize: { value: sunSize },
      clouds: { value: clouds }, cloudColor: { value: new THREE.Color(cloudColor) }, time: { value: 0 }, stars: { value: stars }, intensity: { value: 1 },
    },
    vertexShader: /* glsl */`varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position,1.); gl_Position = p.xyww; }`,
    fragmentShader: /* glsl */`
      varying vec3 vDir; uniform vec3 top, mid, bottom, sunDir, sunColor, cloudColor; uniform float sunSize, clouds, time, stars, intensity;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
      float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<5;i++){ s+=a*n(p); p*=2.03; a*=.5; } return s; }
      void main(){
        vec3 d = normalize(vDir);
        float y = d.y;
        vec3 c = mix(bottom, mid, smoothstep(-0.15, 0.12, y));
        c = mix(c, top, smoothstep(0.08, 0.75, y));
        float sd = max(dot(d, normalize(sunDir)), 0.);
        c += sunColor * (pow(sd, 6.) * .35 + pow(sd, 60.) * .8);
        c += sunColor * smoothstep(sunSize, sunSize + 0.0003, sd) * 8.;
        if (clouds > 0. && y > -0.05) {
          vec2 uv = d.xz / (y + 0.18) * 1.2 + vec2(time*0.01, 0.);
          float f = fbm(uv * 1.3);
          float cl = smoothstep(0.52, 0.8, f) * clouds * smoothstep(-0.05, 0.2, y) * (1. - smoothstep(0.5, 0.9, y));
          vec3 cc = mix(cloudColor, sunColor, pow(sd, 4.) * .6);
          c = mix(c, cc * (0.75 + 0.5*f), cl);
        }
        if (stars > 0.) {
          vec3 q = d * 380.; vec3 iq = floor(q); float r = fract(sin(dot(iq, vec3(12.9898,78.233,37.719)))*43758.5453);
          float st = step(0.9975, r) * smoothstep(0.5, 0.0, length(fract(q)-.5)) * stars * smoothstep(0., .3, y);
          c += vec3(st) * 3.;
        }
        gl_FragColor = vec4(c * intensity, 1.);
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(500, 48, 24), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1000;
  return mesh;
}

// image-based lighting from a scene (sky) so reflections match the environment
export function envFromScene(renderer, scene) {
  const pm = new THREE.PMREMGenerator(renderer);
  const rt = pm.fromScene(scene, 0.02);
  pm.dispose();
  return rt.texture;
}

export function softShadowLight(color, intensity, pos, size = 6, mapSize = 2048) {
  const l = new THREE.DirectionalLight(color, intensity);
  l.position.copy(pos);
  l.castShadow = true;
  l.shadow.mapSize.set(mapSize, mapSize);
  const c = l.shadow.camera;
  c.left = -size; c.right = size; c.top = size; c.bottom = -size; c.near = 0.1; c.far = 80;
  l.shadow.bias = -0.0004;
  l.shadow.normalBias = 0.02;
  l.shadow.radius = 4;
  return l;
}

// canvas texture helpers
export function canvasTex(w, h, draw, { repeat = false, srgb = true } = {}) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  draw(cv.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(cv);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.anisotropy = 8;
  return t;
}
