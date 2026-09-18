import {
  BanknotesIcon,
  ClipboardDocumentListIcon,
  CurrencyEuroIcon,
  ExclamationTriangleIcon,
  ShoppingBagIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { formatPrice } from "lib/format";
import type { DashboardStats } from "lib/admin/types";

// P0 admin operativo (auditoría de septiembre 2026): antes "Pedidos en
// proceso" e "Ingresos totales" leían Order.status (legado, que ningún
// botón real del panel escribe) -- ver lib/admin/dashboard-actions.ts. Acá
// se separan a propósito PAGO (Ventas aprobadas) de OPERACIÓN (Pedidos en
// proceso, Ingresos operativos) y se agrega Pendientes de reembolso, que
// antes no existía en ningún lado del panel.
export function DashboardStatsGrid({ stats }: { stats: DashboardStats }) {
  const tiles = [
    {
      label: "Productos",
      value: stats.totalProducts.toString(),
      icon: ShoppingBagIcon,
    },
    {
      label: "Pedidos",
      value: stats.totalOrders.toString(),
      icon: ClipboardDocumentListIcon,
    },
    {
      label: "Pedidos en proceso",
      value: stats.ordersInProgress.toString(),
      icon: ClipboardDocumentListIcon,
    },
    {
      label: "Usuarios",
      value: stats.totalUsers.toString(),
      icon: UsersIcon,
    },
    {
      label: "Ventas aprobadas",
      value: formatPrice(stats.approvedSales),
      icon: BanknotesIcon,
    },
    {
      label: "Ingresos operativos",
      value: formatPrice(stats.operationalRevenue),
      icon: CurrencyEuroIcon,
      highlight: true,
    },
    {
      label: "Pendientes de reembolso",
      value:
        stats.pendingRefundCount > 0
          ? `${stats.pendingRefundCount} · ${formatPrice(stats.pendingRefundAmount)}`
          : "0",
      icon: ExclamationTriangleIcon,
      warn: stats.pendingRefundCount > 0,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className={`flex items-center gap-4 rounded-xl border p-5 ${
            tile.warn
              ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30"
              : "border-neutral-200 dark:border-neutral-800"
          } ${tile.highlight ? "ring-1 ring-brand-coral/40" : ""}`}
        >
          <div
            className={`flex h-10 w-10 flex-none items-center justify-center rounded-full ${
              tile.warn
                ? "bg-amber-100 dark:bg-amber-900/50"
                : "bg-neutral-100 dark:bg-neutral-900"
            }`}
          >
            <tile.icon
              className={`h-5 w-5 ${
                tile.warn
                  ? "text-amber-700 dark:text-amber-400"
                  : "text-neutral-600 dark:text-neutral-300"
              }`}
            />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.15em] text-neutral-500">
              {tile.label}
            </p>
            <p className="text-xl font-semibold">{tile.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
