import * as THREE from 'three';
import { rng } from './engine.js';

export function makeCloudSea({ y = -22, top = '#ffc09a', shade = '#2a2852', horizon = '#ff9466', sun = [-0.75, -0.66], scale = 0.0065, fogNear = 260, fogFar = 1500 } = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(4000, 4000), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { time: { value: 0 }, intensity: { value: 1 }, top: { value: new THREE.Color(top) }, shade: { value: new THREE.Color(shade) }, horizon: { value: new THREE.Color(horizon) }, camPos: { value: new THREE.Vector3() }, sun: { value: new THREE.Vector2(...sun).normalize() }, scale: { value: scale }, fogNear: { value: fogNear }, fogFar: { value: fogFar } },
    vertexShader: /* glsl */`varying vec3 vW; void main(){ vec4 w = modelMatrix*vec4(position,1.); vW = w.xyz; gl_Position = projectionMatrix*viewMatrix*w; }`,
    fragmentShader: /* glsl */`
      varying vec3 vW; uniform float time, intensity, scale, fogNear, fogFar; uniform vec3 top, shade, horizon, camPos; uniform vec2 sun;
      float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
      float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
      float fbm(vec2 p){ float a=.5, s=0.; for(int i=0;i<6;i++){ s+=a*n(p); p=p*2.02+vec2(1.7,9.2); a*=.5; } return s; }
      void main(){
        vec2 p = vW.xz*scale + vec2(time*0.002, 0.);
        float d = fbm(p);
        float ds = fbm(p + sun*0.035);
        float cov = smoothstep(0.38, 0.66, d);
        float lit = clamp(0.55 + (d - ds) * 7.5, 0., 1.);
        float fine = fbm(p*6.0);
        vec3 c = mix(shade, top, clamp(lit*0.85 + cov*0.25 + (fine-0.5)*0.25, 0., 1.));
        c += top * pow(lit, 6.) * 0.5 * cov;
        float dist = length(vW.xz - camPos.xz);
        float fogk = smoothstep(fogNear, fogFar, dist);
        c = mix(c, horizon, fogk);
        float a = mix(0.55 + cov*0.45, 1., fogk) * intensity;
        gl_FragColor = vec4(c * intensity, a);
      }`,
  }));
  m.rotation.x = -Math.PI / 2; m.position.y = y;
  return m;
}

let _puff = null;
export function puffTexture() {
  if (_puff) return _puff;
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
  _puff = new THREE.CanvasTexture(cv); _puff.colorSpace = THREE.SRGBColorSpace;
  return _puff;
}

export function makePuffs(scene, { n = 40, seed = 5, rMin = 30, rMax = 260, yMin = -30, yMax = -8, sMin = 18, sMax = 48, color = '#ffd2b8', opacity = [0.35, 0.75], center = new THREE.Vector3() } = {}) {
  const R = rng(seed), out = [];
  for (let i = 0; i < n; i++) {
    const m = new THREE.SpriteMaterial({ map: puffTexture(), transparent: true, depthWrite: false, color: new THREE.Color(color), opacity: opacity[0] + R() * (opacity[1] - opacity[0]) });
    const sp = new THREE.Sprite(m);
    const ang = R() * Math.PI * 2, dist = rMin + R() * (rMax - rMin);
    sp.position.set(center.x + Math.cos(ang) * dist, yMin + R() * (yMax - yMin), center.z + Math.sin(ang) * dist);
    const sc = sMin + R() * (sMax - sMin); sp.scale.set(sc * 1.8, sc, 1);
    sp.userData.base = m.opacity;
    scene.add(sp); out.push(sp);
  }
  return out;
}
