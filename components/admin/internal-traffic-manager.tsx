"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { adminInternalTrafficRepository } from "lib/admin/internal-traffic-repository";
import type { InternalTrafficDeviceSummary } from "lib/admin/internal-traffic-actions";
import { formatDate } from "lib/format";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-transparent px-3 py-2 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20 dark:border-neutral-700 dark:text-white dark:focus:ring-white/20";

export function InternalTrafficManager({
  initialDevices,
}: {
  initialDevices: InternalTrafficDeviceSummary[];
}) {
  const [devices, setDevices] = useState(initialDevices);
  const [label, setLabel] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<{
    url: string;
    label: string;
    expiresAt: string;
  } | null>(null);

  const onGenerate = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = label.trim();
    if (!trimmed) return;
    setIsSubmitting(true);
    try {
      const { token, expiresAt } =
        await adminInternalTrafficRepository.createActivationLink(trimmed);
      setGeneratedLink({
        url: `${window.location.origin}/interno/activar?token=${token}`,
        label: trimmed,
        expiresAt,
      });
      setLabel("");
    } catch (error) {
      toast(
        error instanceof Error
          ? error.message
          : "No se pudo generar el enlace.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const onCopy = async () => {
    if (!generatedLink) return;
    await navigator.clipboard.writeText(generatedLink.url);
    toast("Enlace copiado.");
  };

  const onRevoke = async (device: InternalTrafficDeviceSummary) => {
    setPendingId(device.id);
    try {
      await adminInternalTrafficRepository.revoke(device.id);
      setDevices((prev) =>
        prev.map((d) => (d.id === device.id ? { ...d, revoked: true } : d)),
      );
    } catch {
      toast("No se pudo revocar el dispositivo.");
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="mb-1 text-lg font-medium">
          Generar enlace de activación
        </h2>
        <p className="mb-3 text-sm text-neutral-500">
          Compartí el enlace directamente con la persona (WhatsApp, por
          ejemplo) para que lo abra en el navegador/dispositivo que querés
          marcar. Vale por 30 minutos y solo sirve una vez.
        </p>
        <form
          onSubmit={onGenerate}
          className="flex max-w-xl flex-col gap-3 rounded-xl border border-neutral-200 p-4 sm:flex-row dark:border-neutral-800"
        >
          <input
            required
            placeholder="Nombre del dispositivo (ej. iPhone Daniela)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={isSubmitting || !label.trim()}
            className="w-fit shrink-0 rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white transition-opacity duration-200 hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-black"
          >
            {isSubmitting ? "Generando..." : "Generar enlace"}
          </button>
        </form>

        {generatedLink ? (
          <div className="mt-4 max-w-xl rounded-xl border border-green-200 bg-green-50 p-4 text-sm dark:border-green-900 dark:bg-green-950">
            <p className="font-medium text-green-800 dark:text-green-300">
              Enlace para &quot;{generatedLink.label}&quot;
            </p>
            <p className="mt-1 break-all rounded-md bg-white px-3 py-2 font-mono text-xs text-neutral-700 dark:bg-black dark:text-neutral-300">
              {generatedLink.url}
            </p>
            <p className="mt-2 text-xs text-green-700 dark:text-green-400">
              Vence a las{" "}
              {new Date(generatedLink.expiresAt).toLocaleTimeString("es-CO")}.
              Este enlace no se vuelve a mostrar.
            </p>
            <button
              type="button"
              onClick={onCopy}
              className="mt-3 rounded-full border border-green-300 px-4 py-1.5 text-xs font-medium text-green-800 hover:bg-green-100 dark:border-green-800 dark:text-green-300 dark:hover:bg-green-900"
            >
              Copiar enlace
            </button>
          </div>
        ) : null}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Dispositivos marcados</h2>
        {devices.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Todavía no hay ningún dispositivo marcado como tráfico interno.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
                <tr>
                  <th className="px-4 py-3">Dispositivo</th>
                  <th className="px-4 py-3">Activado</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {devices.map((device) => (
                  <tr
                    key={device.id}
                    className="border-b border-neutral-100 last:border-0 dark:border-neutral-900"
                  >
                    <td className="px-4 py-3 font-medium">{device.label}</td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                      {formatDate(device.activatedAt)}
                    </td>
                    <td className="px-4 py-3">
                      {device.revoked ? (
                        <span className="text-neutral-500">Revocado</span>
                      ) : (
                        <span className="text-green-700 dark:text-green-400">
                          Activo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => onRevoke(device)}
                        disabled={device.revoked || pendingId === device.id}
                        className="text-xs text-neutral-500 underline-offset-4 hover:text-red-600 hover:underline disabled:opacity-40"
                      >
                        Revocar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
