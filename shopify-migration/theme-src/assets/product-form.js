/**
 * PDP: selector de variantes + formulario de compra + diálogos de la ficha
 * (Fase 02H). Réplica del comportamiento de
 * components/product-detail/product-variant-picker.tsx:
 *   - con varias tallas, arranca sin selección y pide elegir antes de
 *     comprar (mismo texto real: "Elegí una talla antes de continuar.");
 *   - una talla agotada se puede elegir, pero el botón queda deshabilitado.
 *
 * "Añadir al carrito" envía el <form> nativo de Shopify (/cart/add -> /cart).
 * Fase 02I: si el cart drawer existe, cancela `product:add-to-cart`, agrega
 * por AJAX y entrega su promesa con detail.respondWith(promise); sin drawer
 * (o sin JS) sigue el envío nativo.
 *
 * Eventos (hooks de analytics, sin IDs de GA/Meta):
 *   product:variant-change  { sectionId, variant }
 *   product:add-to-cart     { sectionId, productId, variant, form, respondWith }
 */

/** Variante exacta para una combinación completa de opciones, o null. */
function resolveVariant(variants, selectedValues) {
  if (selectedValues.some((value) => value === null)) return null;
  return (
    variants.find((variant) =>
      variant.options.every((option, index) => option === selectedValues[index]),
    ) ?? null
  );
}

/**
 * ¿Existe alguna variante disponible con `value` en la posición
 * `optionIndex`, respetando lo ya elegido en las demás opciones? Las
 * opciones sin elegir (null) no restringen.
 */
function isOptionValueAvailable(variants, selectedValues, optionIndex, value) {
  return variants.some(
    (variant) =>
      variant.available &&
      variant.options.every((option, index) => {
        if (index === optionIndex) return option === value;
        return selectedValues[index] === null || option === selectedValues[index];
      }),
  );
}

