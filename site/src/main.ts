// Summonware — interaction layer: preloader, text effects, menu,
// scroll reveals, and the Three.js hero.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initHero3D } from "./hero3d";

gsap.registerPlugin(ScrollTrigger);

/* ---------- text effects ---------- */
function scrambleText(el: HTMLElement, duration = 0.8) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const finalText = el.textContent?.trim() ?? "";
  el.textContent = "";
  gsap.set(el, { opacity: 1 });
  let progress = 0;
  const speed = finalText.length / (duration * 40);
  const interval = setInterval(() => {
    progress += speed;
    const visible = Math.min(finalText.length, Math.ceil(progress));
    el.textContent = finalText
      .split("")
      .slice(0, visible)
      .map((letter, i) => {
        if (letter === " ") return " ";
        if (i < progress - 2) return finalText[i];
        return chars[Math.floor(Math.random() * chars.length)];
      })
      .join("");
    if (progress >= finalText.length + 2) {
      el.textContent = finalText;
      clearInterval(interval);
    }
  }, 24);
}

function initScanText() {
  document.querySelectorAll<HTMLElement>("[data-fx='scan-text']").forEach((el) => {
    const delay = parseFloat(el.dataset.fxDelay ?? "0");
    ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      once: true,
      onEnter: () => setTimeout(() => el.classList.add("is-scanned"), delay * 1000),
    });
  });
}

/* ---------- preloader ---------- */
function initPreloader() {
  const preloader = document.querySelector<HTMLElement>(".preloader");
  const progress = document.querySelector<HTMLElement>(".preloader-progress");
  const heroItems = ["[hero-tag]", "[hero-heading]", "[hero-description]", ".hero-cta"]
    .map((s) => document.querySelector<HTMLElement>(s))
    .filter(Boolean) as HTMLElement[];
  if (!preloader || !progress) return;

  gsap.set(heroItems, { opacity: 0 });
  const state = { current: 0, target: 0 };
  let loaded = false;

  const fake = setInterval(() => {
    if (!loaded && state.target < 90) state.target += Math.random() * 8;
  }, 200);

  function update() {
    state.current += (state.target - state.current) * 0.08;
    progress!.style.width = state.current + "%";
    if (state.current < 99.8) requestAnimationFrame(update);
  }
  update();

  const start = Date.now();
  let done = false;
  const onLoaded = () => {
    if (done) return;
    done = true;
    const wait = Math.max(0, 1600 - (Date.now() - start));
    setTimeout(() => {
      loaded = true;
      state.target = 100;
      clearInterval(fake);
      gsap.to(preloader, {
        opacity: 0,
        duration: 0.7,
        delay: 0.35,
        onComplete: () => {
          preloader.style.display = "none";
          revealHero(heroItems);
        },
      });
    }, wait);
  };
  if (document.readyState === "complete") onLoaded();
  else window.addEventListener("load", onLoaded);
  setTimeout(onLoaded, 4000); // hard fallback so the site is never gated on a hung resource
}

function revealHero(items: HTMLElement[]) {
  items.forEach((el, i) => {
    if (el.matches("[hero-tag]")) {
      const label = el.childNodes[el.childNodes.length - 1] as Text;
      const span = document.createElement("span");
      span.textContent = label.textContent ?? "";
      el.replaceChild(span, label);
      gsap.set(el, { opacity: 1 });
      scrambleText(span, 0.9);
    } else {
      gsap.to(el, { opacity: 1, y: 0, duration: 0.9, delay: 0.15 * i, ease: "power3.out" });
    }
  });
}

/* ---------- menu ---------- */
function initMenu() {
  const toggle = document.getElementById("menu-toggle")!;
  const overlay = document.getElementById("menu-overlay")!;
  const close = () => {
    overlay.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  };
  toggle.addEventListener("click", () => {
    const open = overlay.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  overlay.querySelectorAll("[data-menu-link]").forEach((a) => a.addEventListener("click", close));
}

/* ---------- brand color swap over dark sections ---------- */
function initBrandSwap() {
  const brand = document.querySelector<HTMLElement>(".sigil-brand");
  if (!brand) return;
  const dark = getComputedStyle(document.documentElement).getPropertyValue("--color-ink").trim();
  const sections = Array.from(document.querySelectorAll<HTMLElement>(".section-dark, .cta-banner"));
  let ticking = false;
  function evaluate() {
    const r = brand!.getBoundingClientRect();
    const over = sections.some((s) => {
      const sr = s.getBoundingClientRect();
      return sr.top <= r.bottom && sr.bottom > r.top;
    });
    brand!.style.color = over ? "#ffffff" : dark;
  }
  document.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        evaluate();
        ticking = false;
      });
    },
    { passive: true }
  );
  evaluate();
}

/* ---------- rotating word ---------- */
function initSwapWord() {
  const el = document.querySelector<HTMLElement>(".swap-word");
  if (!el) return;
  const words: string[] = JSON.parse(el.dataset.words ?? "[]");
  let i = 0;
  setInterval(() => {
    i = (i + 1) % words.length;
    gsap.fromTo(el, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" });
    el.textContent = words[i];
  }, 2200);
}

/* ---------- counters ---------- */
function initCounters() {
  document.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
    const target = parseInt(el.dataset.count ?? "0", 10);
    ScrollTrigger.create({
      trigger: el,
      start: "top 85%",
      once: true,
      onEnter: () => {
        const obj = { v: 0 };
        gsap.to(obj, {
          v: target,
          duration: 1.4,
          ease: "power2.out",
          onUpdate: () => (el.textContent = String(Math.round(obj.v))),
        });
      },
    });
  });
}

