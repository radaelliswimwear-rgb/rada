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
