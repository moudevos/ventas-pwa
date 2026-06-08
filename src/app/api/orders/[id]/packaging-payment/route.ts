import { eq } from "drizzle-orm";

import { orderPackagingPaymentSchema, uuidSchema } from "@/lib/validation";
import { audit } from "@/server/audit/log";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { orders } from "@/server/db/schema";
import { error, ok, validationError } from "@/server/http/responses";
import { parseOperationalDate } from "@/server/orders/dates";
import { changeOrderStatus } from "@/server/orders/service";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(["admin", "promoter"]);
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const { id } = await ctx.params;
    uuidSchema.parse(id);
    const body = orderPackagingPaymentSchema.parse(await request.json());
    const scheduledShippingDate = parseOperationalDate(body.scheduledShippingDate);
    const [before] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!before) return error("Order not found", 404);
    await db
      .update(orders)
      .set({
        productPaymentAmount: before.totalProductsAmount ?? before.totalAmount ?? before.total,
        productPaymentDate: new Date(),
        productPaymentConfirmed: true,
        packagingCost: body.packagingCost.toFixed(2),
        scheduledShippingAt: scheduledShippingDate,
        scheduledShippingDate,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();
    const after = await changeOrderStatus({ orderId: id, toStatus: "PAID", reason: body.observation ?? "Pago de productos registrado", actorId: auth.user.id, actorRole: auth.user.role, request });
    await audit({ actorId: auth.user.id, action: "update", entity: "order", entityId: id, before, after, request });
    return ok(after);
  } catch (err) {
    return validationError(err);
  }
}
