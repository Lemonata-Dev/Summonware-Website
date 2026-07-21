// Projects showcase: a single persistent laptop+phone device pair whose
// screens live-demo each product's UI as you page through them. Swipe/
// drag/wheel/nav-strip all step a page index; the screens crossfade to
// the new product's looping demo animation. Cursor-driven tilt/parallax
// on the device group (damped, never snaps — see kintsugi's
// MECHANISMS.md "Cursor-tilt card"). Generic laptop/phone silhouettes,
// not a reproduction of any real branded hardware — see kind-drawing note
// on `drawAppContent` below for the same non-trademark rule applied to the
// "microsoft" case.
import * as THREE from "three";
import gsap from "gsap";
import { ParticleField, chaosCloud, cardSilhouette } from "./particles";
import { workHref } from "./routes";
import { t } from "./i18n";
import { fillStartIdea } from "./startForm";

const ENTRANCE_COUNT = 1600;

type Project = {
  name: string; type: string; year: string; blurb: string; tags: string[]; hue: string; slug: string;
  kind?: string; // selects a per-product app mockup — see drawAppContent()
};

/** rounded-rect helper shared by every mockup */
function rr(x: CanvasRenderingContext2D, px: number, py: number, w: number, h: number, r: number, fill: string, alpha = 1) {
  x.globalAlpha = alpha; x.fillStyle = fill;
  x.beginPath(); x.roundRect(px, py, w, h, r); x.fill();
  x.globalAlpha = 1;
}

const SANS = "-apple-system, BlinkMacSystemFont, Arial, sans-serif";

/** shared "real app" chrome: a desktop-style left-nav + header for the
 * laptop screen, a mobile-style top header + bottom tab bar for the
 * phone screen — generic app-shell conventions (not any real product's
 * actual UI), giving every screen the same believable frame so only the
 * per-kind content inside needs to change. Returns the content rect the
 * per-kind drawing function should render into. */
function drawAppFrame(x: CanvasRenderingContext2D, kind: "phone" | "web", W: number, H: number, ink: string, panel: string, accent: string, title: string) {
  if (kind === "web") {
    const sideW = W * 0.2, headH = H * 0.15;
    // A near-invisible tint read as a rendering bug rather than a sidebar —
    // give it a clearly distinct fill plus a hard border line so the app
    // shell reads immediately, not just on close inspection.
    x.globalAlpha = 1; x.fillStyle = ink; x.globalAlpha = 0.1; x.fillRect(0, 0, sideW, H); x.globalAlpha = 1;
    x.strokeStyle = ink; x.globalAlpha = 0.15; x.lineWidth = 1;
    x.beginPath(); x.moveTo(sideW, 0); x.lineTo(sideW, H); x.stroke(); x.globalAlpha = 1;
    const navItems = ["Overview", "Activity", "Reports", "Settings"];
    navItems.forEach((label, i) => {
      const ry = headH * 0.55 + i * (H * 0.1);
      const isActive = i === 0;
      if (isActive) rr(x, 10, ry - 15, sideW - 20, 32, 8, accent, 0.16);
      x.globalAlpha = isActive ? 1 : 0.65;
      x.fillStyle = isActive ? accent : ink;
      x.beginPath(); x.arc(26, ry + 1, 4, 0, Math.PI * 2); x.fill();
      x.font = `${isActive ? 700 : 600} 13px ${SANS}`; x.textAlign = "left";
      x.fillText(label, 40, ry + 5);
      x.globalAlpha = 1;
    });
    rr(x, sideW, 0, W - sideW, headH, 0, panel, 0.92);
    x.fillStyle = ink; x.font = `700 17px ${SANS}`; x.textAlign = "left";
    x.fillText(title, sideW + 24, headH * 0.6);
    rr(x, W - 96, headH * 0.3, 70, headH * 0.42, 20, accent, 0.15);
    x.fillStyle = accent; x.font = `700 10px ${SANS}`; x.textAlign = "center";
    x.fillText("● LIVE", W - 61, headH * 0.58);
    x.textAlign = "left";
    return { cx: sideW + 24, cy: headH + 20, cw: W - sideW - 48, ch: H - headH - 40 };
  } else {
    const headH = H * 0.14, tabH = H * 0.1;
    rr(x, 0, 0, W, headH, 0, panel, 0.92);
    x.fillStyle = ink; x.font = `700 16px ${SANS}`; x.textAlign = "center";
    x.fillText(title, W / 2, headH * 0.78);
    x.textAlign = "left";
    x.globalAlpha = 0.055; x.fillStyle = ink; x.fillRect(0, H - tabH, W, tabH); x.globalAlpha = 1;
    for (let i = 0; i < 4; i++) {
      const tx = W * (i + 0.5) / 4;
      const active = i === 0;
      rr(x, tx - 11, H - tabH + tabH * 0.28, 22, 22, 6, active ? accent : ink, active ? 0.9 : 0.3);
    }
    return { cx: 22, cy: headH + 22, cw: W - 44, ch: H - headH - tabH - 40 };
  }
}

type ContentBox = { cx: number; cy: number; cw: number; ch: number };

function statCard(x: CanvasRenderingContext2D, px: number, py: number, w: number, h: number, label: string, value: string, ink: string, panel: string, accent: string, lit: boolean) {
  rr(x, px, py, w, h, 10, panel, 0.9);
  x.fillStyle = ink; x.globalAlpha = 0.55; x.font = `600 10px ${SANS}`; x.textAlign = "left";
  x.fillText(label.toUpperCase(), px + 12, py + 20); x.globalAlpha = 1;
  x.fillStyle = lit ? accent : ink; x.font = `700 20px ${SANS}`;
  x.fillText(value, px + 12, py + h - 14);
}

