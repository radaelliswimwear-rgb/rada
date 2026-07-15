"use server";

import { prisma } from "lib/prisma";
import type {
  NewsletterCampaign as CampaignRow,
  NewsletterSubscriber as SubscriberRow,
} from "@prisma/client";
import type { AdminActionResult } from "./types";

// Gestión de campañas (Sprint 17): sin proveedor de email externo
// configurado, "enviar" una campaña no dispara ningún email real — solo
// marca la campaña como SENT con la fecha, dejando el dato listo para
// conectar un envío real (Resend/Mailchimp/etc.) más adelante sin cambiar
// este contrato. Documentado explícitamente para no sugerir una capacidad
// que no existe.
export type AdminSubscriber = {
  id: string;
  email: string;
  active: boolean;
  subscribedAt: string;
};

export type AdminCampaign = {
  id: string;
  subject: string;
  body: string;
  status: "DRAFT" | "SENT";
  createdAt: string;
  sentAt: string | null;
};

function toSubscriber(row: SubscriberRow): AdminSubscriber {
  return {
    id: row.id,
    email: row.email,
    active: row.active,
    subscribedAt: row.subscribedAt.toISOString(),
  };
}

function toCampaign(row: CampaignRow): AdminCampaign {
  return {
    id: row.id,
    subject: row.subject,
    body: row.body,
    status: row.status,
    createdAt: row.createdAt.toISOString(),
    sentAt: row.sentAt ? row.sentAt.toISOString() : null,
  };
}

export async function listSubscribersAction(): Promise<AdminSubscriber[]> {
  try {
    const rows = await prisma.newsletterSubscriber.findMany({
      orderBy: { subscribedAt: "desc" },
    });
    return rows.map(toSubscriber);
  } catch (error) {
    console.error("listSubscribersAction: no se pudo leer la lista", error);
    return [];
  }
}

export async function listCampaignsAction(): Promise<AdminCampaign[]> {
  try {
    const rows = await prisma.newsletterCampaign.findMany({
      orderBy: { createdAt: "desc" },
    });
    return rows.map(toCampaign);
  } catch (error) {
    console.error(
      "listCampaignsAction: no se pudieron leer las campañas",
      error,
    );
    return [];
  }
}

export async function createCampaignAction(
  subject: string,
  body: string,
): Promise<AdminActionResult> {
  if (!subject.trim() || !body.trim()) {
    return { success: false, error: "Asunto y contenido son obligatorios." };
  }
  try {
    await prisma.newsletterCampaign.create({ data: { subject, body } });
    return { success: true };
  } catch (error) {
    console.error("createCampaignAction: no se pudo crear la campaña", error);
    return { success: false, error: "No se pudo crear la campaña." };
  }
}

export async function markCampaignSentAction(
  id: string,
): Promise<AdminActionResult> {
  try {
    await prisma.newsletterCampaign.update({
      where: { id },
      data: { status: "SENT", sentAt: new Date() },
    });
    return { success: true };
  } catch (error) {
    console.error("markCampaignSentAction: no se pudo actualizar", error);
    return { success: false, error: "No se pudo marcar como enviada." };
  }
}
