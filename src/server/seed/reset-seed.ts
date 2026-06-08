import "dotenv/config";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { scriptDb as db } from "@/server/db/script-db";
import { users } from "@/server/db/schema";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin12345!";
  const name = process.env.SEED_ADMIN_NAME ?? "Admin";

  const values = {
    name,
    email,
    role: "admin" as const,
    status: "active" as const,
    active: true,
    mustChangePassword: true,
    temporaryPasswordVisible: password,
    passwordHash: await bcrypt.hash(password, 12),
    updatedAt: new Date(),
  };

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    await db.update(users).set(values).where(eq(users.id, existing.id));
    console.log(`Seed admin reset: ${email}`);
    return;
  }

  await db.insert(users).values(values);
  console.log(`Seed admin created: ${email}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