/* ---------- wave bars ---------- */
function initWaveBars() {
  const wrap = document.querySelector(".wave-bars");
  if (!wrap) return;
  for (let i = 0; i < 42; i++) {
    const bar = document.createElement("i");
    bar.style.animationDelay = `${(i % 7) * 0.12}s`;
    bar.style.height = `${20 + Math.random() * 80}%`;
    wrap.appendChild(bar);
  }
}

/* ---------- pinned feature stage: scroll-scrubbed morph ---------- */
const STAGE_STEPS = [
  {
    name: "ai-systems",
    title: "Turn a workflow into an AI engine",
    text: "We build agents and pipelines around your real operations. Describe the process once — then watch it run itself. Automate the grind, keep the judgment calls.",
    chips: ["OPS COPILOT", "SUPPORT AGENT", "DATA PIPELINE"],
    // 8-point polygons with matching vertex counts so clip-path tweens smoothly
    shape: "polygon(50% 0%, 85% 12%, 100% 50%, 85% 88%, 50% 100%, 15% 88%, 0% 50%, 15% 12%)",
  },
  {
    name: "custom-software",
    title: "Unlimited product, instantly scoped",
    text: "Great software without hiring and firefighting a dev org — or full control if you want it. Web apps, platforms, internal tools: clean architecture, yours to keep.",
    chips: ["WEB APPS", "PLATFORMS", "INTERNAL TOOLS"],
    shape: "polygon(25% 6%, 75% 6%, 94% 25%, 94% 75%, 75% 94%, 25% 94%, 6% 75%, 6% 25%)",
  },
  {
    name: "product-design",
    title: "Design that sells before it ships",
    text: "Interfaces your customers actually enjoy — researched, prototyped, and tested. We design the journey first, so engineering builds the right thing once.",
    chips: ["RESEARCH", "UX / UI", "MOTION"],
    shape: "polygon(50% 2%, 68% 32%, 98% 50%, 68% 68%, 50% 98%, 32% 68%, 2% 50%, 32% 32%)",
  },
  {
    name: "launch-support",
    title: "Keep it alive after launch",
    text: "Monitoring, iteration, and growth features on a retainer that flexes with you. Your product keeps improving while you run the business.",
    chips: ["MONITORING", "ITERATION", "GROWTH"],
    shape: "polygon(50% 12%, 80% 2%, 98% 28%, 88% 60%, 62% 98%, 30% 90%, 4% 66%, 12% 26%)",
  },
];

function initFeatureStage() {
  const wrap = document.querySelector<HTMLElement>(".feature-stage-wrap");
  if (!wrap) return;
  const nums = Array.from(wrap.querySelectorAll<HTMLElement>(".stage-nums b"));
  const name = wrap.querySelector<HTMLElement>(".stage-name")!;
  const title = wrap.querySelector<HTMLElement>(".stage-title")!;
  const text = wrap.querySelector<HTMLElement>(".stage-text")!;
  const chips = wrap.querySelector<HTMLElement>(".stage-chips")!;
  const shapes = Array.from(wrap.querySelectorAll<HTMLElement>(".morph-shape"));
  const bar = wrap.querySelector<HTMLElement>(".stage-progress i")!;
  let current = 0;

  shapes.forEach((s) => (s.style.clipPath = STAGE_STEPS[0].shape));

  function applyStep(i: number) {
    if (i === current) return;
    current = i;
    const step = STAGE_STEPS[i];
    nums.forEach((n, j) => n.classList.toggle("is-on", j === i));
    shapes.forEach((s) => (s.style.clipPath = step.shape)); // CSS transition morphs it
    name.textContent = step.name;
    // wipe copy out with a clip sweep, swap content, sweep back in
    const copyEls = [title, text, chips];
    gsap.to(copyEls, {
      clipPath: "inset(0 100% 0 0)",
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        title.textContent = step.title;
        text.textContent = step.text;
        chips.innerHTML = step.chips
          .map((c, j) => `<span class="chip${j === 0 ? " is-on" : ""}">${c}</span>`)
          .join("");
        gsap.to(copyEls, { clipPath: "inset(0 0% 0 0)", duration: 0.5, ease: "power3.out" });
      },
    });
  }

  ScrollTrigger.create({
    trigger: wrap,
    start: "top top",
    end: "bottom bottom",
    scrub: true,
    onUpdate: (self) => {
      bar.style.width = self.progress * 100 + "%";
      const i = Math.min(STAGE_STEPS.length - 1, Math.floor(self.progress * STAGE_STEPS.length));
      applyStep(i);
    },
  });
}

/* ---------- projects showcase (data-driven placeholder format) ---------- */
import projects from "./data/projects.json";

function initProjects() {
  const grid = document.getElementById("projects-grid");
  if (!grid) return;
  grid.innerHTML = projects
    .map(
      (p) => `
      <article class="project-card">
        <div class="project-cover hue-${p.hue}"><span class="project-mark">${p.name.slice(0, 2)}</span></div>
        <div class="project-body">
          <div class="project-meta tag-mono"><span>${p.type}</span><span>${p.year}</span></div>
          <h4>${p.name}</h4>
          <p>${p.blurb}</p>
          <div class="project-tags">${p.tags.map((t) => `<span>${t}</span>`).join("")}</div>
        </div>
      </article>`
    )
    .join("");
}

/* ---------- form ---------- */
function initForm() {
  const form = document.getElementById("start-form") as HTMLFormElement | null;
  const success = document.querySelector<HTMLElement>(".form-success");
  if (!form || !success) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    form.hidden = true;
    success.hidden = false;
  });
}

initPreloader();
initScanText();
initMenu();
initBrandSwap();
initSwapWord();
initCounters();
initWaveBars();
initForm();
initFeatureStage();
initProjects();
initHero3D();
