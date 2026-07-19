// Path-based routing helpers shared by main.ts, work.ts, and the projects
// carousel — mirrors i18n.ts's locale-prefix detection so /work/:slug and
// /th/work/:slug both resolve correctly. No client-side pushState: work
// pages are real navigations (full reload), matching how the existing
// lang-switch already works and avoiding teardown of three separate
// long-lived WebGL scenes on route change.
function isTh(): boolean {
  return location.pathname.startsWith("/th");
}

export function getWorkSlug(): string | null {
  const path = isTh() ? location.pathname.replace(/^\/th/, "") : location.pathname;
  const m = path.match(/^\/work\/([a-z0-9-]+)\/?$/);
  return m ? m[1] : null;
}

export function workHref(slug: string): string {
  return isTh() ? `/th/work/${slug}` : `/work/${slug}`;
}

export function homeHref(): string {
  return isTh() ? "/th/" : "/";
}
