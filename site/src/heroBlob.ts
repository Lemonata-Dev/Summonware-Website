// Hero background, level 3 (kintsugi): a real-time WebGL fluid gradient,
// the same class of effect as khroma.co's hero (confirmed via direct
// inspection — a <canvas> with an active WebGL context, driven by a
// shader-effects library, blending a source texture through domain-warped
// noise). This is an original shader, not a copy of their asset or code —
// domain-warped fbm driving Summonware's own two-color-plus-neutral
// palette (ink -> amber -> accent orange) instead of a full rainbow, per
// the design system's "one signature color" rule. Rendered at a reduced
// internal resolution and softened with CSS blur for the same cheap,
// premium-looking softness trick, rather than an expensive analytic blur.
import * as THREE from "three";

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uAspect;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.05; a *= 0.55; }
    return v;
  }
  // domain warp: two nested fbm lookups feeding back into a third —
  // this is what gives the flow its organic, non-repeating drift.
  // Verified live (two screenshots 8s apart, WebGL readback doesn't work
  // here since three.js defaults preserveDrawingBuffer:false): the *0.045
  // etc coefficients this shipped with were real motion, just slow enough
  // a quick glance reads it as a static image — a genuine bug, not a
  // false alarm. ~4x faster is where it reads as unmistakably alive.
  vec2 warp(vec2 p, float t) {
    vec2 q = vec2(fbm(p + vec2(0.0, 0.0) + t * 0.18), fbm(p + vec2(5.2, 1.3) - t * 0.14));
    vec2 r = vec2(fbm(p + 3.2 * q + vec2(1.7, 9.2) + t * 0.12), fbm(p + 3.2 * q + vec2(8.3, 2.8) - t * 0.1));
    return r;
  }

  void main() {
    vec2 uv = vec2(vUv.x * uAspect, vUv.y);
    vec2 p = uv * 1.7;
    vec2 r = warp(p, uTime);
    float n = fbm(p + 2.6 * r);

    // Five-stop warm ramp (not two colors blended flat) so the flow reads
    // as banded and alive under blur, the way khroma's multi-hue blend
    // keeps visible structure even through heavy softening — ours stays
    // in the ink/amber/accent family instead of a full rainbow, but needs
    // the same number of real stops to read as rich rather than murky.
    vec3 ink    = vec3(0.086, 0.094, 0.102);
    vec3 maroon = vec3(0.46, 0.15, 0.08);
    vec3 amber  = vec3(0.82, 0.37, 0.07);
    vec3 accent = vec3(0.988, 0.365, 0.125);
    vec3 gold   = vec3(1.0, 0.8, 0.46);

    float t = n + 0.32 * (r.x + r.y);
    vec3 col = ink;
    col = mix(col, maroon, smoothstep(0.08, 0.40, t));
    col = mix(col, amber,  smoothstep(0.34, 0.64, t));
    col = mix(col, accent, smoothstep(0.56, 0.82, t));
    col = mix(col, gold,   smoothstep(0.80, 1.08, t));

    // A real presence anchored at the true top-right corner of the screen,
    // big enough to reach down past the headline/button band, not a small
    // blob hugging the nav row.
    //
    // .hero-blob-canvas (main.css) is deliberately oversized — inset: -15%,
    // width/height: 130% — so the blur filter's hard edge lands outside the
    // visible .hero-blob-wrap instead of showing a seam. That means this
    // shader's own vUv 0..1 space spans a box 30% BIGGER than what's ever
    // actually on screen: only the inner slice [0.15/1.3, 1.15/1.3] of vUv
    // is visible per axis. Defining the center in visible-fraction terms
    // (0 = left/top edge of what's actually shown, 1 = right/bottom edge)
    // and converting to raw uv keeps this correct regardless of aspect
    // ratio or if the oversize percentage in the CSS ever changes.
    //
    // NOTE on the y-axis: PlaneGeometry's UV has v=0 at the BOTTOM and
    // v=1 at the TOP (standard OpenGL convention) — confirmed empirically
    // via direct pixel readback (canvas.toDataURL(), preserveDrawingBuffer
    // true above) rather than assumed, since guessing this wrong once
    // already produced a wrongly-shaped blob. So centerVis.y close to 1
    // means "near the top", matching "top-right corner" here.
    float visMin = 0.15 / 1.3;
    float visMax = 1.15 / 1.3;
    float visSpan = visMax - visMin;
    vec2 centerVis = vec2(0.97, 0.94); // true top-right corner of the screen
    vec2 center = (visMin + centerVis * visSpan) * vec2(uAspect, 1.0);

    // A previous version sized this off the remaining distance to the
    // visible edge — correct for "reach the edge" but capped at how big a
    // smoothstep tail can usefully get before it just widens the same
    // small blob. With the center now anchored at the actual corner, the
    // ask is a fundamentally bigger presence (reaching down past the
    // headline/button band, not just sideways to the edge) — so this is a
    // large fixed radius scaled directly off aspect. 0.95 (tried first)
    // measured alpha 22-35 even at the far-left headline column — visibly
    // washing over the text's own background, not just extending rightward.
    // 0.6 keeps the same corner-anchored shape but tuned so the headline
    // column reads near-zero while the right side stays strong, verified
    // via the same full grid (both columns, not just the right side).
    float radius = uAspect * 0.6;

    float d = length(uv - center);
    float falloff = smoothstep(radius, 0.05, d);

    gl_FragColor = vec4(col, falloff * 0.62);
  }