function statusRow(x: CanvasRenderingContext2D, px: number, py: number, w: number, label: string, status: string, ok: boolean, ink: string, accent: string, danger: string) {
  x.fillStyle = ink; x.globalAlpha = 0.85; x.font = `600 12px ${SANS}`; x.textAlign = "left";
  x.fillText(label, px, py); x.globalAlpha = 1;
  const color = ok ? accent : danger;
  x.textAlign = "right"; x.fillStyle = color; x.font = `700 11px ${SANS}`;
  x.fillText(status, px + w, py);
  x.textAlign = "left";
}

/** Per-kind "live demo" content, drawn inside the app-frame's content
 * rect — real labels and values standing in for a real product screen
 * (not a real screenshot, but structured like one), `t` a 0..1 looping
 * progress value driving the one animated touch per kind. */
function drawAppContent(x: CanvasRenderingContext2D, kind: string, box: ContentBox, ink: string, panel: string, accent: string, danger: string, t: number) {
  const TAU = Math.PI * 2;
  const { cx, cy, cw, ch } = box;

  switch (kind) {
    case "ecommerce-cdp": {
      const cardW = (cw - 12) / 2, cardH = ch * 0.24;
      statCard(x, cx, cy, cardW, cardH, "Customers", "12,842", ink, panel, accent, false);
      statCard(x, cx + cardW + 12, cy, cardW, cardH, "Revenue (30d)", "$482.1K", ink, panel, accent, true);
      const chartY = cy + cardH + 18, chartH = ch - cardH - 30;
      rr(x, cx, chartY, cw, chartH, 10, panel, 0.9);
      const days = ["M", "T", "W", "T", "F", "S", "S"];
      const barW = (cw - 32) / 7;
      for (let i = 0; i < 7; i++) {
        const baseH = chartH * (0.3 + ((i * 37) % 50) / 100);
        const grow = 0.6 + 0.4 * Math.sin(t * TAU + i * 0.7);
        const h = baseH * grow;
        rr(x, cx + 16 + i * barW, chartY + chartH - 22 - h, barW * 0.55, h, 3, accent, 0.3 + grow * 0.2);
        x.fillStyle = ink; x.globalAlpha = 0.45; x.font = `600 9px ${SANS}`; x.textAlign = "center";
        x.fillText(days[i], cx + 16 + i * barW + barW * 0.28, chartY + chartH - 8); x.globalAlpha = 1;
      }
      x.textAlign = "left";
      break;
    }
    case "ocr-action": {
      const docs = [
        ["Invoice_0042.pdf", "Extracted"],
        ["PO_Summary.pdf", "Extracted"],
        ["Receipt_881.pdf", "Scanning…"],
        ["Contract_v3.pdf", "Queued"],
      ];
      const activeIdx = Math.floor(t * docs.length) % docs.length;
      const rowH = ch / docs.length;
      docs.forEach(([name, status], i) => {
        const ry = cy + i * rowH;
        const isActive = i === activeIdx;
        rr(x, cx, ry, cw, rowH - 10, 8, panel, 0.85);
        x.fillStyle = ink; x.globalAlpha = 0.85; x.font = `600 12px ${SANS}`; x.textAlign = "left";
        x.fillText(name, cx + 14, ry + rowH * 0.42); x.globalAlpha = 1;
        const label = isActive ? "Extracting…" : status;
        x.fillStyle = isActive || status === "Extracted" ? accent : ink;
        x.globalAlpha = isActive ? 1 : 0.55;
        x.font = `700 10px ${SANS}`; x.textAlign = "right";
        x.fillText(label.toUpperCase(), cx + cw - 14, ry + rowH * 0.42);
        x.globalAlpha = 1; x.textAlign = "left";
      });
      break;
    }
    case "security": {
      const controls = ["Encryption at rest", "Access control", "Backup coverage", "Audit logging"];
      const activeRow = Math.floor(t * controls.length) % controls.length;
      x.fillStyle = ink; x.globalAlpha = 0.55; x.font = `600 11px ${SANS}`; x.textAlign = "left";
      x.fillText("COMPLIANCE SCORE", cx, cy + 8); x.globalAlpha = 1;
      x.fillStyle = accent; x.font = `700 26px ${SANS}`;
      x.fillText("94%", cx, cy + 40);
      const rowH = (ch - 60) / controls.length;
      controls.forEach((label, i) => {
        const ry = cy + 60 + i * rowH + rowH * 0.6;
        statusRow(x, cx, ry, cw, label, i <= activeRow ? "PASS" : "…", i <= activeRow, ink, accent, danger);
      });
      break;
    }
    case "microsoft": {
      // an integration/sync diagram (apps connected to a central hub, data
      // pulses traveling the connections) — the product's actual pitch is
      // "these tools work together," which a static app-launcher grid
      // never showed; generic app labels, not any real product's name.
      const apps = ["Mail", "Files", "Calendar", "CRM", "Automation"];
      const hx = cx + cw * 0.5, hy = cy + ch * 0.42, hr = 26;
      const ringR = Math.min(cw, ch) * 0.38;
      const nodePositions = apps.map((_, i) => {
        const ang = -Math.PI / 2 + (i / apps.length) * Math.PI * 2;
        return [hx + Math.cos(ang) * ringR, hy + Math.sin(ang) * ringR] as [number, number];
      });
      nodePositions.forEach(([nx, ny], i) => {
        x.strokeStyle = ink; x.globalAlpha = 0.25; x.lineWidth = 1.5;
        x.beginPath(); x.moveTo(hx, hy); x.lineTo(nx, ny); x.stroke(); x.globalAlpha = 1;
        // a pulse travels each connection at a phase offset per app, so
        // the diagram reads as continuous sync traffic, not one static line
        const phase = (t + i / apps.length) % 1;
        const px = hx + (nx - hx) * phase, py = hy + (ny - hy) * phase;
        x.fillStyle = accent; x.globalAlpha = 0.85;
        x.beginPath(); x.arc(px, py, 3.5, 0, Math.PI * 2); x.fill(); x.globalAlpha = 1;
      });
      nodePositions.forEach(([nx, ny], i) => {
        rr(x, nx - 44, ny - 16, 88, 32, 8, panel, 0.9);
        x.fillStyle = ink; x.globalAlpha = 0.8; x.font = `600 11px ${SANS}`; x.textAlign = "center";
        x.fillText(apps[i], nx, ny + 4); x.globalAlpha = 1;
      });
      x.fillStyle = accent; x.globalAlpha = 0.16;
      x.beginPath(); x.arc(hx, hy, hr, 0, Math.PI * 2); x.fill(); x.globalAlpha = 1;
      x.strokeStyle = accent; x.lineWidth = 2;
      x.beginPath(); x.arc(hx, hy, hr, 0, Math.PI * 2); x.stroke();
      x.fillStyle = accent; x.font = `700 10px ${SANS}`; x.textAlign = "center";
      x.fillText("SYNC", hx, hy + 4);
      x.textAlign = "left";
      break;
    }
    case "iot": {
      // a network map (hub + nodes, pulsing) alongside the device list —
      // a list alone read as generic; the map is what makes it "IoT."
      const devices = ["Gateway A", "Sensor 01", "Sensor 02", "Camera 3"];
      const activeIdx = Math.floor(t * devices.length) % devices.length;
      const mapW = cw * 0.42, listX = cx + mapW + 20, listW = cw - mapW - 20;

      x.fillStyle = ink; x.globalAlpha = 0.55; x.font = `600 10px ${SANS}`; x.textAlign = "left";
      x.fillText("DEVICES ONLINE", cx, cy + 8); x.globalAlpha = 1;
      x.fillStyle = accent; x.font = `700 22px ${SANS}`;
      x.fillText("3 / 4", cx, cy + 38);

      const hx = cx + mapW * 0.5, hy = cy + ch * 0.62, hr = Math.min(mapW, ch) * 0.16;
      rr(x, cx, cy + 50, mapW, ch - 50, 10, panel, 0.75);
      x.globalAlpha = 0.85; x.strokeStyle = ink; x.lineWidth = 2;
      x.beginPath(); x.arc(hx, hy, hr * 0.4, 0, Math.PI * 2); x.fill(); x.stroke(); x.globalAlpha = 1;
      const nodeAngles = [-2.2, -0.7, 0.6, 2.4];
      nodeAngles.forEach((ang, i) => {
        const nx = hx + Math.cos(ang) * hr, ny = hy + Math.sin(ang) * hr;
        const pulse = i === activeIdx;
        x.globalAlpha = 0.3 + (pulse ? 0.3 : 0); x.strokeStyle = ink; x.lineWidth = 1.5;
        x.beginPath(); x.moveTo(hx, hy); x.lineTo(nx, ny); x.stroke();
        x.globalAlpha = pulse ? 1 : 0.5; x.fillStyle = pulse ? accent : ink;
        x.beginPath(); x.arc(nx, ny, pulse ? 8 : 6, 0, Math.PI * 2); x.fill();
      });
      x.globalAlpha = 1;

      const rowH = ch / devices.length;
      devices.forEach((name, i) => {
        const ry = cy + i * rowH;
        const pulse = i === activeIdx;
        rr(x, listX, ry, listW, rowH - 10, 8, panel, 0.85);
        x.fillStyle = pulse ? accent : ink; x.globalAlpha = pulse ? 1 : 0.5;
        x.beginPath(); x.arc(listX + 16, ry + rowH * 0.4, 5, 0, Math.PI * 2); x.fill(); x.globalAlpha = 1;
        x.fillStyle = ink; x.globalAlpha = 0.85; x.font = `600 11px ${SANS}`; x.textAlign = "left";
        x.fillText(name, listX + 32, ry + rowH * 0.44); x.globalAlpha = 1;
        for (let b = 0; b < 4; b++) {
          const on = b < (pulse ? 4 : 2);
          rr(x, listX + listW - 44 + b * 10, ry + rowH * 0.4 - b * 2.5 - 5, 5, 5 + b * 2.5, 2, ink, on ? 0.7 : 0.2);
        }
      });
      break;
    }
    case "sec-hardening": {
      const gx = cx + cw * 0.24, gy = cy + ch * 0.32, gr = Math.min(cw, ch) * 0.2;
      x.globalAlpha = 0.25; x.strokeStyle = ink; x.lineWidth = 10;
      x.beginPath(); x.arc(gx, gy, gr, Math.PI * 0.78, Math.PI * 0.22, false); x.stroke();
      const scoreFrac = 0.55 + 0.15 * Math.sin(t * TAU);
      x.globalAlpha = 0.9; x.strokeStyle = accent; x.lineWidth = 10;
      x.beginPath(); x.arc(gx, gy, gr, Math.PI * 0.78, Math.PI * 0.78 + (Math.PI * 1.42 - Math.PI * 0.78) * scoreFrac, false); x.stroke();
      x.globalAlpha = 1;
      x.fillStyle = ink; x.font = `700 18px ${SANS}`; x.textAlign = "center";
      x.fillText(`${Math.round(scoreFrac * 100)}%`, gx, gy + 6); x.textAlign = "left";
      const severities: [string, string][] = [["Critical", "2"], ["Medium", "6"], ["Low", "14"]];
      const activeRow = Math.floor(t * severities.length) % severities.length;
      const listX = cx + cw * 0.52, listW = cx + cw - listX;
      severities.forEach(([sev, count], i) => {
        const ry = cy + i * (ch / severities.length) + 14;
        x.globalAlpha = i <= activeRow ? 1 : 0.35;
        x.fillStyle = sev === "Critical" ? danger : ink; x.font = `600 12px ${SANS}`; x.textAlign = "left";
        x.fillText(sev, listX, ry);
        x.textAlign = "right"; x.fillStyle = ink; x.font = `700 12px ${SANS}`;
        x.fillText(count, listX + listW, ry);
        x.textAlign = "left"; x.globalAlpha = 1;
      });
      break;
    }
    case "sec-validation": {
      const tools = ["Firewall", "Email gateway", "Endpoint (EDR)", "SIEM"];
      const activeIdx = Math.floor(t * tools.length) % tools.length;
      const rowH = ch / tools.length;
      tools.forEach((name, i) => {
        const ry = cy + i * rowH;
        const testing = i === activeIdx;
        const blocked = i !== 2; // one tool "misses" the simulated technique, for realism
        rr(x, cx, ry, cw, rowH - 10, 8, panel, 0.85);
        x.fillStyle = ink; x.globalAlpha = 0.85; x.font = `600 12px ${SANS}`; x.textAlign = "left";
        x.fillText(name, cx + 14, ry + rowH * 0.42); x.globalAlpha = 1;
        const label = testing ? "TESTING…" : blocked ? "BLOCKED" : "MISSED";
        x.fillStyle = testing ? ink : blocked ? accent : danger;
        x.globalAlpha = testing ? 0.6 : 1;
        x.font = `700 10px ${SANS}`; x.textAlign = "right";
        x.fillText(label, cx + cw - 14, ry + rowH * 0.42);
        x.globalAlpha = 1; x.textAlign = "left";
      });
      break;
    }
    case "attack-sim": {
      const stages = ["Recon", "Access", "Lateral", "Exfil"];
      const progress = t * (stages.length - 1);
      const stepW = cw / stages.length;
      stages.forEach((label, i) => {
        const reached = i <= progress;
        const sx2 = cx + i * stepW + stepW / 2;
        x.fillStyle = reached ? accent : ink; x.globalAlpha = reached ? 1 : 0.3;
        x.beginPath(); x.arc(sx2, cy + 14, 7, 0, TAU); x.fill();
        x.globalAlpha = reached ? 0.9 : 0.4; x.font = `600 10px ${SANS}`; x.textAlign = "center";
        x.fillText(label, sx2, cy + 38);
        if (i < stages.length - 1) {
          x.strokeStyle = ink; x.globalAlpha = 0.3; x.lineWidth = 2; x.setLineDash([4, 4]);
          x.beginPath(); x.moveTo(sx2 + 10, cy + 14); x.lineTo(sx2 + stepW - 10, cy + 14); x.stroke();
          x.setLineDash([]);
        }
      });
      x.globalAlpha = 1; x.textAlign = "left";
      const logLines = ["Phishing email delivered", "Credential harvested", "Host compromised", "Lateral movement detected"];
      const visible = Math.min(logLines.length, Math.floor(t * (logLines.length + 1)));
      const logY = cy + 70;
      rr(x, cx, logY, cw, ch - 90, 8, panel, 0.85);
      for (let i = 0; i < visible; i++) {
        x.fillStyle = ink; x.globalAlpha = i === visible - 1 ? 0.9 : 0.5;
        x.font = `500 11px ${SANS}`; x.textAlign = "left";
        x.fillText(`› ${logLines[i]}`, cx + 12, logY + 22 + i * 20);
      }
      x.globalAlpha = 1;
      break;
    }
    default: {
      x.save();
      x.translate(cx + cw * 0.5, cy + ch * 0.4);
      x.rotate(t * TAU * 0.15);
      x.strokeStyle = ink; x.globalAlpha = 0.16;
      for (let i = 0; i < 3; i++) { x.beginPath(); x.ellipse(0, 0, 60 + i * 34, 24 + i * 14, -0.35, 0, TAU); x.stroke(); }
      x.globalAlpha = 1;
      x.restore();
    }
  }
}

