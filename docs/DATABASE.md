# Base de datos

## Estado actual: no hay base de datos

No hay Postgres, ni ningún otro motor de base de datos, conectado al proyecto. Todo el estado vive en tres lugares distintos:

| Dato | Dónde vive hoy | Persiste entre sesiones/dispositivos |
|---|---|---|
| Catálogo de productos y categorías | `lib/placeholder-data.ts`, `lib/categories.ts` (arrays en memoria, parte del código fuente) | No aplica — es código, no datos de usuario |
| Carrito | `localStorage` del navegador (clave `lago-cart:v1`) | Solo en el mismo navegador |
| Wishlist | `localStorage` del navegador (clave `lago-wishlist:v1`) | Solo en el mismo navegador |
| Usuarios (nombre, email, hash de contraseña) | `localStorage` del navegador (clave `lago-users:v1`) | Solo en el mismo navegador |
| Sesión activa | `localStorage` del navegador (clave `lago-session:v1`) | Solo en el mismo navegador |
| Tokens de recuperación de contraseña | `localStorage` del navegador (clave `lago-reset-tokens:v1`, expiran a los 30 min) | Solo en el mismo navegador |
| Direcciones | `localStorage` del navegador (clave `lago-addresses:v1`) | Solo en el mismo navegador |
| Pedidos | No se persisten — se generan en memoria de forma determinista por `userId` en cada consulta | No aplica |
| Catálogo real (si se conecta) | Shopify (fuera de este repo) | Sí, vía Shopify Storefront API |

## Modelo de datos actual (extraído del código)

### `PlaceholderProduct` — `lib/placeholder-data.ts`

```ts
type PlaceholderProduct = {
  id: string;
  slug: string;
  name: string;
  category: "Hombre" | "Mujer" | "Accesorios";
  price: string;        // formato de visualización, ej. "189,00"
  priceValue: number;   // valor numérico, ej. 189
  tone: Tone;            // paleta de color para el arte decorativo (Hero, banners)
  sizes: string[];       // ej. ["S", "M", "L"] o ["Única"]
  color: string;         // ej. "Negro", "Camel"
  description: string;
  images: string[];      // URLs de Unsplash
  featured?: boolean;    // aparece en "Productos destacados" de la Home
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
  id: string;           // `${productId}-${size}`
  productId: string;
  size: string;
  quantity: number;
  createdAt: string;    // ISO date
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
  name: string;    // snapshot intencional — ver nota abajo
  image: string;
  size: string;
  quantity: number;
  priceValue: number;
};
type Order = {
  id: string;
  userId: string;
  date: string;
  status: "Procesando" | "Enviado" | "Entregado" | "Cancelado";
  items: OrderItem[];
  total: number;
};
```

A diferencia de `CartLine` (que resuelve los datos del producto en vivo), `OrderItem` sí guarda una copia de nombre/imagen/precio: un pedido es un registro histórico e inmutable, debe reflejar lo que se cobró en su momento, no el precio actual del catálogo. Es la misma lógica que un sistema de pedidos real (Shopify, Stripe, etc.).

### Modelo Shopify (dormido) — `lib/shopify/types.ts`

Tipos completos ya definidos para `Product`, `ProductVariant`, `Collection`, `Cart`, `CartItem`, `Page`, `Menu` — ver ese archivo para el detalle exacto. No están en uso mientras no haya credenciales de Shopify.

## Propuesta de esquema Prisma (no implementada — para cuando se conecte Postgres)

Esta sección es una **propuesta de diseño**, derivada directamente de los tipos de arriba, para dar continuidad cuando se decida introducir Postgres + Prisma. No representa código existente.

