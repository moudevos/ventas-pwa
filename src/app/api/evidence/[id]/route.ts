import { eq } from "drizzle-orm";

import { uuidSchema } from "@/lib/validation";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { orderEvidence } from "@/server/db/schema";
import { error, ok, validationError } from "@/server/http/responses";

export async function GET(_request: Request, ctx: RouteContext<"/api/evidence/[id]">) {
  const auth = await requireUser();
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const { id } = await ctx.params;
    uuidSchema.parse(id);
    const [evidence] = await db.select().from(orderEvidence).where(eq(orderEvidence.id, id)).limit(1);
    if (!evidence) return error("Evidence not found", 404);
    return ok(evidence);
  } catch (err) {
    return validationError(err);
  }
}
