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

// True only for the actual homepage path ("/" or "/th/", with or without
// a trailing slash) — used to tell a real route apart from a typo'd or
// dead link, since Azure's SPA navigationFallback serves index.html for
// literally any unmatched path and main.ts otherwise has no way to know
// the URL didn't match anything.
export function isHomePath(): boolean {
  const path = isTh() ? location.pathname.replace(/^\/th/, "") : location.pathname;
  return path === "" || path === "/";
}

export function workHref(slug: string): string {
  return isTh() ? `/th/work/${slug}` : `/work/${slug}`;
}

export function homeHref(): string {
  return isTh() ? "/th/" : "/";
}
