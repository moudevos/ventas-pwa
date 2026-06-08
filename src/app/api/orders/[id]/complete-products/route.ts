import { and, eq } from "drizzle-orm";

import { uuidSchema } from "@/lib/validation";
import { audit } from "@/server/audit/log";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { orderItems, orders } from "@/server/db/schema";
import { error, ok, validationError } from "@/server/http/responses";
import { changeOrderStatus } from "@/server/orders/service";
import { fulfillMissingProducts } from "@/server/stock/service";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(["admin", "promoter"]);
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const { id } = await ctx.params;
    uuidSchema.parse(id);
    const [before] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!before) return error("Order not found", 404);
    await fulfillMissingProducts({ orderId: id, actorId: auth.user.id });
    const incomplete = await db.select().from(orderItems).where(and(eq(orderItems.orderId, id), eq(orderItems.isComplete, false))).limit(1);
    if (incomplete.length) return error("Hay productos incompletos", 409);
    const [updated] = await db.update(orders).set({ hasMissingProducts: false, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
    await audit({ actorId: auth.user.id, action: "update", entity: "order", entityId: id, before, after: updated, request });
    return ok(await changeOrderStatus({ orderId: id, toStatus: "PRODUCTS_COMPLETE", reason: "Productos completos", actorId: auth.user.id, actorRole: auth.user.role, request }));
  } catch (err) {
    return err instanceof Error ? error(err.message, 409) : validationError(err);
  }
}
