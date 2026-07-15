// Hash vía Web Crypto (SHA-256, sin salt). Suficiente para simular el flujo
// completo sin backend, pero NO es apto para producción: al conectar
// Prisma/Auth.js, el hashing de contraseñas debe hacerse server-side con
// bcrypt/argon2 (con salt), nunca en el cliente.
export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return (await hashPassword(password)) === hash;
}
