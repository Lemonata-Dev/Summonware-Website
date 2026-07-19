// Shared WebGL particle engine — the visual "material" reused across the
// hero, the services morph stage, and the projects carousel entrance, so
// the whole scroll reads as one continuous material assembling itself
// rather than three unrelated 3D scenes.
//
// A ParticleField morphs between named target-shape buffers, either via
// a direct scroll-scrubbed mix (setMix) or a discrete gsap-tweened step
// (morphTo). Mouse position repels nearby particles and adds glow.
import * as THREE from "three";
import gsap from "gsap";

/** brand accent as a normalized rgb triplet, shared by every scene's shader */
export const ACCENT_RGB = new THREE.Vector3(0.988, 0.365, 0.125); // #fc5d20

/* ---------- target-shape generators ---------- */
/* Each returns count*3 floats. Pass the same `count` the field was built
   with — buffers of mismatched length will not update correctly. */

export function chaosCloud(count: number, spread = 1): Float32Array {
  const a = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const r = 1.9 * spread * Math.cbrt(Math.random());
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    a[i * 3] = r * Math.sin(ph) * Math.cos(th) * 1.4;
    a[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    a[i * 3 + 2] = r * Math.cos(ph) * 0.6;
  }
  return a;
}

/** points scattered just outside a sphere shell of `radius` — used to
    let particles "skin" a solid mesh (e.g. the hero crystal) */
export function sphereShell(count: number, radius: number): Float32Array {
  const a = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const dir = new THREE.Vector3().randomDirection();
    const r = radius * (1.0 + Math.random() * 0.22);
    a[i * 3] = dir.x * r;
    a[i * 3 + 1] = dir.y * r;
    a[i * 3 + 2] = dir.z * r;
  }
  return a;
}

/** distribute n points along a rect outline (w×h centered at cx,cy) */
function rectOutline(out: Float32Array, start: number, n: number, cx: number, cy: number, w: number, h: number, z = 0) {
  const per = 2 * (w + h);
  for (let i = 0; i < n; i++) {
    let d = (i / n) * per;
    let x = 0, y = 0;
    if (d < w) { x = -w / 2 + d; y = h / 2; }
    else if (d < w + h) { x = w / 2; y = h / 2 - (d - w); }
    else if (d < 2 * w + h) { x = w / 2 - (d - w - h); y = -h / 2; }
    else { x = -w / 2; y = -h / 2 + (d - 2 * w - h); }
    out[(start + i) * 3] = cx + x;
    out[(start + i) * 3 + 1] = cy + y;
    out[(start + i) * 3 + 2] = z + (Math.random() - 0.5) * 0.05;
  }
}

export function gridPlane(count: number): Float32Array {
  const a = new Float32Array(count * 3);
  const cols = 100, rows = Math.ceil(count / 100);
  for (let i = 0; i < count; i++) {
    const c = i % cols, r = Math.floor(i / cols);
    a[i * 3] = (c / (cols - 1) - 0.5) * 3.4 + (Math.random() - 0.5) * 0.04;
    a[i * 3 + 1] = (r / (rows - 1) - 0.5) * 2.3 + (Math.random() - 0.5) * 0.04;
    a[i * 3 + 2] = Math.sin(c * 0.35) * Math.cos(r * 0.3) * 0.25;
  }
  return a;
}

export function wireBoxes(count: number): Float32Array {
  const a = new Float32Array(count * 3);
  const groups: [number, number, number, number][] = [
    [0, 0.95, 3.2, 0.35],
    [-1.25, -0.25, 0.7, 1.9],
    [0.45, 0.25, 2.0, 0.85],
    [0.45, -0.75, 2.0, 0.85],
  ];
  const per = Math.floor(count / groups.length);
  groups.forEach((g, gi) => rectOutline(a, gi * per, gi === groups.length - 1 ? count - gi * per : per, ...g));
  return a;
}

export function haloVortex(count: number): Float32Array {
  const a = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const band = i % 3;
    const th = Math.random() * Math.PI * 2;
    const rx = 1.7 + band * 0.35 + (Math.random() - 0.5) * 0.12;
    const ry = 1.15 + band * 0.22 + (Math.random() - 0.5) * 0.1;
    const tilt = -0.35 + band * 0.3;
    const x = Math.cos(th) * rx;
    const y = Math.sin(th) * ry;
    a[i * 3] = x;
    a[i * 3 + 1] = y * Math.cos(tilt) + (Math.random() - 0.5) * 0.06;
    a[i * 3 + 2] = y * Math.sin(tilt) + (Math.random() - 0.5) * 0.3 - 0.4;
  }
  return a;
}

/** points that converge onto a target plane rect (used by the carousel
    entrance: particles arrive to "become" the first card) */
export function cardSilhouette(count: number, w: number, h: number, cx = 0, cy = 0): Float32Array {
  const a = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    a[i * 3] = cx + (Math.random() - 0.5) * w;
    a[i * 3 + 1] = cy + (Math.random() - 0.5) * h;
    a[i * 3 + 2] = (Math.random() - 0.5) * 0.05;
  }
  return a;
}

/* ---------- shaders ---------- */

