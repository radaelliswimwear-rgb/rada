# Sprint 9 — Autenticación + área privada "Mi Cuenta"

## Objetivo

Construir el sistema completo de autenticación y área privada de usuarios (`/cuenta/*`), preparado para producción y totalmente desacoplado de cara a una futura integración con PostgreSQL + Prisma + Auth.js (NextAuth) o Clerk, sin romper ninguna funcionalidad existente.

## Qué se implementó

- **`lib/auth/`** — `types.ts` (`User`, `PublicUser`, `ResetToken`, `AuthResult`), `password.ts` (hash/verify vía Web Crypto SHA-256), `users-storage.ts` (adaptador, clave `lago-users:v1`), `session-storage.ts` (adaptador de sesión, clave `lago-session:v1`), `reset-tokens-storage.ts` (tokens de recuperación con expiración de 30 min, clave `lago-reset-tokens:v1`).
- **`components/auth/auth-store.tsx`** — `AuthProvider`/`useAuth`, API 100% async: `login`, `register`, `logout`, `requestPasswordReset`, `resetPassword`, `updateProfile`. Expone siempre `PublicUser` (sin `passwordHash`).
- **`components/auth/require-auth.tsx`** — protección de rutas privadas: redirige a `/cuenta/iniciar-sesion` si no hay sesión.
- **UI de autenticación** — `auth-shell.tsx` + `login-form.tsx`, `register-form.tsx`, `forgot-password-form.tsx` (muestra el link de recuperación en un bloque "modo demo", al no existir backend de email), `reset-password-form.tsx` (lee `?token=` con `useSearchParams` dentro de `<Suspense>`). Páginas: `app/cuenta/iniciar-sesion`, `/registro`, `/recuperar-contrasena`, `/restablecer-contrasena`.
- **`lib/addresses/`** — `types.ts`, `addresses-repository.ts` (`listByUser`, `create`, `update`, `remove`; gestiona exclusividad de dirección por defecto), clave `lago-addresses:v1`.
- **`lib/orders/`** — `types.ts` (`OrderItem` con snapshot intencional de nombre/imagen/precio), `orders-repository.ts` (`listByUser(userId)`: genera pedidos simulados deterministas por usuario a partir del catálogo real).
- **Área privada** — `account-shell.tsx` (envuelve `RequireAuth` + nav + breadcrumb), `account-nav.tsx`, `dashboard-overview.tsx`, `profile-form.tsx`, `addresses-manager.tsx`, `order-history.tsx`. Páginas: `app/cuenta` (dashboard), `/perfil`, `/direcciones`, `/pedidos`.
- **Integración** — `AuthProvider` añadido a `app/layout.tsx` (dentro de `WishlistProvider`). Navbar y menú móvil: el botón "Cuenta" ahora enlaza a `/cuenta` o `/cuenta/iniciar-sesion` según `isAuthenticated`. `lib/placeholder-data.ts`: nueva `getProductById`.

## Decisiones técnicas y limitaciones conocidas

- **Context + Adaptador** aplicado a tres dominios nuevos (auth, direcciones, pedidos), igual que wishlist (Sprint 6) y carrito (Sprint 8): la UI solo conoce los Contexts/repositorios, nunca `localStorage` directamente.
- **`OrderItem` snapshotea** nombre/imagen/precio (a diferencia de `CartLine`, que resuelve en vivo) porque un pedido es un registro histórico e inmutable — documentado en [DATABASE.md](../DATABASE.md).
- **Hashing de contraseñas no apto para producción**: SHA-256 sin salt vía Web Crypto, en el cliente. Documentado en [ARCHITECTURE.md](../ARCHITECTURE.md#seguridad-de-contraseñas-limitación-conocida) como la pieza a reemplazar por bcrypt/argon2 server-side al conectar Auth.js/Clerk.
- **Protección de rutas client-side**: `RequireAuth` redirige con `useEffect` + `router.replace`, no hay sesión server-side ni middleware todavía — documentado en [ARCHITECTURE.md](../ARCHITECTURE.md#protección-de-rutas-privadas-limitación-conocida).
- **Pedidos simulados**: no hay checkout real que genere pedidos; `orders-repository.ts` genera datos deterministas (mismo `userId` → mismos pedidos) para que el historial se sienta real sin persistir nada.

## Verificación

`npx tsc --noEmit` y `npm run build` limpios (45/45 páginas, incluidas todas las rutas nuevas `/cuenta/*`). Probado en navegador de punta a punta: registro → dashboard con estadísticas → historial de pedidos simulado → alta de dirección → edición de perfil con persistencia tras recarga → cierre de sesión → redirección al intentar acceder a `/cuenta` sin sesión → nuevo inicio de sesión con verificación del hash de contraseña → ciclo completo de recuperación/restablecimiento de contraseña (contraseña vieja rechazada, nueva aceptada) → reactividad del enlace "Cuenta" del Navbar según estado de sesión.

## Qué quedó para después

- Autenticación de producción (Auth.js/Clerk, hashing server-side, sesión vía cookie + middleware).
- Checkout real que genere pedidos de verdad (hoy son simulados).
- Conexión a Postgres + Prisma para los cinco dominios nuevos, siguiendo la propuesta de esquema en [DATABASE.md](../DATABASE.md).
- Roles de usuario (admin/cliente), prerequisito para proteger un futuro Panel Administrativo — ver [ADMIN_PANEL.md](../ADMIN_PANEL.md).

Ver [ROADMAP.md](../ROADMAP.md) para el resto de pendientes.
