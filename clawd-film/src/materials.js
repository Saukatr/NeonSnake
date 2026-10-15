import * as THREE from 'three';

// Clay material with a per-instance "heat" attribute that adds incandescent emission.
export function heatClay({ color = '#D2725A', heatColor = new THREE.Color(1.0, 0.42, 0.12), heatScale = 9 } = {}) {
  const m = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(color), roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.3, sheen: 0.3, sheenColor: new THREE.Color('#ffb59a'),
  });
  m.userData.heatScale = { value: heatScale };
  m.onBeforeCompile = (sh) => {
    sh.uniforms.heatScale = m.userData.heatScale;
    sh.uniforms.heatColor = { value: heatColor };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aHeat;\nvarying float vHeat;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvHeat = aHeat;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vHeat;\nuniform float heatScale;\nuniform vec3 heatColor;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float hh = clamp(vHeat, 0., 1.);
        totalEmissiveRadiance += mix(heatColor, vec3(1.0, 0.85, 0.6), hh*hh) * pow(hh, 1.6) * heatScale;`);
  };
  return m;
}

// Unlit glowing material driven by instanceColor (HDR values allowed)
export function glowMat() {
  return new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
}

// Soft radial gradient sprite texture
let _soft = null;
export function softDot() {
  if (_soft) return _soft;
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  _soft = new THREE.CanvasTexture(cv);
  return _soft;
}

// Particle system: positions/sizes/colors updated on CPU each frame, rendered additively as soft discs
export class Sparks {
  constructor(n, { additive = true, sizeAtten = true } = {}) {
    this.n = n;
    const g = this.geo = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('size', new THREE.BufferAttribute(new Float32Array(n), 1));
    this.mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      uniforms: { map: { value: softDot() }, scale: { value: 1 } },
      vertexShader: /* glsl */`attribute float size; attribute vec3 color; varying vec3 vC; uniform float scale;
        void main(){ vC = color; vec4 mv = modelViewMatrix*vec4(position,1.); gl_Position = projectionMatrix*mv; gl_PointSize = size * scale / -mv.z; }`,
      fragmentShader: additive ? /* glsl */`uniform sampler2D map; varying vec3 vC; void main(){ float a = texture2D(map, gl_PointCoord).a; gl_FragColor = vec4(vC * a, a); }`
        : /* glsl */`uniform sampler2D map; varying vec3 vC; void main(){ float a = texture2D(map, gl_PointCoord).a; float k = clamp(max(vC.r, max(vC.g, vC.b)), 0., 1.); gl_FragColor = vec4(vC / max(k, 1e-3), a * k); }`,
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
  }
  set(i, x, y, z, size, r, g, b) {
    const P = this.geo.attributes.position.array, C = this.geo.attributes.color.array, S = this.geo.attributes.size.array;
    P[i * 3] = x; P[i * 3 + 1] = y; P[i * 3 + 2] = z; S[i] = size; C[i * 3] = r; C[i * 3 + 1] = g; C[i * 3 + 2] = b;
  }
  commit(H) {
    this.mat.uniforms.scale.value = H * 0.5;
    for (const k of ['position', 'color', 'size']) this.geo.attributes[k].needsUpdate = true;
  }
}
