import { EyeIcon } from "@heroicons/react/24/outline";

type StockStatus = "available" | "low" | "soldout";

function stockStatus(totalStock: number): StockStatus {
  if (totalStock <= 0) return "soldout";
  if (totalStock <= 5) return "low";
  return "available";
}

const STATUS_STYLES: Record<StockStatus, string> = {
  available: "bg-green-100 text-green-800",
  low: "bg-amber-100 text-amber-800",
  soldout: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<StockStatus, string> = {
  available: "Disponible",
  low: "Últimas unidades",
  soldout: "Agotado",
};

// Debajo del precio en la ficha de producto (Sprint 19): disponibilidad
// (derivada del stock real sumado entre tallas — una sola fuente de
// verdad, la misma que usa /admin/inventario), vistas (reales +
// promocionales, si el admin las tiene visibles) y SKU.
export function ProductMeta({
  totalStock,
  sku,
  showViews,
  totalViews,
  liveViewers,
}: {
  totalStock: number;
  sku?: string | null;
  showViews?: boolean;
  totalViews: number;
  // Slot para <LiveViewers>: se renderiza en la misma fila que el resto
  // de las insignias en vez de en un bloque aparte — antes quedaban dos
  // badges con ícono de ojo, uno debajo del otro, y se leía repetido.
  liveViewers?: React.ReactNode;
}) {
  const status = stockStatus(totalStock);

  return (
    <div className="mb-4 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}
        >
          {STATUS_LABELS[status]}
        </span>
        {status === "low" ? (
          <span className="text-xs text-neutral-500">
            Solo quedan {totalStock} unidades
          </span>
        ) : null}
        {showViews ? (
          <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-xs text-neutral-600">
            <EyeIcon className="h-3.5 w-3.5" aria-hidden="true" />
            {totalViews} {totalViews === 1 ? "vista" : "vistas"}
          </span>
        ) : null}
        {liveViewers}
      </div>
      {sku ? (
        <p className="text-xs text-neutral-400">SKU: {sku}</p>
      ) : null}
    </div>
  );
}

export { stockStatus };
export type { StockStatus };
