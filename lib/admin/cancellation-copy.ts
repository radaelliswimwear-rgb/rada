// P0 admin operativo (proceso de septiembre 2026, sección 8): copy de
// confirmación compartido entre order-detail.tsx y orders-table.tsx, para
// que el mensaje sea idéntico sin importar desde dónde se cancele un
// pedido. Lógica pura -- sin JSX, sin window.confirm acá, eso lo dispara
// cada componente.
export function buildCancelConfirmationMessage(
  paymentStatus: string | undefined,
): string {
  const lines = [
    "¿Cancelar este pedido?",
    "",
    "Cancelar el pedido NO reembolsa automáticamente el pago de Wompi.",
  ];
  if (paymentStatus === "succeeded") {
    lines.push(
      "",
      "Este pedido tiene un pago aprobado. Después de cancelarlo deberás resolver el reembolso por separado.",
    );
  }
  return lines.join("\n");
}

// Auditoría go-live (sep. 2026): "Reembolsado" queda tan bloqueado como
// "Cancelado" (lib/admin/fulfillment-rules.ts trata ambos como estados
// terminales -- ninguna transición posterior es posible desde el panel una
// vez ahí), pero a diferencia de "Cancelado" no tenía ningún paso de
// confirmación: un solo click/tap en el <select> lo aplicaba de inmediato
// y de forma irreversible. Mismo criterio exacto que
// buildCancelConfirmationMessage de arriba -- lógica pura, sin
// window.confirm acá.
export function buildRefundConfirmationMessage(
  paymentStatus: string | undefined,
): string {
  const lines = [
    "¿Marcar este pedido como reembolsado?",
    "",
    "Esta acción queda bloqueada: una vez reembolsado, el pedido no se puede mover a ningún otro estado desde el panel.",
  ];
  if (paymentStatus !== "succeeded") {
    lines.push(
      "",
      "Este pedido no tiene un pago aprobado registrado -- confirmá que corresponde marcarlo como reembolsado antes de continuar.",
    );
  }
  return lines.join("\n");
}
