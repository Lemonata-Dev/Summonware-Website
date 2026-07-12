// Hero WebGL: a barrier of light rising from a summoning seal. No
// floating object rotating into view, no tearing rift — a rune-etched
// seal ignites on the ground, and as the user scrolls a translucent
// energy dome grows up out of it, particles rising from the seal onto
// its surface, until it stands fully formed with a payoff flash. Scroll
// IS the summon; nothing spins, nothing zooms.
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ParticleField, chaosCloud, sealRing, domeShell } from "./particles";

gsap.registerPlugin(ScrollTrigger);

const SPARK_COUNT = 2400;
const DOME_RADIUS = 1.55;
const BASE_Y = -1.4;

export function initHero3D() {
  const canvas = document.getElementById("scroll-canvas") as HTMLCanvasElement | null;
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 7);

  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const rim = new THREE.DirectionalLight(0xff7a2e, 1.6);
  rim.position.set(-3, 2, 3);
  scene.add(rim);

  const FRESNEL_VERT = /* glsl */ `
    varying vec3 vNormal;
    varying vec3 vViewPos;
    varying vec2 vUv;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vViewPos = -mv.xyz;
      vUv = uv;
      gl_Position = projectionMatrix * mv;
    }
  `;

  // The dome: a translucent energy barrier shell, rune-etched, glassy —
  // alpha rises at grazing angles (fresnel) so it reads as a shield, not
  // a solid object. Grown via mesh.scale, driven directly by scroll.
  const domeUniforms = { uTime: { value: 0 }, uGrowth: { value: 0 } };
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(DOME_RADIUS, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.ShaderMaterial({
      uniforms: domeUniforms,
      vertexShader: FRESNEL_VERT,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform float uTime;
        uniform float uGrowth;
        varying vec3 vNormal;
        varying vec3 vViewPos;
        varying vec2 vUv;

        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p) {
          vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1,0)), f.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), f.x), f.y);
        }
        float fbm(vec2 p) {
          float v = 0.0, a = 0.55;
          for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.1; a *= 0.5; }
          return v;
        }

        void main() {
          vec3 N = normalize(vNormal);
          vec3 V = normalize(vViewPos);
          float fresnel = pow(1.0 - max(dot(N, V), 0.0), 2.0);

          // faint rune grid etched on the shell surface
          float gu = smoothstep(0.965, 1.0, fract(vUv.x * 20.0));
          float gv = smoothstep(0.965, 1.0, fract(vUv.y * 9.0));
          float grid = max(gu, gv) * 0.45;

          // internal energy visible through the glass
          float n = fbm(vUv * 3.5 + vec2(uTime * 0.12, uTime * 0.08));

          vec3 base = vec3(0.04, 0.025, 0.05);
          vec3 glow = vec3(1.0, 0.46, 0.15);
          vec3 col = mix(base, glow, n * 0.28 + grid);
          col += glow * fresnel * 1.05;

          float alpha = clamp(fresnel * 0.85 + grid * 0.5 + 0.06, 0.0, 1.0) * uGrowth;
          if (alpha < 0.015) discard;
          gl_FragColor = vec4(col, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
  );
  dome.position.y = BASE_Y;
  dome.scale.setScalar(0.001);

  // The payoff: an actual device showing a real app UI, materializing
  // inside the dome as it grows — concrete, legible, "software" made
  // visible rather than an abstract glowing panel.
  function drawAppUI(): THREE.CanvasTexture {
    const W = 640, H = 440;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const x = c.getContext("2d")!;
    const ink = "#24282b", accent = "#fc5d20", bg = "#f4f5f6", card = "#ffffff";
    const rrect = (px: number, py: number, w: number, h: number, r: number, fill: string) => {
      x.fillStyle = fill; x.beginPath(); x.roundRect(px, py, w, h, r); x.fill();
    };
    rrect(0, 0, W, H, 14, bg);
    rrect(0, 0, W, 46, 0, "#ffffff");
    for (let i = 0; i < 3; i++) { x.fillStyle = i === 0 ? accent : "#d0d4d7"; x.beginPath(); x.arc(22 + i * 20, 23, 6, 0, 7); x.fill(); }
    rrect(90, 12, 260, 22, 11, "#eceeef");
    rrect(0, 46, 140, H - 46, 0, ink);
    for (let i = 0; i < 5; i++) rrect(16, 70 + i * 40, 108, 18, 6, i === 0 ? accent : "#3a4045");
    for (let gx = 0; gx < 2; gx++)
      for (let gy = 0; gy < 2; gy++) {
        rrect(164 + gx * 236, 70 + gy * 168, 214, 144, 12, card);
        rrect(180 + gx * 236, 88 + gy * 168, 110, 13, 4, "#d8dbde");
        rrect(180 + gx * 236, 112 + gy * 168, 182, 82, 8, gx + gy === 0 ? accent : "#eceeef");
      }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }
  const revealUniforms = { uReveal: { value: 0 } };
  const screenMat = new THREE.MeshBasicMaterial({ map: drawAppUI(), transparent: true, opacity: 0 });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.55, 1.07), screenMat);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x101214, metalness: 0.6, roughness: 0.35, transparent: true, opacity: 0 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.66, 1.16, 0.06), bodyMat);
  body.position.z = -0.035;
  const device = new THREE.Group();
  device.add(body, screen);
  device.position.set(0, BASE_Y + DOME_RADIUS * 0.58, 0.1);
  device.scale.setScalar(0.55);

  // Flash burst: fires once at full dome growth
  const flashCanvas = document.createElement("canvas");
  flashCanvas.width = flashCanvas.height = 128;
  const fctx = flashCanvas.getContext("2d")!;
  const grad = fctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.35, "rgba(255,150,80,0.9)");
  grad.addColorStop(1, "rgba(255,110,30,0)");
  fctx.fillStyle = grad;
  fctx.fillRect(0, 0, 128, 128);
  const flashMat = new THREE.SpriteMaterial({
    map: new THREE.CanvasTexture(flashCanvas),
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const flashSprite = new THREE.Sprite(flashMat);
  flashSprite.scale.setScalar(0.3);
  flashSprite.position.y = BASE_Y + DOME_RADIUS * 0.4;

  // Summoning seal: the rune circle on the ground the dome rises from
  const sealUniforms = { uTime: { value: 0 }, uGrowth: { value: 0 } };
  const seal = new THREE.Mesh(
    new THREE.PlaneGeometry(3.6, 3.6),
    new THREE.ShaderMaterial({
      uniforms: sealUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform float uTime;
        uniform float uGrowth;
        varying vec2 vUv;
        #define PI 3.14159265
        void main() {
          vec2 p = vUv - 0.5;
          float r = length(p) * 2.0;
          float ang = atan(p.y, p.x);
          if (r > 1.0) discard;
          vec3 col = vec3(1.0, 0.42, 0.1);
          float a = 0.0;
          for (int i = 0; i < 3; i++) {
            float rr = 0.35 + float(i) * 0.22;
            a += smoothstep(0.008, 0.0, abs(r - rr)) * 0.6;
          }
          float ticks = smoothstep(0.985, 1.0, sin(ang * 16.0 + uTime * 0.35));
          a += ticks * smoothstep(0.5, 0.9, r) * 0.5;
          float sweep = smoothstep(0.0, 0.3, 1.0 - abs(mod(ang - uTime * 0.5, 2.0*PI) - PI) / PI);
          a += sweep * smoothstep(1.0, 0.15, r) * 0.3;
          a *= smoothstep(0.05, 0.18, r) * smoothstep(1.0, 0.75, r);
          a *= 0.25 + 0.75 * uGrowth;
          gl_FragColor = vec4(col, a);
        }
      `,
    })
  );
  seal.rotation.x = -Math.PI / 2.1;
  seal.position.y = BASE_Y;

  // Ambient shockwave pulse, ring on the ground syncing with the seal
  const shockUniforms = { uProgress: { value: 0 }, uGrowth: { value: 0 } };
  const shockwave = new THREE.Mesh(
    new THREE.RingGeometry(0.9, 0.96, 64),
    new THREE.ShaderMaterial({
      uniforms: shockUniforms,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform float uProgress;
        uniform float uGrowth;
        void main() {
          float fade = 1.0 - uProgress;
          gl_FragColor = vec4(vec3(1.0, 0.45, 0.14), fade * fade * 0.5 * uGrowth);
        }
      `,
    })
  );
  shockwave.rotation.x = -Math.PI / 2.1;
  shockwave.position.y = BASE_Y;

  // Sparks: gather on the seal on load (ignition), then rise onto the
  // dome's surface as the barrier grows — driven directly by scroll
  const sparks = new ParticleField({
    count: SPARK_COUNT,
    from: chaosCloud(SPARK_COUNT, 1.6),
    to: sealRing(SPARK_COUNT, 1.3),
    chaos: 1,
    pointScale: 1.1,
  });
  sparks.points.position.y = BASE_Y;

  const rig = new THREE.Group();
  rig.add(dome, device, flashSprite, seal, shockwave);
  scene.add(rig);
  scene.add(sparks.points);

  // atmospheric background: soft noise field that leans toward the cursor
  const bgUniforms = { uTime: { value: 0 }, uMouse: { value: new THREE.Vector2(0, 0) } };
  const bg = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 24),
    new THREE.ShaderMaterial({
      depthWrite: false,
      transparent: true,
      uniforms: bgUniforms,
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        precision highp float;
        uniform float uTime; uniform vec2 uMouse; varying vec2 vUv;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
        float noise(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
          return mix(mix(hash(i),hash(i+vec2(1,0)),u.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x), u.y); }
        void main(){
          vec2 uv = vUv;
          float n = noise(uv*3.0 + uTime*0.03) * 0.6 + noise(uv*7.0 - uTime*0.02) * 0.4;
          float m = exp(-length(uv - 0.5 - uMouse*0.18) * 2.2);
          vec3 warm = vec3(0.988, 0.365, 0.125);
          vec3 col = mix(vec3(0.0), warm, n * 0.10 + m * 0.10);
          gl_FragColor = vec4(col, n * 0.35 + m * 0.25);
        }`,
    })
  );
  bg.position.z = -8;
  scene.add(bg);

  function resize() {
    const w = canvas!.clientWidth, h = canvas!.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // keep the seal right-of-center on wide screens, centered on mobile
    rig.position.x = w > 760 ? 1.6 : 0;
    sparks.points.position.x = rig.position.x;
  }
  resize();
  window.addEventListener("resize", resize);

  // Mouse: subtle parallax tilt, lerped (not raw) to avoid pointer-
  // sampling noise reading as jitter
  const mouse = { x: 0, y: 0 };
  let smoothMouseX = 0;
  const mouseWorld = new THREE.Vector3(99, 99, 0);
  const ray = new THREE.Raycaster();
  const planeZ = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.2);
  window.addEventListener("pointermove", (e) => {
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
    ray.setFromCamera(new THREE.Vector2(mouse.x, -mouse.y), camera);
    ray.ray.intersectPlane(planeZ, mouseWorld);
  });

  // Scroll: drives the dome's growth directly, plus a subtle camera dolly
  const progress = { t: 0 };
  gsap.to(progress, {
    t: 1,
    ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom bottom", scrub: 0.6 },
  });

  // Ignition: on load, sparks gather onto the seal and it starts glowing
  // — the "charged, waiting to be raised" state. Everything past this
  // (the dome actually growing, the reveal, the payoff flash) is driven
  // by scroll below: the scroll IS the summon.
  const ignite = { v: 0 };
  let ignitionDone = false;
  gsap.to(ignite, {
    v: 1,
    duration: 0.9,
    ease: "power2.out",
    delay: 0.25,
    onComplete: () => {
      ignitionDone = true;
      sparks.setTargets(sealRing(SPARK_COUNT, 1.3), domeShell(SPARK_COUNT, DOME_RADIUS));
    },
  });

  let revealed = false;
  function fireReveal() {
    if (revealed) return;
    revealed = true;
    gsap.to(flashSprite.scale, { x: 3.2, y: 3.2, z: 3.2, duration: 0.5, ease: "power2.out" });
    gsap.fromTo(
      flashMat,
      { opacity: 0 },
      { opacity: 1, duration: 0.1, onComplete: () => gsap.to(flashMat, { opacity: 0, duration: 0.45, ease: "power2.in" }) }
    );
  }

  // Pause the render loop entirely while the hero is off-screen
  let visible = true;
  let scheduled = false;
  function scheduleTick() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(tick);
  }
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) scheduleTick();
  }).observe(canvas);

  const clock = new THREE.Clock();
  function tick() {
    scheduled = false;
    if (!visible) return;
    const el = clock.getElapsedTime();
    const t = progress.t;

    bgUniforms.uTime.value = el;
    bgUniforms.uMouse.value.set(mouse.x, -mouse.y);

    smoothMouseX += (mouse.x - smoothMouseX) * 0.08;
    rig.rotation.y = smoothMouseX * 0.1;
    rim.position.x += (mouse.x * 4 - rim.position.x) * 0.05;

    // scroll drives the dome's growth: a tiny nub is always present
    // (ignited seal, waiting) so there's something to see pre-scroll
    const growth = THREE.MathUtils.smoothstep(t, 0.0, 0.85);
    dome.scale.setScalar(0.06 + growth * 0.94);
    domeUniforms.uTime.value = el;
    domeUniforms.uGrowth.value = 0.15 + growth * 0.85;
    sealUniforms.uTime.value = el;
    sealUniforms.uGrowth.value = 0.2 + growth * 0.8;
    shockUniforms.uGrowth.value = 0.2 + growth * 0.8;

    revealUniforms.uReveal.value = THREE.MathUtils.smoothstep(t, 0.45, 0.9);
    device.scale.setScalar(0.4 + revealUniforms.uReveal.value * 0.25);
    screenMat.opacity = revealUniforms.uReveal.value;
    bodyMat.opacity = revealUniforms.uReveal.value;

    if (t > 0.88) fireReveal();

    const shockCycle = (el % 2.6) / 2.6;
    shockwave.scale.setScalar(1 + shockCycle * 2.2);
    shockUniforms.uProgress.value = shockCycle;

    // stage 1 (ignition): chaos -> sealRing, one-time load tween.
    // stage 2 (the actual summon): sealRing -> domeShell, driven by
    // scroll — sparks visibly climb the barrier as it rises.
    sparks.setMix(ignitionDone ? growth : ignite.v);
    sparks.setChaos(ignitionDone ? 0.16 + growth * 0.12 : 1);
    sparks.setTime(el);
    sparks.setMouseWorld(mouseWorld);

    camera.position.z = 7 - t * 0.5;
    renderer.render(scene, camera);
    scheduleTick();
  }
  scheduleTick();
}
