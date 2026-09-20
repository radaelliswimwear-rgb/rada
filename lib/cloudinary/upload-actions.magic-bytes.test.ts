import { test, mock } from "node:test";
import assert from "node:assert/strict";

// Auditoría de seguridad (sep. 2026, hardening P2/P3): prueba de integración
// de uploadProductImageAction con la validación de magic bytes -- un SVG
// disfrazado con Content-Type "image/png" (el ataque real que la auditoría
// encontró: un admin, o alguien que llame la Server Action directo con el
// Next-Action-Id público del bundle, podía subir cualquier archivo mientras
// declarara un Content-Type de imagen) NUNCA debe llegar a Cloudinary.
//
// Cómo correrlo:
//   node --experimental-test-module-mocks --import tsx --test lib/cloudinary/upload-actions.magic-bytes.test.ts

let uploadStreamCalls: Array<{ buffer: Buffer; folder: string }>;

// Fase 2E del proyecto de staging/pentest (sep. 2026): uploadProductImageAction
// ahora reporta upload.attempt/accepted/rejected_* a SystemLog vía
// lib/observability/log (import estático -- ese módulo nunca importa de
// vuelta lib/cloudinary/*, así que acá no hay riesgo de ciclo como sí lo
// hay en lib/email/send.ts). Sin este stub, el import real de
// lib/observability/log arrastra lib/prisma, que puede terminar
// construyendo un PrismaClient real contra la base de datos de desarrollo
// (si .env.local queda resuelto) en vez de quedar completamente aislado.
mock.module("lib/prisma", {
  namedExports: {
    prisma: {
      systemLog: {
        create: async () => ({ id: "log_1" }),
        findFirst: async () => null,
        update: async () => ({}),
      },
    },
  },
});
mock.module("lib/email/send", {
  namedExports: {
    sendEmail: async () => ({ success: true }),
  },
});

mock.module("lib/auth/authorize", {
  namedExports: {
    requireAdmin: async () => ({ id: "admin_1", role: "ADMIN" }),
  },
});

mock.module("./client", {
  namedExports: {
    getCloudinary: () => ({
      uploader: {
        upload_stream: (
          options: { folder: string },
          callback: (
            error: unknown,
            result?: {
              secure_url: string;
              public_id: string;
              width: number;
              height: number;
            },
          ) => void,
        ) => {
          const chunks: Buffer[] = [];
          return {
            end: (buffer: Buffer) => {
              chunks.push(buffer);
              const full = Buffer.concat(chunks);
              uploadStreamCalls.push({ buffer: full, folder: options.folder });
              callback(null, {
                secure_url:
                  "https://res.cloudinary.com/fake/image/upload/x.png",
                public_id: "lago/products/fake",
                width: 1,
                height: 1,
              });
            },
          };
        },
      },
    }),
  },
});

function fileFrom(
  bytes: number[] | Buffer,
  type: string,
  name = "archivo",
): File {
  const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);
  return new File([buffer], name, { type });
}

function formDataWith(file: File): FormData {
  const fd = new FormData();
  fd.set("file", file);
  return fd;
}

const REAL_PNG_BYTES = [
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
];

test("un SVG disfrazado de PNG (Content-Type falso) se rechaza y NUNCA llega a Cloudinary", async () => {
  uploadStreamCalls = [];
  const { uploadProductImageAction } = await import("./upload-actions");

  const svgAsPng = fileFrom(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg"><script>alert(document.cookie)</script></svg>`,
      "utf8",
    ),
    "image/png",
    "malicioso.svg",
  );

  const result = await uploadProductImageAction(formDataWith(svgAsPng));

  assert.equal(result.success, false);
  if (!result.success) {
    assert.match(result.error, /no es una imagen válida/i);
  }
  assert.equal(
    uploadStreamCalls.length,
    0,
    "un archivo que no es una imagen real nunca debe llegar a subirse a Cloudinary",
  );
});

test("un PNG real declarado honestamente se sube sin problema", async () => {
  uploadStreamCalls = [];
  const { uploadProductImageAction } = await import("./upload-actions");

  const result = await uploadProductImageAction(
    formDataWith(fileFrom(REAL_PNG_BYTES, "image/png", "foto.png")),
  );

  assert.equal(result.success, true);
  assert.equal(uploadStreamCalls.length, 1);
});

