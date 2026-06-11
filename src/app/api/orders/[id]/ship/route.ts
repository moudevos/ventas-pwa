import { eq } from "drizzle-orm";

import { shipOrderSchema, uuidSchema } from "@/lib/validation";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { orders } from "@/server/db/schema";
import { error, ok, validationError } from "@/server/http/responses";
import { parseOperationalDate } from "@/server/orders/dates";
import { changeOrderStatus, upsertShipment } from "@/server/orders/service";
import { convertOrderReservationsToOut } from "@/server/stock/service";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(["admin", "promoter"]);
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const { id } = await ctx.params;
    uuidSchema.parse(id);
    const body = shipOrderSchema.parse(await request.json());
    const [before] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!before) return error("Pedido no encontrado", 404);
    if (!before.productPaymentConfirmed) return error("Primero registra el pago del pedido.", 409);
    if (before.hasMissingProducts || !["PRODUCTS_COMPLETE", "READY_TO_SHIP", "PACKAGING_PAID"].includes(before.status)) {
      return error("No se puede enviar: primero alista y completa el stock del pedido.", 409);
    }
    const packagingPaymentConfirmed = before.packagingPaymentConfirmed || Boolean(body.packagingPaymentAmount);
    if (!packagingPaymentConfirmed) {
      return error("Falta confirmar el pago de embalaje de S/ 2.00 antes de enviar.", 409);
    }
    const shippedAt = new Date();
    if (before.status === "PRODUCTS_COMPLETE") {
      await convertOrderReservationsToOut({ orderId: id, actorId: auth.user.id });
    }
    await db
      .update(orders)
      .set({
        shippingType: body.shippingType,
        providerName: body.shippingType === "PICKUP" ? "Recojo en tienda" : body.providerName,
        trackingNumber: body.trackingNumber,
        deliveryOrderNumber: body.deliveryOrderNumber,
        packagingPaymentAmount: body.packagingPaymentAmount ? body.packagingPaymentAmount.toFixed(2) : before.packagingPaymentAmount,
        packagingPaymentMethod: body.packagingPaymentAmount ? body.packagingPaymentMethod : before.packagingPaymentMethod,
        packagingPaymentDate: body.packagingPaymentAmount ? parseOperationalDate(body.packagingPaymentDate ?? new Date().toISOString()) : before.packagingPaymentDate,
        packagingPaymentConfirmed: true,
        packagingPaymentConfirmedById: before.packagingPaymentConfirmedById ?? auth.user.id,
        packagingPaymentConfirmedAt: before.packagingPaymentConfirmedAt ?? new Date(),
        packagedAt: before.packagedAt ?? new Date(),
        shippedAt,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id));
    const shipment = await upsertShipment({
      orderId: id,
      actorId: auth.user.id,
      providerType: body.shippingType,
      providerName: body.shippingType === "PICKUP" ? "Recojo en tienda" : body.providerName,
      carrier: body.shippingType === "PICKUP" ? "Recojo en tienda" : body.providerName,
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
