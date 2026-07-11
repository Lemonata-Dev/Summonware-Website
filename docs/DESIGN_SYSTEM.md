# Design System — Summonware
**Status:** CANONICAL — governs all visual/motion decisions. Sourced from docs/INSPIRATION_BRIEF.md section 6 (open decisions), now resolved.

Rule for every future session: **never hardcode a color, spacing value, font size, or animation config directly in a component.** Reference the tokens below. Changing a token here should be the only step needed to restyle the whole site.

---

## 1. Color tokens

**Rationale:** violet/indigo differentiates from Thailand's green-dominated fintech/telco branding (LINE MAN, Grab, Bitkub, SCB, AIS) and blue-dominated legacy enterprise (True, dtac) — reads as "AI-era software," not "another local app." Electric cyan is the single spark/accent, used sparingly, matching the particle-materialization motion language.

```css
:root {
  /* Base */
  --color-bg: #0B0A10;           /* near-black, warm undertone — not pure black */
  --color-bg-raised: #14121C;    /* cards, raised surfaces */
  --color-bg-inverse: #F5F4FA;   /* rare light-mode surfaces (e.g. printable pages) */

  /* Brand */
  --color-primary: #6C4CF1;      /* deep violet/indigo — primary brand color */
  --color-primary-dim: #4A339E;  /* pressed/muted states */
  --color-accent: #4CF1E8;       /* electric cyan — spark/accent, particle glow, CTAs only */

  /* Text */
  --color-text-primary: #F5F4FA;
  --color-text-secondary: #A6A3B8; /* muted gray-violet, body copy on dark */
  --color-text-inverse: #0B0A10;

  /* Utility */
  --color-border: #26233433;     /* grid lines, dividers — low-opacity */
  --color-success: #4CF1A0;
  --color-warning: #F1C34C;
  --color-error: #F14C6C;
}
```

**Usage discipline:**
- `--color-accent` (cyan) is reserved for: CTA buttons, active/focus states, particle-materialization glow, active nav indicator. Never used for large fills or body text — it stays a "spark," not a background.
- `--color-primary` (violet) carries brand weight: logo, section dividers, primary buttons' resting state, gradient transitions between sections.
- No more than these two brand colors + one neutral scale. Resist adding a third accent — the reference audit showed every strong site used exactly one signature color.

**To change the whole palette later:** edit only this block. Every component below references these variable names, not raw hex values.

---

## 2. Typography

```css
:root {
  --font-display: 'Inter', -apple-system, sans-serif;   /* headlines — swap for a distinct display face once brand assets are ready */
  --font-body: 'Inter', -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;              /* section codes: N.01, stat labels */

  --text-xs:   0.75rem;   /* 12px — eyebrow labels, mono tags */
  --text-sm:   0.875rem;  /* 14px — captions, footer */
  --text-base: 1rem;      /* 16px — body */
  --text-lg:   1.25rem;   /* 20px — lead paragraphs */
  --text-xl:   1.75rem;   /* 28px — card headlines */
  --text-2xl:  2.5rem;    /* 40px — section headlines */
  --text-3xl:  4rem;      /* 64px — hero headline (desktop) */
  --text-4xl:  5.5rem;    /* 88px — hero headline (large desktop only) */

  --weight-regular: 400;
  --weight-medium: 500;
  --weight-bold: 700;

  --tracking-tight: -0.02em;   /* large headlines */
  --tracking-normal: 0;
  --tracking-wide: 0.08em;     /* eyebrow labels, N.0X codes — uppercase, mono */
}
```

**Hierarchy rules:**
- Eyebrow/section-code labels (`N.01`, `WHAT WE DO`): `--font-mono`, `--text-xs`, `--tracking-wide`, uppercase, `--color-text-secondary`.
- Headlines: `--font-display`, `--weight-bold`, `--tracking-tight`.
- Body copy: `--font-body`, `--weight-regular`, `--color-text-secondary` for supporting text, `--color-text-primary` for lead sentences (mixed-weight paragraph pattern from Cmblu).

---

## 3. Spacing scale

8px base unit — every margin/padding/gap in the site must be a multiple of this.

```css
:root {
  --space-1: 0.5rem;   /* 8px */
  --space-2: 1rem;     /* 16px */
  --space-3: 1.5rem;   /* 24px */
  --space-4: 2rem;     /* 32px */
  --space-6: 3rem;     /* 48px */
  --space-8: 4rem;     /* 64px */
  --space-12: 6rem;    /* 96px */
  --space-16: 8rem;    /* 128px — section-to-section vertical rhythm, desktop */
  --space-24: 12rem;   /* 192px — hero top/bottom breathing room */
}
```

Section vertical padding defaults to `--space-16` desktop / `--space-8` mobile (see breakpoint table below) — this single rule keeps section rhythm consistent as new sections get added.

---

## 4. The grid system (structural + materialization stage)

Per `INSPIRATION_BRIEF.md` section 3: the grid is Summonware's core connective device — it frames content sections AND is the literal "stage" particles converge onto.