test("un archivo arbitrario (texto plano) con Content-Type de imagen se rechaza", async () => {
  uploadStreamCalls = [];
  const { uploadProductImageAction } = await import("./upload-actions");

  const result = await uploadProductImageAction(
    formDataWith(
      fileFrom(Buffer.from("esto no es una imagen", "utf8"), "image/jpeg"),
    ),
  );

  assert.equal(result.success, false);
  assert.equal(uploadStreamCalls.length, 0);
});

test("un PNG real declarado con un Content-Type distinto (pero permitido) igual se sube -- se usa el tipo VERIFICADO, no el declarado", async () => {
  uploadStreamCalls = [];
  const { uploadProductImageAction } = await import("./upload-actions");

  // Declara GIF pero el contenido real es un PNG -- no es un ataque (ambos
  // son formatos de imagen reales permitidos), así que debe aceptarse
  // igual, usando el tipo real detectado.
  const result = await uploadProductImageAction(
    formDataWith(fileFrom(REAL_PNG_BYTES, "image/gif", "raro.gif")),
  );

  assert.equal(result.success, true);
});

test("un archivo que supera el tamaño máximo (50 MB) se rechaza sin llegar a leer el buffer", async () => {
  uploadStreamCalls = [];
  const { uploadProductImageAction } = await import("./upload-actions");

  const oversized = Buffer.concat([
    Buffer.from(REAL_PNG_BYTES),
    Buffer.alloc(50 * 1024 * 1024 + 1 - REAL_PNG_BYTES.length),
  ]);
  const result = await uploadProductImageAction(
    formDataWith(fileFrom(oversized, "image/png", "gigante.png")),
  );

  assert.equal(result.success, false);
  if (!result.success) {
    assert.match(result.error, /supera el tamaño máximo/i);
  }
  assert.equal(uploadStreamCalls.length, 0);
});

// Fase 2E, sección B.3: caso básico de archivo poliglota -- una imagen
// real y válida (encabezado GIF correcto) con un payload arbitrario
// pegado atrás (técnica clásica tipo GIFAR: el mismo archivo es un GIF
// válido Y otra cosa válida, dependiendo de qué extremo lea el parser).
//
// HALLAZGO real, documentado acá a propósito (no es un bug introducido
// por esta fase, es el comportamiento preexistente de prepareForUpload,
// lib/cloudinary/upload-actions.ts): la validación es por firma binaria
// AL INICIO del archivo (detectImageTypeFromMagicBytes) -- el
// reprocesamiento con sharp que SÍ reconstruye la imagen desde cero
// SOLO corre para archivos de más de ~9.5 MB (CLOUDINARY_SAFE_BYTES) que
// además no sean GIF. Para un GIF, o para cualquier imagen chica (el caso
// típico de un producto real), el buffer pasa SIN TOCAR hasta Cloudinary
// -- un payload pegado atrás de una imagen chica y válida sobrevive
// byte por byte en lo que efectivamente se sube. Esto no es explotable
// como XSS/RCE por sí solo (Cloudinary sirve el archivo como el tipo de
// imagen que declaró al subirlo, nunca lo ejecuta), pero es exactamente
// el tipo de comportamiento que vale la pena que el pentester conozca de
// antemano para diseñar sus pruebas de poliglotas -- ver el reporte de
// esta fase, sección PENTEST READINESS.
const REAL_GIF_HEADER = Buffer.from("GIF89a", "ascii");
// GIF mínimo válido de 1x1 -- header + logical screen descriptor + campos
// mínimos + trailer, suficiente para que sharp lo decodifique sin error.
const MINIMAL_VALID_GIF = Buffer.from([
  0x47,
  0x49,
  0x46,
  0x38,
  0x39,
  0x61, // GIF89a
  0x01,
  0x00,
  0x01,
  0x00, // 1x1
  0x80,
  0x00,
  0x00, // GCT flag, bg color, aspect ratio
  0xff,
  0xff,
  0xff,
  0x00,
  0x00,
  0x00, // paleta: blanco, negro
  0x21,
  0xf9,
  0x04,
  0x00,
  0x00,
  0x00,
  0x00,
  0x00, // graphic control ext
  0x2c,
  0x00,
  0x00,
  0x00,
  0x00,
  0x01,
  0x00,
  0x01,
  0x00,
  0x00, // image descriptor
  0x02,
  0x02,
  0x44,
  0x01,
  0x00, // datos de imagen mínimos
  0x3b, // trailer
]);