const VERT = /* glsl */ `
  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute float aRand;
  uniform float uMix;
  uniform float uTime;
  uniform float uChaos;
  uniform vec3 uMouse;
  uniform float uPointScale;
  varying float vRand;
  varying float vGlow;

  vec3 wobble(vec3 p, float t) {
    return vec3(
      sin(p.y * 2.1 + t) * cos(p.z * 1.7 + t * 0.8),
      sin(p.z * 1.9 + t * 1.1) * cos(p.x * 2.3 + t),
      sin(p.x * 1.6 + t * 0.9) * cos(p.y * 2.0 + t * 1.2)
    );
  }

  void main() {
    vRand = aRand;
    float m = smoothstep(0.0, 1.0, uMix);
    vec3 pos = mix(aFrom, aTo, m);

    // spiral-in: each particle orbits around origin as it converges, the
    // angle decaying to zero at full mix — reads as being "drawn in" by
    // a vortex rather than just drifting to its target
    float swirl = (1.0 - m) * (1.0 - m) * (1.6 + aRand * 1.4);
    float sA = sin(swirl), cA = cos(swirl);
    pos.xy = mat2(cA, -sA, sA, cA) * pos.xy;

    pos += wobble(pos * 0.9 + aRand * 6.28, uTime * 0.6) * (0.12 + uChaos * 0.55) * (0.4 + aRand * 0.6);

    vec2 d = pos.xy - uMouse.xy;
    float dist = length(d);
    float force = smoothstep(0.9, 0.0, dist);
    pos.xy += normalize(d + 1e-4) * force * 0.32;
    vGlow = force;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (2.2 + aRand * 2.4 + force * 3.0) * (300.0 / -mv.z) * 0.01 * uPointScale;
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uAccent;
  varying float vRand;
  varying float vGlow;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.1, d);
    vec3 white = vec3(1.0);
    vec3 col = mix(uAccent, white, step(0.82, vRand));
    col = mix(col, white, vGlow * 0.7);
    gl_FragColor = vec4(col, soft * (0.55 + vRand * 0.45));
  }
`;

/* ---------- ParticleField ---------- */

export class ParticleField {
  points: THREE.Points;
  private geo: THREE.BufferGeometry;
  private uniforms: {
    uMix: { value: number };
    uTime: { value: number };
    uChaos: { value: number };
    uMouse: { value: THREE.Vector3 };
    uAccent: { value: THREE.Vector3 };
    uPointScale: { value: number };
  };
  private count: number;

  constructor(opts: { count: number; from: Float32Array; to: Float32Array; chaos?: number; pointScale?: number }) {
    this.count = opts.count;
    const geo = new THREE.BufferGeometry();
    const rand = new Float32Array(opts.count);
    for (let i = 0; i < opts.count; i++) rand[i] = Math.random();
    geo.setAttribute("position", new THREE.BufferAttribute(opts.from.slice(), 3));
    geo.setAttribute("aFrom", new THREE.BufferAttribute(opts.from.slice(), 3));
    geo.setAttribute("aTo", new THREE.BufferAttribute(opts.to.slice(), 3));
    geo.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));
    this.geo = geo;

    this.uniforms = {
      uMix: { value: 0 },
      uTime: { value: 0 },
      uChaos: { value: opts.chaos ?? 1 },
      uMouse: { value: new THREE.Vector3(99, 99, 0) },
      uAccent: { value: ACCENT_RGB.clone() },
      uPointScale: { value: opts.pointScale ?? 1 },
    };
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: this.uniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(geo, mat);
  }

  /** direct scroll-scrubbed mix between the current aFrom/aTo, 0..1 — no tween */
  setMix(t: number) {
    this.uniforms.uMix.value = t;
  }

  setChaos(v: number) {
    this.uniforms.uChaos.value = v;
  }

  setPointScale(v: number) {
    this.uniforms.uPointScale.value = v;
  }

  setMouseWorld(v: THREE.Vector3 | null) {
    this.uniforms.uMouse.value.copy(v ?? new THREE.Vector3(99, 99, 0));
  }

  setTime(t: number) {
    this.uniforms.uTime.value = t;
  }

  /** replace the from/to targets outright (e.g. switching scroll sections) */
  setTargets(from: Float32Array, to: Float32Array) {
    (this.geo.getAttribute("aFrom") as THREE.BufferAttribute).set(from);
    (this.geo.getAttribute("aTo") as THREE.BufferAttribute).set(to);
    this.geo.getAttribute("aFrom").needsUpdate = true;
    this.geo.getAttribute("aTo").needsUpdate = true;
    this.uniforms.uMix.value = 0;
  }

  /** gsap-tweened step morph: snapshots the in-flight position as the new
      start, then eases uMix 0->1 toward `target`. Used for discrete steps
      (services stage, carousel entrance) rather than scroll-scrubbing. */
  morphTo(target: Float32Array, chaos: number, duration = 1.1) {
    const from = this.geo.getAttribute("aFrom") as THREE.BufferAttribute;
    const to = this.geo.getAttribute("aTo") as THREE.BufferAttribute;
    const m = THREE.MathUtils.smoothstep(Math.min(this.uniforms.uMix.value, 1), 0, 1);
    const snap = from.array as Float32Array;
    const cur = to.array as Float32Array;
    for (let k = 0; k < snap.length; k++) snap[k] = snap[k] + (cur[k] - snap[k]) * m;
    cur.set(target);
    from.needsUpdate = true;
    to.needsUpdate = true;
    this.uniforms.uMix.value = 0;
    gsap.to(this.uniforms.uMix, { value: 1, duration, ease: "power3.out" });
    gsap.to(this.uniforms.uChaos, { value: chaos, duration, ease: "power2.out" });
  }

  get particleCount() {
    return this.count;
  }
}
