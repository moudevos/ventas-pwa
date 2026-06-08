import { desc } from "drizzle-orm";

import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { auditLogs } from "@/server/db/schema";
import { error, ok } from "@/server/http/responses";

export async function GET() {
  const auth = await requireUser(["admin"]);
  if ("error" in auth) return error(auth.error, auth.status);
  return ok(await db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(200));
}
