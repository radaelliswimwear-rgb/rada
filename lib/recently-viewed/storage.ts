// Historial de "vistos recientemente" (Sprint 17) — 100% client-side
// (localStorage), sin modelo en Postgres ni cuenta de usuario: es un
// historial de navegador, no de cuenta, mismo espíritu que el carrito de
// invitado antes del Sprint 12 (localStorage puro). No hace falta más para
// esta funcionalidad — no se lista en ningún lado del panel administrativo
// ni se sincroniza entre dispositivos.
const STORAGE_KEY = "lago-recently-viewed:v1";
const MAX_ITEMS = 12;

export type RecentlyViewedItem = {
  slug: string;
  name: string;
  image: string;
  price: string;
  category: string;
};

function read(): RecentlyViewedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: RecentlyViewedItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function recordView(item: RecentlyViewedItem): void {
  const current = read().filter((existing) => existing.slug !== item.slug);
  const next = [item, ...current].slice(0, MAX_ITEMS);
  write(next);
}

export function listRecentlyViewed(excludeSlug?: string): RecentlyViewedItem[] {
  return read().filter((item) => item.slug !== excludeSlug);
}
