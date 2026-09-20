import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildStagingMockUploadResult,
  isCloudinaryStagingMockActive,
} from "./staging-mock-upload";

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

test("isCloudinaryStagingMockActive: staging sin ninguna credencial -- activo", () => {
  withEnv(
    {
      APP_ENVIRONMENT: "staging",
      CLOUDINARY_CLOUD_NAME: undefined,
      CLOUDINARY_API_KEY: undefined,
      CLOUDINARY_API_SECRET: undefined,
    },
    () => {
      assert.equal(isCloudinaryStagingMockActive(), true);
    },
  );
});

test("isCloudinaryStagingMockActive: staging con las 3 credenciales -- inactivo (usa Cloudinary real)", () => {
  withEnv(
    {
      APP_ENVIRONMENT: "staging",
      CLOUDINARY_CLOUD_NAME: "algun-cloud",
      CLOUDINARY_API_KEY: "algun-key",
      CLOUDINARY_API_SECRET: "algun-secret",
    },
    () => {
      assert.equal(isCloudinaryStagingMockActive(), false);
    },
  );
});

test("isCloudinaryStagingMockActive: staging con solo 2 de las 3 credenciales -- sigue activo (fail closed)", () => {
  withEnv(
    {
      APP_ENVIRONMENT: "staging",
      CLOUDINARY_CLOUD_NAME: "algun-cloud",
      CLOUDINARY_API_KEY: "algun-key",
      CLOUDINARY_API_SECRET: undefined,
    },
    () => {
      assert.equal(isCloudinaryStagingMockActive(), true);
    },
  );
});

test("isCloudinaryStagingMockActive: production -- siempre inactivo, aunque falten las credenciales", () => {
  withEnv(
    {
      APP_ENVIRONMENT: "production",
      CLOUDINARY_CLOUD_NAME: undefined,
      CLOUDINARY_API_KEY: undefined,
      CLOUDINARY_API_SECRET: undefined,
    },
    () => {
      assert.equal(isCloudinaryStagingMockActive(), false);
    },
  );
});

test("isCloudinaryStagingMockActive: development -- siempre inactivo", () => {
  withEnv(
    {
      APP_ENVIRONMENT: "development",
      CLOUDINARY_CLOUD_NAME: undefined,
      CLOUDINARY_API_KEY: undefined,
      CLOUDINARY_API_SECRET: undefined,
    },
    () => {
      assert.equal(isCloudinaryStagingMockActive(), false);
    },
  );
});

test("buildStagingMockUploadResult: usa un dominio .invalid (nunca resuelve a nada real)", () => {
  const result = buildStagingMockUploadResult({
    folder: "staging/lago/products",
    extension: "jpg",
    width: 800,
    height: 600,
  });
  assert.match(
    result.secure_url,
    /^https:\/\/staging-mock\.radaelliswimwear\.invalid\//,
  );
  assert.match(result.public_id, /^staging\/lago\/products\/staging-mock-/);
  assert.equal(result.width, 800);
  assert.equal(result.height, 600);
});

test("buildStagingMockUploadResult: cada llamada genera un public_id distinto (no colisiona)", () => {
  const a = buildStagingMockUploadResult({
    folder: "staging/lago/products",
    extension: "jpg",
    width: 100,
    height: 100,
  });
  const b = buildStagingMockUploadResult({
    folder: "staging/lago/products",
    extension: "jpg",
    width: 100,
    height: 100,
  });
  assert.notEqual(a.public_id, b.public_id);
  assert.notEqual(a.secure_url, b.secure_url);
});
