"use client";

import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { adminNewsletterRepository } from "lib/admin/newsletter-repository";
import { formatDate } from "lib/format";
import type {
  AdminCampaign,
  AdminSubscriber,
} from "lib/admin/newsletter-actions";

const inputClass =
  "w-full rounded-md border border-neutral-300 bg-transparent px-4 py-2.5 text-sm text-black placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black/20 dark:border-neutral-700 dark:text-white dark:focus:ring-white/20";

export function NewsletterManager({
  initialSubscribers,
  initialCampaigns,
}: {
  initialSubscribers: AdminSubscriber[];
  initialCampaigns: AdminCampaign[];
}) {
  const [subscribers] = useState(initialSubscribers);
  const [campaigns, setCampaigns] = useState(initialCampaigns);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const activeCount = subscribers.filter((s) => s.active).length;

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    const result = await adminNewsletterRepository.createCampaign(
      subject,
      body,
    );
    setIsSubmitting(false);
    if (!result.success) {
      toast(result.error);
      return;
    }
    setSubject("");
    setBody("");
    setCampaigns(await adminNewsletterRepository.listCampaigns());
    toast("Campaña guardada como borrador.");
  };

  const onMarkSent = async (campaign: AdminCampaign) => {
    setPendingId(campaign.id);
    const result = await adminNewsletterRepository.markCampaignSent(
      campaign.id,
    );
    setPendingId(null);
    if (!result.success) {
      toast(result.error);
      return;
    }
    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === campaign.id
          ? { ...c, status: "SENT", sentAt: new Date().toISOString() }
          : c,
      ),
    );
    toast("Campaña marcada como enviada.");
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
          <p className="text-xs uppercase tracking-[0.15em] text-neutral-500">
            Suscriptores activos
          </p>
          <p className="mt-1 text-2xl font-semibold">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 p-5 dark:border-neutral-800">
          <p className="text-xs uppercase tracking-[0.15em] text-neutral-500">
            Total histórico
          </p>
          <p className="mt-1 text-2xl font-semibold">{subscribers.length}</p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Suscriptoras</h2>
        {subscribers.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Todavía no hay nadie suscrita al newsletter.
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 border-b border-neutral-200 bg-white text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800 dark:bg-black">
                <tr>
                  <th className="px-4 py-3">Correo</th>
                  <th className="px-4 py-3">Suscrita</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((subscriber) => (
                  <tr
                    key={subscriber.id}
                    className="border-b border-neutral-100 last:border-0 dark:border-neutral-900"
                  >
                    <td className="px-4 py-3 font-medium">
                      {subscriber.email}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                      {formatDate(subscriber.subscribedAt)}
                    </td>
                    <td className="px-4 py-3">
                      {subscriber.active ? "Activa" : "Dada de baja"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Nueva campaña</h2>
        <p className="mb-3 text-xs text-neutral-500">
          No hay un proveedor de email conectado — las campañas quedan como
          borrador o "enviada" a modo de registro, sin disparar ningún email
          real. Queda preparado para conectar un proveedor real más adelante.
        </p>
        <form
          onSubmit={onCreate}
          className="grid max-w-xl gap-3 rounded-xl border border-neutral-200 p-4 dark:border-neutral-800"
        >
          <input
            required
            placeholder="Asunto"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={inputClass}
          />
          <textarea
            required
            rows={5}
            placeholder="Contenido de la campaña..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className={inputClass}
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-fit rounded-full bg-black px-6 py-2.5 text-sm font-medium text-white transition-opacity duration-200 hover:opacity-90 disabled:opacity-60 dark:bg-white dark:text-black"
          >
            {isSubmitting ? "Guardando..." : "Guardar borrador"}
          </button>
        </form>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">Campañas</h2>
        {campaigns.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Todavía no hay campañas creadas.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 text-xs uppercase tracking-wide text-neutral-500 dark:border-neutral-800">
                <tr>
                  <th className="px-4 py-3">Asunto</th>
                  <th className="px-4 py-3">Creada</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="border-b border-neutral-100 last:border-0 dark:border-neutral-900"
                  >
                    <td className="px-4 py-3 font-medium">
                      {campaign.subject}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 dark:text-neutral-400">
                      {formatDate(campaign.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {campaign.status === "SENT" ? "Enviada" : "Borrador"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {campaign.status === "DRAFT" ? (
                        <button
                          type="button"
                          onClick={() => onMarkSent(campaign)}
                          disabled={pendingId === campaign.id}
                          className="text-xs font-medium text-black underline-offset-4 hover:underline disabled:opacity-50 dark:text-white"
                        >
                          Marcar como enviada
                        </button>
                      ) : (
                        <span className="text-xs text-neutral-500">
                          {campaign.sentAt ? formatDate(campaign.sentAt) : ""}
                        </span>
                      )}
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
