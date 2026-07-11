# Inspiration Brief — v2
**For:** Summonware (software house — custom solutions/products across business needs, AI-forward, modern tech stack)
**Built from:** structural assessment of 5 reference sites (neko.engineering, wembi.ai, cmblu.com, agentura.framer.website, cipherdigital.com)
**Supersedes:** v1 — same base research, revised motion direction and brand concept
**Status:** CANONICAL — this is the active brief feeding Fable 5. Version history and rejected directions live in docs/inspiration/.

---

## 1. What changed from v1

v1 treated Neko's scroll-driven morphing as one contained "flagship moment" among several borrowed patterns. v2 promotes it to the site's **primary motion language**, because it now carries the core brand idea: Summonware *summons* a solution into being. The site should feel, throughout, like something is continuously materializing as you scroll — not just in one section.

Everything else from v1's reasoning (tone, what to avoid from Agentura, why not to copy any single site wholesale) still holds. This version replaces sections 2 (attribution), 3 (structural flow), and 4 (motion) to reflect that shift.

---

## 2. The tone decision (unchanged from v1)

**Chosen tone:** *Confident technical clarity with quiet momentum.* Summonware is the calm, competent partner who ships — not the flashiest booth at the trade show, not a cold enterprise PDF. What's new in v2 is *how* that confidence is shown: through a continuous, controlled materialization motif rather than static sections with one animated highlight.

---

## 3. What we're taking, from where, and why

**From Neko — scroll-scrubbed materialization as the site's spine**
Neko's core mechanic (device screen/visual state changes precisely as you scroll through numbered steps, pinned-then-released sections, blur-to-sharp reveals) becomes Summonware's dominant motion pattern, reskinned around **particles converging into resolved form** instead of a product UI powering on. Nearly every major section gets a materialization moment tied to its content: scattered fragments assembling into a service icon, a wireframe resolving into a finished interface, a case-study logo coalescing from light. This directly embodies "summon" as a literal, ownable brand mechanic — not just a section, but the throughline.

**From Cipher Digital — the grid as the summoning circle**
Cipher's reusable grid/line system is repurposed as the literal stage the materialization happens on: particles converge *onto* grid intersections, resolved shapes snap *into* grid cells. This keeps a Neko-density of motion from feeling chaotic — the grid is the disciplining structure underneath every summon, and it's the same buildable, scalable device from v1, just now with a job description that matches the brand concept instead of being generic decoration.

**From Wembi — numbered section rhythm**
The "N.001 / SECTION NAME" divider header still provides the page's structural backbone and future-content anchor (append N.007 for new sections). Kept as-is from v1 — it's motion-independent scaffolding and doesn't compete with the materialization language.

**From Cmblu — proof-strip pattern + hexagon-link CTA**
Kept as-is from v1 for the same reason: reusable, low-motion-cost components for credibility sections and recurring CTAs (case studies, blog posts) that will accumulate over time and shouldn't each need a bespoke animation.

**From Agentura — still explicitly not taken**
Corner-pinned micro-copy and monochrome fashion-editorial imagery remain out of scope.

---

## 4. Structural flow for Summonware's homepage

1. **Hero — the first summon.** Scattered particles (cyan light on dark violet-black) converge on scroll into the Summonware wordmark/mark, then resolve further into the headline. Sets the mechanic immediately, at low cost (one hero-scale sequence, not a full page of them yet).
2. **Trust strip** — logos fade in inside a gradient transition (Cmblu-style), deliberately *static* — a calm beat after the hero's motion, not more materialization. Contrast matters as much as repetition.
3. **Numbered section divider** ("N.01 — WHAT WE DO") — Wembi-style, introduces services.
4. **Services/capabilities grid** — each card's icon materializes from particles as it scrolls into view (small-scale reuse of the hero mechanic, cheap per-card), mixed-weight intro paragraph above (Cmblu-style), arrow-link CTA per card.
5. **Signature process section — the deepest summon.** Numbered steps (01–04), pinned on the grid (Cipher-style stage): step 1 is raw scattered fragments, step 4 is a fully resolved product UI screen. This is the site's longest, most elaborate sequence — the "wow" moment — everywhere else uses a lighter version of the same mechanic.
6. **Case studies / proof** — each case study's logo/thumbnail materializes into a grid cell (Cipher-style docking + Neko-style resolve), then grows to full-bleed on deeper scroll, stat callouts appear as resolved data in the same grid.
7. **Client testimonial** — plain, static, no materialization — another deliberate calm beat before the close.
8. **Closing CTA** — human, direct (name + role + button); the final resolve: a Summonware mark or CTA button itself materializes as the page's last gesture, bookending the hero.
9. **Footer** — standard, calm, static.

**Design discipline:** materialization sequences (1, 4, 5, 6, 8) are separated by deliberately static beats (2, 7) so the mechanic reads as a controlled signature, not visual noise. This alternation is the actual craft of v2 — the answer to "won't materialization everywhere get exhausting?"

---

## 5. Motion language for Summonware

- **Primary mechanic (new in v2):** particle-convergence materialization, scroll-scrubbed, staged on the recurring grid system. Used at three intensities: hero-scale (once), card-scale (light, repeated per service/case-study), and flagship-scale (once, in the process section).
- **Structural rhythm:** Wembi-style numbered dividers between sections, motion-independent.
- **Micro:** word-by-word text reveal reserved for 1–2 key statements only, so it doesn't compete with the particle mechanic for attention.
- **Deliberate static beats:** trust strip and testimonial sections carry no materialization — this contrast is what keeps the mechanic feeling premium rather than exhausting across a full page.
- **Explicitly avoided:** full-bleed blur-to-focus photographic hero, dashed radial "energy" motifs (Wembi's), marker-highlight text boxes, corner-pinned micro-copy, literal fantasy/rune iconography.

**Build-cost note for Fable 5 (low effort):** start with the hero and flagship process section fully built (2 real materialization sequences), and implement card/case-study materialization as a single reusable component with variable input (icon/logo/screen) rather than one-off animations — keeps this ambitious concept achievable in a low-effort build pass.

---

## 6. Open decisions before this becomes canonical

- **Color:** still open — violet/indigo primary + electric cyan accent recommended (see conversation), chosen specifically to differentiate from green-dominated Thai fintech/telco branding and to code as "AI-era tech." Confirmed reversible later via tokens, so not a blocker.
- **Imagery at the resolve point:** real product UI screenshots vs. generic workflow diagrams at the end of each materialization — depends on whether Summonware has real product screens ready to feature.
- **Particle system implementation:** whether Fable 5 builds this as canvas/WebGL particles or a simpler CSS/SVG approximation — a technical feasibility call to make before committing to the flagship section's exact fidelity.

**Decision:** proposed as v2 working direction — pending your review before it becomes the canonical brief.
