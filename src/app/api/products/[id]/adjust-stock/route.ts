import { adjustStockSchema, uuidSchema } from "@/lib/validation";
import { requireUser } from "@/server/auth/guards";
import { error, ok, validationError } from "@/server/http/responses";
import { adjustStock } from "@/server/stock/service";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(["admin"]);
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const { id } = await ctx.params;
    uuidSchema.parse(id);
    const body = adjustStockSchema.parse(await request.json());
    return ok(await adjustStock({ productId: id, stockOnHand: body.stockOnHand, reason: body.reason, actorId: auth.user.id, request }));
  } catch (err) {
    return err instanceof Error ? error(err.message, 409) : validationError(err);
  }
}
