# Content Placeholders — Review & Replace
**Status:** DRAFT PLACEHOLDER — every value marked PLACEHOLDER must be replaced with real content before launch.
**Backs:** the /data/*.json files that feed the site's components (see DESIGN_SYSTEM.md section 7 and NARRATIVE_FLOW.md).

This is the single place to review and edit content in plain language. Once you approve wording here, mirror the changes into the corresponding JSON file — or just tell a future session "update services.json per CONTENT_PLACEHOLDERS.md" and it will do the sync.

---

## Services (`data/services.json`) — Act 2: Formation

5 placeholder categories, generated to plausibly fit "software house serving all business needs, AI-forward":

1. **Custom Software** — Turn manual workflows into working software
2. **AI Integration** — Put AI to work inside your existing operations
3. **Product Design & Build** — From idea to shipped product
4. **Systems & Automation** — Remove the manual work between your tools
5. **Technology Consulting** — A technical partner before you write a line of code

**Replace with:** your actual service lineup. If you only offer 3, or a completely different 5, just tell me the list and I'll regenerate this file and its descriptions.

---

## Process (`data/process.json`) — Act 3: Resolution (flagship section)

Generic 4-step placeholder, written verb-led per NARRATIVE_FLOW.md guidance:

1. **We map the problem** — discovery/understanding phase
2. **We design the shape** — planning/architecture phase
3. **We build it for real** — engineering phase, visible progress
4. **We ship and stay on** — launch + ongoing support

**Replace with:** your actual process. Even if you don't have a formalized process yet, this is worth defining for real — it's the flagship animated section, so vague placeholder steps will be the most visible weak point on the page if left unedited.

---

## Projects (`data/projects.json`) — Act 4: Proof

3 placeholder case studies, structured as problem → solution → outcome per NARRATIVE_FLOW.md's copy direction. All client names, industries, and outcomes are fake.

**Replace with:** real past projects. If you don't have client permission to name them publicly yet, we can genericize (e.g. "A logistics company in Bangkok") rather than inventing fake specifics — flag this if it applies.

---

## Stats — dropped for now

`data/stats.json` has been removed. As a starting company, Summonware has no track record yet to make a stats section (Projects Delivered, Years Active, etc.) credible — zeroed-out or invented numbers would undercut trust more than help it. `StatCallout` stays defined in DESIGN_SYSTEM.md as a deferred component; reintroduce this section once there are real, honestly-claimable numbers. See NARRATIVE_FLOW.md section 6.

---

## Testimonial (`data/testimonial.json`) — Act 4: Proof

One placeholder quote demonstrating the "specific claim, not generic praise" copy direction from NARRATIVE_FLOW.md.

**Replace with:** a real client quote. If none exist yet, better to omit this section entirely on first launch than publish a fabricated quote — flag this if you don't have one ready.

---

## Closing CTA (`data/cta.json`) — Act 5: Invitation

Placeholder person, headline ties back to the "summon" metaphor per NARRATIVE_FLOW.md Act 5 guidance ("Tell us what you need built" / "Start the conversation").

**Replace with:** the actual named person who should be the face of inbound inquiries (founder, creative lead, biz dev — whoever fits), their real photo, and a real contact email/response-time expectation.

---

## How to update

- Small text edits: edit the JSON files directly in `/data/`, or describe the change in chat and I'll do it.
- Structural changes (adding a 6th service, more than 3 projects): safe to do — the components in DESIGN_SYSTEM.md section 7 are built to handle N items, not a fixed count.
- Once all PLACEHOLDER strings are gone, update this file's status line to `FINAL` so future sessions know the content is launch-ready.
