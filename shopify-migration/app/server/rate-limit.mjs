/**
 * Rate limit por clienta con token bucket EN MEMORIA.
 *
 * Es "best effort": la función no tiene base de datos (decisión 02L), así
 * que cada instancia lleva su propia cuenta y un reinicio la borra. Con N
 * instancias el límite efectivo es N veces el configurado. La protección de
 * fondo sigue siendo el throttle de la Admin API (REPORT § 14).
 *
 * La clave NO es el id de la clienta: es su correlativo con sal por proceso
 * (logger.mjs), así la memoria tampoco guarda ids reales.
 */
export function createRateLimiter({ burst, perMinute, maxKeys = 10_000, nowMs = Date.now }) {
  const buckets = new Map();
  const refillPerMs = perMinute / 60_000;

  return {
    /** @returns {{ok: boolean, retryAfterSec: number}} */
    take(key) {
      const now = nowMs();
      const bucket = buckets.get(key) ?? { tokens: burst, updatedAt: now };
      const elapsed = Math.max(0, now - bucket.updatedAt);
      bucket.tokens = Math.min(burst, bucket.tokens + elapsed * refillPerMs);
      bucket.updatedAt = now;

      // Orden de inserción = uso reciente: se re-inserta y se descarta el más viejo.
      buckets.delete(key);
      buckets.set(key, bucket);
      if (buckets.size > maxKeys) buckets.delete(buckets.keys().next().value);

      if (bucket.tokens >= 1) {
        bucket.tokens -= 1;
        return { ok: true, retryAfterSec: 0 };
      }
      return { ok: false, retryAfterSec: Math.max(1, Math.ceil((1 - bucket.tokens) / refillPerMs / 1000)) };
    },
    get size() {
      return buckets.size;
    },
  };
}
