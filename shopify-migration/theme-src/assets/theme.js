/**
 * Radaelli Swimwear -- Shopify theme foundation JS.
 *
 * Fase 02A (skeleton): NO implementa ninguna de las 8 interacciones
 * documentadas en shopify-migration/theme/interaction-map.md todavía --
 * solo deja el patrón base de Custom Element que las fases posteriores
 * (02F en adelante) van a extender. Vanilla JS puro, sin dependencias --
 * consistente con la decisión de no llevar framer-motion/React al theme.
 *
 * Carga como <script type="module" defer>, ver layout/theme.liquid.
 */

/**
 * Clase base para los Custom Elements del theme. Cada interacción futura
 * (product-gallery, product-lightbox, cart-drawer, etc. -- ver
 * theme-file-map.md) extiende esto en vez de definir su propio patrón de
 * ciclo de vida desde cero.
 */
class RadaelliElement extends HTMLElement {
  connectedCallback() {
    this.onConnect?.();
  }

  disconnectedCallback() {
    this.onDisconnect?.();
  }
}

/**
 * Registra un Custom Element solo si el navegador no lo conoce todavía --
 * evita errores de "already defined" si theme.js se re-ejecuta (ej. tras
 * una navegación con prefetch de Shopify).
 */
function defineRadaelliElement(tagName, ElementClass) {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, ElementClass);
  }
}

// Se exponen para que las fases posteriores puedan importar/extender sin
// tener que reescribir el patrón base.
window.Radaelli = window.Radaelli || {};
window.Radaelli.RadaelliElement = RadaelliElement;
window.Radaelli.defineElement = defineRadaelliElement;