```css
:root {
  --grid-columns: 12;
  --grid-gutter: var(--space-3);   /* 24px desktop */
  --grid-gutter-mobile: var(--space-2); /* 16px mobile */
  --grid-line-color: var(--color-border);
  --grid-line-width: 1px;
}
```

- Rendered as a persistent faint overlay (dot-intersections + thin lines) at low opacity on any section marked `data-grid-stage="true"`.
- Materialization sequences must resolve particles onto grid intersections — never freeform positions — so the effect always reads as "structured," not chaotic.
- Not every section needs the grid visible — static beats (trust strip, testimonial) should omit it entirely, per the brief's "deliberate calm beat" rule.

---

## 5. Motion library

Single source of truth for all animation — components import named presets, never write raw animation config inline. Lives at `/src/lib/motion.ts` (or `.js`) in the actual build.

**Presets to implement:**

| Preset name | Behavior | Used for |
|---|---|---|
| `materializeHero` | Particle convergence, scroll-scrubbed, resolves into wordmark/headline | Hero section only |
| `materializeCard` | Lightweight particle convergence into an icon/logo, triggered on scroll-into-view (not scrubbed) | Service cards, case-study thumbnails |
| `materializeFlagship` | Full scroll-scrubbed sequence, 4 stages, pinned section | Signature process section only |
| `fadeUp` | Simple opacity + 16px translate-Y on scroll-into-view | Static beats: testimonial, footer, trust logos |
| `revealWord` | Word-by-word opacity ramp tied to scroll position | 1–2 key statements max per page — not default body copy behavior |
| `gridPulse` | Grid lines' opacity/glow responds subtly to nearby active content | Background ambience during materialization sequences |

**Rule:** if a new section needs motion, it must use one of the presets above. If none fit, add a new named preset to the library (with a name + one-line description added to this table) rather than writing one-off animation code in a component.

**Intensity budget (from the brief):** exactly one `materializeHero`, one `materializeFlagship` per page. `materializeCard` may repeat once per grid item. Do not add a second flagship-scale sequence without updating `INSPIRATION_BRIEF.md` first — this is a deliberate constraint, not an oversight.

---

## 6. Breakpoints & responsive rules

```css
:root {
  --bp-mobile: 375px;   /* base */
  --bp-tablet: 768px;
  --bp-desktop: 1280px;
  --bp-wide: 1600px;
}
```

| Element | Mobile (< 768px) | Tablet (768–1279px) | Desktop (1280px+) |
|---|---|---|---|
| Grid columns | 4 | 8 | 12 |
| Section padding | `--space-8` | `--space-12` | `--space-16` |
| Hero headline size | `--text-2xl` | `--text-3xl` | `--text-3xl` / `--text-4xl` on wide |
| Materialize sequences | Simplify to sequential fade-reveal per step — no scroll-scrubbing/pinning (avoids janky mobile scroll-jacking) | Scroll-scrubbed OK, reduced particle count for perf | Full fidelity |
| Nav | Collapses to single menu icon | Collapses to single menu icon | Full link list visible |
| Card grids | 1 column | 2 columns | 3–4 columns |
| Grid overlay | Visible, simplified (fewer lines) | Full | Full |

**Content hierarchy rule for reflow:** nothing is ever hidden on mobile — only reflowed/simplified. If a section has a primary visual + supporting text side-by-side on desktop, mobile stacks visual-then-text (image leads, matching how all 5 reference sites handled reflow).

---

## 7. Component reference (for CONTENT_MAP.md pairing)

These are the reusable building blocks — every page/section is composed from these, not one-off markup:

- `SectionDivider` — the "N.0X — SECTION NAME" header (Wembi-derived), used at the top of every major section.
- `ServiceCard` — icon (materializeCard) + title + description + arrow-link CTA.
- `ProjectCard` — thumbnail (materializeCard, docks into grid cell) + title + tag + arrow-link CTA. Grows to case-study full-bleed on click/scroll if detail pages exist.
- `StatCallout` — number + unit + label, snaps into grid cells (Cipher-style data table). **Deferred:** not used on first launch (no track record yet to make it credible) — see NARRATIVE_FLOW.md section 6. Kept in the component list so it's ready to activate later without design rework.
- `ArrowLink` — the reusable icon-arrow + label CTA (Cmblu-derived), used for all secondary links.
- `TestimonialBlock` — plain quote + attribution, no motion.
- `GridStage` — wrapper component that renders the grid overlay and hosts any materialize* sequence.

New content types (e.g., a future "Team" section) should reuse these primitives before inventing a new component.

---

## 8. Open items to finalize before build

- Exact particle system implementation (canvas/WebGL vs. CSS/SVG approximation) — a Fable 5 technical call, not a design one; revisit if performance/build-cost becomes an issue.
- Whether `--font-display` stays Inter or gets replaced with a distinct display typeface once brand assets exist — Inter is a safe placeholder, not a final decision.
- Real product UI screenshots for materialize resolve-points — pending availability.
