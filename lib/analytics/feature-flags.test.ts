import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isAnalyticsRuntimeEnabled,
  isBrowserAnalyticsEnabled,
  isServerDeliveryEnabled,
} from "./feature-flags";

// Mismo patrón que lib/utils.app-base-url.test.ts: estas funciones leen
// process.env directo, sin cachear nada a nivel de módulo, así que cada
// test puede fijar/restaurar las variables libremente.
function withEnv<T>(vars: Record<string, string | undefined>, fn: () => T): T {
  const previous: Record<string, string | undefined> = {};
  for (const key of Object.keys(vars)) previous[key] = process.env[key];
  for (const [key, value] of Object.entries(vars)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    return fn();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

const ALL_FLAGS = [
  "ANALYTICS_RUNTIME_ENABLED",
  "ANALYTICS_BROWSER_ENABLED",
  "ANALYTICS_SERVER_DELIVERY_ENABLED",
];

// X. feature flags default OFF.
test("X: sin ninguna variable definida -> los 3 flags dan false", () => {
  withEnv(Object.fromEntries(ALL_FLAGS.map((k) => [k, undefined])), () => {
    assert.equal(isAnalyticsRuntimeEnabled(), false);
    assert.equal(isBrowserAnalyticsEnabled(), false);
    assert.equal(isServerDeliveryEnabled(), false);
  });
});

test("X: valores distintos de 'true' exacto (typos, '1', 'false') -> false", () => {
  for (const bad of ["1", "false", "TRUE", "yes", ""]) {
    withEnv({ ANALYTICS_RUNTIME_ENABLED: bad }, () => {
      assert.equal(isAnalyticsRuntimeEnabled(), false, `valor: ${bad}`);
    });
  }
});

test("maestro apagado bloquea los sub-flags aunque ellos digan 'true'", () => {
  withEnv(
    {
      ANALYTICS_RUNTIME_ENABLED: "false",
      ANALYTICS_BROWSER_ENABLED: "true",
      ANALYTICS_SERVER_DELIVERY_ENABLED: "true",
    },
    () => {
      assert.equal(isBrowserAnalyticsEnabled(), false);
      assert.equal(isServerDeliveryEnabled(), false);
    },
  );
});

test("maestro prendido pero sub-flag apagado -> ese canal sigue false", () => {
  withEnv(
    {
      ANALYTICS_RUNTIME_ENABLED: "true",
      ANALYTICS_BROWSER_ENABLED: "true",
      ANALYTICS_SERVER_DELIVERY_ENABLED: undefined,
    },
    () => {
      assert.equal(isBrowserAnalyticsEnabled(), true);
      assert.equal(isServerDeliveryEnabled(), false);
    },
  );
});

test("los 3 prendidos explícitamente -> todo true", () => {
  withEnv(
    {
      ANALYTICS_RUNTIME_ENABLED: "true",
      ANALYTICS_BROWSER_ENABLED: "true",
      ANALYTICS_SERVER_DELIVERY_ENABLED: "true",
    },
    () => {
      assert.equal(isAnalyticsRuntimeEnabled(), true);
      assert.equal(isBrowserAnalyticsEnabled(), true);
      assert.equal(isServerDeliveryEnabled(), true);
    },
  );
});
