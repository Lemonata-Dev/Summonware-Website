// Projects showcase: a draggable WebGL carousel. Each project is a 3D
// card (canvas-drawn artwork as texture) arranged in a shallow arc.
// Dragging bends the cards with velocity; hovering ripples them; the
// centered card drives the DOM detail panel. Snaps with inertia.
import * as THREE from "three";
import gsap from "gsap";
import { ParticleField, chaosCloud, cardSilhouette } from "./particles";

const ENTRANCE_COUNT = 1600;

type Project = {
  name: string; type: string; year: string; blurb: string; tags: string[]; hue: string;
  kind?: string; // selects a skeleton mockup illustration — see drawSkeleton()
};

const HUES: Record<string, [string, string, string]> = {
  // [bg top, bg bottom, ink]
  orange: ["#fc5d20", "#8a2400", "#ffffff"],
  dark: ["#2c3134", "#101214", "#ffffff"],
  light: ["#e8eaec", "#b9bfc4", "#24282b"],
};

/** rounded-rect helper shared by every skeleton mockup */
function rr(x: CanvasRenderingContext2D, px: number, py: number, w: number, h: number, r: number, fill: string, alpha = 1) {
  x.globalAlpha = alpha; x.fillStyle = fill;
  x.beginPath(); x.roundRect(px, py, w, h, r); x.fill();
  x.globalAlpha = 1;
}

/** Skeleton-view mockups: abstract wireframe illustrations (boxes, lines,
    icons) standing in for a real product screenshot — not a real UI,
    just enough shape language to read as "what this project is." */
