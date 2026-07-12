// Feature-stage WebGL: the shared particle field morphs from a chaotic
// "idea" cloud through progressively structured shapes, ending as an
// orbital halo around solid device meshes that materialize in place —
// the moment the product becomes real. Mouse repels nearby particles.
import * as THREE from "three";
import gsap from "gsap";
import { ParticleField, chaosCloud, gridPlane, wireBoxes, haloVortex } from "./particles";

const COUNT = 7000;
const TARGETS = [chaosCloud(COUNT), gridPlane(COUNT), wireBoxes(COUNT), haloVortex(COUNT)];
// per-step residual chaos: how much noise wobble each shape keeps
const CHAOS = [1.0, 0.45, 0.2, 0.07];

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

  const field = new ParticleField({ count: COUNT, from: TARGETS[0], to: TARGETS[0], chaos: CHAOS[0] });
  field.setMix(1);
  scene.add(field.points);

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
    field.setMouseWorld(hit);
  });
  canvas.addEventListener("pointerleave", () => field.setMouseWorld(null));

  let current = 0;
  function setStep(i: number) {
    if (i === current) return;
    field.morphTo(TARGETS[i], CHAOS[i], 1.1);

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

  // Pause rendering while off-screen — see hero3d.ts for why this matters:
  // several concurrent WebGL scenes rendering unconditionally is enough
  // load to stall unrelated rAF-driven animation elsewhere on the page.
  let onScreen = true;
  let looping = false;
  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen && !looping) requestAnimationFrame(tick);
  }).observe(canvas);

  const clock = new THREE.Clock();
  function tick() {
    if (!onScreen) {
      looping = false;
      return;
    }
    looping = true;
    const t = clock.getElapsedTime();
    field.setTime(t);
    field.points.rotation.y = Math.sin(t * 0.12) * 0.12;
    if (devices.visible) {
      devices.rotation.y = Math.sin(t * 0.35) * 0.08;
      devices.position.y = Math.sin(t * 0.7) * 0.04;
      field.points.rotation.z += 0.0006; // halo slowly swirls around the product
    } else {
      field.points.rotation.z *= 0.98;
    }
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();

  return { setStep };
}
