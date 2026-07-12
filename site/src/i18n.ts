// Language layer: path-based locale (/ = en, /th/ = th), the current
// standard for multi-language sites — real, indexable URLs per language
// rather than a JS-only text swap. Detection order: URL path > saved
// explicit choice > browser language (suggestion only, never forces a
// redirect away from a URL the user is already on).
import en from "./i18n/en.json";
import th from "./i18n/th.json";

export type Locale = "en" | "th";
type Dict = Record<string, unknown>;
const DICTS: Record<Locale, Dict> = { en, th };
const STORAGE_KEY = "sw_lang";

function get(dict: Dict, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Dict)[k] : undefined), dict);
}

function detectLocale(): Locale {
  if (location.pathname.startsWith("/th")) return "th";
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "th" || stored === "en") return stored;
  return navigator.language?.toLowerCase().startsWith("th") ? "th" : "en";
}

function applyLocale(locale: Locale) {
  document.documentElement.lang = locale;
  const dict = DICTS[locale];

  document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
    const val = get(dict, el.dataset.i18n!);
    if (typeof val === "string") el.textContent = val;
  });
  document.querySelectorAll<HTMLElement>("[data-i18n-html]").forEach((el) => {
    const val = get(dict, el.dataset.i18nHtml!);
    if (typeof val === "string") el.innerHTML = val;
  });
  document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>("[data-i18n-placeholder]").forEach((el) => {
    const val = get(dict, el.dataset.i18nPlaceholder!);
    if (typeof val === "string") el.placeholder = val;
  });
  document.querySelectorAll<HTMLElement>("[data-i18n-words]").forEach((el) => {
    const val = get(dict, el.dataset.i18nWords!);
    if (Array.isArray(val)) el.setAttribute("data-words", JSON.stringify(val));
  });

  const title = get(dict, "meta.title");
  if (typeof title === "string") document.title = title;
  const desc = get(dict, "meta.description");
  const metaDesc = document.querySelector('meta[name="description"]');
  if (typeof desc === "string" && metaDesc) metaDesc.setAttribute("content", desc);

  document.querySelectorAll<HTMLElement>("[data-lang-switch]").forEach((a) => {
    a.classList.toggle("is-active", a.dataset.langSwitch === locale);
  });
}

let currentLocale: Locale = "en";

/** current locale's dictionary — used by JS-rendered content (e.g. the
    feature-stage steps, which re-render their own text on interaction
    and can't rely on the one-time [data-i18n] DOM pass) */
export function getDict(): Dict {
  return DICTS[currentLocale];
}
export function getLocale(): Locale {
  return currentLocale;
}
export function t(path: string): unknown {
  return get(DICTS[currentLocale], path);
}

export function initI18n() {
  const locale = detectLocale();
  currentLocale = locale;
  applyLocale(locale);

  document.querySelectorAll<HTMLAnchorElement>("[data-lang-switch]").forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = a.dataset.langSwitch as Locale;
      if (target === locale) { e.preventDefault(); return; }
      e.preventDefault();
      localStorage.setItem(STORAGE_KEY, target);
      location.href = target === "th" ? "/th/" : "/";
    });
  });
}
