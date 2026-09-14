"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { settingsRepository } from "lib/currency/settings-repository";
import type { StoreSettings } from "lib/currency/settings-actions";
import { HeroSettingsManager } from "./hero-settings-manager";
import { SizeGuideUploader } from "./size-guide-uploader";

const inputClass =
  "w-full max-w-xs rounded-md border border-neutral-300 bg-transparent px-4 py-2.5 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20 dark:border-neutral-700 dark:text-white dark:focus:ring-white/20";
const labelClass =
  "mb-1.5 block text-xs uppercase tracking-[0.15em] text-neutral-500";

function formatUpdatedAt(iso: string): string {
  return new Date(iso).toLocaleString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Único lugar del panel donde se edita la tasa COP/USD (Sprint 18):
// automática contra la TRM oficial de Colombia (lib/currency/trm.ts) o
// fijada a mano — components/currency/* la lee vía settingsRepository.get()
// para mostrar precios en USD sin duplicar el número en ningún otro
// componente.
export function SettingsManager({ initial }: { initial: StoreSettings }) {
  const router = useRouter();
  const [usdRate, setUsdRate] = useState(initial.usdRate.toString());
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(
    initial.discountPercent.toString(),
  );
  const [isSavingDiscount, setIsSavingDiscount] = useState(false);

  const onSubmitDiscount = async (event: FormEvent) => {
    event.preventDefault();
    setIsSavingDiscount(true);
    const result = await settingsRepository.updateSitewideDiscount(
      Number(discountPercent),
    );
    setIsSavingDiscount(false);
    if (!result.success) {
      toast(result.error);
      return;
    }
    toast(
      Number(discountPercent) > 0
        ? `Descuento del sitio actualizado a ${discountPercent}%.`
        : "Descuento del sitio desactivado.",
    );
    router.refresh();
  };

  const onSubmitManual = async (event: FormEvent) => {
    event.preventDefault();
    const rate = Number(usdRate);
    setIsSaving(true);
    const result = await settingsRepository.updateUsdRate(rate);
    setIsSaving(false);

    if (!result.success) {
      toast(result.error);
      return;
    }
    toast("Tasa fijada manualmente.");
    router.refresh();
  };

  const onSyncTrm = async () => {
    setIsSyncing(true);
    const result = await settingsRepository.syncTrm();
    setIsSyncing(false);

    if (!result.success) {
      toast(result.error);
      return;
    }
    toast("Tasa actualizada desde la TRM oficial.");
    router.refresh();
  };

  return (
    <div className="max-w-xl">
      <div className="mb-6 rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Región
        </h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          País predeterminado: <strong>{initial.defaultCountry}</strong> ·
          Moneda base: <strong>{initial.defaultCurrency}</strong>
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Descuento del sitio completo
        </h2>
        <p className="mb-4 text-xs text-neutral-500">
          Se aplica a todos los productos que no tengan un descuento propio
          ni un descuento de categoría activo — ver "Descuento (%)" en el
          formulario de cada prenda y en /admin/categorias. 0 = sin
          descuento.
        </p>
        <form onSubmit={onSubmitDiscount} className="grid max-w-xs gap-3">
          <input
            id="discountPercent"
            type="number"
            min={0}
            max={100}
            step={1}
            value={discountPercent}
            onChange={(e) => setDiscountPercent(e.target.value)}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={isSavingDiscount}
            className="w-fit rounded-full bg-black px-6 py-2.5 text-sm font-medium tracking-wide text-white transition-opacity duration-200 hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-black"
          >
            {isSavingDiscount ? "Guardando..." : "Guardar descuento"}
          </button>
        </form>
      </div>

      <div className="mb-6 rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Portada del home
        </h2>
        <p className="mb-4 text-xs text-neutral-500">
          Video en loop de fondo para destacar la colección del momento en
          la portada, con su texto e imagen de respaldo. Sin video subido,
          la portada muestra el diseño anterior (fondo de manchas de color).
        </p>
        <HeroSettingsManager
          initialVideo={initial.heroVideo}
          initialPoster={initial.heroPoster}
          initialText={initial.heroText}
        />
      </div>

      <div className="mb-6 rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
        <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-neutral-500">
          Guía de tallas
        </h2>
        <p className="mb-4 text-xs text-neutral-500">
          Por ahora se usa solo en los productos de Oasis Natural: aparece en
          el botón "Guía de tallas" junto al selector de talla, en vez de
          subirla como una foto más en la galería de cada prenda. Las demás
          colecciones no muestran este botón.
        </p>
        <SizeGuideUploader initial={initial.sizeGuideImage} />
      </div>

      <div className="grid gap-4 rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">
            Tasa de cambio COP / USD
          </h2>
          <p className="mt-1 text-xs text-neutral-500">
            Se usa para mostrar precios en USD en toda la tienda cuando el
            cliente elige esa moneda en el selector del navbar. El cobro real
            en el checkout siempre se hace en COP.
          </p>
        </div>

        <div className="rounded-lg bg-neutral-50 p-4 text-sm dark:bg-neutral-900">
          <p>
            Tasa actual: <strong>$ {initial.usdRate.toLocaleString("es-CO")}</strong> COP
            por USD
          </p>
          <p className="mt-1 text-xs text-neutral-500">
            Origen:{" "}
            {initial.usdRateSource === "trm"
              ? "TRM oficial de Colombia (automática)"
              : "fijada manualmente"}{" "}
            · Actualizada el {formatUpdatedAt(initial.updatedAt)}
          </p>
        </div>

        <button
          type="button"
          onClick={onSyncTrm}
          disabled={isSyncing}
          className="w-fit rounded-full border border-neutral-300 px-6 py-2.5 text-sm font-medium tracking-wide transition-opacity duration-200 hover:opacity-80 disabled:opacity-60 dark:border-neutral-700"
        >
          {isSyncing ? "Consultando TRM..." : "Actualizar ahora desde la TRM oficial"}
        </button>

        <form
          onSubmit={onSubmitManual}
          className="grid gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-800"
        >
          <label htmlFor="usdRate" className={labelClass}>
            O fijar un valor manual (pesos COP por 1 USD)
          </label>
          <input
            id="usdRate"
            type="number"
            min={1}
            step="0.01"
            required
            value={usdRate}
            onChange={(e) => setUsdRate(e.target.value)}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={isSaving}
            className="w-fit rounded-full bg-black px-6 py-2.5 text-sm font-medium tracking-wide text-white transition-opacity duration-200 hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-black"
          >
            {isSaving ? "Guardando..." : "Fijar tasa manual"}
          </button>
          <p className="text-xs text-neutral-500">
            Al fijar un valor manual, la tasa deja de actualizarse sola —
            usá "Actualizar ahora" para volver al modo automático.
          </p>
        </form>
      </div>
    </div>
  );
}