/** draw one device screen's live-demo frame directly into a persistent
 * canvas context (no per-frame allocation) — phone gets a status-bar
 * notch + home indicator baked into the texture (cheaper and more
 * reliable than a geometric cutout); the laptop screen is just the app
 * content, since its physical bezel is the real "chrome" now. */
function drawDeviceScreen(x: CanvasRenderingContext2D, kind: "phone" | "web", p: Project, t: number) {
  const W = kind === "phone" ? 360 : 720, H = kind === "phone" ? 720 : 480;
  // Device-screen content always needs to read like a real app: dark ink
  // on a light screen, or light ink on a dark screen — independent of
  // the project's brand hue (that hue is only used for the site's other
  // chrome now, e.g. the project-tag pills, not this canvas anymore).
  const dark = p.hue === "dark";
  const bg = dark ? "#1b1e20" : "#f4f5f6";
  const ink = dark ? "#f4f5f6" : "#24282b";
  const panel = dark ? "rgba(255,255,255,0.08)" : "#ffffff";
  const accent = "#fc5d20";
  const danger = "#e0384c";

  x.clearRect(0, 0, W, H);
  x.fillStyle = bg; x.fillRect(0, 0, W, H);
  const box = drawAppFrame(x, kind, W, H, ink, panel, accent, p.name);
  drawAppContent(x, p.kind ?? "", box, ink, panel, accent, danger, t);

  if (kind === "phone") {
    x.fillStyle = "#000";
    x.beginPath(); x.roundRect(W / 2 - 46, 8, 92, 22, 11); x.fill();
    x.globalAlpha = 0.4; x.fillStyle = ink;
    x.beginPath(); x.roundRect(W / 2 - 56, H - 14, 112, 5, 3); x.fill();
    x.globalAlpha = 1;
  }
}

