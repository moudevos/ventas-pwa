import { eq } from "drizzle-orm";

import { uuidSchema } from "@/lib/validation";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { saleItems, sales } from "@/server/db/schema";
import { error, ok, validationError } from "@/server/http/responses";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const { id } = await ctx.params;
    uuidSchema.parse(id);
    const [sale] = await db.select().from(sales).where(eq(sales.id, id)).limit(1);
    if (!sale) return error("Sale not found", 404);
    const items = await db.select().from(saleItems).where(eq(saleItems.saleId, id));
    return ok({ ...sale, items });
  } catch (err) {
    return validationError(err);
  }
}
