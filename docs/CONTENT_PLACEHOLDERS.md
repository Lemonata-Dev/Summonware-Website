# Content Placeholders — Review & Replace
**Status:** FINAL for launch-as-simple. The site intentionally ships without testimonials or a stats section (no track record yet — confirmed with the founder rather than inventing numbers or quotes).
**Backs:** copy actually lives inline in `site/src/i18n/en.json` / `th.json` (not separate `/data/*.json` files per section — only `site/src/data/projects.json` is a standalone data file, holding structural fields like slug/photo/hue).

This file used to describe an earlier planned architecture (separate `services.json`, `testimonial.json`, `cta.json`, React `.tsx` sections). The actual build is a vanilla-TS/Vite SPA and doesn't use that structure — this doc now reflects what's really there.

---

## Services — inline in `i18n/{en,th}.json`

Copy is specific scenario-based content (customer data unification, document/OCR ingestion, security hardening, Microsoft-stack integration, IoT fleet visibility, attack simulation) rather than generic category placeholders — already past the "vague 5-category placeholder" stage.

---

## Process (flagship pinned-scroll section) — `services.steps` in `i18n/{en,th}.json`

Confirm the step copy still matches your actual delivery process before calling this final; it's the flagship animated section (`.feature-stage-wrap` in `index.html` + `initFeatureStage()` in `main.ts`) so it's the most visible section on the page.

---

## Projects — `site/src/data/projects.json` (structure) + `work.items`/`work.detail` in `i18n/{en,th}.json` (copy)

8 case studies, all genericized by capability/scenario (e.g. `ecommerce-customer-data-platform`, `ocr-ingestion-auto-action`) rather than named clients or invented outcomes — this is deliberate since Summonware has no public-reference clients yet. Keep this pattern (capability-first, no fake specifics) until real, name-permissioned case studies exist.

---

## Stats — dropped, by design

No stats section exists (Projects Delivered, Years Active, etc.). As a new company, invented or zeroed-out numbers would undercut trust more than help it. Reintroduce only once real, honestly-claimable numbers exist — see `NARRATIVE_FLOW.md` section 6.

---

## Testimonial — omitted, by design

No testimonial section is wired into the site (confirmed: no client quotes exist yet). Add one later via a new section once a real quote is available — don't fabricate one to fill the slot.

---

## Closing CTA / contact — `start` block in `i18n/{en,th}.json` + `#start-form` in `index.html`

Plain contact form ("Work email" + message), no invented spokesperson or fabricated photo. This is the simple, honest version — keep it this way unless there's a real named point of contact to attach to it.

---

## How to update

- Copy edits: edit `site/src/i18n/en.json` and `th.json` directly (keep both in sync), or describe the change in chat.
- New project/case study: see `docs/CONTENT_MAP.md` section 3 for the 3-file pattern (`projects.json` + both i18n files).