test("polyglot básico: GIF real y válido con payload arbitrario pegado atrás -- se acepta como GIF (encabezado real), y el payload SOBREVIVE sin tocar (ver el hallazgo documentado arriba)", async () => {
  uploadStreamCalls = [];
  const { uploadProductImageAction } = await import("./upload-actions");

  const polyglotPayload = Buffer.concat([
    MINIMAL_VALID_GIF,
    Buffer.from(
      "<script>alert(document.cookie)</script>PK\x03\x04FAKE_ZIP_TAIL",
      "utf8",
    ),
  ]);
  assert.ok(polyglotPayload.subarray(0, 6).equals(REAL_GIF_HEADER));

  const result = await uploadProductImageAction(
    formDataWith(fileFrom(polyglotPayload, "image/gif", "polyglot.gif")),
  );

  assert.equal(
    result.success,
    true,
    "el encabezado es un GIF real y válido -- debe aceptarse",
  );
  assert.equal(uploadStreamCalls.length, 1);
  // GIF nunca pasa por sharp (prepareForUpload lo excluye a propósito
  // para no romper animación) -- el buffer sube EXACTAMENTE como llegó,
  // payload pegado atrás incluido. Documentado, no arreglado en esta
  // fase (fuera de alcance -- ver el reporte).
  const uploaded = uploadStreamCalls[0]!.buffer;
  assert.match(uploaded.toString("latin1"), /<script>|FAKE_ZIP_TAIL/);
  assert.ok(
    uploaded.equals(polyglotPayload),
    "para GIF/archivos chicos, el buffer sube byte-por-byte sin reprocesar",
  );
});

// Fase 2E, sección B.3: path traversal -- el nombre original del archivo
// (File.name) NUNCA se usa para construir ninguna ruta/public_id en este
// flujo (Cloudinary arma el suyo a partir de UPLOAD_FOLDER +
// resolveCloudinaryFolder, nunca del nombre que mandó el cliente) -- un
// nombre malicioso no tiene ningún efecto observable.
test("path traversal: un nombre de archivo malicioso no afecta el folder/public_id resultante", async () => {
  uploadStreamCalls = [];
  const { uploadProductImageAction } = await import("./upload-actions");

  const result = await uploadProductImageAction(
    formDataWith(
      fileFrom(REAL_PNG_BYTES, "image/png", "../../../../etc/passwd.png"),
    ),
  );

  assert.equal(result.success, true);
  assert.equal(uploadStreamCalls.length, 1);
  assert.equal(uploadStreamCalls[0]!.folder, "lago/products");
  assert.doesNotMatch(uploadStreamCalls[0]!.folder, /\.\./);
});

test("un Content-Type fuera de la lista permitida se rechaza ANTES de leer el archivo", async () => {
  uploadStreamCalls = [];
  const { uploadProductImageAction } = await import("./upload-actions");

  const result = await uploadProductImageAction(
    formDataWith(fileFrom([0x00], "application/x-msdownload")),
  );

  assert.equal(result.success, false);
  assert.equal(uploadStreamCalls.length, 0);
});

// Fase 2E, sección B: en staging sin credenciales de Cloudinary, la subida
// usa el mock (lib/cloudinary/staging-mock-upload.ts) -- nunca llega a
// llamar a Cloudinary real, pero la validación (magic bytes) sigue
// corriendo exactamente igual.
const VALID_PNG_1X1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64",
);

