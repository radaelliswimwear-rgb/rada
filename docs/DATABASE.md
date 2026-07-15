# Base de datos

## Estado actual: Postgres + Prisma conectados (Sprint 12), catálogo/wishlist migrados (Sprint 13)

Hay una base Postgres real, gestionada con Prisma (`prisma/schema.prisma`, migración inicial en `prisma/migrations/`, seed en `prisma/seed.ts`). No todo se migró: sesión y tokens de recuperación de auth siguen en `localStorage` a propósito, y `lib/placeholder-data.ts` sigue vivo como caché síncrona de cliente (ver [ARCHITECTURE.md](./ARCHITECTURE.md#catálogo-en-postgres-pero-libplaceholder-datats-sigue-vivo-decisión-de-diseño-sprint-13)).

| Dato                                                                                            | Dónde vive hoy                                                                                               | Persiste entre sesiones/dispositivos      |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------- |
| Catálogo (lectura: `/hombre`, `/mujer`, `/accesorios`, ficha de producto, búsqueda, destacados) | **Postgres** (`Product`, `ProductImage`, `ProductVariant`, `Category`) vía `catalogRepository` (Sprint 13)   | Sí                                        |
| Catálogo (resolución síncrona en cliente: carrito, wishlist)                                    | `lib/placeholder-data.ts` en memoria, mismos IDs que Postgres                                                | No aplica — es código                     |
| Carrito                                                                                         | **Postgres** (`Cart`, `CartItem`), identificado por cookie `lago-cart-id` (invitado)                         | Sí, por navegador (no por cuenta todavía) |
| Wishlist                                                                                        | **Postgres** (`Wishlist`, `WishlistItem`), identificada por cookie `lago-wishlist-id` (invitado) (Sprint 13) | Sí, por navegador (no por cuenta todavía) |
| Usuarios (nombre, email, hash de contraseña)                                                    | **Postgres** (`User`)                                                                                        | Sí                                        |
| Sesión activa                                                                                   | `localStorage` del navegador (clave `lago-session:v1`) — sin migrar (no hay modelo `Session`)                | Solo en el mismo navegador                |
| Tokens de recuperación de contraseña                                                            | `localStorage` del navegador (clave `lago-reset-tokens:v1`, expiran a los 30 min) — sin migrar               | Solo en el mismo navegador                |
| Direcciones                                                                                     | **Postgres** (`Address`)                                                                                     | Sí                                        |
| Pedidos                                                                                         | **Postgres** (`Order`, `OrderItem`). El generador de pedidos simulados del Sprint 9/10 se eliminó            | Sí                                        |
| Pagos (Stripe simulado, Wompi real desde Sprint 16)                                             | **Postgres** (`Payment`)                                                                                     | Sí                                        |
| Categorías editoriales de Home (6, 3 sin catálogo real)                                         | `lib/categories.ts` en memoria — contenido de portada, no taxonomía de catálogo                              | No aplica — es código                     |
| Catálogo real (si se conecta Shopify)                                                           | Shopify (fuera de este repo)                                                                                 | Sí, vía Shopify Storefront API            |

## Modelo de datos actual (extraído del código)

### `PlaceholderProduct` — `lib/placeholder-data.ts`

```ts
type PlaceholderProduct = {
  id: string;
  slug: string;
  name: string;
  category: "Hombre" | "Mujer" | "Accesorios";
  price: string; // formato de visualización, ej. "189,00"
  priceValue: number; // valor numérico, ej. 189
  tone: Tone; // paleta de color para el arte decorativo (Hero, banners)
  sizes: string[]; // ej. ["S", "M", "L"] o ["Única"]
  color: string; // ej. "Negro", "Camel"
  description: string;
  images: string[]; // URLs de Unsplash
  featured?: boolean; // aparece en "Productos destacados" de la Home
};
```

Hoy hay **20 productos** cargados a mano, distribuidos en Hombre (7), Mujer (7) y Accesorios (6).

### `WishlistItem` — `lib/wishlist/types.ts`

```ts
type WishlistItem = {
  productId: string;
  createdAt: string; // ISO date
};
```

### `CartLine` — `lib/cart/types.ts`

```ts
type CartLine = {
  id: string; // `${productId}-${size}`
  productId: string;
  size: string;
  quantity: number;
  createdAt: string; // ISO date
};
```

Normalizado a propósito (Sprint 8): no guarda nombre/imagen/precio del producto — `components/cart-drawer/cart-store.tsx` resuelve esos datos en vivo contra `lib/placeholder-data.ts` (`getProductById`) al leer el carrito, para que nunca queden desactualizados si el producto cambia.

### `User` / `PublicUser` — `lib/auth/types.ts`

```ts
type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // SHA-256 sin salt — ver docs/ARCHITECTURE.md, limitación conocida
  createdAt: string;
};
type PublicUser = Omit<User, "passwordHash">; // lo único expuesto a la UI
```

### `Address` — `lib/addresses/types.ts`

```ts
type Address = {
  id: string;
  userId: string;
  label: string; // "Casa", "Oficina"
  fullName: string;
  street: string;
  city: string;
  postalCode: string;
  province: string;
  country: string;
  phone: string;
  isDefault: boolean;
};
```

### `Order` / `OrderItem` — `lib/orders/types.ts`

```ts
type OrderItem = {
  productId: string;
  name: string; // snapshot intencional — ver nota abajo
  image: string;
  size: string;
  quantity: number;
  priceValue: number;
};
type ShippingAddressSnapshot = {
  fullName: string;
  street: string;
  city: string;
  postalCode: string;
  province: string;
  country: string;
  phone: string;
};
type ShippingMethodId = "standard" | "express";
type Order = {
  id: string;
  userId: string;
  date: string;
  status: "Procesando" | "Enviado" | "Entregado" | "Cancelado";
  items: OrderItem[];
  total: number;
  // Presentes en pedidos reales creados desde /checkout (Sprint 10);
  // ausentes en los pedidos simulados de demo (Sprint 9).
  subtotal?: number;
  shippingCost?: number;
  tax?: number;
  shippingAddress?: ShippingAddressSnapshot;
  shippingMethod?: ShippingMethodId;
  payment?: PaymentSnapshot;
};
```

A diferencia de `CartLine` (que resuelve los datos del producto en vivo), `OrderItem` sí guarda una copia de nombre/imagen/precio: un pedido es un registro histórico e inmutable, debe reflejar lo que se cobró en su momento, no el precio actual del catálogo. Es la misma lógica que un sistema de pedidos real (Shopify, Stripe, etc.). `shippingAddress` sigue el mismo criterio: es una copia de la dirección al momento de la compra, no una referencia a `Address` (que el usuario puede editar o borrar después). `payment` sigue el mismo criterio con el pago aprobado.

### `PaymentIntent` / `PaymentSnapshot` — `lib/payments/types.ts`, `lib/orders/types.ts`

```ts
type PaymentProvider = "stripe" | "wompi";
type PaymentStatus = "pending" | "succeeded" | "failed" | "cancelled";
type PaymentIntent = {
  id: string;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  status: PaymentStatus;
  orderId?: string; // se completa recién cuando el pago se aprueba y el pedido se crea
  createdAt: string;
  failureReason?: string;
};
// Snapshot guardado en Order.payment — igual criterio que shippingAddress
type PaymentSnapshot = {
  provider: PaymentProvider;
  transactionId: string; // PaymentIntent.id
  last4: string;
};
```

Cada intento de pago (exitoso, rechazado o cancelado) queda registrado en `lago-payments:v1` para auditoría — el pedido solo se crea si el intento termina en `succeeded`. Esto refleja el orden real de un checkout con pasarela: primero se cobra, después se genera el pedido, nunca al revés.

### Modelo Shopify (dormido) — `lib/shopify/types.ts`

Tipos completos ya definidos para `Product`, `ProductVariant`, `Collection`, `Cart`, `CartItem`, `Page`, `Menu` — ver ese archivo para el detalle exacto. No están en uso mientras no haya credenciales de Shopify.

## Esquema Prisma implementado (Sprint 12/13)

El esquema real vive en [`prisma/schema.prisma`](../prisma/schema.prisma) — 17 modelos: `User`, `Address`, `Category`, `Product`, `ProductImage`, `ProductVariant`, `Wishlist`, `WishlistItem`, `Cart`, `CartItem`, `Order`, `OrderItem`, `Payment`, `BlogPost`, `NewsletterSubscriber`, `NewsletterCampaign`, `Coupon`. `User.role` (`UserRole`, migración `20260715120000_add_user_role`) se agregó en el Sprint 14 para el Panel Administrativo; `ProductImage.publicId` (migración `20260716090000_add_product_image_public_id`) se agregó en el Sprint 15 para Cloudinary; `BlogPost`/`NewsletterSubscriber`/`NewsletterCampaign`/`Coupon` y `Order.couponCode`/`Order.discountValue` (migración `20260717100000_sprint17_marketing`) se agregaron en el Sprint 17 — ver [ADMIN_PANEL.md](./ADMIN_PANEL.md). Resumen (ver el archivo para el detalle exacto de cada campo):

```prisma
model Category {
  id       String    @id @default(cuid())
  slug     String    @unique
  name     String
  products Product[]
}

model Product {
  id           String           @id @default(cuid())
  slug         String           @unique
  name         String
  categoryId   String
  category     Category         @relation(fields: [categoryId], references: [id])
  priceValue   Int              // centavos
  color        String
  description  String
  featured     Boolean          @default(false)
  images       ProductImage[]
  variants     ProductVariant[]
  wishlistedBy WishlistItem[]
  cartItems    CartItem[]
  orderItems   OrderItem[]
  createdAt    DateTime         @default(now())
  updatedAt    DateTime         @updatedAt
}

model ProductImage {
  id        String  @id @default(cuid())
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  url       String
  publicId  String? // public_id de Cloudinary (Sprint 15); null para imágenes sembradas desde Unsplash
  position  Int
}

model ProductVariant {
  id        String  @id @default(cuid())
  productId String
  product   Product @relation(fields: [productId], references: [id], onDelete: Cascade)
  size      String
  stock     Int     @default(0)

  @@unique([productId, size])
}

model User {
  id           String     @id @default(cuid())
  name         String
  email        String     @unique
  passwordHash String?
  role         UserRole   @default(USER)
  addresses    Address[]
  orders       Order[]
  wishlist     Wishlist[]
  carts        Cart[]
  createdAt    DateTime   @default(now())
}

enum UserRole {
  USER
  ADMIN
}

model Address {
  id         String  @id @default(cuid())
  userId     String
  user       User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  label      String
  fullName   String
  street     String
  city       String
  postalCode String
  province   String
  country    String
  phone      String
  isDefault  Boolean @default(false)
}

// "Contenedor + items", igual patrón que Cart/CartItem: Wishlist.id se
// reutiliza como identificador de invitado (cookie) cuando userId es null.
model Wishlist {
  id        String         @id @default(cuid())
  userId    String?
  user      User?          @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     WishlistItem[]
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt
}

model WishlistItem {
  id         String   @id @default(cuid())
  wishlistId String
  wishlist   Wishlist @relation(fields: [wishlistId], references: [id], onDelete: Cascade)
  productId  String
  product    Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  createdAt  DateTime @default(now())

  @@unique([wishlistId, productId])
}

model Cart {
  id        String     @id @default(cuid())
  userId    String?    // null = carrito de invitado, identificado por cookie
  user      User?      @relation(fields: [userId], references: [id], onDelete: Cascade)
  items     CartItem[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model CartItem {
  id        String   @id @default(cuid())
  cartId    String
  cart      Cart     @relation(fields: [cartId], references: [id], onDelete: Cascade)
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  size      String
  quantity  Int
  createdAt DateTime @default(now())

  @@unique([cartId, productId, size])
}

model Order {
  id              String         @id @default(cuid())
  userId          String
  user            User           @relation(fields: [userId], references: [id])
  status          OrderStatus    @default(PROCESANDO)
  items           OrderItem[]
  payment         Payment?
  subtotal        Int            // centavos
  shippingCost    Int            // centavos
  tax             Int            // centavos
  total           Int            // centavos
  couponCode      String?        // cupón aplicado (Sprint 17), null si no hubo
  discountValue   Int            @default(0) // centavos, ya restado de `total`
  shippingMethod  ShippingMethod @default(STANDARD)
  shippingAddress Json           // snapshot de la dirección al momento de la compra
  createdAt       DateTime       @default(now())
}

model OrderItem {
  id         String  @id @default(cuid())
  orderId    String
  order      Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId  String
  product    Product @relation(fields: [productId], references: [id])
  name       String
  image      String
  size       String
  quantity   Int
  priceValue Int     // centavos, snapshot al momento de la compra
}

model Payment {
  id            String          @id @default(cuid())
  orderId       String?         @unique
  order         Order?          @relation(fields: [orderId], references: [id])
  provider      PaymentProvider
  providerRef   String
  cardLast4     String?
  amount        Int             // centavos
  currency      String          @default("EUR")
  status        PaymentStatus   @default(PENDING)
  failureReason String?
  createdAt     DateTime        @default(now())
}

// Sprint 17 — Marketing e Inteligencia

model BlogPost {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  excerpt     String
  content     String // Markdown simple, ver lib/blog/markdown.ts
  coverImage  String
  tags        String[] @default([])
  published   Boolean  @default(true)
  publishedAt DateTime @default(now())
  authorName  String   @default("Equipo LAGO")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model NewsletterSubscriber {
  id           String   @id @default(cuid())
  email        String   @unique
  active       Boolean  @default(true)
  subscribedAt DateTime @default(now())
}

model NewsletterCampaign {
  id        String         @id @default(cuid())
  subject   String
  body      String
  status    CampaignStatus @default(DRAFT) // DRAFT | SENT — "SENT" no dispara ningún email real
  createdAt DateTime       @default(now())
  sentAt    DateTime?
}

model Coupon {
  id          String     @id @default(cuid())
  code        String     @unique
  type        CouponType // PERCENTAGE | FIXED
  value       Int        // % (0-100) o centavos, según `type`
  active      Boolean    @default(true)
  minSubtotal Int        @default(0) // centavos
  maxUses     Int?
  usedCount   Int        @default(0)
  expiresAt   DateTime?
  createdAt   DateTime   @default(now())
}
```

**Notas de la implementación:**

- `priceValue`/`subtotal`/`shippingCost`/`tax`/`total`/`amount` se guardan como `Int` en centavos (evita errores de punto flotante en dinero); la capa `*-actions.ts` de cada dominio convierte euros↔centavos en el borde, así que los tipos de `lib/orders/types.ts` y `lib/payments/types.ts` (usados por toda la UI) siguen en euros sin cambios.
- `Cart.userId` y `Wishlist.userId` son opcionales por el mismo motivo: ambos soportan invitados identificados por cookie (`lib/guest-identity.ts`), sin fusión a la cuenta al iniciar sesión todavía. `Payment.orderId` es opcional porque un intento de pago puede existir sin pedido (rechazado o cancelado antes de crearlo) — refleja el flujo real: primero se cobra, después se crea el pedido.
- `OrderItem` y `Order.shippingAddress` guardan snapshots (no referencias en vivo) porque un pedido es un registro histórico — mismo criterio documentado en `lib/orders/types.ts`.
- Imágenes de producto: las 20 sembradas desde `lib/placeholder-data.ts` siguen apuntando a Unsplash con `publicId: null`; las subidas desde el Panel Administrativo (Sprint 15, ver [ADMIN_PANEL.md](./ADMIN_PANEL.md)) viven en Cloudinary y sí tienen `publicId` — es lo que permite borrarlas ahí al reemplazar/quitar una imagen o eliminar el producto.
- Búsqueda (`catalogRepository.search`, Sprint 13, ranking agregado en el Sprint 17) usa `contains`/`mode: "insensitive"` de Prisma (equivalente a `ILIKE`) sobre nombre/color/descripción/categoría, ahora con orden por relevancia (coincidencia exacta > empieza con > contiene) y límite de 24 resultados — suficiente para el volumen actual (20 productos). Un índice GIN + `pg_trgm` para full-text real queda como optimización futura si el catálogo crece.
- `BlogPost.tags` usa el tipo array nativo de Postgres (`String[]`), sin tabla de tags separada — alcanza para el volumen de posts actual; `NewsletterCampaign.status`/`Coupon.type` son enums (`CampaignStatus`, `CouponType`) siguiendo el mismo criterio que `OrderStatus`/`PaymentStatus`.
- `Order.couponCode`/`Order.discountValue` (Sprint 17) son opcionales/con default `0` a propósito: ningún pedido creado antes de este sprint, ni ningún pedido sin cupón, cambia de comportamiento.
- Seed: [`prisma/seed.ts`](../prisma/seed.ts) carga categorías/productos desde `lib/placeholder-data.ts` (mismos IDs, para que `CartItem`/`OrderItem`/`WishlistItem` referencien filas reales), crea dos usuarios de prueba (`test@lago.com` / `demo@lago.com`, contraseña `lago1234`), un pedido+pago de ejemplo y una wishlist de ejemplo para `test@lago.com`.

## Documentos relacionados

- [ARCHITECTURE.md](./ARCHITECTURE.md) — patrón de capas que hace posible este reemplazo sin rehacer la UI.
- [API.md](./API.md) — endpoints que tendrían que existir para que el adaptador hable con Prisma.
- [ROADMAP.md](./ROADMAP.md) — cuándo se plantea abordar esto.
