import { test, mock } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";

// Hardening de auth / recuperación de contraseña (sep. 2026). Cubre el
// checklist obligatorio A-M: enumeración de usuarios (respuesta pública
// idéntica + sin esperar la llamada de red del correo), rate limit por IP
// y por email, seguridad del token (entropía/expiración/un solo uso,
// incluida la condición de carrera arreglada en
// lib/auth/verification-tokens.ts), invalidación de sesiones tras el
// cambio, observabilidad (eventos correctos, nunca token/email en los
// logs), y que un fallo de observabilidad nunca rompe el flujo real.
//
// Cómo correrlo:
//   node --env-file=.env.test --experimental-test-module-mocks --import tsx --test lib/auth/password-reset.test.ts

type FakeUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string | null;
  role: "USER" | "ADMIN";
  emailVerifiedAt: Date | null;
  createdAt: Date;
};

type FakeToken = {
  id: string;
  userId: string;
  tokenHash: string;
  type: "EMAIL_VERIFY" | "PASSWORD_RESET";
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
};

type FakeAttempt = { identifier: string; action: string; createdAt: Date };
type FakeSession = { id: string; userId: string; tokenHash: string };

let users: Record<string, FakeUser>;
let tokens: Record<string, FakeToken>;
let attempts: FakeAttempt[];
let sessions: Record<string, FakeSession>;
let idCounter: number;
let clientIp: string;

let emailCalls: Array<{ to: string; subject: string; html: string }>;
let emailDelayMsFor: Record<string, number>;
let logCalls: Array<Record<string, unknown>>;
let logEventShouldThrow: boolean;

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function resetStore(): void {
  users = {};
  tokens = {};
  attempts = [];
  sessions = {};
  idCounter = 1;
  clientIp = "203.0.113.10";
  emailCalls = [];
  emailDelayMsFor = {};
  logCalls = [];
  logEventShouldThrow = false;
}

function nextId(prefix: string): string {
  return `${prefix}_${idCounter++}`;
}

function addUser(overrides: Partial<FakeUser> & { email: string }): FakeUser {
  const user: FakeUser = {
    id: nextId("user"),
    name: "Clienta de prueba",
    passwordHash: "sal:vieja-clave-hasheada",
    role: "USER",
    emailVerifiedAt: null,
    createdAt: new Date(),
    ...overrides,
  };
  users[user.id] = user;
  return user;
}

mock.module("lib/prisma", {
  namedExports: {
    prisma: {
      user: {
        findFirst: async ({
          where,
        }: {
          where: { email: { equals: string; mode: string } };
        }) => {
          const target = where.email.equals.toLowerCase();
          return (
            Object.values(users).find(
              (u) => u.email.toLowerCase() === target,
            ) ?? null
          );
        },
        update: async ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<FakeUser>;
        }) => {
          const row = users[where.id];
          if (!row) throw new Error("usuario no encontrado (fake)");
          Object.assign(row, data);
          return row;
        },
      },
      authAttempt: {
        count: async ({
          where,
        }: {
          where: {
            identifier: string;
            action: string;
            createdAt: { gte: Date };
          };
        }) =>
          attempts.filter(
            (a) =>
              a.identifier === where.identifier &&
              a.action === where.action &&
              a.createdAt >= where.createdAt.gte,
          ).length,
        create: async ({
          data,
        }: {
          data: { identifier: string; action: string };
        }) => {
          attempts.push({ ...data, createdAt: new Date() });
        },
      },
      verificationToken: {
        findUnique: async ({ where }: { where: { tokenHash: string } }) =>
          Object.values(tokens).find((t) => t.tokenHash === where.tokenHash) ??
          null,
        create: async ({
          data,
        }: {
          data: Omit<FakeToken, "id" | "usedAt" | "createdAt">;
        }) => {
          const row: FakeToken = {
            id: nextId("token"),
            usedAt: null,
            createdAt: new Date(),
            ...data,
          };
          tokens[row.id] = row;
          return row;
        },
        deleteMany: async ({
          where,
        }: {
          where: { userId: string; type: string; usedAt: null };
        }) => {
          let count = 0;
          for (const [id, row] of Object.entries(tokens)) {
            if (
              row.userId === where.userId &&
              row.type === where.type &&
              row.usedAt === null
            ) {
              delete tokens[id];
              count++;
            }
          }
          return { count };
        },
        updateMany: async ({
          where,
          data,
        }: {
          where: { id: string; usedAt: null };
          data: { usedAt: Date };
        }) => {
          const row = tokens[where.id];
          if (!row || row.usedAt !== null) return { count: 0 };
          row.usedAt = data.usedAt;
          return { count: 1 };
        },
      },
      session: {
        deleteMany: async ({ where }: { where: { userId: string } }) => {
          let count = 0;
          for (const [id, row] of Object.entries(sessions)) {
            if (row.userId === where.userId) {
              delete sessions[id];
              count++;
            }
          }
          return { count };
        },
      },
    },
  },
});

