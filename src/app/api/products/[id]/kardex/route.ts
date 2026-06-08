import { desc, eq } from "drizzle-orm";

import { uuidSchema } from "@/lib/validation";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { stockMovements } from "@/server/db/schema";
import { error, ok, validationError } from "@/server/http/responses";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const { id } = await ctx.params;
    uuidSchema.parse(id);
    return ok(await db.select().from(stockMovements).where(eq(stockMovements.productId, id)).orderBy(desc(stockMovements.createdAt)).limit(100));
  } catch (err) {
    return validationError(err);
  }
}
