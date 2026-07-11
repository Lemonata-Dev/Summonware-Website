# Website Build Pipeline — Reusable Template
**Purpose:** the repeatable process for building any client/project website from scratch, using the Summonware site as the reference implementation. Copy this file into a new project's `/docs/` folder and work through the phases in order.

Each phase has a clear deliverable — don't move to the next phase until the current one's deliverable exists as a real file, not just a decision made in chat (decisions that only live in conversation get lost when a session ends).

---

## Phase 0 — Discovery
**Deliverable:** a short brief (can live in chat or a `DISCOVERY.md`) answering:
- What does the business do, and who is it for?
- What should a visitor believe/feel/do after visiting the site?
- Any hard constraints (existing brand assets, must-launch date, must-avoid competitor look)?
- Starting-company or established? (Affects whether stats/social-proof sections are usable — see Summonware's own NARRATIVE_FLOW.md section 6 for why this matters.)

---

## Phase 1 — Reference assessment
**Deliverable:** one structural brief per reference site, saved individually (don't skip straight to a blend).

Process:
1. Collect 3–5 reference URLs from the client/stakeholder — one at a time, not batched.
2. For each: open in the browser tool, capture desktop + mobile screenshots, extract page text, scroll through fully.
3. Write a structural brief per site covering: navigation pattern, section-by-section flow, signature motion/interaction device, type/color hierarchy, what makes it distinctive vs. the others.
4. Explicitly separate **structure** (layout, pacing, hierarchy) from **surface** (exact colors, exact fonts, exact imagery) in every brief — this separation is what prevents the final build from reading as a copy.

**Model guidance:** use a strong vision + reasoning model for this phase (not the low-effort build model) — it needs to look at screenshots and reason about layout, not just generate code.

---

## Phase 2 — Inspiration synthesis
**Deliverable:** `INSPIRATION_BRIEF.md` — a single document that names, for each pattern taken, which reference site it came from and *why* it fits this specific brand (not just "it looked good"). Explicitly note what was deliberately left out and why.

Process:
1. Do NOT default to "closest matching site." Assess tone fit against the Phase 0 discovery brief first.
2. Attribute every borrowed pattern to its source site with reasoning — this is what makes the result a deliberate synthesis instead of an accidental copy.
3. If genuinely unsure between two directions, write both as numbered versions (`INSPIRATION_BRIEF_v1.md`, `v2.md`, in a `/docs/inspiration/` archive folder) before picking one as canonical — cheap to compare, expensive to redo after build starts.
4. Once approved, copy the winning version to `docs/INSPIRATION_BRIEF.md` and mark its status `CANONICAL`.

---

## Phase 3 — Narrative & content strategy
**Deliverable:** `NARRATIVE_FLOW.md` — maps each structural section to its narrative job (what it says and why it comes next), independent of final copy.

Process:
1. Define the emotional/story arc the visitor should move through (Summonware used a 5-act invocation→formation→resolution→proof→invitation structure — a different business may need a different arc, don't force-fit this one).
2. For each section: narrative job, emotional note, which reference pattern it pairs with, copy direction (not final copy).
3. Explicitly note what NOT to do — lessons from Phase 1's audit applied to copy/pacing, not just visuals.
4. Flag what real inputs are still needed before copywriting can be final (real services list, real numbers, real people) — don't let placeholder content silently become permanent.

---

## Phase 4 — Design tokens
**Deliverable:** `DESIGN_SYSTEM.md` + (once build starts) `src/styles/tokens.css`.

Process:
1. Color: pick one primary + one accent, justified against the competitive landscape (what do competitors/adjacent brands already use — differentiate deliberately, don't default to industry-generic colors).
2. Type scale, spacing scale (single base unit, e.g. 8px), breakpoints.
3. Motion: name every animation as a reusable preset in a table (name, behavior, used-for) — never leave "animation" as a vague concept. Set an explicit intensity budget (e.g. "one hero-scale sequence, one flagship sequence per page") so build doesn't sprawl into inconsistent motion everywhere.
4. Responsive rules as an explicit per-breakpoint table (grid columns, section padding, what reflows vs. simplifies) — this is the step most pipelines skip and the one that causes the worst tablet/mobile chaos later.
5. Component reference list — the reusable building blocks every section composes from. New content types should reuse these before inventing new components.

---

## Phase 5 — Content structure & placeholders
**Deliverable:** `CONTENT_MAP.md` (literal page→section→file lookup table) + `/data/*.json` placeholder files + a plain-language review doc (e.g. `CONTENT_PLACEHOLDERS.md`).

Process:
1. `CONTENT_MAP.md`: one row per homepage section (order, narrative act, components used, data source, intended file path) + a "how to add new content" cheat-sheet for the common cases (new service, new project, new page).
2. Generate realistic placeholder content matching the narrative direction from Phase 3 — enough that the site is reviewable/demoable, but every fabricated value clearly marked `PLACEHOLDER`.
3. **Do not invent trust-damaging placeholders** (fake stats, fake testimonials, fake client names) even marked as placeholder — omit those sections entirely if real data doesn't exist yet, per the Phase 0 starting-company check. A missing section is safer than a fabricated-looking one.
4. List explicitly, in the review doc, what real inputs are still needed to finalize each placeholder.

---

## Phase 6 — Entry point
**Deliverable:** root `CLAUDE.md` (or equivalent) that tells any future session, in one short paragraph, which docs to read before touching content or code, and in what order.

---

## Phase 7 — Build (Fable 5 / builder model)
**Process:**
1. Start a **new session** for the build — don't reuse the research/planning conversation. The whole point of Phases 1–6 is that the docs are self-contained; a fresh session reading them has everything needed without inheriting research context it doesn't need.
2. Hand the builder session: `CLAUDE.md`, `INSPIRATION_BRIEF.md`, `DESIGN_SYSTEM.md`, `CONTENT_MAP.md`, `NARRATIVE_FLOW.md`, and the `/data/` folder.
3. Build components first (per DESIGN_SYSTEM.md's component reference), then compose pages — not the reverse.
4. Verify responsive behavior against Phase 4's breakpoint table specifically, not just "does it look okay on mobile."

---

## Phase 8 — Handoff & iteration
**Deliverable:** updated docs reflecting anything that changed during build (a component got renamed, a section got reordered, a token value changed) — the docs must stay accurate or they stop being trustworthy for the next session.

**Ongoing rule:** every future content addition should be traceable through `CONTENT_MAP.md` first. Every future visual change should touch `DESIGN_SYSTEM.md` tokens, not component-level hardcoded values. If either doc goes stale, fix it in the same session that caused the drift — don't defer.

---

## Quick-reference: phase → deliverable

| Phase | Deliverable |
|---|---|
| 0. Discovery | Brief (chat or `DISCOVERY.md`) |
| 1. Reference assessment | One structural brief per reference site |
| 2. Inspiration synthesis | `INSPIRATION_BRIEF.md` (+ versioned archive) |
| 3. Narrative & content strategy | `NARRATIVE_FLOW.md` |
| 4. Design tokens | `DESIGN_SYSTEM.md` |
| 5. Content structure & placeholders | `CONTENT_MAP.md` + `/data/*.json` + review doc |
| 6. Entry point | `CLAUDE.md` |
| 7. Build | Working site, new session, builder model |
| 8. Handoff & iteration | Docs kept in sync with actual build |
