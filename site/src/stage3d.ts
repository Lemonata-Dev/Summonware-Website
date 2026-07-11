// Feature-stage WebGL: ~7k particles that morph from a chaotic "idea"
// cloud into progressively structured shapes, ending as a browser-style
// app window. Mouse repels nearby particles; a noise wobble keeps the
// cloud alive. Morphs run in the vertex shader between two position
// buffers (aFrom -> aTo) driven by a single uMix uniform.
import * as THREE from "three";
import gsap from "gsap";

const COUNT = 7000;

/* ---------- target generators (each returns COUNT xyz triplets) ---------- */

function chaosCloud(): Float32Array {
  // pure imagination: gaussian swirl, no structure
  const a = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
    const r = 1.9 * Math.cbrt(Math.random());
    const th = Math.random() * Math.PI * 2;
    const ph = Math.acos(2 * Math.random() - 1);
    a[i * 3] = r * Math.sin(ph) * Math.cos(th) * 1.4;
    a[i * 3 + 1] = r * Math.sin(ph) * Math.sin(th);
    a[i * 3 + 2] = r * Math.cos(ph) * 0.6;
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

function gridPlane(): Float32Array {
  // blueprint: a loose isometric-ish grid taking shape
  const a = new Float32Array(COUNT * 3);
  const cols = 100, rows = Math.ceil(COUNT / 100);
  for (let i = 0; i < COUNT; i++) {
    const c = i % cols, r = Math.floor(i / cols);
    a[i * 3] = (c / (cols - 1) - 0.5) * 3.4 + (Math.random() - 0.5) * 0.04;
    a[i * 3 + 1] = (r / (rows - 1) - 0.5) * 2.3 + (Math.random() - 0.5) * 0.04;
    a[i * 3 + 2] = Math.sin(c * 0.35) * Math.cos(r * 0.3) * 0.25;
  }
  return a;
}

function wireBoxes(): Float32Array {
  // design pass: UI blocks emerging — header, sidebar, two cards
  const a = new Float32Array(COUNT * 3);
  const groups: [number, number, number, number][] = [
    [0, 0.95, 3.2, 0.35],      // header bar
    [-1.25, -0.25, 0.7, 1.9],  // sidebar
    [0.45, 0.25, 2.0, 0.85],   // card A
    [0.45, -0.75, 2.0, 0.85],  // card B
  ];
  const per = Math.floor(COUNT / groups.length);
  groups.forEach((g, gi) => rectOutline(a, gi * per, gi === groups.length - 1 ? COUNT - gi * per : per, ...g));
  return a;
}

function haloVortex(): Float32Array {
  // launch: particles become magic dust — orbital bands swirling around
  // the (solid, mesh-built) device that materializes at this step
  const a = new Float32Array(COUNT * 3);
  for (let i = 0; i < COUNT; i++) {
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

const TARGETS = [chaosCloud, gridPlane, wireBoxes, haloVortex].map((f) => f());
// per-step residual chaos: how much noise wobble each shape keeps
const CHAOS = [1.0, 0.45, 0.2, 0.07];

/* ---------- shaders ---------- */

const VERT = /* glsl */ `
  attribute vec3 aFrom;
  attribute vec3 aTo;
  attribute float aRand;
  uniform float uMix;
  uniform float uTime;
  uniform float uChaos;
  uniform vec3 uMouse;   // world-space, z unused for force
  varying float vRand;
  varying float vGlow;

  // cheap 3d noise-ish wobble
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
    pos += wobble(pos * 0.9 + aRand * 6.28, uTime * 0.6) * (0.12 + uChaos * 0.55) * (0.4 + aRand * 0.6);

    // mouse repulsion in xy
    vec2 d = pos.xy - uMouse.xy;
    float dist = length(d);
    float force = smoothstep(0.9, 0.0, dist);
    pos.xy += normalize(d + 1e-4) * force * 0.55;
    vGlow = force;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = (2.2 + aRand * 2.4 + force * 3.0) * (300.0 / -mv.z) * 0.01;
  }
`;

const FRAG = /* glsl */ `
  varying float vRand;
  varying float vGlow;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float soft = smoothstep(0.5, 0.1, d);
    vec3 orange = vec3(0.988, 0.365, 0.125);
    vec3 white  = vec3(1.0);
    vec3 col = mix(orange, white, step(0.82, vRand));
    col = mix(col, white, vGlow * 0.7);
    gl_FragColor = vec4(col, soft * (0.55 + vRand * 0.45));
  }
`;

/* ---------- solid device meshes (materialize at the final step) ---------- */

/** draw an original, plausible app UI onto a canvas for use as a screen texture */
function drawUI(kind: "phone" | "web"): THREE.CanvasTexture {
  const W = kind === "phone" ? 360 : 720, H = kind === "phone" ? 720 : 480;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d")!;
  const ink = "#24282b", soft = "#9aa1a6", accent = "#fc5d20", bg = "#f4f5f6", card = "#ffffff";

  x.fillStyle = bg; x.fillRect(0, 0, W, H);
  const rrect = (px: number, py: number, w: number, h: number, r: number, fill: string) => {
    x.fillStyle = fill; x.beginPath(); x.roundRect(px, py, w, h, r); x.fill();
  };

  if (kind === "phone") {
    rrect(0, 0, W, 84, 0, ink);                              // header
    rrect(24, 30, 130, 24, 6, accent);                       // header chip
    rrect(24, 108, W - 48, 110, 14, card);                   // hero card
    rrect(40, 130, 150, 16, 5, "#d8dbde");
    rrect(40, 158, 220, 12, 4, "#e6e8ea");
    rrect(40, 180, 90, 12, 4, accent);
    for (let i = 0; i < 3; i++) {                             // list rows
      rrect(24, 244 + i * 92, W - 48, 76, 12, card);
      rrect(40, 260 + i * 92, 44, 44, 10, i === 0 ? accent : "#d8dbde");
      rrect(100, 262 + i * 92, 150, 12, 4, "#d8dbde");
      rrect(100, 284 + i * 92, 110, 10, 4, "#e6e8ea");
    }
    rrect(0, H - 76, W, 76, 0, card);                        // tab bar
    for (let i = 0; i < 4; i++) rrect(38 + i * 82, H - 52, 28, 28, 8, i === 0 ? accent : "#d0d4d7");
  } else {
    rrect(0, 0, W, 56, 0, "#ffffff");                        // browser chrome
    for (let i = 0; i < 3; i++) { x.fillStyle = i === 0 ? accent : "#d0d4d7"; x.beginPath(); x.arc(28 + i * 24, 28, 7, 0, 7); x.fill(); }
    rrect(110, 16, 320, 26, 13, "#eceeef");                  // url bar
    rrect(0, 56, 170, H - 56, 0, ink);                       // sidebar
    for (let i = 0; i < 5; i++) rrect(20, 84 + i * 46, 130, 20, 6, i === 0 ? accent : "#3a4045");
    for (let gx = 0; gx < 2; gx++)                            // dashboard cards
      for (let gy = 0; gy < 2; gy++) {
        rrect(196 + gx * 260, 84 + gy * 180, 236, 156, 12, card);
        rrect(212 + gx * 260, 104 + gy * 180, 120, 14, 5, "#d8dbde");
        rrect(212 + gx * 260, 130 + gy * 180, 200, 90, 8, gx + gy === 0 ? accent : "#eceeef");
      }
  }
  x.strokeStyle = soft; x.globalAlpha = 0.0;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function buildDevices(): THREE.Group {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x101214, metalness: 0.6, roughness: 0.35, transparent: true });

  // browser window (back left)
  const web = new THREE.Group();
  const webScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(2.4, 1.6),
    new THREE.MeshBasicMaterial({ map: drawUI("web"), transparent: true })
  );
  const webBody = new THREE.Mesh(new THREE.BoxGeometry(2.52, 1.72, 0.06), bodyMat.clone());
  webBody.position.z = -0.04;
  web.add(webBody, webScreen);
  web.position.set(-0.55, 0.05, -0.5);
  web.rotation.y = 0.22;

  // phone (front right)
  const phone = new THREE.Group();
  const phoneScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.82, 1.64),
    new THREE.MeshBasicMaterial({ map: drawUI("phone"), transparent: true })
  );
  const phoneBody = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.74, 0.07), bodyMat.clone());
  phoneBody.position.z = -0.045;
  phone.add(phoneBody, phoneScreen);
  phone.position.set(0.95, -0.15, 0.35);
  phone.rotation.y = -0.28;

  g.add(web, phone);
  g.visible = false;
  return g;
}

