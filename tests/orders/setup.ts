// Instala los mocks de módulo que necesita cualquier escenario de
// createOrderAction y devuelve el doble de Prisma + los registros de
// llamadas. Se llama UNA sola vez por proceso (node:test no permite
// remockear el mismo módulo dos veces en el mismo proceso) — de ahí que
// cada escenario viva en su propio archivo .test.ts.
import { mockModule } from "../mock-module";
import { makeFakePrisma, type FakePrismaOptions } from "./fake-prisma";

export type NotificationCall = { orderId: string };

export function setupOrdersActionMocks(options: FakePrismaOptions) {
  const fake = makeFakePrisma(options);
  const notifications: NotificationCall[] = [];

  mockModule("lib/prisma", { prisma: fake.prisma });

  // getCurrentUser importa next/headers (cookies()), que no existe fuera
  // del runtime de Next. Se mockea el módulo entero: acá siempre compra una
  // invitada, que es el camino del checkout público.
  mockModule("lib/auth/session", {
    getCurrentUser: async () => null,
    createSession: async () => undefined,
    destroySession: async () => undefined,
  });

  // El aviso al admin manda correos de verdad: se reemplaza por un registro
  // para poder afirmar cuántas veces se disparó (debe ser exactamente una
  // por pago, nunca en un reintento ni en una carrera perdida).
  mockModule("lib/email/order-notifications", {
    notifyAdminsOfNewOrder: async (order: { id: string }) => {
      notifications.push({ orderId: order.id });
    },
    notifyAdminsOfNewSubscriber: async () => undefined,
  });

  return { ...fake, notifications };
}
