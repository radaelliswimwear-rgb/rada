/**
 * Animación de entrada del Product Card (Fase 02F). EXACT: réplica de
 * CatalogProductCard real (framer-motion whileInView -- fade + translateY,
 * viewport once: true, margin -40px). CSS solo no puede detectar "entró
 * al viewport" -- de ahí este IntersectionObserver mínimo, sin librería.
 *
 * Solo actúa sobre [data-animate-entry] (opt-in vía product-card.liquid
 * `animate_entry: true`) -- los carruseles de Home no lo usan (el
 * componente real de Home tampoco tiene esta animación).
 */
function initProductCardEntryAnimation() {
  const cards = document.querySelectorAll("[data-animate-entry]");
  if (!cards.length) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!("IntersectionObserver" in window) || prefersReducedMotion) {
    cards.forEach((card) => card.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -40px 0px", threshold: 0.01 },
  );

  cards.forEach((card) => observer.observe(card));
}

initProductCardEntryAnimation();
