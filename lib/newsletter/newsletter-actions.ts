"use server";

import { prisma } from "lib/prisma";
import type { SubscribeResult } from "./types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Server Action pública (Sprint 17): reemplaza el formulario puramente
// visual de components/home/newsletter.tsx (que solo mostraba un toast, sin
// persistir nada). No hay envío real de emails — sin un proveedor externo
// configurado (Mailchimp/Resend/etc.), esto solo guarda la suscripción en
// Postgres, lista para conectar un proveedor real más adelante sin tocar el
// formulario (ver docs/sprints/SPRINT-17.md).
export async function subscribeToNewsletterAction(
  email: string,
): Promise<SubscribeResult> {
  const normalized = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalized)) {
    return { success: false, error: "Ingresá un email válido." };
  }

  try {
    await prisma.newsletterSubscriber.upsert({
      where: { email: normalized },
      update: { active: true },
      create: { email: normalized },
    });
    return { success: true };
  } catch (error) {
    console.error(
      "subscribeToNewsletterAction: no se pudo guardar la suscripción",
      error,
    );
    return { success: false, error: "No se pudo procesar la suscripción." };
  }
}
