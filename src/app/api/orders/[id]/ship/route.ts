import { eq } from "drizzle-orm";

import { shipOrderSchema, uuidSchema } from "@/lib/validation";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { orders } from "@/server/db/schema";
import { error, ok, validationError } from "@/server/http/responses";
import { changeOrderStatus, upsertShipment } from "@/server/orders/service";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(["admin", "promoter"]);
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const { id } = await ctx.params;
    uuidSchema.parse(id);
    const body = shipOrderSchema.parse(await request.json());
    const shippedAt = new Date();
    await db
      .update(orders)
      .set({
        shippingType: body.shippingType,
        providerName: body.providerName,
        trackingNumber: body.trackingNumber,
        deliveryOrderNumber: body.deliveryOrderNumber,
        shippedAt,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id));
    const shipment = await upsertShipment({
      orderId: id,
      actorId: auth.user.id,
      providerType: body.shippingType,
      providerName: body.providerName,
      carrier: body.providerName,
      trackingNumber: body.trackingNumber ?? body.deliveryOrderNumber,
      shippedAt: shippedAt.toISOString(),
      request,
    });
    const order = await changeOrderStatus({ orderId: id, toStatus: "SHIPPED", reason: "Envio registrado", actorId: auth.user.id, actorRole: auth.user.role, request });
    return ok({ order, shipment });
  } catch (err) {
    return err instanceof Error ? error(err.message, 409) : validationError(err);
  }
}