```prisma
// schema.prisma (propuesta)

model Product {
  id          String   @id @default(cuid())
  slug        String   @unique
  name        String
  category    Category
  priceValue  Int      // en centavos, para evitar floats
  color       String
  description String
  featured    Boolean  @default(false)
  images      ProductImage[]
  sizes       ProductSize[]
  wishlistedBy Wishlist[]
  cartLines   CartLine[]
  orderItems  OrderItem[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum Category {
  HOMBRE
  MUJER
  ACCESORIOS
}

model ProductImage {
  id         String  @id @default(cuid())
  productId  String
  product    Product @relation(fields: [productId], references: [id])
  url        String  // URL de Cloudinary
  position   Int
}

model ProductSize {
  id        String  @id @default(cuid())
  productId String
  product   Product @relation(fields: [productId], references: [id])
  label     String  // "S", "M", "Única", etc.
  stock     Int     @default(0)
}

model User {
  id           String     @id @default(cuid())
  name         String
  email        String     @unique
  passwordHash String?    // null si se usa Auth.js/Clerk (login social, sin password propia)
  wishlist     Wishlist[]
  carts        Cart[]
  addresses    Address[]
  orders       Order[]
  createdAt    DateTime   @default(now())
}

model Address {
  id         String  @id @default(cuid())
  userId     String
  user       User    @relation(fields: [userId], references: [id])
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

model Order {
  id        String      @id @default(cuid())
  userId    String
  user      User        @relation(fields: [userId], references: [id])
  status    OrderStatus @default(PROCESANDO)
  items     OrderItem[]
  total     Int         // centavos
  createdAt DateTime    @default(now())
}

enum OrderStatus {
  PROCESANDO
  ENVIADO
  ENTREGADO
  CANCELADO
}

model OrderItem {
  id         String  @id @default(cuid())
  orderId    String
  order      Order   @relation(fields: [orderId], references: [id])
  productId  String
  product    Product @relation(fields: [productId], references: [id])
  name       String  // snapshot al momento de la compra
  image      String  // snapshot al momento de la compra
  size       String
  quantity   Int
  priceValue Int     // snapshot al momento de la compra, centavos
}

model Wishlist {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  productId  String
  product    Product  @relation(fields: [productId], references: [id])
  createdAt  DateTime @default(now())

  @@unique([userId, productId])
}

model Cart {
  id        String     @id @default(cuid())
  userId    String?    // null = carrito anónimo (guest)
  user      User?      @relation(fields: [userId], references: [id])
  lines     CartLine[]
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
}

model CartLine {
  id        String  @id @default(cuid())
  cartId    String
  cart      Cart    @relation(fields: [cartId], references: [id])
  productId String
  product   Product @relation(fields: [productId], references: [id])
  size      String
  quantity  Int
}
```

**Notas de la propuesta:**
- `priceValue` pasa de `number` (euros) a `Int` en centavos — práctica estándar para evitar errores de punto flotante en dinero.
- Las imágenes pasan de URLs de Unsplash hardcodeadas a una tabla `ProductImage` con URLs de **Cloudinary** (subida gestionada, transformaciones on-the-fly).
- `Wishlist` y `Cart` quedan atados a `User`, pero `Cart.userId` es opcional para soportar carritos de invitado (igual que hoy, que funciona sin login).
- `User.passwordHash` es nullable: si se conecta Auth.js o Clerk, el hashing y la verificación de contraseña los gestiona el proveedor y esta columna puede quedar sin usar (o eliminarse); si se implementa auth propia sobre Prisma, aquí va el hash server-side (bcrypt/argon2) reemplazando al SHA-256 client-side actual.
- `OrderItem` guarda `name`/`image`/`priceValue` como snapshot (no referencia en vivo al `Product`) porque un pedido es un registro histórico: si el producto cambia de precio o se elimina después, el pedido ya facturado no debe cambiar. Contrasta con `CartLine`, que no snapshotea nada y resuelve el producto en vivo.
- Migración: el día que esto se implemente, cada adaptador/repositorio (`lib/wishlist/storage-adapter.ts`, `lib/cart/storage-adapter.ts`, `lib/auth/users-storage.ts` + `session-storage.ts` + `reset-tokens-storage.ts`, `lib/addresses/addresses-repository.ts`, `lib/orders/orders-repository.ts`) es el **único** archivo de su dominio a reescribir — ver [ARCHITECTURE.md](./ARCHITECTURE.md#patrón-de-capa-de-datos-context--adaptador-introducido-en-sprint-6).

## Documentos relacionados

- [ARCHITECTURE.md](./ARCHITECTURE.md) — patrón de capas que hace posible este reemplazo sin rehacer la UI.
- [API.md](./API.md) — endpoints que tendrían que existir para que el adaptador hable con Prisma.
- [ROADMAP.md](./ROADMAP.md) — cuándo se plantea abordar esto.
