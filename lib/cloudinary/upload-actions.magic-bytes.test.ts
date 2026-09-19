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

test("un Content-Type fuera de la lista permitida se rechaza ANTES de leer el archivo", async () => {
  uploadStreamCalls = [];
  const { uploadProductImageAction } = await import("./upload-actions");

  const result = await uploadProductImageAction(
    formDataWith(fileFrom([0x00], "application/x-msdownload")),
  );

  assert.equal(result.success, false);
  assert.equal(uploadStreamCalls.length, 0);
});
