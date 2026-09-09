// crypto.randomUUID() existe solo en "contextos seguros" (HTTPS o
// localhost) — los navegadores lo bloquean a propósito en HTTP plano
// servido desde otra IP (ej. entrar por la red local desde el celular a
// http://192.168.x.x:3000, como en desarrollo). Ahí crypto.randomUUID ni
// siquiera existe como función, así que llamarlo tira un TypeError sin
// capturar que tumba toda la página (bug real: <LiveViewers>, registro de
// usuario y recuperar contraseña lo llamaban directo). Esto no necesita
// ser criptográficamente fuerte (son IDs de sesión/tokens de demo, no
// claves de verdad), así que alcanza con un generador manual como reserva.
export function randomId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}
