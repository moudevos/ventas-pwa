import { eq } from "drizzle-orm";

import { markReadyToShipSchema, uuidSchema } from "@/lib/validation";
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
    const body = markReadyToShipSchema.parse(await request.json());
    const [before] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!before) return error("Order not found", 404);

    const [updated] = await db
      .update(orders)
      .set({
        packagingPaymentAmount: body.packagingPaymentAmount.toFixed(2),
        packagingPaymentMethod: body.packagingPaymentMethod,
        packagingPaymentDate: parseOperationalDate(body.packagingPaymentDate),
        packagingPaymentConfirmed: true,
        packagingPaymentConfirmedById: auth.user.id,
        packagingPaymentConfirmedAt: new Date(),
        packagedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning();

    await audit({ actorId: auth.user.id, action: "update", entity: "order", entityId: id, before, after: updated, request });
    const order = await changeOrderStatus({
      orderId: id,
      toStatus: "PACKAGING_PAID",
      reason: body.observation ?? "Pago de embalaje registrado",
      actorId: auth.user.id,
      actorRole: auth.user.role,
      request,
    });
    return ok(order);
  } catch (err) {
    return err instanceof Error ? error(err.message, 409) : validationError(err);
  }
}
