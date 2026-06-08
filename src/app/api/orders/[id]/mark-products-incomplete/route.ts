import { uuidSchema } from "@/lib/validation";
import { requireUser } from "@/server/auth/guards";
import { error, ok, validationError } from "@/server/http/responses";
import { changeOrderStatus } from "@/server/orders/service";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(["admin", "promoter"]);
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const { id } = await ctx.params;
    uuidSchema.parse(id);
    return ok(await changeOrderStatus({ orderId: id, toStatus: "PRODUCTS_INCOMPLETE", reason: "Productos incompletos", actorId: auth.user.id, actorRole: auth.user.role, request }));
  } catch (err) {
    return err instanceof Error ? error(err.message, 409) : validationError(err);
  }
}
