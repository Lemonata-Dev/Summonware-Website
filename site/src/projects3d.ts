// Projects showcase: a draggable WebGL carousel. Each project is a 3D
// card (canvas-drawn artwork as texture) arranged in a shallow arc.
// Dragging bends the cards with velocity; hovering ripples them; the
// centered card drives the DOM detail panel. Snaps with inertia.
import * as THREE from "three";
import gsap from "gsap";

type Project = {
  name: string; type: string; year: string; blurb: string; tags: string[]; hue: string;
};

const HUES: Record<string, [string, string, string]> = {
  // [bg top, bg bottom, ink]
  orange: ["#fc5d20", "#8a2400", "#ffffff"],
  dark: ["#2c3134", "#101214", "#ffffff"],
  light: ["#e8eaec", "#b9bfc4", "#24282b"],
};

/* draw a card texture: gradient field, grid, monogram, meta text */
function drawCard(p: Project): THREE.CanvasTexture {
  const W = 640, H = 448;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d")!;
  const [top, bottom, ink] = HUES[p.hue] ?? HUES.orange;

  const g = x.createLinearGradient(0, 0, W * 0.4, H);
  g.addColorStop(0, top); g.addColorStop(1, bottom);
  x.fillStyle = g; x.fillRect(0, 0, W, H);

  // orbital rings motif
  x.strokeStyle = ink; x.globalAlpha = 0.14;
  for (let i = 0; i < 4; i++) {
    x.beginPath();
    x.ellipse(W * 0.72, H * 0.34, 90 + i * 46, 34 + i * 18, -0.35, 0, Math.PI * 2);
    x.stroke();
  }
  // scan grid
  x.globalAlpha = 0.07;
  for (let i = 1; i < 10; i++) { x.beginPath(); x.moveTo((W / 10) * i, 0); x.lineTo((W / 10) * i, H); x.stroke(); }
  for (let i = 1; i < 7; i++) { x.beginPath(); x.moveTo(0, (H / 7) * i); x.lineTo(W, (H / 7) * i); x.stroke(); }
  x.globalAlpha = 1;

  // monogram
  x.fillStyle = ink;
  x.font = "700 150px Archivo, sans-serif";
  x.textBaseline = "middle";
  x.fillText(p.name.slice(0, 2), 46, H * 0.42);

  // meta
  x.font = "400 22px 'Space Mono', monospace";
  x.globalAlpha = 0.85;
  x.fillText(p.type.toUpperCase(), 46, H - 84);
  x.textAlign = "right";
  x.fillText(p.year, W - 46, H - 84);
  x.textAlign = "left";
  x.font = "600 34px Archivo, sans-serif";
  x.globalAlpha = 1;
  x.fillText(p.name, 46, H - 40);

  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const VERT = /* glsl */ `
  uniform float uVel;     // drag velocity -> bend
  uniform float uHover;   // 0..1
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 pos = position;
    // bend around Y axis by velocity, strongest at horizontal edges
    pos.z += sin(uv.x * 3.14159) * uVel * 0.35;
    pos.z += sin(uv.y * 3.14159) * uVel * 0.12;
    // hover: gentle swell toward viewer
    pos.z += uHover * 0.06 * sin(uv.x * 3.14159) * sin(uv.y * 3.14159);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const FRAG = /* glsl */ `
  precision highp float;
  uniform sampler2D uMap;
  uniform vec2 uMouse;    // uv of pointer on this card
  uniform float uHover;
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    // pointer ripple distorts the texture lookup
    vec2 d = uv - uMouse;
    float dist = length(d * vec2(1.43, 1.0));
    float ripple = sin(dist * 30.0 - uTime * 5.0) * exp(-dist * 6.0) * uHover;
    uv += normalize(d + 1e-4) * ripple * 0.02;

    vec4 col = texture2D(uMap, uv);
    col.rgb += exp(-dist * 8.0) * 0.15 * uHover;   // cursor glow

    // rounded corners mask
    vec2 q = abs(vUv - 0.5) - vec2(0.5 - 0.045, 0.5 - 0.064);
    float corner = length(max(q, 0.0));
    float alpha = 1.0 - smoothstep(0.028, 0.045, corner);
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(col.rgb, alpha);
  }
