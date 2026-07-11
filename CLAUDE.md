# Summonware — Project Entry Point

Summonware is a software house building custom solutions and products across business needs, AI-forward, modern tech stack. This file is the required first read for any session touching this project — human or AI, any model.

## Read these before doing anything else

1. **`docs/INSPIRATION_BRIEF.md`** — the visual/structural direction and why it was chosen (synthesized from 5 audited reference sites, not copied from any one).
2. **`docs/DESIGN_SYSTEM.md`** — color, type, spacing, motion, and responsive tokens. **Never hardcode a visual value in code — reference these tokens.**
3. **`docs/NARRATIVE_FLOW.md`** — what each section says and why it's ordered that way. Read before writing any copy.
4. **`docs/CONTENT_MAP.md`** — the literal lookup table for where content lives and how to add more. **Read before adding or editing any content** — don't guess a file location.

## Working rules

- **Adding content** (new service, new project, new page): start at `docs/CONTENT_MAP.md` — it has a "how to add new content" cheat-sheet for the common cases.
- **Changing visuals** (color, spacing, animation): edit only the tokens in `docs/DESIGN_SYSTEM.md` / `src/styles/tokens.css` — never hardcode a value inline in a component.
- **Current content status**: see `docs/CONTENT_PLACEHOLDERS.md` — many values are still marked `PLACEHOLDER` and need real input before launch. Check this before treating any homepage copy as final.
- **No stats section yet, deliberately** — see `docs/NARRATIVE_FLOW.md` section 6. Don't add fabricated numbers; reintroduce this section only once real numbers exist.
- **Motion has a hard budget**: one hero-scale and one flagship-scale materialization sequence per page (see `DESIGN_SYSTEM.md` section 5). Don't add a second flagship-scale sequence without updating `INSPIRATION_BRIEF.md` first.

## Reusable process

`docs/PIPELINE.md` documents the full reusable process this project followed (discovery → reference assessment → inspiration synthesis → narrative → design tokens → content structure → build). Copy it into any new project for the same repeatable workflow.

## Project structure (intended — created as the site is scaffolded)

```
/docs                  — all planning/reference docs (read-first)
  /inspiration          — versioned inspiration brief history (archive, not canonical)
/data                  — content as JSON, consumed by components (services, projects, process, etc.)
/src
  /pages                — route-level pages
  /sections/home         — homepage sections, one file per CONTENT_MAP.md row
  /components            — shared reusable components (SectionDivider, ServiceCard, etc.)
  /styles/tokens.css      — design tokens, single source of truth for visual values
  /lib/motion.ts          — named animation presets, single source of truth for motion
```
