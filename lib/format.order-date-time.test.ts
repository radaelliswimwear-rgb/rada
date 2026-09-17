import { test } from "node:test";
import assert from "node:assert/strict";
import { formatOrderDateTime } from "./format";
import { adminNewOrderEmail, customerOrderConfirmationEmail } from "./email/templates";
import type { Order } from "./orders/types";

// Auditoría UI fecha+hora (Sprint 31): formatOrderDateTime se movió de
// lib/email/templates.ts (función privada) a acá, para que la pantalla de
// confirmación (components/checkout/order-confirmation.tsx) y los emails
// usen exactamente la misma lógica — nunca la hora del navegador/servidor.
// timeZone se fija explícito (America/Bogota) adentro de la función, así
// que estos tests dan el mismo resultado sin importar en qué huso horario
// corra la máquina que los ejecuta — no hace falta simular TZ del sistema.

// A. Una fecha en UTC que, restando el offset de Bogotá (UTC-5, sin horario
// de verano), sigue siendo el mismo día calendario.
test("fecha que sigue siendo el mismo día en America/Bogota", () => {
  const { date, time } = formatOrderDateTime("2026-09-16T18:16:24.767Z");
  assert.equal(date, "16 de septiembre de 2026");
  assert.equal(time, "1:16 p. m.");
});

// B. Una fecha cerca de medianoche UTC (ya en el día siguiente en UTC) que
// en Bogotá sigue siendo el día anterior — el caso que de verdad prueba que
// se está aplicando el huso horario, no solo formateando en UTC/local.
test("fecha cerca de medianoche UTC cae en el día anterior en Colombia", () => {
  const { date, time } = formatOrderDateTime("2026-09-17T02:30:00.000Z");
  assert.equal(date, "16 de septiembre de 2026"); // no "17"
  assert.equal(time, "9:30 p. m.");
});

// C. Formato de hora: a. m. / p. m. (es-CO, 12 horas).
test("formato de hora usa a. m. / p. m. en horas antes y después del mediodía", () => {
  const manana = formatOrderDateTime("2026-09-16T15:00:00.000Z"); // 10:00 a.m. Bogotá
  assert.equal(manana.time, "10:00 a. m.");
  const tarde = formatOrderDateTime("2026-09-16T23:52:00.000Z"); // 6:52 p.m. Bogotá
  assert.equal(tarde.time, "6:52 p. m.");
});

// D. Formato completo tal como lo arma la pantalla de confirmación
// (`Pedido #N · {date} · {time}`) — se prueba la construcción del string
// final, no solo las partes sueltas.
test("formato completo usado por la pantalla de confirmación", () => {
  const { date, time } = formatOrderDateTime("2026-09-16T22:52:32.791Z");
  const linea = `Pedido #1009 · ${date} · ${time}`;
  assert.equal(linea, "Pedido #1009 · 16 de septiembre de 2026 · 5:52 p. m.");
});

// E. Los emails (admin y comprador) siguen produciendo exactamente el mismo
// resultado después de mover formatOrderDateTime a lib/format.ts — no es
// solo que los tests existentes de templates.ts sigan pasando, sino que acá
// se compara explícitamente contra el mismo formatter compartido.
const FICTITIOUS_ORDER: Order = {
  id: "order_ficticio_fecha_hora",
  orderNumber: 1009,
  userId: "guest",
  date: "2026-09-16T22:52:32.791Z",
  status: "Procesando",
  fulfillmentStatus: "Pendiente por preparar",
  items: [
    {
      productId: "prod_ficticio",
      name: "Producto Ficticio",
      image: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      size: "M",
      quantity: 1,
      priceValue: 50000,
    },
  ],
  total: 50000,
  subtotal: 50000,
  shippingAddress: {
    fullName: "Clienta Ficticia",
    email: "clienta-ficticia@ejemplo.test",
    street: "Calle Falsa 123",
    neighborhood: "Barrio",
    city: "Bogotá",
    postalCode: "",
    province: "Cundinamarca",
    country: "Colombia",
    phone: "+573000000000",
  },
  shippingMethod: "standard",
  payment: {
    provider: "wompi",
    transactionId: "lago-ficticio",
    last4: "4242",
    status: "succeeded",
  },
};

test("adminNewOrderEmail usa la misma fecha/hora que formatOrderDateTime compartido", () => {
  const expected = formatOrderDateTime(FICTITIOUS_ORDER.date);
  const { html } = adminNewOrderEmail(FICTITIOUS_ORDER, 299900);
  assert.ok(html.includes(expected.date), "el email admin debe incluir la fecha esperada");
  assert.ok(html.includes(expected.time), "el email admin debe incluir la hora esperada");
});

test("customerOrderConfirmationEmail usa la misma fecha que formatOrderDateTime compartido", () => {
  const expected = formatOrderDateTime(FICTITIOUS_ORDER.date);
  const { html } = customerOrderConfirmationEmail(FICTITIOUS_ORDER);
  assert.ok(html.includes(expected.date), "el email a la clienta debe incluir la fecha esperada");
});
