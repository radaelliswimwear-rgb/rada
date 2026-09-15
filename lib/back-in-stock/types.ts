// alreadyRequested: true cuando ya existía una solicitud PENDING para esa
// combinación producto+talla+correo — no se creó una fila nueva, pero
// igual es un resultado exitoso (la clienta ya está en la lista).
export type BackInStockRequestResult =
  | { success: true; alreadyRequested: boolean }
  | { success: false; error: string };
