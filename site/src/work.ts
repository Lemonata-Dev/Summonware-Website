// Work detail pages — one shared template rendered for all 8 products
// (intro -> features -> CTA, per NARRATIVE_FLOW's problem/solution/outcome
// spirit but at case-study depth). Data-driven off projects.json + the
// i18n work.items/work.detail dictionaries so EN/TH and every product stay
// in exactly the same shape.
import gsap from "gsap";
import projects from "./data/projects.json";
import { t } from "./i18n";
import { workHref, homeHref } from "./routes";
import { initWorkGlyph3D } from "./workGlyph3d";

type Project = { slug: string; year: string; hue: string; kind: string; photo: string; photoCredit: string };
export type WorkItem = { name: string; type: string; blurb: string; tags: string[] };
type WorkFeature = { title: string; desc: string };
type WorkDetail = { intro: string; features: WorkFeature[]; ctaHeadingHtml: string; ctaBody: string };

const HUE_VAR: Record<string, string> = { orange: "--color-accent", dark: "--color-dark-2", light: "--color-ink-soft" };

function esc(s: string): string {
  const d = document.createElement("div");
  d.textContent = s;
  return d.innerHTML;
}

export function renderWorkPage(slug: string) {
  const list = projects as Project[];
  const index = list.findIndex((p) => p.slug === slug);
  if (index === -1) return false;
  const project = list[index];
  const items = t("work.items") as Record<string, WorkItem>;
  const details = t("work.detail") as Record<string, WorkDetail>;
  const item = items?.[slug];
  const detail = details?.[slug];
  if (!item || !detail) return false;

  const prev = list[(index - 1 + list.length) % list.length];
  const next = list[(index + 1) % list.length];
  const prevItem = items[prev.slug];
  const nextItem = items[next.slug];

  document.title = `${item.name} — Summonware`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute("content", item.blurb);

  const view = document.getElementById("work-view")!;
  view.innerHTML = `
    <header class="work-topbar">
      <a class="work-back tag-mono" href="${homeHref()}#projects"><span class="work-back-arrow">&larr;</span> ${esc(t("work.backToWork") as string)}</a>
      <button class="work-dir-toggle tag-mono" id="work-dir-toggle" aria-expanded="false">
        ${esc(t("work.allWork") as string)} <span class="work-dir-count">${index + 1}/${list.length}</span>
      </button>
    </header>

    <div class="work-directory" id="work-directory">
      <nav class="work-directory-list">
        ${list
          .map(
            (p) => `<a href="${workHref(p.slug)}" class="work-directory-item${p.slug === slug ? " is-active" : ""}">
              <span class="work-directory-dot hue-${p.hue}"></span>${esc(items[p.slug].name)}
            </a>`
          )
          .join("")}
      </nav>
    </div>

    <section class="work-hero" data-track-section="work_hero">
      <p class="tag-mono work-eyebrow">${esc(item.type)}</p>
      <h1 class="work-title text-hero-work">${esc(item.name)}</h1>
      <p class="work-intro">${esc(detail.intro)}</p>
      <div class="work-hero-visual" id="work-hero-visual">
        <div class="work-hero-photo" style="background-image:url('${project.photo}')"></div>
        <canvas id="work-glyph-canvas"></canvas>
        <div class="work-hero-frame" aria-hidden="true"></div>
      </div>
      <p class="work-photo-credit tag-mono">Photo — ${esc(project.photoCredit)}</p>
    </section>

    <section class="work-features">
      <p class="tag-mono section-tag">${esc(t("work.featuresTag") as string)}</p>
      <div class="work-feature-grid">
        ${detail.features
          .map(
            (f, i) => `<article class="work-feature-card" data-reveal>
              <span class="work-feature-index tag-mono">0${i + 1}</span>
              <h3>${esc(f.title)}</h3>
              <p>${esc(f.desc)}</p>
            </article>`
          )
          .join("")}
      </div>
    </section>

    <section class="work-cta section-dark">
      <p class="tag-mono section-tag light"><span class="tag-square"></span>${esc(t("work.ctaTag") as string)}</p>
      <h2 class="text-45">${detail.ctaHeadingHtml}</h2>
      <p class="work-cta-body">${esc(detail.ctaBody)}</p>
      <a class="btn-swoosh" href="${homeHref()}?usecase=${encodeURIComponent(item.name)}#start"><span class="btn-swoosh-bg"></span><span class="btn-swoosh-text">${esc(t("work.ctaButton") as string)}</span></a>
    </section>

    <nav class="work-pager">
      <a class="work-pager-link work-pager-prev" href="${workHref(prev.slug)}">
        <span class="tag-mono">&larr; ${esc(t("work.prevProject") as string)}</span>
        <strong>${esc(prevItem.name)}</strong>
      </a>
      <a class="work-pager-link work-pager-next" href="${workHref(next.slug)}">
        <span class="tag-mono">${esc(t("work.nextProject") as string)} &rarr;</span>
        <strong>${esc(nextItem.name)}</strong>
      </a>
    </nav>
  `;

  const style = getComputedStyle(document.documentElement);
  const hueVar = HUE_VAR[project.hue] ?? "--color-accent";
  initWorkGlyph3D(project.kind, style.getPropertyValue(hueVar).trim(), style.getPropertyValue("--color-accent").trim());

  initTiltVisual();
  initRevealCards();
  initDirectoryDrawer();
  if (matchMedia("(pointer: fine)").matches) initEdgeNav(prev.slug, next.slug);

  return true;
}