class ProductForm extends window.Radaelli.RadaelliElement {
  onConnect() {
    const variantsScript = this.querySelector("[data-product-variants]");
    this.variants = variantsScript ? JSON.parse(variantsScript.textContent) : [];
    this.sectionId = this.dataset.sectionId;
    this.productAvailable = this.dataset.productAvailable === "true";

    const section = this.closest("[data-product-section]") ?? document;
    this.priceEl = section.querySelector("[data-price]");
    this.skuEl = section.querySelector("[data-product-sku]");

    this.form = this.querySelector("[data-product-form]");
    this.idInput = this.querySelector("[data-variant-id-input]");
    this.submitButton = this.querySelector("[data-add-to-cart]");
    this.submitLabel = this.querySelector("[data-add-to-cart-label]");
    this.errorEl = this.querySelector("[data-product-form-error]");
    this.statusEl = this.querySelector("[data-variant-status]");

    // Sin JS este input queda deshabilitado y compra el <select> de <noscript>.
    if (this.idInput) this.idInput.disabled = false;

    this.addEventListener("change", (event) => {
      if (event.target.matches("[data-option-input]")) this.onOptionChange();
    });
    this.form?.addEventListener("submit", (event) => this.onSubmit(event));
    // Volver con el botón "atrás" (bfcache) no debe dejar el botón en "Añadiendo…".
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) this.resetLoading();
    });

    this.update({ userInitiated: false });
  }

  getSelectedValues() {
    const byPosition = new Map();
    this.querySelectorAll("[data-option-hidden]").forEach((input) => {
      byPosition.set(Number(input.dataset.optionPosition), input.value);
    });
    this.querySelectorAll("[data-option-group]").forEach((group) => {
      const checked = group.querySelector("[data-option-input]:checked");
      byPosition.set(Number(group.dataset.optionPosition), checked ? checked.value : null);
    });
    return Array.from({ length: byPosition.size }, (_, index) => byPosition.get(index + 1) ?? null);
  }

  onOptionChange() {
    this.hideError();
    this.update({ userInitiated: true });
  }

  update({ userInitiated }) {
    const selectedValues = this.getSelectedValues();
    const variant = resolveVariant(this.variants, selectedValues);
    this.currentVariant = variant;

    this.refreshOptionAvailability(selectedValues);
    if (this.idInput) this.idInput.value = variant ? String(variant.id) : "";
    this.updateButton(variant, selectedValues);

    if (variant) {
      this.updatePrice(variant);
      this.updateSku(variant);
    }

    if (!userInitiated) return;

    if (variant) {
      this.updateUrl(variant);
      this.dispatchEvent(
        new CustomEvent("product:variant-change", {
          bubbles: true,
          detail: { sectionId: this.sectionId, variant },
        }),
      );
    }
    this.announce(variant, selectedValues);
  }

  refreshOptionAvailability(selectedValues) {
    this.querySelectorAll("[data-option-group]").forEach((group) => {
      const optionIndex = Number(group.dataset.optionPosition) - 1;
      group.querySelectorAll("[data-option-input]").forEach((input) => {
        const available = isOptionValueAvailable(
          this.variants,
          selectedValues,
          optionIndex,
          input.value,
        );
        const pill = input.closest(".variant-pill");
        pill?.classList.toggle("is-unavailable", !available);
        const srLabel = pill?.querySelector("[data-unavailable-label]");
        if (srLabel) srLabel.hidden = available;
      });
    });
  }

  updateButton(variant, selectedValues) {
    if (!this.submitButton || !this.submitLabel) return;
    const allSelected = selectedValues.every((value) => value !== null);
    let label = this.dataset.labelAdd;
    let disabled = false;

    if (!this.productAvailable) {
      label = this.dataset.labelSoldOutProduct;
      disabled = true;
    } else if (allSelected && !variant) {
      label = this.dataset.labelUnavailable;
      disabled = true;
    } else if (variant && !variant.available) {
      label = this.dataset.labelSoldOutVariant;
      disabled = true;
    }

    this.submitButton.disabled = disabled;
    this.submitLabel.textContent = label;
  }

  updatePrice(variant) {
    if (!this.priceEl) return;
    const regular = this.priceEl.querySelector("[data-price-regular]");
    const compare = this.priceEl.querySelector("[data-price-compare]");
    const compareValue = this.priceEl.querySelector("[data-price-compare-value]");
    const discount = this.priceEl.querySelector("[data-price-discount]");
    const onSale = Boolean(variant.compareAtPrice);

    if (regular) regular.textContent = variant.price;
    this.priceEl.classList.toggle("price--sale", onSale);
    if (compare) compare.hidden = !onSale;
    if (discount) discount.hidden = !onSale;
    if (onSale) {
      if (compareValue) compareValue.textContent = variant.compareAtPrice;
      if (discount) discount.textContent = `-${variant.discountPercent}%`;
    }
  }

  updateSku(variant) {
    if (!this.skuEl) return;
    this.skuEl.hidden = !variant.sku;
    if (variant.sku) {
      this.skuEl.textContent = this.skuEl.dataset.skuTemplate.replace("__SKU__", variant.sku);
    }
  }

  updateUrl(variant) {
    const url = new URL(window.location.href);
    url.searchParams.set("variant", String(variant.id));
    window.history.replaceState(window.history.state, "", url.toString());
  }

  announce(variant, selectedValues) {
    if (!this.statusEl) return;
    const parts = [selectedValues.filter(Boolean).join(", ")];
    if (variant) {
      parts.push(variant.price);
      parts.push(variant.available ? this.dataset.labelAvailable : this.dataset.labelSoldOutVariant);
    }
    this.statusEl.textContent = parts.filter(Boolean).join(". ");
  }

  onSubmit(event) {
    if (this.isSubmitting) {
      event.preventDefault();
      return;
    }

    const selectedValues = this.getSelectedValues();
    const missingIndex = selectedValues.findIndex((value) => value === null);
    if (missingIndex !== -1) {
      event.preventDefault();
      const group = this.querySelector(
        `[data-option-group][data-option-position="${missingIndex + 1}"]`,
      );
      const message =
        group?.dataset.sizeOption === "true"
          ? this.dataset.errorSelectSize
          : this.dataset.errorSelectOption.replace(
              "__OPTION__",
              (group?.dataset.optionName ?? "").toLowerCase(),
            );
      this.showError(message);
      group?.querySelector("[data-option-input]")?.focus();
      return;
    }

    if (!this.currentVariant || !this.currentVariant.available) {
      event.preventDefault();
      return;
    }

    let pendingAdd = null;
    const addEvent = new CustomEvent("product:add-to-cart", {
      bubbles: true,
      cancelable: true,
      detail: {
        sectionId: this.sectionId,
        productId: this.dataset.productId,
        variant: this.currentVariant,
        form: this.form,
        // Fase 02I: quien cancela el envío nativo (el cart drawer) entrega
        // acá la promesa de su alta por AJAX. El botón queda en "Añadiendo…"
        // hasta que termine, y si falla el error se muestra en la ficha.
        respondWith: (promise) => {
          pendingAdd = promise;
        },
      },
    });
    if (!this.dispatchEvent(addEvent)) {
      event.preventDefault();
      if (pendingAdd) this.waitForAdd(pendingAdd);
      return;
    }

    this.setLoading();
  }

  async waitForAdd(promise) {
    this.hideError();
    this.setLoading();
    try {
      await promise;
    } catch (error) {
      this.showError(error?.message || this.dataset.errorAdd);
    } finally {
      this.resetLoading();
    }
  }

  setLoading() {
    this.isSubmitting = true;
    this.submitButton?.setAttribute("aria-busy", "true");
    if (this.submitLabel) this.submitLabel.textContent = this.dataset.labelAdding;
  }

  resetLoading() {
    this.isSubmitting = false;
    this.submitButton?.removeAttribute("aria-busy");
    this.update({ userInitiated: false });
  }

  showError(message) {
    if (!this.errorEl) return;
    this.errorEl.textContent = message;
    this.errorEl.hidden = false;
  }

  hideError() {
    if (!this.errorEl) return;
    this.errorEl.hidden = true;
    this.errorEl.textContent = "";
  }
}

window.Radaelli.defineElement("product-form", ProductForm);

/* ============================================================
   DIÁLOGOS DE LA FICHA (guía de tallas) -- <dialog> nativo:
   foco inicial, Escape, fondo inerte y top layer los resuelve el
   navegador. Acá solo: abrir, cerrar al tocar el fondo, y devolver
   el foco al botón que lo abrió.
   ============================================================ */
document.addEventListener("click", (event) => {
  const opener = event.target.closest("[data-dialog-open]");
  if (!opener) return;
  const dialog = document.getElementById(opener.dataset.dialogOpen);
  if (!dialog || typeof dialog.showModal !== "function" || dialog.open) return;
  dialog.showModal();
  dialog.addEventListener("close", () => opener.focus(), { once: true });
});

document.querySelectorAll("dialog[data-dialog-backdrop-close]").forEach((dialog) => {
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
});
