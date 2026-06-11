import { eq } from "drizzle-orm";

import { registerProductPaymentSchema, uuidSchema } from "@/lib/validation";
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
    const body = registerProductPaymentSchema.parse(await request.json());
    const [before] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!before) return error("Order not found", 404);

    const productPaymentDate = parseOperationalDate(body.productPaymentDate);
    const scheduledShippingDate = body.scheduledShippingDate ? parseOperationalDate(body.scheduledShippingDate) : undefined;
    const [updated] = await db
      .update(orders)
      .set({
        productPaymentAmount: body.productPaymentAmount.toFixed(2),
        productPaymentMethod: body.productPaymentMethod,
        productPaymentDate,
        productPaymentConfirmed: true,
        scheduledShippingAt: scheduledShippingDate,
        scheduledShippingDate,
        packagingCost: body.packagingCost.toFixed(2),
        packagingPaymentAmount: body.packagingPaid ? body.packagingCost.toFixed(2) : null,
        packagingPaymentMethod: body.packagingPaid ? (body.packagingPaymentMethod ?? body.productPaymentMethod) : null,
        packagingPaymentDate: body.packagingPaid ? parseOperationalDate(body.packagingPaymentDate ?? body.productPaymentDate) : null,
        packagingPaymentConfirmed: body.packagingPaid,
        packagingPaymentConfirmedById: body.packagingPaid ? auth.user.id : null,
        packagingPaymentConfirmedAt: body.packagingPaid ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    await audit({ actorId: auth.user.id, action: "update", entity: "order", entityId: id, before, after: updated, request });
    const order = await changeOrderStatus({
      orderId: id,
      toStatus: "PAID",
      reason: body.observation ?? "Pago de productos registrado",
      actorId: auth.user.id,
      actorRole: auth.user.role,
      request,
    });
    return ok(order);
  } catch (err) {
    return err instanceof Error ? error(err.message, 409) : validationError(err);
  }
}