`;

export function initProjects3D(projects: Project[]) {
  const canvas = document.getElementById("projects-canvas") as HTMLCanvasElement | null;
  const detail = document.getElementById("project-detail");
  if (!canvas || !detail) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.z = 4.2;

  const SPACING = 2.9;
  const geo = new THREE.PlaneGeometry(2.5, 1.75, 48, 32);
  const cards = projects.map((p, i) => {
    const uniforms = {
      uMap: { value: drawCard(p) },
      uVel: { value: 0 },
      uHover: { value: 0 },
      uMouse: { value: new THREE.Vector2(0.5, 0.5) },
      uTime: { value: 0 },
    };
    const mesh = new THREE.Mesh(
      geo,
      new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms, transparent: true })
    );
    mesh.userData = { index: i, uniforms };
    scene.add(mesh);
    return mesh;
  });

  function resize() {
    const w = canvas!.clientWidth || 1, h = canvas!.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  /* ----- drag / inertia / snap ----- */
  let offset = 0, target = 0, vel = 0;
  let dragging = false, lastX = 0, moved = 0;
  let active = -1;

  function setDetail(i: number) {
    if (i === active) return;
    active = i;
    const p = projects[i];
    detail!.innerHTML = `
      <div class="project-meta tag-mono"><span>${p.type}</span><span>${p.year}</span></div>
      <h4>${p.name}</h4>
      <p>${p.blurb}</p>
      <div class="project-tags">${p.tags.map((t) => `<span>${t}</span>`).join("")}</div>`;
    gsap.fromTo(detail, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
  }

  canvas.addEventListener("pointerdown", (e) => {
    dragging = true; lastX = e.clientX; moved = 0;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (dragging) {
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      moved += Math.abs(dx);
      target -= dx * 0.0045;
      vel = -dx * 0.02;
    }
    // hover ripple via raycast
    const r = canvas.getBoundingClientRect();
    const ndc = new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(cards);
    cards.forEach((m) => {
      const u = m.userData.uniforms;
      const hit = hits.find((h) => h.object === m);
      if (hit && hit.uv) {
        u.uMouse.value.copy(hit.uv);
        gsap.to(u.uHover, { value: 1, duration: 0.4, overwrite: "auto" });
      } else {
        gsap.to(u.uHover, { value: 0, duration: 0.6, overwrite: "auto" });
      }
    });
    canvas.style.cursor = hits.length ? "grab" : "default";
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    // snap to nearest card, clamped
    const nearest = Math.round(THREE.MathUtils.clamp(target, 0, projects.length - 1));
    gsap.to({ v: target }, {
      v: nearest, duration: 0.8, ease: "power3.out",
      onUpdate() { target = (this as any).targets()[0].v; },
    });
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("wheel", (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
      target = THREE.MathUtils.clamp(target + e.deltaX * 0.003, -0.4, projects.length - 0.6);
    }
  }, { passive: false });

  const ray = new THREE.Raycaster();
  const clock = new THREE.Clock();

  (function tick() {
    const t = clock.getElapsedTime();
    offset += (target - offset) * 0.09;
    vel *= 0.92;

    cards.forEach((m, i) => {
      const x = (i - offset) * SPACING;
      m.position.x = x;
      m.position.z = -Math.abs(x) * 0.55;
      m.position.y = Math.sin(t * 0.8 + i) * 0.03;                 // idle float
      m.rotation.y = -x * 0.18;
      const u = m.userData.uniforms;
      u.uVel.value += (vel - u.uVel.value) * 0.2;
      u.uTime.value = t;
    });

    setDetail(Math.round(THREE.MathUtils.clamp(offset, 0, projects.length - 1)));
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  })();
}
