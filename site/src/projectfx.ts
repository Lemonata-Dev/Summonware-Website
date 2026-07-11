// Project-cover WebGL: each card cover is a small shader plane — layered
// flowing noise in the card's hue, with a mouse-follow ripple that
// intensifies on hover. One lightweight renderer per cover.
import * as THREE from "three";
import gsap from "gsap";

const FRAG = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec2 uMouse;      // uv space
  uniform float uHover;     // 0..1
  uniform vec3 uColA;
  uniform vec3 uColB;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
               mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.55;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.1; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 uv = vUv;

    // mouse ripple: radial displacement wave from the pointer
    vec2 d = uv - uMouse;
    float dist = length(d * vec2(1.33, 1.0));
    float ripple = sin(dist * 26.0 - uTime * 5.0) * exp(-dist * 5.0) * (0.35 + uHover);
    uv += normalize(d + 1e-4) * ripple * 0.03;

    float n = fbm(uv * 3.0 + vec2(uTime * 0.08, -uTime * 0.05));
    float n2 = fbm(uv * 6.0 - vec2(uTime * 0.05, uTime * 0.07) + n);
    vec3 col = mix(uColA, uColB, smoothstep(0.45, 1.15, n + n2 * 0.4));

    // faint scan grid, stronger on hover
    float grid = max(
      smoothstep(0.97, 1.0, fract(uv.x * 14.0)),
      smoothstep(0.97, 1.0, fract(uv.y * 10.0))
    );
    col += grid * 0.08 * (0.4 + uHover);

    // glow halo around cursor
    col += exp(-dist * 7.0) * 0.22 * (0.3 + uHover);

    gl_FragColor = vec4(col, 1.0);
  }
`;

const VERT = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
`;

const HUES: Record<string, [THREE.Color, THREE.Color]> = {
  orange: [new THREE.Color("#fc5d20"), new THREE.Color("#7a1f00")],
  dark: [new THREE.Color("#24282b"), new THREE.Color("#0c0d0e")],
  light: [new THREE.Color("#d9dcdf"), new THREE.Color("#9aa1a6")],
};

export function attachCoverFX(canvas: HTMLCanvasElement, hue: string) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const [a, b] = HUES[hue] ?? HUES.orange;

  const uniforms = {
    uTime: { value: Math.random() * 20 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uHover: { value: 0 },
    uColA: { value: a },
    uColB: { value: b },
  };
  scene.add(
    new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms })
    )
  );

  function resize() {
    renderer.setSize(canvas.clientWidth || 1, canvas.clientHeight || 1, false);
  }
  resize();
  window.addEventListener("resize", resize);

  const host = canvas.parentElement!;
  host.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    uniforms.uMouse.value.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
  });
  host.addEventListener("pointerenter", () => gsap.to(uniforms.uHover, { value: 1, duration: 0.5 }));
  host.addEventListener("pointerleave", () => gsap.to(uniforms.uHover, { value: 0, duration: 0.8 }));

  const clock = new THREE.Clock();
  (function tick() {
    uniforms.uTime.value += clock.getDelta();
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  })();
}
