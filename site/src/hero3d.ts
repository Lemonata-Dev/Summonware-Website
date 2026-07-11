// Scroll-scrubbed Three.js hero: a crystalline "summon" artifact that
// assembles and rotates as the user scrolls, replacing a prerendered
// frame sequence with a real-time render.
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export function initHero3D() {
  const canvas = document.getElementById("scroll-canvas") as HTMLCanvasElement | null;
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 7);

  // Lighting: soft studio key + orange rim
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 4, 5);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xff4d0d, 2.2);
  rim.position.set(-4, -2, -3);
  scene.add(rim);

  // Core artifact: faceted crystal
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.15, 0),
    new THREE.MeshStandardMaterial({ color: 0x24282b, metalness: 0.75, roughness: 0.25, flatShading: true })
  );

  // Orbiting shards that converge as you scroll
  const shards = new THREE.Group();
  const shardMat = new THREE.MeshStandardMaterial({ color: 0xff4d0d, emissive: 0xd63a05, emissiveIntensity: 0.55, metalness: 0.3, roughness: 0.4, flatShading: true });
  const shardData: { mesh: THREE.Mesh; start: THREE.Vector3; end: THREE.Vector3 }[] = [];
  for (let i = 0; i < 14; i++) {
    const mesh = new THREE.Mesh(new THREE.TetrahedronGeometry(0.16 + Math.random() * 0.14), shardMat);
    const dir = new THREE.Vector3().randomDirection();
    const start = dir.clone().multiplyScalar(3.4 + Math.random() * 2.2);
    const end = dir.clone().multiplyScalar(1.55 + Math.random() * 0.25);
    mesh.position.copy(start);
    mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);
    shards.add(mesh);
    shardData.push({ mesh, start, end });
  }

  // Rotating rune ring
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(2.1, 0.015, 8, 96),
    new THREE.MeshBasicMaterial({ color: 0x24282b, transparent: true, opacity: 0.35 })
  );
  ring.rotation.x = Math.PI / 2.4;

  const rig = new THREE.Group();
  rig.add(core, shards, ring);
  scene.add(rig);

  function resize() {
    const w = canvas!.clientWidth, h = canvas!.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // keep artifact right-of-center on wide screens, centered on mobile
    rig.position.x = w > 760 ? 1.6 : 0;
  }
  resize();
  window.addEventListener("resize", resize);

  // Scroll scrub: assembly progress 0→1 across the hero's 260vh
  const progress = { t: 0 };
  gsap.to(progress, {
    t: 1,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom bottom", scrub: 0.6 },
  });

  const clock = new THREE.Clock();
  function tick() {
    const el = clock.getElapsedTime();
    const t = progress.t;

    rig.rotation.y = el * 0.15 + t * Math.PI * 2;
    core.rotation.x = t * Math.PI * 0.8;
    core.scale.setScalar(0.85 + t * 0.35);

    for (const s of shardData) {
      s.mesh.position.lerpVectors(s.start, s.end, THREE.MathUtils.smoothstep(t, 0, 1));
      s.mesh.rotation.y = el * 0.6;
    }

    ring.rotation.z = el * 0.2;
    (ring.material as THREE.MeshBasicMaterial).opacity = 0.15 + t * 0.35;
    ring.scale.setScalar(1 - t * 0.25);

    camera.position.z = 7 - t * 0.9;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
  tick();
}