mock.module("lib/email/send", {
  namedExports: {
    sendEmail: async ({
      to,
      subject,
      html,
    }: {
      to: string;
      subject: string;
      html: string;
    }) => {
      const delay = emailDelayMsFor[to];
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      emailCalls.push({ to, subject, html });
      return { success: true };
    },
  },
});

mock.module("lib/observability/log", {
  namedExports: {
    logEvent: async (input: Record<string, unknown>) => {
      if (logEventShouldThrow) {
        throw new Error("SystemLog/alertas caídas (simulado)");
      }
      logCalls.push(input);
    },
  },
});

mock.module("lib/request/client-ip", {
  namedExports: { getClientIp: async () => clientIp },
});

// mergeGuestCartIntoUserAction/mergeGuestWishlistIntoUserAction (importadas
// por users-actions.ts para registerAction/loginAction, no usadas por el
// flujo de reset) también dependen de "lib/prisma" -- nunca se llaman en
// estos tests, así que no hace falta mockear sus módulos completos.

test("A/B: la respuesta pública es IDÉNTICA para un email existente y uno inexistente", async () => {
  resetStore();
  addUser({ email: "clienta@example.com" });
  const { requestPasswordResetAction } = await import("./users-actions");

  const resultExistente = await requestPasswordResetAction(
    "clienta@example.com",
  );
  const resultInexistente = await requestPasswordResetAction(
    "no-existe@example.com",
  );

  assert.deepEqual(resultExistente, { success: true });
  assert.deepEqual(resultInexistente, { success: true });
  assert.deepEqual(resultExistente, resultInexistente);
});

test("B2: un email inexistente nunca crea un token ni manda un correo", async () => {
  resetStore();
  const { requestPasswordResetAction } = await import("./users-actions");

  await requestPasswordResetAction("nadie@example.com");

  assert.equal(Object.keys(tokens).length, 0);
  assert.equal(emailCalls.length, 0);
});

test("C: la respuesta no espera la llamada de red del correo (mitigación de timing)", async () => {
  resetStore();
  const user = addUser({ email: "lenta@example.com" });
  // El envío para este destinatario tarda "mucho" (300ms) -- si la acción
  // esperara ese envío antes de responder, un atacante podría distinguir un
  // email existente (respuesta lenta) de uno inexistente (respuesta
  // inmediata) solo midiendo el tiempo. La acción debe devolver mucho antes
  // de que ese delay termine.
  emailDelayMsFor[user.email] = 300;

  const { requestPasswordResetAction } = await import("./users-actions");
  const start = Date.now();
  const result = await requestPasswordResetAction(user.email);
  const elapsed = Date.now() - start;

  assert.deepEqual(result, { success: true });
  assert.ok(
    elapsed < 150,
    `la acción debería resolver mucho antes que el envío del correo (tardó ${elapsed}ms)`,
  );
  // El correo sigue enviándose igual, solo que no bloquea la respuesta --
  // se espera un momento acá (en el test, no en el código real) para
  // confirmar que de verdad se disparó.
  await new Promise((resolve) => setTimeout(resolve, 350));
  assert.equal(emailCalls.length, 1);
});

test("D: rate limit por IP -- muchos emails distintos desde la MISMA IP se frenan", async () => {
  resetStore();
  const { requestPasswordResetAction } = await import("./users-actions");
  clientIp = "198.51.100.7";

  // Límite por IP es 10/15min; el límite por email es 5/60min -- usando un
  // email distinto en cada llamada se aísla específicamente el freno por IP.
  const results: { success: true }[] = [];
  for (let i = 0; i < 11; i++) {
    results.push(await requestPasswordResetAction(`persona${i}@example.com`));
  }

  // Contrato público sin cambios: TODAS responden igual, incluida la que
  // disparó el límite.
  for (const r of results) assert.deepEqual(r, { success: true });

  const rateLimitedLog = logCalls.find(
    (c) => c.event === "auth.password_reset_rate_limited",
  );
  assert.ok(rateLimitedLog, "debe registrar auth.password_reset_rate_limited");
  assert.equal(rateLimitedLog!.alert, true);
});