function drawSkeleton(x: CanvasRenderingContext2D, kind: string, W: number, H: number, ink: string, panel: string) {
  const line = (x1: number, y1: number, x2: number, y2: number, w = 2, a = 0.5) => {
    x.globalAlpha = a; x.strokeStyle = ink; x.lineWidth = w;
    x.beginPath(); x.moveTo(x1, y1); x.lineTo(x2, y2); x.stroke(); x.globalAlpha = 1;
  };
  const ox = W * 0.36, oy = H * 0.1, ow = W * 0.58, oh = H * 0.72;

  switch (kind) {
    case "ecommerce-cdp": {
      // dashboard: nav strip, profile card, bar chart
      rr(x, ox, oy, ow, 34, 8, panel, 0.9);
      rr(x, ox + 16, oy + 10, 90, 14, 4, ink, 0.35);
      rr(x, ox, oy + 50, ow * 0.42, oh - 50, 10, panel, 0.9);
      x.globalAlpha = 0.4; x.strokeStyle = ink; x.lineWidth = 2;
      x.beginPath(); x.arc(ox + 34, oy + 88, 16, 0, Math.PI * 2); x.stroke(); x.globalAlpha = 1;
      rr(x, ox + 58, oy + 80, ow * 0.28, 10, 3, ink, 0.3);
      rr(x, ox + 58, oy + 98, ow * 0.18, 8, 3, ink, 0.2);
      for (let i = 0; i < 4; i++) rr(x, ox + 16 + i * 20, oy + 140 + (3 - i) * 12, 12, 40 + i * 12, 3, ink, 0.28);
      rr(x, ox + ow * 0.46, oy + 50, ow * 0.54, oh - 50, 10, panel, 0.9);
      const barX = ox + ow * 0.46 + 20, barW = ow * 0.54 - 40, barBase = oy + oh - 20;
      x.globalAlpha = 0.35; x.strokeStyle = ink; x.lineWidth = 2; x.beginPath();
      x.moveTo(barX, barBase - 10);
      for (let i = 0; i <= 6; i++) x.lineTo(barX + (barW / 6) * i, barBase - 10 - Math.sin(i * 1.1) * 30 - i * 4);
      x.stroke(); x.globalAlpha = 1;
      break;
    }
    case "ocr-action": {
      // document with dashed scan lines -> arrow -> action bolt
      const dw = ow * 0.38;
      rr(x, ox, oy + 20, dw, oh - 40, 8, panel, 0.9);
      x.strokeStyle = ink; x.lineWidth = 2;
      for (let i = 0; i < 6; i++) {
        x.globalAlpha = i === 2 ? 0.55 : 0.25;
        x.setLineDash(i === 2 ? [] : [4, 4]);
        line(ox + 16, oy + 50 + i * 24, ox + dw - 16 - (i % 2) * 20, oy + 50 + i * 24, 2, 1);
      }
      x.setLineDash([]);
      line(ox + dw + 14, oy + oh / 2, ox + dw + ow * 0.24, oy + oh / 2, 3, 0.5);
      x.globalAlpha = 0.5; x.fillStyle = ink;
      x.beginPath();
      x.moveTo(ox + dw + ow * 0.24 - 10, oy + oh / 2 - 8);
      x.lineTo(ox + dw + ow * 0.24 + 6, oy + oh / 2);
      x.lineTo(ox + dw + ow * 0.24 - 10, oy + oh / 2 + 8);
      x.fill(); x.globalAlpha = 1;
      const ax = ox + dw + ow * 0.42, ar = 48;
      x.globalAlpha = 0.9; x.strokeStyle = ink; x.lineWidth = 2.5;
      x.beginPath(); x.arc(ax + ar, oy + oh / 2, ar, 0, Math.PI * 2); x.stroke();
      x.beginPath();
      x.moveTo(ax + ar + 10, oy + oh / 2 - 20);
      x.lineTo(ax + ar - 6, oy + oh / 2 + 2);
      x.lineTo(ax + ar + 4, oy + oh / 2 + 2);
      x.lineTo(ax + ar - 10, oy + oh / 2 + 20);
      x.stroke(); x.globalAlpha = 1;
      break;
    }
    case "security": {
      // shield outline + checklist rows
      const sx = ox + ow * 0.22, sy = oy + oh * 0.08, sw = ow * 0.32, sh = oh * 0.62;
      x.globalAlpha = 0.85; x.strokeStyle = ink; x.lineWidth = 3;
      x.beginPath();
      x.moveTo(sx + sw / 2, sy);
      x.lineTo(sx + sw, sy + sh * 0.22);
      x.lineTo(sx + sw, sy + sh * 0.6);
      x.quadraticCurveTo(sx + sw, sy + sh, sx + sw / 2, sy + sh);
      x.quadraticCurveTo(sx, sy + sh, sx, sy + sh * 0.6);
      x.lineTo(sx, sy + sh * 0.22);
      x.closePath(); x.stroke();
      x.beginPath();
      x.moveTo(sx + sw * 0.32, sy + sh * 0.48);
      x.lineTo(sx + sw * 0.46, sy + sh * 0.62);
      x.lineTo(sx + sw * 0.7, sy + sh * 0.32);
      x.stroke(); x.globalAlpha = 1;
      for (let i = 0; i < 3; i++) {
        const ry = oy + oh * 0.78 + i * 26;
        x.globalAlpha = 0.4; x.strokeStyle = ink; x.lineWidth = 2;
        x.beginPath(); x.arc(ox + ow * 0.08, ry, 7, 0, Math.PI * 2); x.stroke();
        line(ox + ow * 0.08 - 3, ry, ox + ow * 0.08 + 3, ry + 4, 2, 0.4);
        rr(x, ox + ow * 0.18, ry - 5, ow * 0.55 - i * 40, 10, 3, ink, 0.22);
      }
      break;
    }
    case "microsoft": {
      // abstract app-tile grid (waffle-style launcher, generic — not a
      // trademarked logo, just a 3x3 grid of rounded tiles)
      const g = 3, gap = 16, tile = (ow - gap * (g - 1)) / g;
      for (let r = 0; r < g; r++)
        for (let c = 0; c < g; c++) {
          const isCenter = r === 1 && c === 1;
          rr(x, ox + c * (tile + gap), oy + oh * 0.06 + r * (tile + gap), tile, tile, 10, panel, isCenter ? 1 : 0.6);
        }
      break;
    }
    case "iot": {
      // hub-and-node network diagram
      const hx = ox + ow * 0.5, hy = oy + oh * 0.46;
      x.globalAlpha = 0.85; x.strokeStyle = ink; x.lineWidth = 2.5;
      x.beginPath(); x.arc(hx, hy, 22, 0, Math.PI * 2); x.stroke();
      x.beginPath(); x.arc(hx, hy, 9, 0, Math.PI * 2); x.fillStyle = ink; x.fill(); x.globalAlpha = 1;
      const nodes = [
        [ox + ow * 0.06, oy + oh * 0.1], [ox + ow * 0.94, oy + oh * 0.08],
        [ox + ow * 0.02, oy + oh * 0.78], [ox + ow * 0.96, oy + oh * 0.82],
        [ox + ow * 0.5, oy + oh * 0.96],
      ];
      for (const [nx, ny] of nodes) {
        line(hx, hy, nx, ny, 1.5, 0.3);
        x.globalAlpha = 0.6; x.strokeStyle = ink; x.lineWidth = 2;
        x.beginPath(); x.arc(nx, ny, 10, 0, Math.PI * 2); x.stroke(); x.globalAlpha = 1;
      }
      break;
    }
    default: {
      // fallback: the original orbital-rings motif
      x.strokeStyle = ink; x.globalAlpha = 0.14;
      for (let i = 0; i < 4; i++) {
        x.beginPath();
        x.ellipse(W * 0.72, H * 0.34, 90 + i * 46, 34 + i * 18, -0.35, 0, Math.PI * 2);
        x.stroke();
      }
      x.globalAlpha = 1;
    }
  }
}

