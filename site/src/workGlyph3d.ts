// Shared 3D product glyph for work detail pages — one small three.js scene
// definition, reused (parameterized by `kind`) across all 8 products, so
// every page gets a real 3D object without 8 bespoke scenes. Auto-rotates,
// drag-to-rotate per MECHANISMS.md (setPointerCapture, momentum on release).
import * as THREE from "three";

function buildGlyph(kind: string, color: THREE.Color, accent: THREE.Color): THREE.Group {
  const group = new THREE.Group();
  const wire = (geo: THREE.BufferGeometry, c: THREE.Color, opacity = 0.9) =>
    new THREE.LineSegments(new THREE.WireframeGeometry(geo), new THREE.LineBasicMaterial({ color: c, transparent: true, opacity }));
  const solid = (geo: THREE.BufferGeometry, c: THREE.Color, opacity = 0.14) =>
    new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity }));

  switch (kind) {
    case "ecommerce-cdp": {
      const geo = new THREE.IcosahedronGeometry(1.1, 1);
      group.add(solid(geo, color), wire(geo, accent));
      break;
    }
    case "ocr-action": {
      for (let i = 0; i < 6; i++) {
        const plane = new THREE.Mesh(
          new THREE.PlaneGeometry(1.5, 2),
          new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.16 + i * 0.02, side: THREE.DoubleSide })
        );
        plane.position.set(i * 0.05 - 0.15, i * -0.06 + 0.15, i * 0.08 - 0.24);
        plane.rotation.z = i * 0.03;
        group.add(plane);
        const edge = new THREE.LineSegments(
          new THREE.EdgesGeometry(new THREE.PlaneGeometry(1.5, 2)),
          new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.6 })
        );
        edge.position.copy(plane.position);
        edge.rotation.copy(plane.rotation);
        group.add(edge);
      }
      break;
    }
    case "microsoft": {
      const size = 0.55, gap = 0.14;
      for (let r = 0; r < 3; r++)
        for (let c = 0; c < 3; c++) {
          const isCenter = r === 1 && c === 1;
          const geo = new THREE.BoxGeometry(size, size, size * (isCenter ? 0.7 : 0.35));
          const cube = solid(geo, isCenter ? accent : color, isCenter ? 0.5 : 0.22);
          cube.position.set((c - 1) * (size + gap), (1 - r) * (size + gap), 0);
          group.add(cube, wire(geo, accent, 0.35));
          group.children[group.children.length - 1].position.copy(cube.position);
        }
      break;
    }
    case "iot": {
      const hub = solid(new THREE.SphereGeometry(0.22, 16, 16), accent, 0.9);
      group.add(hub);
      const nodePositions = [
        [1.1, 0.5, 0.2], [-1.1, 0.6, -0.1], [0.9, -0.7, 0.3],
        [-0.95, -0.55, -0.2], [0.15, 1.1, -0.3],
      ];
      nodePositions.forEach(([x, y, z]) => {
        const node = solid(new THREE.SphereGeometry(0.11, 12, 12), color, 0.8);
        node.position.set(x, y, z);
        group.add(node);
        const points = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, y, z)];
        group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.35 })));
      });
      break;
    }
    case "sec-validation": {
      const disc = solid(new THREE.CircleGeometry(1.05, 48), color, 0.1);
      disc.rotation.x = -Math.PI / 2.3;
      group.add(disc);
      [0.35, 0.65, 1.0].forEach((r) => {
        const ring = wire(new THREE.RingGeometry(r - 0.006, r, 64), accent, 0.5);
        ring.rotation.x = -Math.PI / 2.3;
        group.add(ring);
      });
      const sweep = new THREE.Mesh(
        new THREE.CircleGeometry(1.05, 32, 0, Math.PI / 6),
        new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.3, side: THREE.DoubleSide })
      );
      sweep.rotation.x = -Math.PI / 2.3;
      sweep.name = "sweep";
      group.add(sweep);
      break;
    }
    case "attack-sim": {
      const path: [number, number, number][] = [[-1.1, 0.5, 0], [-0.4, -0.3, 0.3], [0.3, 0.4, -0.2], [1.0, -0.4, 0.15]];
      path.forEach(([x, y, z], i) => {
        const node = solid(new THREE.OctahedronGeometry(0.13, 0), i === path.length - 1 ? accent : color, 0.85);
        node.position.set(x, y, z);
        group.add(node);
        if (i > 0) {
          const [px, py, pz] = path[i - 1];
          const points = [new THREE.Vector3(px, py, pz), new THREE.Vector3(x, y, z)];
          group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.55 })));
        }
      });
      break;
    }
    case "security":
    case "sec-hardening":
    default: {
      const geo = new THREE.OctahedronGeometry(1.15, kind === "sec-hardening" ? 1 : 0);
      group.add(solid(geo, color), wire(geo, accent));
      if (kind === "sec-hardening") {
        const ring = wire(new THREE.TorusGeometry(1.35, 0.012, 8, 64), accent, 0.45);
        ring.rotation.x = Math.PI / 2.4;
        group.add(ring);
      }
      break;
    }
  }
  return group;
}

export function initWorkGlyph3D(kind: string, hexColor: string, hexAccent: string) {
  const canvas = document.getElementById("work-glyph-canvas") as HTMLCanvasElement | null;
  if (!canvas) return;

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 20);
  camera.position.z = 4;

  const glyph = buildGlyph(kind, new THREE.Color(hexColor), new THREE.Color(hexAccent));
  scene.add(glyph);

  function resize() {
    const w = canvas!.clientWidth || 1, h = canvas!.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(canvas);

  let rotY = 0.4, rotX = -0.2, velY = 0.0018;
  let dragging = false, lastX = 0, lastY = 0;
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true; lastX = e.clientX; lastY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    rotY += dx * 0.006;
    rotX = Math.max(-1.2, Math.min(1.2, rotX - dy * 0.006));
    velY = dx * 0.0006;
  });
  const release = () => { dragging = false; };
  canvas.addEventListener("pointerup", release);
  canvas.addEventListener("pointercancel", release);

  let onScreen = false;
  let looping = false;
  new IntersectionObserver(([entry]) => {
    onScreen = entry.isIntersecting;
    if (onScreen && !looping) requestAnimationFrame(tick);
  }, { threshold: 0.1 }).observe(canvas);

  function tick() {
    if (!onScreen) { looping = false; return; }
    looping = true;
    if (!dragging) {
      rotY += velY;
      velY *= 0.985;
      velY += (0.0018 - velY) * 0.01;
    }
    glyph.rotation.y = rotY;
    glyph.rotation.x = rotX;
    const sweep = glyph.getObjectByName("sweep");
    if (sweep) sweep.rotation.z = performance.now() * 0.0006;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
}