test("E: rate limit por email -- muchos intentos para el MISMO email se frenan", async () => {
  resetStore();
  const user = addUser({ email: "insistente@example.com" });
  const { requestPasswordResetAction } = await import("./users-actions");

  // Límite por email es 5/60min -- se varía la IP en cada llamada para
  // aislar específicamente el freno por email (si no, el freno por IP
  // (10/15min) nunca llegaría a dispararse primero en este test).
  for (let i = 0; i < 5; i++) {
    clientIp = `203.0.113.${i}`;
    await requestPasswordResetAction(user.email);
  }
  const tokensAntesDelLimite = Object.keys(tokens).length;

  clientIp = "203.0.113.99";
  logCalls = [];
  const result = await requestPasswordResetAction(user.email);

  assert.deepEqual(result, { success: true });
  assert.equal(
    Object.keys(tokens).length,
    tokensAntesDelLimite,
    "el intento que dispara el límite no debe crear un token nuevo",
  );
  const rateLimitedLog = logCalls.find(
    (c) => c.event === "auth.password_reset_rate_limited",
  );
  assert.ok(rateLimitedLog);
});

async function requestAndGetToken(email: string): Promise<string> {
  const { requestPasswordResetAction } = await import("./users-actions");
  await requestPasswordResetAction(email);
  const row = Object.values(tokens).find(
    (t) => t.type === "PASSWORD_RESET" && t.usedAt === null,
  );
  assert.ok(row, "debía haberse creado un token");
  // El token real solo se conoce por el correo (nunca se persiste en texto
  // plano) -- para el test, se reconstruye a partir de emailCalls (el link
  // que se habría mandado), no de la tabla (que solo tiene el hash).
  const call = emailCalls.find((c) => c.to === email);
  assert.ok(call, "debía haberse mandado el correo con el enlace");
  const match = call!.html.match(/token=([0-9a-f]+)/);
  assert.ok(match, "el correo debe incluir el token en la URL");
  return match![1]!;
}

test("F: token expirado -- rechazado con el mensaje genérico y logueado", async () => {
  resetStore();
  const user = addUser({ email: "vencido@example.com" });
  const { resetPasswordAction } = await import("./users-actions");

  const rawToken = "a".repeat(64);
  tokens["tok_vencido"] = {
    id: "tok_vencido",
    userId: user.id,
    tokenHash: sha256(rawToken),
    type: "PASSWORD_RESET",
    expiresAt: new Date(Date.now() - 60_000), // venció hace 1 minuto
    usedAt: null,
    createdAt: new Date(Date.now() - 31 * 60_000),
  };

  const result = await resetPasswordAction(rawToken, "NuevaClave123!");

  assert.deepEqual(result, {
    success: false,
    error: "El enlace no es válido o expiró.",
  });
  assert.equal(users[user.id]!.passwordHash, "sal:vieja-clave-hasheada");
  assert.ok(
    logCalls.some((c) => c.event === "auth.password_reset_invalid_token"),
  );
});

test("G: token reutilizado -- el segundo intento con el MISMO token falla", async () => {
  resetStore();
  addUser({ email: "reusa@example.com" });
  const token = await requestAndGetToken("reusa@example.com");
  const { resetPasswordAction } = await import("./users-actions");

  const primero = await resetPasswordAction(token, "PrimeraClaveNueva1!");
  assert.deepEqual(primero, { success: true });

  logCalls = [];
  const segundo = await resetPasswordAction(token, "SegundaClaveNueva2!");
  assert.deepEqual(segundo, {
    success: false,
    error: "El enlace no es válido o expiró.",
  });
  assert.ok(
    logCalls.some((c) => c.event === "auth.password_reset_invalid_token"),
  );
});

test("G2: dos resets CONCURRENTES con el mismo token -- solo uno gana (sin condición de carrera)", async () => {
  resetStore();
  addUser({ email: "concurrente@example.com" });
  const token = await requestAndGetToken("concurrente@example.com");
  const { resetPasswordAction } = await import("./users-actions");

  const [a, b] = await Promise.all([
    resetPasswordAction(token, "ClaveConcurrenteA1!"),
    resetPasswordAction(token, "ClaveConcurrenteB1!"),
  ]);

  const resultados = [a, b].map((r) => r.success).sort();
  assert.deepEqual(resultados, [false, true]);
});

test("H: token con formato inválido -- rechazado igual, sin reventar", async () => {
  resetStore();
  const { resetPasswordAction } = await import("./users-actions");

  const result = await resetPasswordAction(
    "esto-no-es-un-token-real",
    "ClaveNueva123!",
  );

  assert.deepEqual(result, {
    success: false,
    error: "El enlace no es válido o expiró.",
  });
});

