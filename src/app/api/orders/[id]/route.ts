import { eq } from "drizzle-orm";

import { uuidSchema } from "@/lib/validation";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { orderEvidence, orderItems, orderStatusHistory, orders, users } from "@/server/db/schema";
import { error, ok, validationError } from "@/server/http/responses";

export async function GET(_request: Request, ctx: RouteContext<"/api/orders/[id]">) {
  const auth = await requireUser();
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const { id } = await ctx.params;
    uuidSchema.parse(id);
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) return error("Order not found", 404);
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    const evidence = await db.select().from(orderEvidence).where(eq(orderEvidence.orderId, id));
    const history = await db
      .select({
        id: orderStatusHistory.id,
        fromStatus: orderStatusHistory.fromStatus,
        toStatus: orderStatusHistory.toStatus,
        reason: orderStatusHistory.reason,
        createdAt: orderStatusHistory.createdAt,
        actorName: users.name,
      })
      .from(orderStatusHistory)
      .leftJoin(users, eq(users.id, orderStatusHistory.createdById))
      .where(eq(orderStatusHistory.orderId, id));
    return ok({ ...order, items, evidence, history });
  } catch (err) {
    return validationError(err);
  }
}
