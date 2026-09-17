import { getAppBaseUrl } from "lib/utils";
import { formatOrderDateTime, formatPrice } from "lib/format";
import { buildCustomerWhatsappUrl } from "lib/checkout/whatsapp";
import { qualifiesForFreeShipping } from "lib/checkout/pricing";
import { SOCIAL_LINKS } from "lib/social-links";
import { IS_SIMULATED_PROVIDER } from "lib/payments/config";
import type { Order } from "lib/orders/types";

const BRAND = "Radaelli Swimwear";

// formatOrderDateTime (fecha + hora en America/Bogota, sin depender del
// huso del servidor) vive en lib/format.ts — compartida con
// components/checkout/order-confirmation.tsx (Sprint 31), antes duplicada
// acá como función privada.

// item.name/item.image (lib/orders/orders-actions.ts) y los campos de
// shippingAddress llegan tal cual del cliente en el checkout, sin pasar por
// ningun campo derivado server-side — si se interpolaran crudos en este
// HTML, cualquiera podria inyectar markup (ej. un link de phishing) en el
// correo interno que reciben los admins con solo completar el checkout.
function escapeHtml(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function wrapper(bodyHtml: string): string {
  return `<div style="font-family:Arial,Helvetica,sans-serif;background:#f7f5f2;padding:32px 16px;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;border-radius:8px;overflow:hidden;">
      <div style="background:#000000;padding:24px;text-align:center;">
        <span style="color:#ffffff;font-size:13px;letter-spacing:3px;text-transform:uppercase;">${BRAND}</span>
      </div>
      <div style="padding:32px 24px;color:#111111;font-size:14px;line-height:1.6;">
        ${bodyHtml}
      </div>
    </div>
  </div>`;
}

function ctaButton(url: string, label: string): string {
  return `<p style="text-align:center;margin:28px 0;">
    <a href="${url}" style="background:#000000;color:#ffffff;padding:12px 28px;border-radius:999px;text-decoration:none;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;">${label}</a>
  </p>`;
}

export function verificationEmail(name: string, token: string) {
  const baseUrl = getAppBaseUrl();
  const url = `${baseUrl}/cuenta/verificar-email?token=${token}`;
  return {
    subject: "Confirmá tu correo — Radaelli Swimwear",
    html: wrapper(`
      <p>Hola ${name},</p>
      <p>Gracias por crear tu cuenta en ${BRAND}. Confirmá tu correo para activarla del todo:</p>
      ${ctaButton(url, "Confirmar correo")}
      <p style="color:#666666;font-size:12px;">Si no creaste esta cuenta, podés ignorar este correo.</p>
    `),
  };
}

export function passwordResetEmail(name: string, token: string) {
  const baseUrl = getAppBaseUrl();
  const url = `${baseUrl}/cuenta/restablecer-contrasena?token=${token}`;
  return {
    subject: "Restablecé tu contraseña — Radaelli Swimwear",
    html: wrapper(`
      <p>Hola ${name},</p>
      <p>Pediste restablecer tu contraseña. Este enlace vale por 30 minutos y solo se puede usar una vez:</p>
      ${ctaButton(url, "Restablecer contraseña")}
      <p style="color:#666666;font-size:12px;">Si no lo pediste vos, ignorá este correo — tu contraseña actual sigue funcionando.</p>
    `),
  };
}

export function passwordChangedEmail(name: string) {
  return {
    subject: "Tu contraseña cambió — Radaelli Swimwear",
    html: wrapper(`
      <p>Hola ${name},</p>
      <p>Tu contraseña se actualizó correctamente y cerramos tu sesión en todos los dispositivos por seguridad.</p>
      <p style="color:#666666;font-size:12px;">Si no fuiste vos quien hizo este cambio, respondé este correo de inmediato.</p>
    `),
  };
}

export function welcomeEmail(name: string) {
  return {
    subject: `Bienvenida a ${BRAND}`,
    html: wrapper(`
      <p>Hola ${name},</p>
      <p>Tu cuenta ya está lista. Desde "Mi cuenta" vas a poder ver tus pedidos, guardar direcciones y más.</p>
    `),
  };
}

// "Avísame cuando vuelva" (Fase 2, P2): se dispara desde
// lib/email/back-in-stock-notifications.ts cuando updateVariantStockAction
// detecta que una talla pasó de 0 a stock disponible. El link preserva la
// talla como query param (?talla=) que app/producto/[slug]/page.tsx lee
// para preseleccionarla — el color no hace falta preservarlo aparte porque
// ya es parte del producto/slug al que apunta el link.
export function backInStockEmail(
  name: string | null,
  productName: string,
  productColor: string,
  size: string,
  priceLabel: string,
  imageUrl: string,
  productUrl: string,
): { subject: string; html: string } {
  return {
    subject: "¡Volvió tu Radaelli! 🤍",
    html: wrapper(`
      <p>Hola${name ? ` ${escapeHtml(name)}` : ""},</p>
      <p><strong>${escapeHtml(productName)} ${escapeHtml(productColor)}</strong> volvió a estar disponible.</p>
      <p>Tu talla <strong>${escapeHtml(size)}</strong> ya está nuevamente en stock.</p>
      <div style="text-align:center;margin:20px 0;">
        <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(productName)}" width="220" style="border-radius:8px;max-width:100%;height:auto;" />
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:8px;">
        <tr><td style="padding:2px 0;color:#666;">Producto</td><td style="padding:2px 0;text-align:right;">${escapeHtml(productName)}</td></tr>
        <tr><td style="padding:2px 0;color:#666;">Color</td><td style="padding:2px 0;text-align:right;">${escapeHtml(productColor)}</td></tr>
        <tr><td style="padding:2px 0;color:#666;">Talla</td><td style="padding:2px 0;text-align:right;">${escapeHtml(size)}</td></tr>
        <tr><td style="padding:2px 0;color:#666;">Precio</td><td style="padding:2px 0;text-align:right;font-weight:600;">${escapeHtml(priceLabel)}</td></tr>
      </table>
      ${ctaButton(productUrl, "Comprar ahora")}
      <p style="color:#666666;font-size:12px;">Las unidades son limitadas — si mucha gente estaba esperando esta talla, se puede volver a agotar rápido.</p>
    `),
  };
}

// Notificación interna (a los admins, no a la clienta) de una nueva
// suscripción al newsletter — antes, la única forma de enterarse era
// entrar manualmente a /admin/newsletter a mirar si el contador subió.
export function newSubscriberEmail(subscriberEmail: string): {
  subject: string;
  html: string;
} {
  return {
    subject: "Nueva suscriptora al newsletter — Radaelli Swimwear",
    html: wrapper(`
      <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#c65b4e;">Newsletter</p>
      <h2 style="margin:0 0 16px;font-size:20px;">Nueva suscripción</h2>
      <p>Alguien se suscribió a las novedades de ${BRAND}:</p>
      <p style="font-weight:600;">${escapeHtml(subscriberEmail)}</p>
      <p style="color:#666666;font-size:12px;">Podés ver el total de suscriptoras activas en el panel de administración, sección Newsletter.</p>
    `),
  };
}

const PAYMENT_STATE_LABEL: Record<string, string> = {
  succeeded: "Aprobado",
  pending: "Pendiente",
  failed: "Rechazado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

// Único email administrativo de "pedido nuevo" (Sprint 30) — se manda una
// sola vez por pedido, justo después de crearlo (ver createOrderAction en
// lib/orders/orders-actions.ts), nunca desde el navegador ni por un simple
// redirect a la página de éxito. Cubre tanto un pago real aprobado con
// Wompi como un pedido coordinado por WhatsApp (Payment.provider
// "whatsapp"), dejando bien claro en el asunto y en "Estado del pago" cuál
// es cuál — nunca dice "Aprobado" para un pago que todavía no lo está.
export function adminNewOrderEmail(
  order: Order,
  freeShippingThreshold: number,
): { subject: string; html: string } {
  const { date, time } = formatOrderDateTime(order.date);
  const address = order.shippingAddress;
  const payment = order.payment;
  const isWhatsapp = payment?.provider === "whatsapp";
  const paymentStateLabel = isWhatsapp
    ? "Pendiente de coordinar por WhatsApp"
    : (payment?.status && PAYMENT_STATE_LABEL[payment.status]) || "Desconocido";

  const subtotal = order.subtotal ?? order.total;
  const discount = order.discountValue ?? 0;
  const freeShipping = qualifiesForFreeShipping(
    subtotal,
    discount,
    freeShippingThreshold,
  );
  const shippingLabel = freeShipping ? "Gratis" : "Por confirmar con el cliente";

  const whatsappUrl = address?.phone
    ? buildCustomerWhatsappUrl(
        address.phone,
        `Hola ${address.fullName.split(" ")[0] ?? ""}, somos Radaelli Swimwear 🤍. Recibimos correctamente tu pedido #${order.orderNumber}. Te contactamos para coordinar los detalles de tu entrega.`,
      )
    : null;

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eeeeee;vertical-align:top;width:56px;">
          <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" width="48" height="48" style="border-radius:6px;object-fit:cover;display:block;" />
        </td>
        <td style="padding:10px 0 10px 12px;border-bottom:1px solid #eeeeee;vertical-align:top;">
          <p style="margin:0;font-weight:600;">${escapeHtml(item.name)}</p>
          <p style="margin:2px 0 0;color:#666666;font-size:12px;">
            ${[
              item.collection,
              item.color,
              `Talla ${item.size}`,
              `Cant. ${item.quantity}`,
              item.sku ? `SKU ${item.sku}` : null,
            ]
              .filter(Boolean)
              .map(escapeHtml)
              .join(" · ")}
          </p>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #eeeeee;vertical-align:top;text-align:right;white-space:nowrap;">
          ${formatPrice(item.priceValue * item.quantity)}
        </td>
      </tr>`,
    )
    .join("");

  const html = wrapper(`
    <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#c65b4e;">Nueva compra</p>
    <h2 style="margin:0 0 20px;font-size:20px;">Pedido #${order.orderNumber}</h2>

    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
      <tr><td style="padding:3px 0;color:#666;">Fecha</td><td style="padding:3px 0;text-align:right;">${date}</td></tr>
      <tr><td style="padding:3px 0;color:#666;">Hora</td><td style="padding:3px 0;text-align:right;">${time} (Colombia)</td></tr>
      <tr><td style="padding:3px 0;color:#666;">Estado del pedido</td><td style="padding:3px 0;text-align:right;">${order.fulfillmentStatus}</td></tr>
      <tr><td style="padding:3px 0;color:#666;">Estado del pago</td><td style="padding:3px 0;text-align:right;font-weight:600;">${paymentStateLabel}</td></tr>
      ${payment ? `<tr><td style="padding:3px 0;color:#666;">Referencia Wompi</td><td style="padding:3px 0;text-align:right;">${payment.transactionId}</td></tr>` : ""}
    </table>

    <h3 style="margin:0 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Cliente</h3>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
      <tr><td style="padding:2px 0;color:#666;width:110px;">Nombre</td><td style="padding:2px 0;">${escapeHtml(address?.fullName) || "—"}</td></tr>
      <tr><td style="padding:2px 0;color:#666;">Correo</td><td style="padding:2px 0;">${escapeHtml(address?.email) || "—"}</td></tr>
      <tr><td style="padding:2px 0;color:#666;">WhatsApp</td><td style="padding:2px 0;">${escapeHtml(address?.phone) || "—"}</td></tr>
      <tr><td style="padding:2px 0;color:#666;">Dirección</td><td style="padding:2px 0;">${escapeHtml(address?.street) || "—"}${address?.apartmentDetails ? `, ${escapeHtml(address.apartmentDetails)}` : ""}</td></tr>
      <tr><td style="padding:2px 0;color:#666;">Barrio</td><td style="padding:2px 0;">${escapeHtml(address?.neighborhood) || "—"}</td></tr>
      <tr><td style="padding:2px 0;color:#666;">Ciudad</td><td style="padding:2px 0;">${escapeHtml(address?.city) || "—"}, ${escapeHtml(address?.province) || "—"}</td></tr>
      <tr><td style="padding:2px 0;color:#666;">País</td><td style="padding:2px 0;">${escapeHtml(address?.country) || "—"}</td></tr>
      ${address?.deliveryNotes ? `<tr><td style="padding:2px 0;color:#666;">Indicaciones</td><td style="padding:2px 0;">${escapeHtml(address.deliveryNotes)}</td></tr>` : ""}
    </table>

    ${whatsappUrl ? ctaButton(whatsappUrl, "Contactar por WhatsApp") : ""}

    <h3 style="margin:20px 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Productos</h3>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      ${itemsHtml}
    </table>

    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:16px;">
      <tr><td style="padding:2px 0;color:#666;">Subtotal</td><td style="padding:2px 0;text-align:right;">${formatPrice(subtotal)}</td></tr>
      ${discount > 0 ? `<tr><td style="padding:2px 0;color:#666;">Descuento${order.couponCode ? ` (${escapeHtml(order.couponCode)})` : ""}</td><td style="padding:2px 0;text-align:right;">-${formatPrice(discount)}</td></tr>` : ""}
      <tr><td style="padding:2px 0;color:#666;">Envío</td><td style="padding:2px 0;text-align:right;">${shippingLabel}</td></tr>
      <tr><td style="padding:8px 0 0;font-weight:700;border-top:1px solid #eeeeee;">${freeShipping ? "Total pagado" : "Total productos"}</td><td style="padding:8px 0 0;text-align:right;font-weight:700;border-top:1px solid #eeeeee;">${formatPrice(order.total)} COP</td></tr>
    </table>
  `);

  const subject = `Nueva compra Radaelli Swimwear — Pedido #${order.orderNumber} — ${formatPrice(order.total)}`;
  return { subject, html };
}

// ============================================================================
// Portado desde propuesta/categorias-colecciones-NO-APLICAR (commits
// 510e50c, 8bc7471, 92f9e0b) — solo la plantilla, sin ningún cambio de
// categorías/colecciones de esa rama. El wiring real (cuándo/desde dónde se
// llama) se agregó en esta rama, en lib/email/order-notifications.ts y
// lib/orders/order-creation-core.ts, no acá.
//
// CUÁNDO es seguro mandar este correo diciendo "tu pago fue aprobado"
// (y cuándo NO) — leído el código real, no supuesto:
//
// 1) Pedido con TARJETA (Wompi): createOrderForPayment (lib/orders/
//    order-creation-core.ts) tiene esta guarda ANTES de crear cualquier
//    fila Order:
//
//      } else if (payment.status !== "SUCCEEDED") {
//        throw new Error("Este pago todavía no fue aprobado.");
//      }
//
//    Es decir: para un pago con tarjeta, la fila Order NUNCA llega a
//    existir a menos que Payment.status ya sea "SUCCEEDED" en ese
//    instante. Conclusión: en el momento exacto en que createOrderForPayment
//    termina su transacción (justo donde se llama a notifyAdminsOfNewOrder)
//    — "pedido recibido" y "pago confirmado" son la MISMA cosa para
//    tarjeta. Ahí es seguro llamar a esta plantilla diciendo "tu pago fue
//    aprobado".
//
// 2) Pedido por WHATSAPP (sin tarjeta): la MISMA función, unas líneas
//    antes, exige Payment.status === "PENDING" — NUNCA "SUCCEEDED". No hay
//    ningún cobro real todavía. Por eso esta plantilla, para
//    order.payment?.provider === "whatsapp", NUNCA dice "tu pago fue
//    aprobado" — dice que el pedido se recibió y que la tienda va a
//    escribir para coordinar el pago y la entrega.
// ============================================================================
type ResultadoDePago =
  | { tipo: "whatsapp" }
  | { tipo: "aprobado" }
  | { tipo: "pendiente" }
  | { tipo: "rechazado" }
  | { tipo: "reembolsado" }
  | { tipo: "simulado" }
  | { tipo: "sin_pago" };

function resolverResultadoDePago(payment: Order["payment"]): ResultadoDePago {
  if (!payment) return { tipo: "sin_pago" };
  if (payment.provider === "whatsapp") return { tipo: "whatsapp" };
  if (IS_SIMULATED_PROVIDER[payment.provider]) return { tipo: "simulado" };

  switch (payment.status) {
    case "succeeded":
      return { tipo: "aprobado" };
    case "pending":
      return { tipo: "pendiente" };
    case "failed":
    case "cancelled":
      return { tipo: "rechazado" };
    case "refunded":
      return { tipo: "reembolsado" };
    default:
      // Cualquier valor futuro de PaymentStatus que no se haya
      // contemplado todavía: nunca afirmar un cobro por default.
      return { tipo: "pendiente" };
  }
}

export function customerOrderConfirmationEmail(order: Order): {
  subject: string;
  html: string;
} {
  const baseUrl = getAppBaseUrl();
  const { date } = formatOrderDateTime(order.date);
  const address = order.shippingAddress;
  const resultadoDePago = resolverResultadoDePago(order.payment);
  const firstName = address?.fullName?.split(" ")[0] ?? "";

  const subtotal = order.subtotal ?? order.total;
  const discount = order.discountValue ?? 0;

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #eeeeee;vertical-align:top;width:56px;">
          <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" width="48" height="48" style="border-radius:6px;object-fit:cover;display:block;" />
        </td>
        <td style="padding:10px 0 10px 12px;border-bottom:1px solid #eeeeee;vertical-align:top;">
          <p style="margin:0;font-weight:600;">${escapeHtml(item.name)}</p>
          <p style="margin:2px 0 0;color:#666666;font-size:12px;">
            ${[
              item.collection,
              item.color,
              `Talla ${item.size}`,
              `Cant. ${item.quantity}`,
            ]
              .filter(Boolean)
              .map(escapeHtml)
              .join(" · ")}
          </p>
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #eeeeee;vertical-align:top;text-align:right;white-space:nowrap;">
          ${formatPrice(item.priceValue * item.quantity)}
        </td>
      </tr>`,
    )
    .join("");

  const whatsappSupportUrl = SOCIAL_LINKS.find(
    (link) => link.key === "whatsapp",
  )?.href;

  // Copy por estado — ninguna rama afirma un cobro que no corresponda.
  const COPY_POR_ESTADO: Record<
    ResultadoDePago["tipo"],
    { eyebrow: string; intro: string }
  > = {
    whatsapp: {
      eyebrow: "Pedido recibido",
      intro: `Recibimos tu pedido <strong>#${order.orderNumber}</strong> del ${date}. Nuestro equipo te va a escribir por WhatsApp para coordinar el pago y la entrega — todavía no te cobramos nada.`,
    },
    aprobado: {
      eyebrow: "Pedido confirmado",
      intro: `Tu pago fue aprobado y tu pedido <strong>#${order.orderNumber}</strong> del ${date} ya está confirmado.`,
    },
    pendiente: {
      eyebrow: "Pedido recibido",
      intro: `Recibimos tu pedido <strong>#${order.orderNumber}</strong> del ${date}. Aún no tenemos confirmación del pago — no te cobramos nada hasta que se confirme.`,
    },
    rechazado: {
      eyebrow: "Pago no confirmado",
      intro: `Tu pedido <strong>#${order.orderNumber}</strong> del ${date} no pudo confirmarse: el pago quedó rechazado o cancelado.`,
    },
    reembolsado: {
      eyebrow: "Reembolso registrado",
      intro: `El estado de tu pedido <strong>#${order.orderNumber}</strong> del ${date} se actualizó a "reembolsado" en nuestro sistema.`,
    },
    simulado: {
      eyebrow: "Pedido de prueba",
      intro: `Este es un pedido de prueba (pasarela de pagos en modo simulado) — no se realizó ningún cobro real por el pedido <strong>#${order.orderNumber}</strong>.`,
    },
    sin_pago: {
      eyebrow: "Pedido recibido",
      intro: `Recibimos tu pedido <strong>#${order.orderNumber}</strong> del ${date}. Nos vamos a poner en contacto con más información.`,
    },
  };
  const { eyebrow, intro } = COPY_POR_ESTADO[resultadoDePago.tipo];
  const introHtml = `<p>${intro}</p>`;

  const html = wrapper(`
    <p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#c65b4e;">${escapeHtml(eyebrow)}</p>
    <h2 style="margin:0 0 16px;font-size:20px;">¡Gracias por tu compra${firstName ? `, ${escapeHtml(firstName)}` : ""}!</h2>
    ${introHtml}

    <h3 style="margin:20px 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Productos</h3>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      ${itemsHtml}
    </table>

    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-top:16px;">
      <tr><td style="padding:2px 0;color:#666;">Subtotal</td><td style="padding:2px 0;text-align:right;">${formatPrice(subtotal)}</td></tr>
      ${discount > 0 ? `<tr><td style="padding:2px 0;color:#666;">Descuento${order.couponCode ? ` (${escapeHtml(order.couponCode)})` : ""}</td><td style="padding:2px 0;text-align:right;">-${formatPrice(discount)}</td></tr>` : ""}
      <tr><td style="padding:8px 0 0;font-weight:700;border-top:1px solid #eeeeee;">Total</td><td style="padding:8px 0 0;text-align:right;font-weight:700;border-top:1px solid #eeeeee;">${formatPrice(order.total)} COP</td></tr>
    </table>

    ${
      address
        ? `<h3 style="margin:20px 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:0.5px;">Enviamos a</h3>
    <p style="margin:0;font-size:13px;color:#444444;">
      ${escapeHtml(address.fullName)}<br />
      ${escapeHtml(address.street)}${address.apartmentDetails ? `, ${escapeHtml(address.apartmentDetails)}` : ""}<br />
      ${escapeHtml(address.neighborhood)}, ${escapeHtml(address.city)}, ${escapeHtml(address.province)}
    </p>`
        : ""
    }

    ${ctaButton(`${baseUrl}/checkout/confirmacion/${order.id}`, "Ver mi pedido")}

    <p style="color:#666666;font-size:12px;">
      ¿Dudas con tu compra? Escribinos${whatsappSupportUrl ? ` <a href="${whatsappSupportUrl}" style="color:#111111;">por WhatsApp</a>` : ""}
      o mirá nuestra <a href="${baseUrl}/envios" style="color:#111111;">política de envíos</a> y
      <a href="${baseUrl}/devoluciones" style="color:#111111;">de devoluciones</a>.
    </p>

    <!--
      PLACEHOLDER explícito: dirección física real de la tienda — no existe
      en ningún lugar del código hoy (se buscó), así que NO se inventó una.
      Completar antes de activar el envío real de este correo si la dueña
      quiere incluirla (algunos proveedores de email/anti-spam la piden en
      correos comerciales). Se deja comentada (no se imprime) para no
      mostrarle a ninguna clienta un placeholder visible.
      <p style="color:#999999;font-size:11px;">[dirección de la tienda]</p>
    -->
  `);

  const SUBJECT_POR_ESTADO: Record<ResultadoDePago["tipo"], string> = {
    whatsapp: `Recibimos tu pedido #${order.orderNumber} — Radaelli Swimwear`,
    aprobado: `Pedido confirmado #${order.orderNumber} — Radaelli Swimwear`,
    pendiente: `Recibimos tu pedido #${order.orderNumber} — Radaelli Swimwear`,
    rechazado: `Tu pedido #${order.orderNumber} no pudo confirmarse — Radaelli Swimwear`,
    reembolsado: `Reembolso registrado para tu pedido #${order.orderNumber} — Radaelli Swimwear`,
    simulado: `[Prueba] Pedido #${order.orderNumber} — Radaelli Swimwear`,
    sin_pago: `Recibimos tu pedido #${order.orderNumber} — Radaelli Swimwear`,
  };
  const subject = SUBJECT_POR_ESTADO[resultadoDePago.tipo];

  return { subject, html };
}