test("I: el token real NUNCA aparece en ningún logEvent registrado", async () => {
  resetStore();
  addUser({ email: "sin-fugas@example.com" });
  const token = await requestAndGetToken("sin-fugas@example.com");
  const { resetPasswordAction } = await import("./users-actions");

  await resetPasswordAction(token, "ClaveSegura123!");
  await resetPasswordAction(token, "OtraClave456!"); // reutilizado, también logueado

  const serialized = JSON.stringify(logCalls);
  assert.doesNotMatch(serialized, new RegExp(token));
});

test("J: el email real NUNCA aparece en ningún logEvent registrado", async () => {
  resetStore();
  const email = "privado@example.com";
  addUser({ email });
  const { requestPasswordResetAction } = await import("./users-actions");

  await requestPasswordResetAction(email);
  await requestPasswordResetAction("desconocido@example.com");

  const serialized = JSON.stringify(logCalls);
  assert.doesNotMatch(serialized, /privado@example\.com/);
  assert.doesNotMatch(serialized, /desconocido@example\.com/);
});

test("K: reset correcto de punta a punta -- la contraseña realmente cambia", async () => {
  resetStore();
  addUser({ email: "feliz@example.com" });
  const token = await requestAndGetToken("feliz@example.com");
  const { resetPasswordAction } = await import("./users-actions");
  const { verifyPassword } = await import("./password");

  const result = await resetPasswordAction(token, "ClaveFelizNueva123!");

  assert.deepEqual(result, { success: true });
  const user = Object.values(users).find(
    (u) => u.email === "feliz@example.com",
  )!;
  const { valid } = await verifyPassword(
    "ClaveFelizNueva123!",
    user.passwordHash!,
  );
  assert.equal(valid, true);
  assert.ok(
    logCalls.some(
      (c) =>
        c.event === "auth.password_reset_completed" && c.userId === user.id,
    ),
  );
  await new Promise((resolve) => setTimeout(resolve, 10));
  assert.ok(
    emailCalls.some(
      (c) => c.to === "feliz@example.com" && /cambió/i.test(c.subject),
    ),
  );
});

test("L: sesiones anteriores se invalidan tras un reset exitoso", async () => {
  resetStore();
  const user = addUser({ email: "con-sesiones@example.com" });
  sessions["s1"] = { id: "s1", userId: user.id, tokenHash: "hash1" };
  sessions["s2"] = { id: "s2", userId: user.id, tokenHash: "hash2" };
  const otroUsuario = addUser({ email: "otra@example.com" });
  sessions["s3"] = { id: "s3", userId: otroUsuario.id, tokenHash: "hash3" };

  const token = await requestAndGetToken(user.email);
  const { resetPasswordAction } = await import("./users-actions");
  await resetPasswordAction(token, "ClaveConSesiones123!");

  assert.equal(sessions["s1"], undefined);
  assert.equal(sessions["s2"], undefined);
  assert.ok(sessions["s3"], "las sesiones de OTRA cuenta no deben tocarse");
});

test("M: un fallo del canal de observabilidad no rompe el flujo real de reset", async () => {
  resetStore();
  const user = addUser({ email: "resiliente@example.com" });
  const token = await requestAndGetToken(user.email);
  const { resetPasswordAction } = await import("./users-actions");

  // A partir de acá, CUALQUIER llamada a logEvent (mockeado arriba para
  // todo el archivo) rechaza -- simula un fallo total de SystemLog/alertas.
  logEventShouldThrow = true;

  const result = await resetPasswordAction(token, "ClaveResiliente123!");

  assert.deepEqual(
    result,
    { success: true },
    "el reset debe completarse igual aunque logEvent falle",
  );
  const changed = Object.values(users).find(
    (u) => u.email === "resiliente@example.com",
  )!;
  const { verifyPassword } = await import("./password");
  const { valid } = await verifyPassword(
    "ClaveResiliente123!",
    changed.passwordHash!,
  );
  assert.equal(valid, true, "la contraseña debe haber cambiado de verdad");
});

test("M2: un fallo de observabilidad tampoco rompe la solicitud de reset (sigue respondiendo genérico)", async () => {
  resetStore();
  addUser({ email: "solicitud-resiliente@example.com" });
  const { requestPasswordResetAction } = await import("./users-actions");

  logEventShouldThrow = true;
  const result = await requestPasswordResetAction(
    "solicitud-resiliente@example.com",
  );

  assert.deepEqual(result, { success: true });
});