/* ---------- public API ---------- */

export function initStageFX() {
  const canvas = document.getElementById("stage-canvas") as HTMLCanvasElement | null;
  if (!canvas) return null;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
  camera.position.z = 4.6;

  const geo = new THREE.BufferGeometry();
  const rand = new Float32Array(COUNT);
  for (let i = 0; i < COUNT; i++) rand[i] = Math.random();
  geo.setAttribute("position", new THREE.BufferAttribute(TARGETS[0].slice(), 3)); // required by three
  geo.setAttribute("aFrom", new THREE.BufferAttribute(TARGETS[0].slice(), 3));
  geo.setAttribute("aTo", new THREE.BufferAttribute(TARGETS[0].slice(), 3));
  geo.setAttribute("aRand", new THREE.BufferAttribute(rand, 1));

  const uniforms = {
    uMix: { value: 1 },
    uTime: { value: 0 },
    uChaos: { value: CHAOS[0] },
    uMouse: { value: new THREE.Vector3(99, 99, 0) },
  };
  const mat = new THREE.ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  // solid devices for the final step
  const devices = buildDevices();
  scene.add(devices);
  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const key = new THREE.DirectionalLight(0xffffff, 1.4);
  key.position.set(2, 3, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xfc5d20, 1.6);
  rim.position.set(-3, -1, 2);
  scene.add(rim);

  function resize() {
    const w = canvas!.clientWidth || 1, h = canvas!.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  // mouse in world coords on the z=0 plane
  const ray = new THREE.Raycaster();
  const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const hit = new THREE.Vector3();
  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    ray.ray.intersectPlane(planeZ, hit);
    uniforms.uMouse.value.copy(hit);
  });
  canvas.addEventListener("pointerleave", () => uniforms.uMouse.value.set(99, 99, 0));

  let current = 0;
  function setStep(i: number) {
    if (i === current) return;
    // snapshot the in-flight morph as the new start, then tween to target i
    const from = geo.getAttribute("aFrom") as THREE.BufferAttribute;
    const to = geo.getAttribute("aTo") as THREE.BufferAttribute;
    const m = THREE.MathUtils.smoothstep(Math.min(uniforms.uMix.value, 1), 0, 1);
    const snap = from.array as Float32Array;
    const target = to.array as Float32Array;
    for (let k = 0; k < snap.length; k++) snap[k] = snap[k] + (target[k] - snap[k]) * m;
    target.set(TARGETS[i]);
    from.needsUpdate = true;
    to.needsUpdate = true;
    uniforms.uMix.value = 0;
    gsap.to(uniforms.uMix, { value: 1, duration: 1.1, ease: "power3.out" });
    gsap.to(uniforms.uChaos, { value: CHAOS[i], duration: 1.1, ease: "power2.out" });

    // final step: materialize the devices; leaving it: dissolve them
    const mats: THREE.Material[] = [];
    devices.traverse((o) => { if (o instanceof THREE.Mesh) mats.push(o.material as THREE.Material); });
    if (i === 3) {
      devices.visible = true;
      devices.scale.setScalar(0.7);
      mats.forEach((m) => ((m as THREE.MeshBasicMaterial).opacity = 0));
      gsap.to(devices.scale, { x: 1, y: 1, z: 1, duration: 1.2, ease: "power3.out", delay: 0.25 });
      gsap.to(mats, { opacity: 1, duration: 0.9, delay: 0.25, ease: "power2.out" });
    } else if (devices.visible) {
      gsap.to(devices.scale, { x: 0.75, y: 0.75, z: 0.75, duration: 0.6, ease: "power2.in" });
      gsap.to(mats, { opacity: 0, duration: 0.5, ease: "power2.in", onComplete: () => (devices.visible = false) });
    }
    current = i;
  }

  const clock = new THREE.Clock();
  (function tick() {
    uniforms.uTime.value = clock.getElapsedTime();
    points.rotation.y = Math.sin(clock.elapsedTime * 0.12) * 0.12;
    if (devices.visible) {
      devices.rotation.y = Math.sin(clock.elapsedTime * 0.35) * 0.08;
      devices.position.y = Math.sin(clock.elapsedTime * 0.7) * 0.04;
      points.rotation.z += 0.0006; // halo slowly swirls around the product
    } else {
      points.rotation.z *= 0.98;
    }
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  })();

  return { setStep };
}