/** a 2D rounded-rect shape, centered on its own local origin — the base
 * for every extruded device panel below (real geometry, not a CSS/box
 * approximation — MECHANISMS.md's rule once an object is load-bearing). */
function roundedRectShape(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const hw = w / 2, hh = h / 2;
  s.moveTo(-hw + r, -hh);
  s.lineTo(hw - r, -hh);
  s.quadraticCurveTo(hw, -hh, hw, -hh + r);
  s.lineTo(hw, hh - r);
  s.quadraticCurveTo(hw, hh, hw - r, hh);
  s.lineTo(-hw + r, hh);
  s.quadraticCurveTo(-hw, hh, -hw, hh - r);
  s.lineTo(-hw, -hh + r);
  s.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  return s;
}

function extrudedPanel(w: number, h: number, depth: number, r: number): THREE.ExtrudeGeometry {
  const geo = new THREE.ExtrudeGeometry(roundedRectShape(w, h, r), { depth, bevelEnabled: false, curveSegments: 10 });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

/** THREE.ShapeGeometry does NOT normalize its UVs to 0-1 — it uses the
 * shape's raw local coordinates directly as (u, v). `roundedRectShape`
 * spans [-w/2, w/2] x [-h/2, h/2], so its UVs come out roughly
 * [-1, 1] instead of [0, 1]. With the default ClampToEdge wrapping, any
 * UV outside [0, 1] just repeats the nearest edge texel — which is
 * exactly what a screen texture rendered "correctly" in the flat 2D
 * canvas but confined to a small corner of the mesh looks like: half the
 * plane samples one clamped edge column/row instead of the real image.
 * Remap the generated UVs into 0-1 using the same w/h the shape was
 * built from, since that's the exact known bounding box (no need to
 * recompute it from the tessellated curve geometry). */
function normalizeShapeUV(geo: THREE.BufferGeometry, w: number, h: number) {
  const uv = geo.getAttribute("uv");
  for (let i = 0; i < uv.count; i++) {
    const u = uv.getX(i), v = uv.getY(i);
    uv.setXY(i, u / w + 0.5, v / h + 0.5);
  }
  uv.needsUpdate = true;
}

/** one screen: two persistent canvas/texture buffers so content can
 * crossfade without ever recreating the device or losing the ongoing
 * demo animation on the outgoing side mid-transition. */
function buildScreen(w: number, h: number, kind: "phone" | "web", r = 0) {
  const texW = kind === "phone" ? 360 : 720, texH = kind === "phone" ? 720 : 480;
  const makeBuffer = () => {
    const cv = document.createElement("canvas");
    cv.width = texW; cv.height = texH;
    const ctx = cv.getContext("2d")!;
    const tex = new THREE.CanvasTexture(cv);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return { ctx, tex };
  };
  const bufA = makeBuffer(), bufB = makeBuffer();
  const matA = new THREE.MeshBasicMaterial({ map: bufA.tex, transparent: true, opacity: 1 });
  const matB = new THREE.MeshBasicMaterial({ map: bufB.tex, transparent: true, opacity: 0 });
  // A flat PlaneGeometry has hard right-angle corners — inset inside a
  // rounded bezel, those corners can peek past the body's own rounded
  // silhouette at a grazing/tilted angle. Match the screen's corners to
  // the body's rounding instead of using a plain rectangle.
  let screenGeo: THREE.BufferGeometry;
  if (r > 0) {
    screenGeo = new THREE.ShapeGeometry(roundedRectShape(w, h, r));
    normalizeShapeUV(screenGeo, w, h);
  } else {
    screenGeo = new THREE.PlaneGeometry(w, h);
  }
  const planeA = new THREE.Mesh(screenGeo, matA);
  const planeB = new THREE.Mesh(screenGeo, matB);
  planeB.position.z = 0.001;
  const mesh = new THREE.Group();
  mesh.add(planeA, planeB);

  let front: "A" | "B" = "A";
  let projA: Project | null = null, projB: Project | null = null;

  function setProject(p: Project) {
    const current = front === "A" ? projA : projB;
    if (current && current.slug === p.slug) return;
    if (front === "A") projB = p; else projA = p;
    const incomingMat = front === "A" ? matB : matA;
    const outgoingMat = front === "A" ? matA : matB;
    gsap.to(incomingMat, { opacity: 1, duration: 0.55, ease: "power2.out" });
    gsap.to(outgoingMat, { opacity: 0, duration: 0.55, ease: "power2.out" });
    front = front === "A" ? "B" : "A";
  }

  function tick(t: number) {
    if (projA) { drawDeviceScreen(bufA.ctx, kind, projA, t); bufA.tex.needsUpdate = true; }
    if (projB) { drawDeviceScreen(bufB.ctx, kind, projB, t); bufB.tex.needsUpdate = true; }
  }

  return { mesh, setProject, tick };
}

/** persistent laptop+phone device pair — generic hinged-laptop and
 * notched-phone silhouettes (not a reproduction of any real branded
 * hardware), never scaling/fading in or out; only the screen content
 * crossfades and live-demos when the active project changes. Tilt/
 * parallax is cursor-driven, damped so it never snaps (kintsugi's
 * MECHANISMS.md "Cursor-tilt card"). */
function buildDevicePreview() {
  const g = new THREE.Group();
  // Body color is a generic aluminum silver — not the brand accent (that
  // orange is used only as content/UI accent and the rim light, kept
  // deliberately off the device shells themselves). The near-black,
  // high-metalness version read as flat black plastic anyway, since
  // there's no environment map here for that metalness to reflect.
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0xc4c7cb, metalness: 0.5, roughness: 0.35 });
  const bezelMat = new THREE.MeshStandardMaterial({ color: 0x232629, metalness: 0.25, roughness: 0.5 });

  // Both devices sit on this shared "table" line. Everything before this
  // fix used the base's own y (-0.1) as the reference, which put the
  // screen/phone tops around y=1.45-1.5 while the bottoms stayed near
  // -0.1 — a composition that's almost entirely ABOVE world y=0, while
  // the camera (no explicit lookAt, so its frustum is centered on world
  // y = camera.position.y) was centered on y=0. That mismatch is what cut
  // the phone off at the top: most of the frustum's vertical range was
  // being wasted below the content instead of framing it. Moving the
  // table down centers the whole composition on y≈0 instead.
  const tableY = -0.75;

  // ---- laptop: hinged base + screen, generic aluminum-unibody silhouette ----
  const laptop = new THREE.Group();
  const baseW = 2.5, baseD = 1.7, baseThk = 0.07;
  const base = new THREE.Mesh(extrudedPanel(baseW, baseD, baseThk, 0.09), bodyMat.clone());
  base.rotation.x = -Math.PI / 2; // lay the extruded panel flat
  base.position.y = -baseThk / 2;
  laptop.add(base);

  // keyboard deck: a simple canvas-textured plane laid flat on the base's
  // top surface — a bare wedge with no keys at all didn't read as a laptop.
  const deckC = document.createElement("canvas");
  deckC.width = 512; deckC.height = 340;
  const dctx = deckC.getContext("2d")!;
  dctx.fillStyle = "#c4c7cb"; dctx.fillRect(0, 0, 512, 340);
  const keyW = 40, keyGap = 6, rows = 4, cols = 11;
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++)
      rr(dctx, 20 + c * (keyW + keyGap), 20 + r * (keyW + keyGap), keyW, keyW, 5, "#26282b", 0.85);
  rr(dctx, 512 / 2 - 90, 20 + rows * (keyW + keyGap) + 14, 180, 90, 10, "#26282b", 0.18);
  const deckTex = new THREE.CanvasTexture(deckC);
  deckTex.colorSpace = THREE.SRGBColorSpace;
  const deck = new THREE.Mesh(
    new THREE.PlaneGeometry(baseW - 0.16, baseD - 0.16),
    new THREE.MeshBasicMaterial({ map: deckTex })
  );
  deck.rotation.x = -Math.PI / 2;
  deck.position.y = 0.001;
  laptop.add(deck);

  // Screen plane dims kept at exactly the 720x480 ("web" texture) aspect
  // ratio so the drawn UI fills the screen edge-to-edge without stretch
  // or crop — a mismatched plane/texture aspect was silently distorting
  // the content before.
  const screenW = 2.34, screenH = 1.60, screenThk = 0.05;
  const hinge = new THREE.Group();
  hinge.position.set(0, 0, -baseD / 2); // hinge sits at the back edge of the base
  const screenBody = new THREE.Mesh(extrudedPanel(screenW, screenH, screenThk, 0.07), bezelMat.clone());
  screenBody.position.y = screenH / 2; // extend upward from the hinge line
  const laptopScreen = buildScreen(screenW - 0.12, screenH - 0.12, "web", 0.04);
  laptopScreen.mesh.position.set(0, screenH / 2, screenThk / 2 + 0.001);
  hinge.add(screenBody, laptopScreen.mesh);
  // The screen's baseline (unrotated) pose is already standing upright
  // (90° open) since screenBody/laptopScreen are offset +Y from the hinge
  // origin — so "resting open" is a SMALL recline off vertical, not a
  // rotation measured from closed/flat. Negative X tips the top back
  // (away from camera); a large angle here folds the screen down behind
  // the base instead of standing it up, which is exactly what broke first.
  hinge.rotation.x = -THREE.MathUtils.degToRad(12);
  laptop.add(hinge);
  laptop.position.set(-0.75, tableY, -0.35);
  laptop.rotation.y = 0.18;

  // ---- phone: rounded-rect slab, notch/home-indicator drawn into the screen texture ----
  // Height kept at the phone screen's 360x720 aspect (see screenW/H note
  // above) rather than an arbitrary taller slab.
  const phoneW = 0.82, phoneH = 1.58, phoneThk = 0.08;
  const phone = new THREE.Group();
  const phoneBody = new THREE.Mesh(extrudedPanel(phoneW, phoneH, phoneThk, 0.14), bodyMat.clone());
  const phoneScreen = buildScreen(phoneW - 0.06, phoneH - 0.06, "phone", 0.1);
  phoneScreen.mesh.position.z = phoneThk / 2 + 0.001;
  phone.add(phoneBody, phoneScreen.mesh);
  // separated further from the laptop than before — the two overlapped
  // at their previous x-positions once the laptop actually started
  // rendering its screen (it didn't, before the hinge-angle fix). Bottom
  // edge sits on the same table line as the laptop base.
  phone.position.set(1.15, tableY + phoneH / 2, 0.35);
  phone.rotation.y = -0.26;

  g.add(laptop, phone);

  function setProject(p: Project) {
    laptopScreen.setProject(p);
    phoneScreen.setProject(p);
  }
  function tick(t: number) {
    laptopScreen.tick(t);
    phoneScreen.tick(t);
  }
  return { group: g, setProject, tick, laptop, phone };
}

