import { prepareOrderSchema, uuidSchema } from "@/lib/validation";
import { requireUser } from "@/server/auth/guards";
import { error, ok, validationError } from "@/server/http/responses";
import { prepareOrderItems } from "@/server/orders/preparation";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(["admin", "promoter"]);
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const { id } = await ctx.params;
    uuidSchema.parse(id);
    const body = prepareOrderSchema.parse(await request.json());
    return ok(await prepareOrderItems({ orderId: id, actorId: auth.user.id, items: body.items, observation: body.observation, request }));
  } catch (err) {
    return err instanceof Error ? error(err.message, 409) : validationError(err);
  }
}