function prefersReducedMotion() {
  return matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function initTiltVisual() {
  const el = document.getElementById("work-hero-visual");
  if (!el || matchMedia("(pointer: coarse)").matches || prefersReducedMotion()) return;
  const photo = el.querySelector<HTMLElement>(".work-hero-photo")!;
  const canvas = el.querySelector<HTMLElement>("#work-glyph-canvas")!;
  el.style.perspective = "1200px";
  el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    gsap.to(el, { rotateY: px * 10, rotateX: -py * 10, duration: 0.6, ease: "power3.out" });
    gsap.to(photo, { x: -px * 18, y: -py * 18, duration: 0.6, ease: "power3.out" });
    gsap.to(canvas, { x: -px * 34, y: -py * 34, duration: 0.6, ease: "power3.out" });
  });
  el.addEventListener("pointerleave", () => {
    gsap.to(el, { rotateY: 0, rotateX: 0, duration: 0.8, ease: "power3.out" });
    gsap.to([photo, canvas], { x: 0, y: 0, duration: 0.8, ease: "power3.out" });
  });
}

function initRevealCards() {
  const cards = document.querySelectorAll<HTMLElement>("[data-reveal]");
  if (prefersReducedMotion()) {
    gsap.set(cards, { opacity: 1, y: 0 });
    return;
  }
  gsap.set(cards, { opacity: 0, y: 24 });
  const obs = new IntersectionObserver(
    (entries, o) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        gsap.to(entry.target, { opacity: 1, y: 0, duration: 0.7, delay: Array.from(cards).indexOf(entry.target as HTMLElement) * 0.06, ease: "power3.out" });
        o.unobserve(entry.target);
      });
    },
    { threshold: 0.2 }
  );
  cards.forEach((c) => obs.observe(c));
}

function initDirectoryDrawer() {
  const toggle = document.getElementById("work-dir-toggle");
  const drawer = document.getElementById("work-directory");
  if (!toggle || !drawer) return;
  toggle.addEventListener("click", () => {
    const open = drawer.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  drawer.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => drawer.classList.remove("is-open"))
  );
}

function initEdgeNav(prevSlug: string, nextSlug: string) {
  const EDGE = 88;
  const arrow = document.createElement("div");
  arrow.className = "edge-nav-arrow";
  arrow.innerHTML = `<span></span>`;
  document.body.appendChild(arrow);

  let zone: "prev" | "next" | null = null;
  window.addEventListener("pointermove", (e) => {
    if (document.getElementById("work-directory")?.classList.contains("is-open")) {
      arrow.classList.remove("is-visible");
      zone = null;
      return;
    }
    const next2 = e.clientX <= EDGE ? "prev" : e.clientX >= innerWidth - EDGE ? "next" : null;
    if (next2 !== zone) {
      zone = next2;
      arrow.classList.toggle("is-visible", zone !== null);
      arrow.classList.toggle("is-prev", zone === "prev");
      arrow.classList.toggle("is-next", zone === "next");
      document.body.classList.toggle("edge-nav-active", zone !== null);
    }
    arrow.style.top = `${e.clientY}px`;
    arrow.style.left = zone === "prev" ? "1.5rem" : zone === "next" ? "" : "";
    if (zone === "next") arrow.style.right = "1.5rem";
    else arrow.style.removeProperty("right");
  });
  window.addEventListener("click", (e) => {
    if (!zone) return;
    const t = e.target as HTMLElement;
    if (t.closest("a, button")) return; // don't hijack real links/buttons under the cursor
    location.href = workHref(zone === "prev" ? prevSlug : nextSlug);
  });
}
