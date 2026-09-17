import { test } from "node:test";
import assert from "node:assert/strict";
import {
  computeInternalTrafficStatus,
  isActivationTokenUsable,
  marketingExclusionReasonFor,
} from "./status";

const NOW = new Date("2026-01-01T12:00:00.000Z");

// Fase 0 de analytics (tráfico interno): lógica pura, sin DB ni cookies()
// reales -- ver el comentario en status.ts sobre por qué vive separada de
// resolve.ts.

// A. Sin cookie (device === null, lo que devuelve resolveInternalTraffic
// cuando no hay token en absoluto) -> no interno.
test("A: sin dispositivo (sin cookie) -> isInternal false", () => {
  assert.deepEqual(computeInternalTrafficStatus(null), { isInternal: false });
});

// E. Cookie válida que coincide con un dispositivo activo -> interno.
test("E: dispositivo encontrado y no revocado -> isInternal true, con deviceId", () => {
  const result = computeInternalTrafficStatus({
    id: "device_1",
    revokedAt: null,
  });
  assert.deepEqual(result, { isInternal: true, deviceId: "device_1" });
});

// F. Cookie inventada/manipulada: no hay fila que coincida con ese hash, así
// que resolveInternalTraffic pasa null acá -- mismo caso que A.
test("F: cookie manipulada (ningún dispositivo coincide) -> isInternal false", () => {
  assert.deepEqual(computeInternalTrafficStatus(null), { isInternal: false });
});

// G. Dispositivo revocado desde /admin -> ya no cuenta como interno, aunque
// la fila y la cookie sigan existiendo.
test("G: dispositivo revocado -> isInternal false", () => {
  const result = computeInternalTrafficStatus({
    id: "device_1",
    revokedAt: new Date("2026-01-01T00:00:00.000Z"),
  });
  assert.deepEqual(result, { isInternal: false });
});

// I/J: el mapeo a Payment.marketingExclusionReason.
test("I: visitante normal -> marketingExclusionReason null", () => {
  assert.equal(
    marketingExclusionReasonFor({ isInternal: false }),
    null,
  );
});

test("J: dispositivo interno -> marketingExclusionReason 'internal_traffic'", () => {
  assert.equal(
    marketingExclusionReasonFor({ isInternal: true, deviceId: "device_1" }),
    "internal_traffic",
  );
});

// B. Token de activación válido (no usado, no vencido) -> se puede consumir.
test("B: token válido (sin usar, sin vencer) -> usable", () => {
  const usable = isActivationTokenUsable(
    {
      usedAt: null,
      expiresAt: new Date("2026-01-01T12:30:00.000Z"), // 30 min después de NOW
    },
    NOW,
  );
  assert.equal(usable, true);
});

// C. Token ya consumido -> rechazado, aunque no haya vencido todavía.
test("C: token ya usado -> no usable, aunque no haya vencido", () => {
  const usable = isActivationTokenUsable(
    {
      usedAt: new Date("2026-01-01T11:00:00.000Z"),
      expiresAt: new Date("2026-01-01T12:30:00.000Z"),
    },
    NOW,
  );
  assert.equal(usable, false);
});

// D. Token vencido -> rechazado, aunque nunca se haya usado.
test("D: token vencido -> no usable, aunque nunca se haya usado", () => {
  const usable = isActivationTokenUsable(
    {
      usedAt: null,
      expiresAt: new Date("2026-01-01T11:59:00.000Z"), // 1 min antes de NOW
    },
    NOW,
  );
  assert.equal(usable, false);
});

test("token inexistente (ningún registro con ese hash) -> no usable", () => {
  assert.equal(isActivationTokenUsable(null, NOW), false);
});
