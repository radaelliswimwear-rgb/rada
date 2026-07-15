import {
  ClipboardDocumentListIcon,
  CurrencyEuroIcon,
  ShoppingBagIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { formatPrice } from "lib/format";
import type { DashboardStats } from "lib/admin/types";

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
      value: stats.pendingOrders.toString(),
      icon: ClipboardDocumentListIcon,
    },
    {
      label: "Usuarios",
      value: stats.totalUsers.toString(),
      icon: UsersIcon,
    },
    {
      label: "Ingresos totales",
      value: formatPrice(stats.revenue),
      icon: CurrencyEuroIcon,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="flex items-center gap-4 rounded-xl border border-neutral-200 p-5 dark:border-neutral-800"
        >
          <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-neutral-100 dark:bg-neutral-900">
            <tile.icon className="h-5 w-5 text-neutral-600 dark:text-neutral-300" />
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
