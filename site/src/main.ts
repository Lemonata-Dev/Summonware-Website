// Summonware — interaction layer: preloader, text effects, menu,
// scroll reveals, and the Three.js hero.
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { initHero3D } from "./hero3d";
import { initStageFX } from "./stage3d";
import { initProjects3D } from "./projects3d";
import { initCursor, initMagnetic } from "./fx";
import { initI18n, t } from "./i18n";

gsap.registerPlugin(ScrollTrigger);

// Runs first and synchronously: sets all [data-i18n*] text before the
// preloader reveal or scramble effects read it, so nothing flashes in
// the wrong language.
initI18n();

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
  const sections = Array.from(document.querySelectorAll<HTMLElement>(".section-dark, .feature-stage"));
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
type StageStep = { name: string; title: string; text: string; chips: string[] };

function getStageSteps(): StageStep[] {
  const steps = t("services.steps");
  return Array.isArray(steps) ? (steps as StageStep[]) : [];
}

function initFeatureStage() {
  const wrap = document.querySelector<HTMLElement>(".feature-stage-wrap");
  if (!wrap) return;
  const STAGE_STEPS = getStageSteps();
  const nums = Array.from(wrap.querySelectorAll<HTMLElement>(".stage-nums b"));
  const name = wrap.querySelector<HTMLElement>(".stage-name")!;
  const title = wrap.querySelector<HTMLElement>(".stage-title")!;
  const text = wrap.querySelector<HTMLElement>(".stage-text")!;
  const chips = wrap.querySelector<HTMLElement>(".stage-chips")!;
  const bar = wrap.querySelector<HTMLElement>(".stage-progress i")!;
  const fx = initStageFX();
  let current = 0;

  function applyStep(i: number) {
    if (i === current) return;
    current = i;
    const step = STAGE_STEPS[i];
    nums.forEach((n, j) => n.classList.toggle("is-on", j === i));
    fx?.setStep(i);
    name.textContent = step.name;
    // wipe copy out with a clip sweep, swap content, sweep back in.
    // Content is resolved at swap time from `current` so an interrupted
    // transition always lands on the latest step, never a stale one.
    const copyEls = [title, text, chips];
    gsap.killTweensOf(copyEls);
    gsap.to(copyEls, {
      clipPath: "inset(0 100% 0 0)",
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        const s = STAGE_STEPS[current];
        title.textContent = s.title;
        text.textContent = s.text;
        chips.innerHTML = s.chips
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

/* ---------- projects showcase (data-driven, 3D carousel) ---------- */
import projects from "./data/projects.json";

function initProjects() {
  initProjects3D(projects);
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
initCursor();
initMagnetic();
