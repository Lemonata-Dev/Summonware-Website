// Hero: the old version was a pinned, scroll-scrubbed three.js scene
// (seal -> dome -> device, 2400 particles). This replaces it with:
//   1. a level-3 WebGL fluid gradient blob (heroBlob.ts) — the same class
//      of effect as khroma.co's hero, confirmed via direct inspection
//   2. the headline itself as the kinetic surface — per-letter variable
//      font weight rising near the cursor (evidence: kintsugi's `unsaid`
//      reference, cursor-proximity via font-variation-settings)
// No pinning/scroll-jacking either way — a single normal-height section.
import { initHeroBlob } from "./heroBlob";

// Splits into per-letter spans, but nests them inside a per-WORD
// inline-block wrapper so the line can only break between words (at the
// space text nodes) — wrapping bare letters with no word container lets
// the browser break a line between any two letter-spans, since each is
// its own atomic inline-block box with no memory of which word it's in.
function wrapLetters(root: HTMLElement) {
  function wrapWord(word: string): HTMLSpanElement {
    const wordSpan = document.createElement("span");
    wordSpan.className = "kword";
    for (const ch of word) {
      const letterSpan = document.createElement("span");
      letterSpan.className = "kletter";
      letterSpan.textContent = ch;
      wordSpan.appendChild(letterSpan);
    }
    return wordSpan;
  }
  function walk(node: Node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? "";
      const frag = document.createDocumentFragment();
      const parts = text.split(/(\s+)/); // keep the whitespace runs as their own entries
      parts.forEach((part) => {
        if (part === "") return;
        if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
        else frag.appendChild(wrapWord(part));
      });
      node.parentNode?.replaceChild(frag, node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      Array.from(node.childNodes).forEach(walk);
    }
  }
  Array.from(root.childNodes).forEach(walk);
}

function initKineticHeadline() {
  const heading = document.getElementById("hero-heading");
  if (!heading) return;
  if (matchMedia("(pointer: coarse)").matches || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  // Splitting into per-codepoint spans breaks complex-script shaping —
  // Thai combining vowel/tone marks need to sit adjacent to their base
  // consonant in the same text run to compose correctly; isolating each
  // in its own span renders them as detached "tofu" marks. Only Latin
  // script gets the kinetic split; Thai keeps a plain, correctly-shaped
  // static heading instead of an animated-but-broken one.
  if (document.documentElement.lang !== "en") return;

  wrapLetters(heading);
  const letters = Array.from(heading.querySelectorAll<HTMLElement>(".kletter"));
  if (!letters.length) return;

  // A heavier font-variation weight is a genuinely wider glyph, so an
  // unconstrained inline-block span reflows its neighbors as it animates
  // — the reported "lines change on hover" bug. Locking each letter's box
  // to its resting-weight width stops that: the glyph can still render
  // bolder/wider than its box at high weight, but that's a paint-time
  // overflow, not a layout change, so nothing downstream ever reflows.
  type Cached = { el: HTMLElement; dx: number; dy: number; w: number };
  let cache: Cached[] = [];
  function measure() {
    const base = heading!.getBoundingClientRect();
    letters.forEach((el) => {
      el.style.width = "auto";
      el.style.fontVariationSettings = '"wght" 550';
    });
    cache = letters.map((el) => {
      const r = el.getBoundingClientRect();
      el.style.width = `${r.width}px`;
      const prev = cache.find((c) => c.el === el);
      return { el, dx: r.left - base.left + r.width / 2, dy: r.top - base.top + r.height / 2, w: prev?.w ?? 550 };
    });
  }
  measure();
  new ResizeObserver(measure).observe(heading);

  let mouseX = -9999, mouseY = -9999;
  window.addEventListener("pointermove", (e) => { mouseX = e.clientX; mouseY = e.clientY; });

  const RADIUS = 150;
  function tick() {
    const base = heading!.getBoundingClientRect();
    cache.forEach((c) => {
      const cx = base.left + c.dx, cy = base.top + c.dy;
      const dist = Math.hypot(cx - mouseX, cy - mouseY);
      const target = 550 + Math.max(0, 1 - dist / RADIUS) * 350;
      c.w += (target - c.w) * 0.15;
      c.el.style.fontVariationSettings = `"wght" ${c.w.toFixed(0)}`;
    });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

export function initHero() {
  initHeroBlob();
  initKineticHeadline();
}
