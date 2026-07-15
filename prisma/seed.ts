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

  const testUser = await prisma.user.upsert({
    where: { email: "test@lago.com" },
    update: {},
    create: { name: "Laura Test", email: "test@lago.com", passwordHash },
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

async function main() {
  await seedCategoriesAndProducts();
  const { testUser } = await seedUsers();
  await seedDemoOrder(testUser.id);
  await seedDemoWishlist(testUser.id);
  console.log(
    "Seed completo: categorías, productos, usuarios de prueba, un pedido demo y una wishlist demo.",
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
