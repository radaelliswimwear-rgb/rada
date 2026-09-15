"use client";

import { useState } from "react";
import { toast } from "sonner";
import { adminBackInStockRepository } from "lib/admin/back-in-stock-repository";
import type {
  AdminBackInStockDemandRow,
  AdminBackInStockRequestRow,
} from "lib/admin/back-in-stock-actions";
import { formatDate } from "lib/format";

const STATUS_LABELS: Record<AdminBackInStockRequestRow["status"], string> = {
  PENDING: "Esperando",
  NOTIFIED: "Notificada",
  FAILED: "Falló el envío",
};

const STATUS_STYLES: Record<AdminBackInStockRequestRow["status"], string> = {
  PENDING: "bg-amber-100 text-amber-800",
  NOTIFIED: "bg-green-100 text-green-800",
  FAILED: "bg-red-100 text-red-800",
};

function RetryButton({
  requestId,
  onDone,
}: {
  requestId: string;
  onDone: (result: { success: boolean; error?: string }) => void;
}) {
  const [isRetrying, setIsRetrying] = useState(false);

  const retry = async () => {
    setIsRetrying(true);
    const result = await adminBackInStockRepository.retryNotification(requestId);
    setIsRetrying(false);
    onDone(result);
    if (result.success) {
      toast.success("Correo reenviado.");
    } else {
      toast.error(result.error ?? "No se pudo reintentar el envío.");
    }
  };

  return (
    <button
      type="button"
      onClick={retry}
      disabled={isRetrying}
      className="ml-2 text-xs font-medium text-black underline-offset-4 hover:underline disabled:opacity-50 dark:text-white"
    >
      {isRetrying ? "Reintentando..." : "Reintentar"}
    </button>
  );
}

function DemandRow({ row }: { row: AdminBackInStockDemandRow }) {
  const [expanded, setExpanded] = useState(false);
  const [requests, setRequests] = useState<AdminBackInStockRequestRow[] | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const toggle = async () => {
    const next = !expanded;
    setExpanded(next);
    if (next && requests === null) {
      setIsLoading(true);
      const rows = await adminBackInStockRepository.listRequestsForVariant(
        row.productId,
        row.size,
      );
      setRequests(rows);
      setIsLoading(false);
    }
  };

  const handleRetryDone = (
    requestId: string,
    result: { success: boolean; error?: string },
  ) => {
    // Solo actualiza el estado local cuando el reintento realmente cambió
    // algo (éxito -> NOTIFIED); un fallo deja la fila como FAILED, sin
    // necesidad de tocar el estado.
    if (!result.success) return;
    setRequests((prev) =>
      prev
        ? prev.map((request) =>
            request.id === requestId
              ? { ...request, status: "NOTIFIED", notifiedAt: new Date().toISOString() }
              : request,
          )
        : prev,
    );
  };

  return (
    <>
      <tr className="border-b border-neutral-100 last:border-0 dark:border-neutral-900">
        <td className="px-4 py-3 font-medium">{row.productName}</td>
        <td className="px-4 py-3">{row.color}</td>
        <td className="px-4 py-3 text-right">{row.size}</td>
        <td className="px-4 py-3 text-right">{row.waitingCount}</td>
        <td className="px-4 py-3 text-right">
          <button
            type="button"
            onClick={toggle}
            className="text-xs font-medium text-black underline-offset-4 hover:underline dark:text-white"
          >
            {expanded ? "Ocultar" : "Ver solicitudes"}
          </button>
          {row.failedCount > 0 ? (
            <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-800">
              {row.failedCount} falló{row.failedCount > 1 ? "aron" : ""}
            </span>
          ) : null}
        </td>
      </tr>
      {expanded ? (
        <tr className="border-b border-neutral-100 bg-neutral-50 last:border-0 dark:border-neutral-900 dark:bg-neutral-950">
          <td colSpan={5} className="px-4 py-3">
            {isLoading ? (
              <p className="text-xs text-neutral-500">Cargando...</p>
            ) : requests && requests.length > 0 ? (
              <table className="w-full text-left text-xs">
                <thead className="text-neutral-500">
                  <tr>
                    <th className="py-1 pr-4 font-normal">Correo</th>
                    <th className="py-1 pr-4 font-normal">Pedido el</th>
                    <th className="py-1 font-normal">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((request) => (
                    <tr key={request.id}>
                      <td className="py-1 pr-4">{request.email}</td>
                      <td className="py-1 pr-4">{formatDate(request.createdAt)}</td>
                      <td className="py-1">
                        <span
                          className={`rounded-full px-2 py-0.5 ${STATUS_STYLES[request.status]}`}
                        >
                          {STATUS_LABELS[request.status]}
                        </span>
                        {request.status === "FAILED" ? (
                          <RetryButton
                            requestId={request.id}
                            onDone={(result) => handleRetryDone(request.id, result)}
                          />
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-xs text-neutral-500">Sin solicitudes.</p>
            )}
          </td>
        </tr>
      ) : null}
    </>
  );
}

export function BackInStockManager({
  initialDemand,
}: {
  initialDemand: AdminBackInStockDemandRow[];
}) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-neutral-500">
        Combinaciones de producto + talla agotadas que tienen clientas
        esperando un aviso. Ordenado de mayor a menor demanda — te ayuda a
        decidir qué reponer primero.
      </p>

      {initialDemand.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-neutral-300 py-14 text-center dark:border-neutral-700">
          <p className="text-sm text-neutral-500">
            Nadie está esperando ninguna talla agotada por ahora.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
              <tr>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Color</th>
                <th className="px-4 py-3 text-right">Talla</th>
                <th className="px-4 py-3 text-right">Personas esperando</th>
                <th className="px-4 py-3 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {initialDemand.map((row) => (
                <DemandRow key={`${row.productId}-${row.size}`} row={row} />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
