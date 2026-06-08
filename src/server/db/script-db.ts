// src/server/db/script-db.ts
import { drizzle } from "drizzle-orm/neon-http";

export const scriptDb = drizzle(process.env.DATABASE_URL!);