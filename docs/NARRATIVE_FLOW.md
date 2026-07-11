# Narrative Flow — Summonware
**Status:** CANONICAL — the story arc that fills the structural sections defined in INSPIRATION_BRIEF.md
**Purpose:** INSPIRATION_BRIEF.md answers "what does each section look like." This document answers "what is each section *saying*, and why does it come next." Every future copywriting pass (Fable 5 or human) should read this before writing headlines.

---

## 1. The narrative spine

A visitor should leave the homepage with one sentence in their head: **"Summonware turns whatever a business needs into working software — and they make that process visible, not mysterious."**

The "summon" concept only earns its keep if the *story*, not just the animation, follows a journey shape: **invocation → formation → resolution → proof → invitation.** Each reference site taught us a piece of this arc:

- **Neko** proved a step-by-step "watch it become real" narrative works when the payoff visual is honest (a real device, not a mockup of a mockup).
- **Wembi** proved numbered, systemic pacing (N.01, N.02...) makes even abstract technical claims feel structured and trustworthy.
- **Cmblu** proved you can open with a bold identity claim, then immediately ground it in who it's for (utilities/data centers/commercial) — abstraction followed fast by concreteness.
- **Cipher** proved restraint and hard numbers (MW, GW) build institutional trust faster than adjectives — Summonware's equivalent is projects shipped, industries served, response time, etc.
- **Agentura** proved a personal, human close (a name and a face) converts better than a faceless contact form — kept for our closing CTA even though we rejected its visual language.

None of the 5 sites tell *our* story on their own — this document is the synthesis into a single Summonware-specific arc.

---

## 2. The five-act structure

### Act 1 — Invocation (Hero)
**Narrative job:** name the gap. A business has a need — a process that doesn't scale, a workflow trapped in spreadsheets, an idea with no engineering team to build it. Summonware exists to close that gap, on demand.
**Emotional note:** confident, not mysterious. This is a company that *builds*, not a magic trick.
**Structural pairing:** Hero section, `materializeHero`.
**Copy direction (not final):** headline states the outcome, not the metaphor — e.g. "We build the software your business is missing" rather than a purely poetic "we summon." The word "summon" should live in the *brand name and motion*, not be over-explained in copy. Subhead grounds it: what kinds of businesses, what kinds of solutions, that Summonware is AI-forward/modern-stack.
**What to avoid:** don't open with abstraction-for-its-own-sake (Wembi's "Il Gemello Digitale di ogni cosa" works in Italian editorial register, not here) — Summonware's hero should be legible to a non-technical founder within 3 seconds.

### Act 2 — Formation (What we do / Services)
**Narrative job:** show the range without diluting focus. This is where "fits all business needs" gets proven, not just claimed — via a small number of clearly differentiated service categories (e.g. custom software, AI integration, product design/build, systems/automation — finalize actual list separately).
**Emotional note:** organized, systemic — this is Wembi's numbered-rhythm contribution doing narrative work, not just visual work: N.01, N.02, N.03 makes "we do a lot" feel structured instead of scattered.
**Structural pairing:** Numbered section divider + Services grid, `materializeCard` per service.
**Copy direction:** each service card leads with the business outcome, not the technology — "Turn manual workflows into software" beats "Custom backend development." Keep descriptions to one sentence; depth belongs on service detail pages, not the homepage card.

### Act 3 — Resolution (How we build / Process — the flagship section)
**Narrative job:** this is the emotional peak, matching the flagship `materializeFlagship` motion sequence. The story beat is literally "watch the summon happen" — an idea (scattered, chaotic) becomes a shipped product (resolved, structured) in four visible steps.
**Emotional note:** the "wow" moment — but earn it with real process substance, not just visual spectacle. Neko's mistake-to-avoid: don't let the animation outrun the content. Each of the 4 steps needs a genuinely distinct, true claim about how Summonware actually works (e.g. Discover → Design → Build → Ship, or whatever your real process is).
**Structural pairing:** Signature process section.
**Copy direction:** step labels short and verb-led (not noun-led) — "We map the problem" beats "Discovery Phase." This is the one section where the metaphor ("summon") can surface explicitly once, since the visual is doing the heavy lifting — e.g. a section eyebrow like "N.03 — THE SUMMON" is earned here in a way it wouldn't be in the hero.