/* draw a card texture: gradient field, skeleton mockup, meta text */
function drawCard(p: Project): THREE.CanvasTexture {
  const W = 640, H = 448;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const x = c.getContext("2d")!;
  const [top, bottom, ink] = HUES[p.hue] ?? HUES.orange;
  const panel = p.hue === "light" ? "#ffffff" : "rgba(255,255,255,0.9)";

  const g = x.createLinearGradient(0, 0, W * 0.4, H);
  g.addColorStop(0, top); g.addColorStop(1, bottom);
  x.fillStyle = g; x.fillRect(0, 0, W, H);

  // scan grid
  x.strokeStyle = ink; x.globalAlpha = 0.07;
  for (let i = 1; i < 10; i++) { x.beginPath(); x.moveTo((W / 10) * i, 0); x.lineTo((W / 10) * i, H); x.stroke(); }
  for (let i = 1; i < 7; i++) { x.beginPath(); x.moveTo(0, (H / 7) * i); x.lineTo(W, (H / 7) * i); x.stroke(); }
  x.globalAlpha = 1;

  drawSkeleton(x, p.kind ?? "", W, H, ink, panel);

  // meta
  x.fillStyle = ink;
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
    mesh.scale.setScalar(0); // revealed by the entrance sequence below
    scene.add(mesh);
    return mesh;
  });

  // Entrance: the shared particle field sweeps in from chaos and converges
  // on the first card's silhouette, then dissolves as the cards themselves
  // scale in — the same "material" arriving here as assembled the hero and
  // the services stage, so the carousel doesn't feel like a fresh scene.
  const entrance = new ParticleField({
    count: ENTRANCE_COUNT,
    from: chaosCloud(ENTRANCE_COUNT, 1.6),
    to: cardSilhouette(ENTRANCE_COUNT, 2.5, 1.75),
    chaos: 1,
    pointScale: 1.1,
  });
  scene.add(entrance.points);
  let entranceDone = false;
  function playEntrance() {
    if (entranceDone) return;
    entranceDone = true;
    gsap.to({ v: 0 }, {
      v: 1,
      duration: 1.3,
      ease: "power3.out",
      onUpdate: function () { entrance.setMix(this.targets()[0].v); },
      onComplete: () => {
        gsap.to({ s: 1.1 }, {
          s: 0,
          duration: 0.7,
          delay: 0.15,
          ease: "power2.in",
          onUpdate: function () { entrance.setPointScale(this.targets()[0].s); },
        });
        cards.forEach((m, i) => {
          gsap.to(m.scale, { x: 1, y: 1, z: 1, duration: 0.7, delay: i * 0.05, ease: "back.out(1.7)" });
        });
      },
    });
  }

  const BASE_Z = 4.2;
  function resize() {
    const w = canvas!.clientWidth || 1, h = canvas!.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // A fixed camera z with a fixed vertical FOV means horizontal FOV
    // shrinks with aspect ratio — on a narrow mobile viewport the card
    // (a fixed 2.5-world-unit width) no longer fits and overflows the
    // canvas edges. Dolly the camera back just enough to keep it framed.
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const neededZ = (2.5 * 1.2) / (2 * Math.tan(vFov / 2) * camera.aspect);
    camera.position.z = Math.max(BASE_Z, neededZ);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  /* ----- swipe / infinite loop ----- */
  // `target` free-runs (never clamped) — each card's on-screen position is
  // computed by wrapping its index distance from `offset` into the shortest
  // path around the loop, so scrolling past the last card seamlessly
  // continues into the first, and vice versa.
  const N = projects.length;
  function wrapDelta(i: number, off: number) {
    let d = i - off;
    d -= Math.round(d / N) * N;
    return d;
  }
  let offset = 0, target = 0;
  let dragging = false, startX = 0, startY = 0;
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

  // Swipe-to-advance instead of 1:1 drag-tracking — much more forgiving on
  // touch than requiring a precise proportional drag. A swipe past a small
  // threshold steps exactly one card; the smooth glide toward that target
  // (in tick(), below) provides the slide animation.
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true; startX = e.clientX; startY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    // hover ripple via raycast (independent of drag state)
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
  const endDrag = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      target += dx < 0 ? 1 : -1;
    }
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("wheel", (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
      target += e.deltaX * 0.003; // free-running — no clamp, loop wraps
    }
  }, { passive: false });

  const ray = new THREE.Raycaster();
  const clock = new THREE.Clock();

  // Pause rendering while off-screen — see hero3d.ts for why this matters:
  // several concurrent WebGL scenes rendering unconditionally is enough
  // load to stall unrelated rAF-driven animation elsewhere on the page.
  // The entrance sequence also only fires once the canvas is visible.
  let onScreen = false;
  let looping = false;
  new IntersectionObserver(
    ([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) {
        playEntrance();
        if (!looping) requestAnimationFrame(tick);
      }
    },
    { threshold: 0.2 }
  ).observe(canvas);

  function tick() {
    if (!onScreen) {
      looping = false;
      return;
    }
    looping = true;
    const t = clock.getElapsedTime();
    entrance.setTime(t);
    const prevOffset = offset;
    offset += (target - offset) * 0.09;
    const vel = (offset - prevOffset) * 12; // drives the bend shader during the glide

    cards.forEach((m, i) => {
      const d = wrapDelta(i, offset);
      const x = d * SPACING;
      m.position.x = x;
      m.position.z = -Math.abs(x) * 0.55;
      m.position.y = Math.sin(t * 0.8 + i) * 0.03;                 // idle float
      m.rotation.y = -x * 0.18;
      const u = m.userData.uniforms;
      u.uVel.value += (vel - u.uVel.value) * 0.2;
      u.uTime.value = t;
    });

    const nearest = ((Math.round(offset) % N) + N) % N;
    setDetail(nearest);
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
}