function withEnv<T>(
  vars: Record<string, string | undefined>,
  fn: () => Promise<T>,
): Promise<T> {
  const previous: Record<string, string | undefined> = {};
  for (const key of Object.keys(vars)) previous[key] = process.env[key];
  for (const [key, value] of Object.entries(vars)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return fn().finally(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

test("staging sin credenciales de Cloudinary: usa el mock, NUNCA llama a Cloudinary real, URL .invalid", async () => {
  await withEnv(
    {
      APP_ENVIRONMENT: "staging",
      CLOUDINARY_CLOUD_NAME: undefined,
      CLOUDINARY_API_KEY: undefined,
      CLOUDINARY_API_SECRET: undefined,
    },
    async () => {
      uploadStreamCalls = [];
      const { uploadProductImageAction } = await import("./upload-actions");

      const result = await uploadProductImageAction(
        formDataWith(fileFrom(VALID_PNG_1X1, "image/png", "foto.png")),
      );

      assert.equal(result.success, true);
      assert.equal(
        uploadStreamCalls.length,
        0,
        "en staging sin credenciales, Cloudinary real nunca debe llamarse",
      );
      if (result.success) {
        assert.match(
          result.url,
          /^https:\/\/staging-mock\.radaelliswimwear\.invalid\//,
        );
        assert.match(result.publicId, /^staging\/lago\/products\//);
      }
    },
  );
});

test("staging sin credenciales de Cloudinary: la validación de magic bytes SIGUE corriendo (un SVG disfrazado se rechaza igual)", async () => {
  await withEnv(
    {
      APP_ENVIRONMENT: "staging",
      CLOUDINARY_CLOUD_NAME: undefined,
      CLOUDINARY_API_KEY: undefined,
      CLOUDINARY_API_SECRET: undefined,
    },
    async () => {
      uploadStreamCalls = [];
      const { uploadProductImageAction } = await import("./upload-actions");

      const svgAsPng = fileFrom(
        Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>`,
          "utf8",
        ),
        "image/png",
        "malicioso.svg",
      );
      const result = await uploadProductImageAction(formDataWith(svgAsPng));

      assert.equal(result.success, false);
      assert.equal(uploadStreamCalls.length, 0);
    },
  );
});

test("staging CON las 3 credenciales de Cloudinary: usa el camino real (Production/staging-con-cuenta-propia sin cambios)", async () => {
  await withEnv(
    {
      APP_ENVIRONMENT: "staging",
      CLOUDINARY_CLOUD_NAME: "algun-cloud",
      CLOUDINARY_API_KEY: "algun-key",
      CLOUDINARY_API_SECRET: "algun-secret",
    },
    async () => {
      uploadStreamCalls = [];
      const { uploadProductImageAction } = await import("./upload-actions");

      const result = await uploadProductImageAction(
        formDataWith(fileFrom(VALID_PNG_1X1, "image/png", "foto.png")),
      );

      assert.equal(result.success, true);
      assert.equal(
        uploadStreamCalls.length,
        1,
        "con credenciales configuradas, aunque sea staging, debe usar Cloudinary real",
      );
    },
  );
});

test("producción (sin APP_ENVIRONMENT=staging): el mock NUNCA se activa, aunque falten las credenciales -- comportamiento preexistente intacto (falla igual que siempre)", async () => {
  await withEnv(
    {
      APP_ENVIRONMENT: "production",
      CLOUDINARY_CLOUD_NAME: undefined,
      CLOUDINARY_API_KEY: undefined,
      CLOUDINARY_API_SECRET: undefined,
    },
    async () => {
      uploadStreamCalls = [];
      const { uploadProductImageAction } = await import("./upload-actions");

      // El mock de "./client" de este archivo ignora las credenciales (no
      // las valida), así que igual "funciona" -- lo único que este test
      // confirma es que el CAMINO elegido es el de Cloudinary real (pasa
      // por uploadStreamCalls), nunca el mock de staging.
      const result = await uploadProductImageAction(
        formDataWith(fileFrom(VALID_PNG_1X1, "image/png", "foto.png")),
      );

      assert.equal(result.success, true);
      assert.equal(uploadStreamCalls.length, 1);
      if (result.success) {
        assert.doesNotMatch(result.url, /staging-mock/);
      }
    },
  );
});