### Act 4 — Proof (Projects / Case studies)
**Narrative job:** the resolved outcome needs receipts. Cipher's contribution was hard numbers over adjectives — but that device only works once there's a track record. **As a starting company, Summonware skips `StatCallout` entirely for now**: fabricated or zeroed-out metrics ("00+ Projects Delivered") read as new-and-unproven rather than confident, which undercuts this section's job. Proof instead comes from project cards (problem → solution → outcome) and, once available, a real testimonial — substance over stats. Revisit adding `StatCallout` once there's a real track record worth quoting (see section 6).
**Emotional note:** matter-of-fact confidence, the calmest section on the page (deliberate static beat per the motion budget) — after the intensity of Act 3, this is where the visitor's guard comes down because nothing is being sold to them, just shown.
**Structural pairing:** Case studies grid, testimonial (if available).
**Copy direction:** project cards state the client's problem → what Summonware built → the outcome, in that order, one line each. Testimonial should be a specific claim, not generic praise ("They shipped in six weeks what our last vendor quoted eight months for" beats "Great team to work with") — omit the testimonial block entirely if no real quote exists yet, rather than inventing one.

### Act 5 — Invitation (Closing CTA)
**Narrative job:** close the loop opened in Act 1 — the gap named in the hero now has an obvious next step. This is Agentura's contribution: make it personal. A name, a role, a direct line — not a faceless "Contact Us" form.
**Emotional note:** warm, direct, low-friction. The visitor should feel like reaching out is talking to a person who already understands what they do, not submitting a ticket.
**Structural pairing:** Closing CTA section, final `materializeCard`-scale resolve on the button/mark itself, bookending the hero.
**Copy direction:** frame the CTA as starting the next summon — e.g. "Tell us what you need built" — rather than a generic "Get in touch," to close the metaphor loop without needing to re-explain it.

---

## 3. Why this ordering, specifically

The arc deliberately alternates **intensity** to match the motion budget already set in DESIGN_SYSTEM.md:

| Act | Motion intensity | Narrative pace |
|---|---|---|
| 1. Invocation | High (materializeHero) | Fast — state the gap immediately |
| 2. Formation | Medium (materializeCard × N) | Structured, scannable |
| 3. Resolution | Highest (materializeFlagship) | Slow, deliberate — the payoff |
| 4. Proof | Low (static beat) | Calm, factual — let the visitor exhale |
| 5. Invitation | Medium (single resolve) | Warm, short, closes the loop |

This mirrors how Cipher paced its own page (restraint → restraint → one bigger reveal → restraint) more than Neko's approach (constant high intensity throughout) — because Summonware's audience is business decision-makers evaluating a vendor, not consumers being sold a gadget. Constant spectacle would undercut credibility; the alternation is what makes the one big moment (Act 3) land.

---

## 4. What NOT to do (lessons from the audit, applied to copy)

- Don't over-explain the "summon" metaphor in text — let the name + the motion carry it. Explicit metaphor language should appear at most once (Act 3 eyebrow).
- Don't lead with company philosophy/manifesto language (Wembi's register) before establishing what Summonware concretely does — abstraction needs to follow concreteness, not precede it, for a B2B software buyer.
- Don't let every section carry equal motion weight — the proof section's power comes specifically from being the calmest section on the page.
- Don't use a generic contact form as the final beat — the personal-close pattern is non-negotiable per this narrative.

---

## 5. Next step

This document assumes a real services list and real process steps exist or will be defined. Before copywriting begins in earnest (Fable 5 session or otherwise), you'll want a short input doc answering:
1. What are Summonware's actual 3–5 service categories?
2. What are the actual 4 steps in your build process?
3. Any early/past projects (even pre-Summonware or personal work that fits the brand) usable as case studies?
4. Who is the named person for the closing CTA?

Once those are answered, this narrative arc becomes the outline a copywriter (human or AI) fills in — the structure and pacing decisions here don't change based on those answers, only the words do.

## 6. Adding stats later

`StatCallout` (Cipher-derived) stays in DESIGN_SYSTEM.md's component list but is **not used on first launch** — there's no track record yet to make it credible. Reintroduce it in Act 4 once Summonware has real, honestly-claimable numbers (projects shipped, years active, client count, etc.). Until then, Act 4 relies on project cards and testimonial (if available) alone.
