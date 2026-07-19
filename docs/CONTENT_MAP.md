# Content Map — Summonware
**Status:** CANONICAL — the literal lookup table for "where does new content go."
**Rule for any session (human or AI):** before adding or editing content, find the right row here first. Don't guess a file location.

This describes the *intended* build structure (src/ doesn't exist yet — created when Fable 5 scaffolds the actual site). Once built, keep this table in sync with real file paths; if a path changes during build, update this file in the same session.

---

## 1. Pages

| Page | Route | Section source | Notes |
|---|---|---|---|
| Home | `/` | See section 2 below | Single long-scroll page per NARRATIVE_FLOW.md's 5-act structure |
| Work detail | `/work/:slug` (`/th/work/:slug`) | `site/src/data/projects.json` (structure) + `site/src/i18n/{en,th}.json` `work.items`/`work.detail` (all copy) | Shipped. Client-side route inside the same SPA (`site/src/work.ts`), not a separate framework page — `#home-view`/`#work-view` toggle in `index.html`, decided in `main.ts` from the URL path. One shared template for every product: intro → 4 features → CTA, plus a side product-directory drawer and edge-hover prev/next navigation. Add a new product by adding one entry to `projects.json` (with a unique `slug`) and matching `work.items`/`work.detail` entries in **both** `en.json` and `th.json`. |
| Service detail (future) | `/services/[id]` | `data/services.json` | Not in v1 scope — same pattern as Work detail above could be reused if this is wanted later |

---

## 2. Homepage sections (in scroll order)

Matches NARRATIVE_FLOW.md's Act structure and INSPIRATION_BRIEF.md's structural flow exactly — this table is the implementation-level mirror of both.

| Order | Section | Narrative Act | Component(s) used | Data source | File (intended) |
|---|---|---|---|---|---|
| 1 | Hero | Act 1 — Invocation | `GridStage` + `materializeHero` | Hardcoded headline/subhead (not data-driven — copy is fixed, not a list) | `src/sections/home/Hero.tsx` |
| 2 | Trust strip | (transition beat) | Logo row, `fadeUp` | `data/trust-logos.json` (not yet created — add when client logos are approved for public display) | `src/sections/home/TrustStrip.tsx` |
| 3 | Services | Act 2 — Formation | `SectionDivider` + `ServiceCard` × N | `data/services.json` | `src/sections/home/Services.tsx` |
| 4 | Process (flagship) | Act 3 — Resolution | `SectionDivider` + `materializeFlagship` | `data/process.json` | `src/sections/home/Process.tsx` |
| 5 | Projects | Act 4 — Proof | `SectionDivider` + `ProjectCard` × N | `data/projects.json` | `src/sections/home/Projects.tsx` |
| 6 | Testimonial | Act 4 — Proof (cont.) | `TestimonialBlock` | `data/testimonial.json` — **omit this section entirely if this file doesn't exist or is still placeholder** | `src/sections/home/Testimonial.tsx` |
| 7 | Closing CTA | Act 5 — Invitation | `materializeCard` (resolve on button/mark) | `data/cta.json` | `src/sections/home/ClosingCTA.tsx` |
| 8 | Footer | (structural, not narrative) | Standard footer | Hardcoded nav/legal links | `src/components/Footer.tsx` |

**Stats section is intentionally absent** — see NARRATIVE_FLOW.md section 6. When reintroduced later, it inserts between Projects and Testimonial as its own row here.

---

## 3. How to add new content (the common cases)

**"Add a new service"**
→ Add an object to `data/services.json`. `ServiceCard` renders N items automatically — no component change needed. Follow the existing object shape (id, code, title, headline, description, icon).

**"Add a new project / case study"**
→ Three files, all required: 1) add `{slug, year, hue, kind, photo, photoCredit}` to `site/src/data/projects.json` (`kind` selects a carousel-card skeleton illustration in `projects3d.ts` and a 3D glyph shape in `workGlyph3d.ts` — reuse an existing one or add a new `case` to both). 2) add a `work.items.<slug>` entry (name/type/blurb/tags) to **both** `site/src/i18n/en.json` and `th.json`. 3) add a matching `work.detail.<slug>` entry (intro, 4 `features`, `ctaHeadingHtml`, `ctaBody`) to both language files, same shape as the existing 8. The carousel and the `/work/:slug` detail page are both driven off this same data — nothing else to wire up.

**"Add a new homepage section entirely"** (e.g. a future "Team" section)
→ 1) Add a row to the table in section 2 above with its Act/narrative purpose. 2) Reuse existing components from DESIGN_SYSTEM.md section 7 before inventing a new one. 3) Create the data file in `/data/` if the content is list-like. 4) Add the section file under `src/sections/home/`.

**"Add a whole new page"** (e.g. a dedicated About page)
→ 1) Add a row to the Pages table in section 1. 2) Decide its own section flow using the same Act-based narrative logic as NARRATIVE_FLOW.md, don't just copy the homepage. 3) Create `src/pages/[name].tsx` (or route-equivalent for whatever framework Fable 5 uses).

**"Reactivate the stats section"**
→ Create `data/stats.json` (deleted earlier — see NARRATIVE_FLOW.md section 6 for the shape it had), add a row back into section 2's table between Projects and Testimonial, use the already-defined but currently unused `StatCallout` component.

---

## 4. What's governed by which doc (avoid duplicating rules)

- **Visual look** (color, type, spacing, motion presets, breakpoints): `DESIGN_SYSTEM.md` — never redefine a token or animation inline in a component.
- **What each section says and why it's ordered that way**: `NARRATIVE_FLOW.md` — consult before writing new copy.
- **Why the overall visual direction was chosen**: `INSPIRATION_BRIEF.md` — reference, don't re-litigate, unless a new version is deliberately proposed (see `docs/inspiration/` for version history).
- **Where a specific piece of content lives**: this file.

If a future session is unsure where something belongs, the read order is: `CLAUDE.md` → this file → the relevant doc above.
