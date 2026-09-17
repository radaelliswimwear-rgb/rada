// Instala los mocks de módulo que necesita cualquier escenario de
// createOrderAction y devuelve el doble de Prisma + los registros de
// llamadas. Se llama UNA sola vez por proceso (node:test no permite
// remockear el mismo módulo dos veces en el mismo proceso) — de ahí que
// cada escenario viva en su propio archivo .test.ts.
import { mockModule } from "../mock-module";
import { makeFakePrisma, type FakePrismaOptions } from "./fake-prisma";

// Registro de cada llamada real a sendEmail (Sprint de confiabilidad de
// emails/outbox) — reemplaza al mock anterior de
// lib/email/order-notifications: desde este cambio, createOrderForPayment
// ya no llama a notifyAdminsOfNewOrder/notifyCustomerOfNewOrder
// directamente, sino que crea EmailOutbox dentro de la transacción y hace
// un intento inmediato vía sendOutboxJob (lib/email/outbox.ts), que sí
// termina llamando a sendEmail — ese es el límite externo real, y por eso
// es lo que se mockea acá ahora.
export type SendEmailCall = {
  to: string;
  subject: string;
  idempotencyKey?: string;
};

export function setupOrdersActionMocks(options: FakePrismaOptions) {
  const fake = makeFakePrisma(options);
  const sentEmails: SendEmailCall[] = [];

  mockModule("lib/prisma", { prisma: fake.prisma });

  // getCurrentUser importa next/headers (cookies()), que no existe fuera
  // del runtime de Next. Se mockea el módulo entero: acá siempre compra una
  // invitada, que es el camino del checkout público.
  mockModule("lib/auth/session", {
    getCurrentUser: async () => null,
    createSession: async () => undefined,
    destroySession: async () => undefined,
  });

  // sendEmail es el único punto real de salida hacia Resend. Se mockea acá
  // (siempre "éxito") para que el intento inmediato de sendOutboxJob, que
  // corre automáticamente después de crear cada Order en estos tests,
  // nunca intente una llamada de red real -- y para poder afirmar cuántas
  // veces se disparó cada tipo de email (debe ser exactamente una por
  // pago, nunca en un reintento ni en una carrera perdida).
  mockModule("lib/email/send", {
    sendEmail: async (payload: SendEmailCall) => {
      sentEmails.push(payload);
      return { success: true };
    },
  });

  return { ...fake, sentEmails };
}
