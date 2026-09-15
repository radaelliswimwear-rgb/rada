import { headers } from "next/headers";

// Vercel (y la mayoría de proxies delante de Next.js) ponen la IP real del
// visitante en `x-forwarded-for` — puede traer una lista "cliente, proxy1,
// proxy2"; el primer valor es el del visitante. Se usa solo como
// identificador de rate limiting (lib/auth/rate-limit.ts), nunca para
// decisiones de autorización — no hay forma de verificar criptográficamente
// que ese header no fue falsificado por quien hace la petición directo
// (fuera de la red de Vercel), así que el peor caso es un límite que no
// aplica bien, no un bypass de seguridad real.
export async function getClientIp(): Promise<string> {
  const store = await headers();
  const forwardedFor = store.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = store.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}
