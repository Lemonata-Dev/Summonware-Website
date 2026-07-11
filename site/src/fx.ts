// Site-wide mouse polish: a trailing cursor glow and magnetic buttons.
import gsap from "gsap";

export function initCursor() {
  if (matchMedia("(pointer: coarse)").matches) return; // skip on touch
  const dot = document.createElement("div");
  dot.className = "cursor-dot";
  const ring = document.createElement("div");
  ring.className = "cursor-ring";
  document.body.append(dot, ring);

  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const ringPos = { ...pos };
  window.addEventListener("pointermove", (e) => {
    pos.x = e.clientX;
    pos.y = e.clientY;
    dot.style.transform = `translate(${pos.x}px, ${pos.y}px)`;
  });
  (function tick() {
    ringPos.x += (pos.x - ringPos.x) * 0.16;
    ringPos.y += (pos.y - ringPos.y) * 0.16;
    ring.style.transform = `translate(${ringPos.x}px, ${ringPos.y}px)`;
    requestAnimationFrame(tick);
  })();

  // grow over interactive elements
  const grow = () => document.body.classList.add("cursor-grow");
  const shrink = () => document.body.classList.remove("cursor-grow");
  document.addEventListener("pointerover", (e) => {
    const t = e.target as HTMLElement;
    if (t.closest("a, button, canvas, summary, .pill")) grow();
    else shrink();
  });
}

export function initMagnetic() {
  if (matchMedia("(pointer: coarse)").matches) return;
  document.querySelectorAll<HTMLElement>(".btn-swoosh, .menu-pill, .pill").forEach((el) => {
    const strength = 0.35;
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      gsap.to(el, { x: dx * strength, y: dy * strength, duration: 0.4, ease: "power3.out" });
    });
    el.addEventListener("pointerleave", () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
    });
  });
}
