import { ZodError } from "zod";

import { transitionOrderSchema, uuidSchema } from "@/lib/validation";
import { requireUser } from "@/server/auth/guards";
import { changeOrderStatus } from "@/server/orders/service";
import { error, ok, validationError } from "@/server/http/responses";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(["admin", "promoter"]);
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const { id } = await ctx.params;
    uuidSchema.parse(id);
    const body = transitionOrderSchema.parse(await request.json());
    return ok(await changeOrderStatus({ orderId: id, toStatus: body.toStatus, reason: body.reason, actorId: auth.user.id, actorRole: auth.user.role, request }));
  } catch (err) {
    if (err instanceof ZodError) return validationError(err);
    if (err instanceof Error) return error(err.message, err.message === "Order not found" ? 404 : 409);
    return validationError(err);
  }
}