export function initProjects3D(projects: Project[]) {
  const canvas = document.getElementById("projects-canvas") as HTMLCanvasElement | null;
  const detail = document.getElementById("project-detail");
  if (!canvas || !detail) return;
  const navPrev = document.getElementById("carousel-nav-prev");
  const navNext = document.getElementById("carousel-nav-next");

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
  const BASE_Z = 4.2;
  camera.position.z = BASE_Z;

  const devicePreview = buildDevicePreview();
  scene.add(devicePreview.group);
  scene.add(new THREE.AmbientLight(0xffffff, 0.7));
  scene.add(new THREE.HemisphereLight(0xffffff, 0x3a3d40, 0.6));
  const deviceKey = new THREE.DirectionalLight(0xffffff, 1.3);
  deviceKey.position.set(2, 3, 4);
  scene.add(deviceKey);
  const deviceFill = new THREE.DirectionalLight(0xffffff, 0.5);
  deviceFill.position.set(-2, 1, 3);
  scene.add(deviceFill);
  const deviceRim = new THREE.DirectionalLight(0xfc5d20, 0.5);
  deviceRim.position.set(-3, -1, 2);
  scene.add(deviceRim);

  // Entrance: the shared particle field sweeps in from chaos and converges
  // on the device group's rough silhouette, then dissolves — the same
  // "material" arriving here as assembled the hero, so the section doesn't
  // feel like a fresh scene.
  const entrance = new ParticleField({
    count: ENTRANCE_COUNT,
    from: chaosCloud(ENTRANCE_COUNT, 1.6),
    to: cardSilhouette(ENTRANCE_COUNT, 2.6, 1.6),
    chaos: 1,
    pointScale: 1.1,
  });
  scene.add(entrance.points);
  let entranceDone = false;
  function playEntrance() {
    if (entranceDone) return;
    entranceDone = true;
    devicePreview.group.scale.setScalar(0.7);
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
        gsap.to(devicePreview.group.scale, { x: 1, y: 1, z: 1, duration: 0.8, delay: 0.1, ease: "back.out(1.6)" });
        // one-time coach mark (kintsugi's "Gesture Discoverability" pattern:
        // a single hint, not a permanent animated affordance) — plays once
        // after the entrance settles, never repeats on later page changes.
        const hint = document.getElementById("carousel-hint");
        setTimeout(() => hint?.classList.add("drag-hint-pulse"), 400);
      },
    });
  }

  // Rough half-extents of the laptop+phone composition (world units) —
  // used to dolly the camera back on viewports where a fixed z would
  // otherwise crop the devices, the same problem the old flat-card
  // carousel solved for narrow mobile aspect ratios.
  // The composition isn't quite centered on x=0 (laptop sits further left
  // than the phone sits right), so the half-width needs margin for that
  // asymmetry too, not just the raw span/2.
  const SCENE_HALF_W = 2.05, SCENE_HALF_H = 0.95;
  function resize() {
    const w = canvas!.clientWidth || 1, h = canvas!.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const vFov = THREE.MathUtils.degToRad(camera.fov);
    const neededZv = SCENE_HALF_H / Math.tan(vFov / 2);
    const neededZh = SCENE_HALF_W / (Math.tan(vFov / 2) * camera.aspect);
    camera.position.z = Math.max(BASE_Z, neededZv + 0.4, neededZh + 0.4);
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  /* ----- paging: swipe / drag / wheel / nav-strip all step pageIndex ----- */
  const N = projects.length;
  let pageIndex = 0;
  let dragging = false, startX = 0, startY = 0;
  let active = -1;

  function setDetail(i: number) {
    if (i === active) return;
    active = i;
    const p = projects[i];
    devicePreview.setProject(p);
    // Tag pills used to repeat here as a third listing of the same info
    // already shown in the meta line above ("DATA PLATFORM · 2026") — one
    // less thing to read, not a data change (still used on the case-study
    // page). "Start something like this" is now a secondary, lower-weight
    // link since the primary path (open the case study) is reachable two
    // ways — the "View case study" link and clicking either device.
    detail!.innerHTML = `
      <div class="project-meta tag-mono"><span>${p.type}</span><span>${p.year}</span></div>
      <h4>${p.name}</h4>
      <p>${p.blurb}</p>
      <div class="project-detail-actions">
        <a class="arrow-link project-view-link" href="${workHref(p.slug)}">${t("work.viewCase") as string} <span class="arrow-link-icon">&rarr;</span></a>
        <button type="button" class="project-start-link">${t("work.startLikeThis") as string}</button>
      </div>`;
    detail!.querySelector(".project-start-link")?.addEventListener("click", () => fillStartIdea(p.name));
    gsap.fromTo(detail, { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" });
    if (navPrev) navPrev.textContent = `← ${projects[((i - 1) % N + N) % N].name}`;
    if (navNext) navNext.textContent = `${projects[(i + 1) % N].name} →`;
  }

  function page(delta: number) {
    pageIndex = ((pageIndex + delta) % N + N) % N;
    setDetail(pageIndex);
  }
  navPrev?.addEventListener("click", () => page(-1));
  navNext?.addEventListener("click", () => page(1));

  // Clicking either device opens that product's case-study sub-page —
  // same destination as the "View case" link in the detail panel below.
  const ray = new THREE.Raycaster();
  const clickTargets = [devicePreview.laptop, devicePreview.phone];
  function hitDevice(clientX: number, clientY: number): boolean {
    const r = canvas!.getBoundingClientRect();
    const ndc = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    return ray.intersectObjects(clickTargets, true).length > 0;
  }

  let pointerNX = 0, pointerNY = 0, hovering = false;
  canvas.addEventListener("pointerdown", (e) => {
    dragging = true; startX = e.clientX; startY = e.clientY;
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    pointerNX = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointerNY = -(((e.clientY - r.top) / r.height) * 2 - 1);
    hovering = true;
    canvas.style.cursor = hitDevice(e.clientX, e.clientY) ? "pointer" : "default";
  });
  const endDrag = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { page(dx < 0 ? 1 : -1); return; }
    // a drag-free release on either device opens the active product's page
    if (Math.abs(dx) < 6 && Math.abs(dy) < 6 && active >= 0 && hitDevice(e.clientX, e.clientY)) {
      location.href = workHref(projects[active].slug);
    }
  };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);
  canvas.addEventListener("pointerleave", () => { hovering = false; });

  // A single trackpad fling fires dozens of wheel events whose deltaX sums
  // into the hundreds — accumulating continuously and resetting on every
  // threshold crossing let one physical swipe fire page() many times in a
  // row (rapid multi-page skipping). Raise the threshold and, more
  // importantly, lock out further paging for a beat after each step so
  // one gesture reliably advances exactly one product.
  let wheelAccum = 0;
  let wheelLockedUntil = 0;
  canvas.addEventListener("wheel", (e) => {
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      e.preventDefault();
      const now = performance.now();
      if (now < wheelLockedUntil) return;
      wheelAccum += e.deltaX;
      if (Math.abs(wheelAccum) > 140) {
        page(wheelAccum > 0 ? 1 : -1);
        wheelAccum = 0;
        wheelLockedUntil = now + 550;
      }
    }
  }, { passive: false });

  const clock = new THREE.Clock();
  let devTiltX = 0, devTiltY = 0, devParX = 0, devParY = 0;
  let lastDemoUpdate = 0;
  const DEMO_FPS = 14;

  // Pause rendering while off-screen — see hero.ts/particles.ts for why this
  // matters: several concurrent WebGL scenes rendering unconditionally is
  // enough load to stall unrelated rAF-driven animation elsewhere on the page.
  let onScreen = false;
  let looping = false;
  new IntersectionObserver(
    ([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen) {
        playEntrance();
        if (active === -1) setDetail(0);
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

    // demo loop progress: a slow, seamless 0..1 cycle, redrawn at a
    // throttled cadence — a full-res 60fps canvas redraw for two live
    // screens is unnecessary cost for content that reads fine at ~14fps.
    if (t - lastDemoUpdate > 1 / DEMO_FPS) {
      lastDemoUpdate = t;
      const demoT = (t * 0.14) % 1;
      devicePreview.tick(demoT);
    }

    // idle sway + damped cursor tilt/parallax (never snaps — reset toward
    // idle when the pointer leaves, per MECHANISMS.md's cursor-tilt recipe)
    const idleY = Math.sin(t * 0.4) * 0.05;
    const idleBob = Math.sin(t * 0.75) * 0.03;
    const targetTiltY = hovering ? pointerNX * 0.16 : 0;
    const targetTiltX = hovering ? -pointerNY * 0.1 : 0;
    const targetParX = hovering ? pointerNX * 0.1 : 0;
    const targetParY = hovering ? -pointerNY * 0.06 : 0;
    devTiltY += (targetTiltY - devTiltY) * 0.08;
    devTiltX += (targetTiltX - devTiltX) * 0.08;
    devParX += (targetParX - devParX) * 0.06;
    devParY += (targetParY - devParY) * 0.06;
    devicePreview.group.rotation.y = idleY + devTiltY;
    devicePreview.group.rotation.x = devTiltX;
    devicePreview.group.position.y = idleBob + devParY;
    devicePreview.group.position.x = devParX;

    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  }
}
