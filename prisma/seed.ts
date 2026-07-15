import "dotenv/config";
import { createHash } from "node:crypto";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { products as placeholderProducts } from "../lib/placeholder-data";
import { CATEGORY_SLUG_BY_LABEL } from "../lib/catalog/types";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Mismo algoritmo que lib/auth/password.ts (SHA-256 hex, sin salt) para que
// los usuarios de prueba puedan iniciar sesión con la UI existente.
function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

const CATEGORIES = [
  { slug: "hombre", name: "Hombre" },
  { slug: "mujer", name: "Mujer" },
  { slug: "accesorios", name: "Accesorios" },
] as const;

async function seedCategoriesAndProducts() {
  const categoryIdBySlug = new Map<string, string>();
  for (const category of CATEGORIES) {
    const row = await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });
    categoryIdBySlug.set(category.slug, row.id);
  }

  for (const product of placeholderProducts) {
    const categoryId = categoryIdBySlug.get(
      CATEGORY_SLUG_BY_LABEL[product.category]!,
    )!;

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        categoryId,
        priceValue: Math.round(product.priceValue * 100),
        color: product.color,
        description: product.description,
        featured: product.featured ?? false,
      },
      create: {
        id: product.id,
        slug: product.slug,
        name: product.name,
        categoryId,
        priceValue: Math.round(product.priceValue * 100),
        color: product.color,
        description: product.description,
        featured: product.featured ?? false,
        images: {
          create: product.images.map((url, position) => ({ url, position })),
        },
        variants: {
          create: product.sizes.map((size) => ({ size, stock: 25 })),
        },
      },
    });
  }
}

async function seedUsers() {
  const passwordHash = hashPassword("lago1234");

  // test@lago.com es ADMIN (Sprint 14) para poder probar /admin/* con el
  // seed sin pasos manuales extra.
  const testUser = await prisma.user.upsert({
    where: { email: "test@lago.com" },
    update: { role: "ADMIN" },
    create: {
      name: "Laura Test",
      email: "test@lago.com",
      passwordHash,
      role: "ADMIN",
    },
  });

  const demoUser = await prisma.user.upsert({
    where: { email: "demo@lago.com" },
    update: {},
    create: { name: "Cliente Demo", email: "demo@lago.com", passwordHash },
  });

  const existingAddress = await prisma.address.findFirst({
    where: { userId: testUser.id },
  });
  if (!existingAddress) {
    await prisma.address.create({
      data: {
        userId: testUser.id,
        label: "Casa",
        fullName: "Laura Test",
        street: "Calle Falsa 123",
        city: "Madrid",
        postalCode: "28080",
        province: "Madrid",
        country: "España",
        phone: "600123123",
        isDefault: true,
      },
    });
  }

  return { testUser, demoUser };
}

async function seedDemoOrder(userId: string) {
  const existing = await prisma.order.findFirst({ where: { userId } });
  if (existing) return;

  const product = await prisma.product.findUnique({
    where: { slug: "abrigo-oversize-lana" },
    include: { images: { orderBy: { position: "asc" }, take: 1 } },
  });
  if (!product) return;

  const subtotal = product.priceValue;
  const shippingCost = 0;
  const tax = Math.round(subtotal * 0.21);
  const total = subtotal + shippingCost + tax;

  const order = await prisma.order.create({
    data: {
      userId,
      status: "ENTREGADO",
      subtotal,
      shippingCost,
      tax,
      total,
      shippingMethod: "STANDARD",
      shippingAddress: {
        fullName: "Laura Test",
        street: "Calle Falsa 123",
        city: "Madrid",
        postalCode: "28080",
        province: "Madrid",
        country: "España",
        phone: "600123123",
      },
      items: {
        create: {
          productId: product.id,
          name: product.name,
          image: product.images[0]?.url ?? "",
          size: "M",
          quantity: 1,
          priceValue: product.priceValue,
        },
      },
    },
  });

  await prisma.payment.create({
    data: {
      orderId: order.id,
      provider: "STRIPE",
      providerRef: `pi_seed_${order.id.slice(0, 12)}`,
      amount: total,
      currency: "EUR",
      status: "SUCCEEDED",
    },
  });
}

async function seedDemoWishlist(userId: string) {
  const existing = await prisma.wishlist.findFirst({ where: { userId } });
  if (existing) return;

  const products = await prisma.product.findMany({
    where: { slug: { in: ["chaqueta-bomber", "reloj-acero-minimalista"] } },
  });
  if (products.length === 0) return;

  await prisma.wishlist.create({
    data: {
      userId,
      items: {
        create: products.map((product) => ({ productId: product.id })),
      },
    },
  });
}

// Sprint 17 — blog y cupón de ejemplo, para que /blog y el checkout con
// cupón se puedan probar apenas corre el seed, sin pasos manuales.
async function seedBlogPosts() {
  const posts = [
    {
      slug: "guia-de-capas-para-el-invierno",
      title: "Guía de capas para el invierno",
      excerpt:
        "Cómo combinar abrigo, jersey y camisa sin perder silueta ni movilidad.",
      content:
        "## El arte de las capas\n\nVestir por capas no es solo abrigarse: es construir una silueta.\n\n- Empezá con una base ajustada.\n- Sumá una capa intermedia con textura.\n- Cerrá con un abrigo de corte limpio.\n\n**El secreto** está en no repetir texturas dos veces seguidas.",
      coverImage:
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1200&auto=format&fit=crop",
      tags: ["guías de estilo", "invierno"],
      authorName: "Laura Gómez",
    },
    {
      slug: "materiales-nobles-por-que-importan",
      title: "Materiales nobles: por qué importan",
      excerpt:
        "Lana, lino y cuero curtido a mano — qué hace que una prenda dure años.",
      content:
        "## Calidad que se nota\n\nUna prenda hecha con materiales nobles envejece mejor que una de fibras sintéticas.\n\n1. La lana regula la temperatura.\n2. El lino transpira.\n3. El cuero curtido a mano gana carácter con el uso.\n\n*LAGO* elige proveedores que priorizan estos tres materiales.",
      coverImage:
        "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=1200&auto=format&fit=crop",
      tags: ["materiales", "sostenibilidad"],
      authorName: "Equipo LAGO",
    },
    {
      slug: "novedades-temporada",
      title: "Lo nuevo de la temporada",
      excerpt: "Un vistazo a las piezas que se suman a la colección este mes.",
      content:
        "## Nuevas llegadas\n\nCada temporada sumamos piezas pensadas para durar, no para una sola estación.\n\n- Sastrería en tonos neutros.\n- Accesorios en cuero y acero.\n- Texturas naturales en toda la colección.",
      coverImage:
        "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1200&auto=format&fit=crop",
      tags: ["novedades"],
      authorName: "Equipo LAGO",
    },
  ];

  for (const post of posts) {
    await prisma.blogPost.upsert({
      where: { slug: post.slug },
      update: {},
      create: post,
    });
  }
}

async function seedCoupon() {
  await prisma.coupon.upsert({
    where: { code: "LAGO10" },
    update: {},
    create: {
      code: "LAGO10",
      type: "PERCENTAGE",
      value: 10,
      active: true,
      minSubtotal: 0,
    },
  });
}

async function main() {
  await seedCategoriesAndProducts();
  const { testUser } = await seedUsers();
  await seedDemoOrder(testUser.id);
  await seedDemoWishlist(testUser.id);
  await seedBlogPosts();
  await seedCoupon();
  console.log(
    "Seed completo: categorías, productos, usuarios de prueba, un pedido demo, una wishlist demo, 3 posts de blog y un cupón (LAGO10).",
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
