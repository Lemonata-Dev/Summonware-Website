// Shared "start something like this" action: pre-fills the proposal
// form's idea field and scrolls to it. Used both same-page (the carousel's
// inline project detail, a plain click — see projects3d.ts) and cross-page
// (the /work/:slug CTA navigates home with a ?usecase= query param that
// main.ts reads on load and forwards here — see routes.ts's homeHref()).
export function fillStartIdea(label: string) {
  const idea = document.querySelector<HTMLTextAreaElement>('#start-form textarea[name="idea"]');
  if (!idea) return;
  idea.value = `${label} — `;
  document.getElementById("start")?.scrollIntoView({ behavior: "smooth", block: "start" });
  idea.focus();
  idea.setSelectionRange(idea.value.length, idea.value.length);
}
