import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveCloudinaryFolder } from "./staging-folder";

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

test("APP_ENVIRONMENT=staging -- prefija con staging/", () => {
  withEnv({ APP_ENVIRONMENT: "staging" }, () => {
    assert.equal(
      resolveCloudinaryFolder("lago/products"),
      "staging/lago/products",
    );
    assert.equal(resolveCloudinaryFolder("lago/home"), "staging/lago/home");
    assert.equal(
      resolveCloudinaryFolder("lago/categories"),
      "staging/lago/categories",
    );
  });
});

test("APP_ENVIRONMENT=production -- carpeta sin cambios (comportamiento preexistente)", () => {
  withEnv({ APP_ENVIRONMENT: "production" }, () => {
    assert.equal(resolveCloudinaryFolder("lago/products"), "lago/products");
  });
});

test("APP_ENVIRONMENT=development -- carpeta sin cambios", () => {
  withEnv({ APP_ENVIRONMENT: "development" }, () => {
    assert.equal(resolveCloudinaryFolder("lago/products"), "lago/products");
  });
});

test("APP_ENVIRONMENT ausente -- carpeta sin cambios (mismo comportamiento que antes de este cambio)", () => {
  withEnv({ APP_ENVIRONMENT: undefined }, () => {
    assert.equal(resolveCloudinaryFolder("lago/products"), "lago/products");
  });
});
