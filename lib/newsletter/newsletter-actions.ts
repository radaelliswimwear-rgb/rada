"use server";

import { prisma } from "lib/prisma";
import { notifyAdminsOfNewSubscriber } from "lib/email/order-notifications";
import type { SubscribeResult } from "./types";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Server Action pública (Sprint 17): reemplaza el formulario puramente
// visual de components/home/newsletter.tsx (que solo mostraba un toast, sin
// persistir nada). Guarda la suscripción en Postgres y avisa a los admins
// por correo (notifyAdminsOfNewSubscriber) — antes la única forma de
// enterarse era entrar manualmente al panel a ver si el contador subió.
export async function subscribeToNewsletterAction(
  email: string,
): Promise<SubscribeResult> {
  const normalized = email.trim().toLowerCase();
  if (!EMAIL_REGEX.test(normalized)) {
    return { success: false, error: "Ingresá un email válido." };
  }

  try {
    const before = await prisma.newsletterSubscriber.findUnique({
      where: { email: normalized },
      select: { active: true },
    });
    await prisma.newsletterSubscriber.upsert({
      where: { email: normalized },
      update: { active: true },
      create: { email: normalized },
    });
    // Solo avisa en un alta real (nueva o reactivada) — reenviar el mismo
    // formulario con un correo ya suscrito y activo no debe generar un
    // correo nuevo cada vez.
    if (!before || !before.active) {
      await notifyAdminsOfNewSubscriber(normalized);
    }
    return { success: true };
  } catch (error) {
    console.error(
      "subscribeToNewsletterAction: no se pudo guardar la suscripción",
      error,
    );
    return { success: false, error: "No se pudo procesar la suscripción." };
  }
}
