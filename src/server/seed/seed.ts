import "dotenv/config";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

//import { db } from "@/server/db";
import { scriptDb as db } from "@/server/db/script-db";
import { users } from "@/server/db/schema";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Admin12345!";
  const name = process.env.SEED_ADMIN_NAME ?? "Admin";

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    console.log(`Seed admin already exists: ${email}`);
    return;
  }

  await db.insert(users).values({
    name,
    email,
    role: "admin",
    active: true,
    mustChangePassword: true,
    passwordHash: await bcrypt.hash(password, 12),
  });
  console.log(`Seed admin created: ${email}`);
  console.log("Initial password comes from SEED_ADMIN_PASSWORD or defaults to Admin12345!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
