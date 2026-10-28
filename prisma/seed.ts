import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_CATEGORIES } from "../src/lib/categories";

export { DEFAULT_CATEGORIES };

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding PocketLedger database...");

  // Create a demo user
  const hash = await bcrypt.hash("Demo@1234", 12);
  const user = await prisma.user.upsert({
    where: { email: "demo@pocketledger.app" },
    update: {},
    create: {
      name: "Demo User",
      email: "demo@pocketledger.app",
      passwordHash: hash,
      currency: "LKR",
    },
  });

  // Seed default categories for demo user
  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: {
        id: `seed-${user.id}-${cat.name}`,
      },
      update: {},
      create: {
        id: `seed-${user.id}-${cat.name}`,
        userId: user.id,
        ...cat,
      },
    });
  }

  console.log(`✅ Seeded user: ${user.email}`);
  console.log(`✅ Seeded ${DEFAULT_CATEGORIES.length} default categories`);
}

// Only run main if this file is the entry point
if (process.argv[1]?.includes("seed")) {
  main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
}