`;

export function initHeroBlob() {
  const canvas = document.getElementById("hero-blob-canvas") as HTMLCanvasElement | null;
  const wrap = canvas?.parentElement;
  if (!canvas || !wrap) return;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // preserveDrawingBuffer: true — the default (false) lets the browser
  // clear the drawing buffer at any point after a frame renders, which
  // made this canvas impossible to verify externally (canvas.toDataURL()
  // and gl.readPixels both silently returned all-zero pixels when called
  // from outside the render loop itself, discovered while debugging the
  // hero gradient's right-edge coverage). Negligible cost for a canvas
  // this small — worth it so this class of bug is actually verifiable.
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true, preserveDrawingBuffer: true });
  // Lower internal resolution than the display size — rendered smaller,
  // then scaled up and CSS-blurred (see .hero-blob-canvas). Too aggressive
  // a downscale (this was 0.28) kills the noise detail before the blur
  // even runs, leaving a flat murky wash instead of visible flow bands.
  const RENDER_SCALE = 0.55;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const uniforms = { uTime: { value: 0 }, uAspect: { value: 1 } };
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms,
    transparent: true,
  }));
  scene.add(quad);

  function resize() {
    const w = wrap!.clientWidth || 1, h = wrap!.clientHeight || 1;
    renderer.setSize(w * RENDER_SCALE, h * RENDER_SCALE, false);
    // Do NOT set canvas.style.width/height here — .hero-blob-canvas (main.css)
    // already declares the canvas's display size (130%, inset:-15%, the
    // oversize that hides the blur filter's edge). An inline style always
    // wins over an external stylesheet rule regardless of specificity, so
    // a stray "100%" here was silently overriding that 130% down to 100%
    // while the inset:-15% positioning still shifted the box left/up —
    // leaving the canvas physically 15% short of the wrap's right and
    // bottom edges (a real gap, not a fade). Root-caused via direct
    // getBoundingClientRect() measurement after shader-only fixes kept
    // failing to close a right-edge void that turned out to be structural.
    uniforms.uAspect.value = w / h;
  }
  resize();
  new ResizeObserver(resize).observe(wrap);

  // Reduced motion still gets the glow — a still frame of the same
  // shader, arrived rather than animated — not a blank canvas.
  if (reduced) {
    renderer.render(scene, camera);
    return;
  }

  let onScreen = true;
  let looping = false;
  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen && !looping) requestAnimationFrame(tick);
  }).observe(canvas);

  const clock = new THREE.Clock();
  function tick() {
    if (!onScreen) { looping = false; return; }
    looping = true;
    uniforms.uTime.value = clock.getElapsedTime();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
