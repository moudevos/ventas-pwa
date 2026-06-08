import { eq } from "drizzle-orm";

import { closeOrderSchema, uuidSchema } from "@/lib/validation";
import { audit } from "@/server/audit/log";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { orders } from "@/server/db/schema";
import { error, ok, validationError } from "@/server/http/responses";
import { changeOrderStatus } from "@/server/orders/service";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(["admin", "promoter"]);
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const { id } = await ctx.params;
    uuidSchema.parse(id);
    const body = closeOrderSchema.parse(await request.json());
    const [before] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!before) return error("Order not found", 404);
    const [updated] = await db
      .update(orders)
      .set({
        customerReceivedConfirmed: body.customerReceivedConfirmed ?? body.customerPickupConfirmed ?? true,
        customerPickupConfirmed: body.customerPickupConfirmed ?? body.customerReceivedConfirmed ?? true,
        customerPickupConfirmedAt: new Date(),
        carrierDeliveredConfirmed: body.carrierDeliveredConfirmed ?? true,
        deliveredAt: new Date(),
        closedAt: new Date(),
        observations: body.observation ?? before.observations,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();
    await audit({ actorId: auth.user.id, action: "update", entity: "order", entityId: id, before, after: updated, request });
    return ok(await changeOrderStatus({ orderId: id, toStatus: "CLOSED", reason: body.observation ?? "Pedido cerrado", actorId: auth.user.id, actorRole: auth.user.role, request }));
  } catch (err) {
    return err instanceof Error ? error(err.message, 409) : validationError(err);
  }
}
