import "server-only";

import { eq } from "drizzle-orm";

import { audit } from "@/server/audit/log";
import { db } from "@/server/db";
import { orderItems, orders, orderStatusHistory, products } from "@/server/db/schema";
import { publishOrderEvent } from "@/server/realtime/pusher";

export async function prepareOrderItems(input: {
  orderId: string;
  actorId: string;
  items: Array<{ orderItemId: string; fulfilledQuantity: number }>;
  observation?: string;
  request: Request;
}) {
  const [beforeOrder] = await db.select().from(orders).where(eq(orders.id, input.orderId)).limit(1);
  if (!beforeOrder) throw new Error("Order not found");
  if (!["PAID", "PRODUCTS_INCOMPLETE", "PRODUCTS_COMPLETE"].includes(beforeOrder.status)) {
    throw new Error("Order cannot be prepared in current status");
  }

  for (const patch of input.items) {
    const [item] = await db.select().from(orderItems).where(eq(orderItems.id, patch.orderItemId)).limit(1);
    if (!item || item.orderId !== input.orderId) throw new Error("Order item not found");
    if (patch.fulfilledQuantity > item.quantity) throw new Error(`No se puede alistar mas de lo solicitado para ${item.sku ?? item.description}`);
    if (patch.fulfilledQuantity > item.reservedQuantity) throw new Error(`No hay reserva suficiente para ${item.sku ?? item.description}`);
    if (item.productId) {
      const [product] = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
      if (!product) throw new Error("Product not found");
      const availableReserved = product.stockReserved;
      if (patch.fulfilledQuantity > availableReserved) throw new Error(`Stock reservado insuficiente para ${item.sku ?? item.description}`);
    }
    await db.update(orderItems).set({
      fulfilledQuantity: patch.fulfilledQuantity,
      missingQuantity: item.quantity - patch.fulfilledQuantity,
      isComplete: patch.fulfilledQuantity === item.quantity,
      updatedAt: new Date(),
    }).where(eq(orderItems.id, item.id));
  }

  const allItems = await db.select().from(orderItems).where(eq(orderItems.orderId, input.orderId));
  const allComplete = allItems.length > 0 && allItems.every((item) => item.isComplete || item.fulfilledQuantity >= item.quantity);
  const nextStatus = allComplete ? "PRODUCTS_COMPLETE" : "PRODUCTS_INCOMPLETE";
  const [afterOrder] = await db.update(orders).set({
    status: nextStatus,
    hasMissingProducts: !allComplete,
    updatedAt: new Date(),
  }).where(eq(orders.id, input.orderId)).returning();

  await db.insert(orderStatusHistory).values({
    orderId: input.orderId,
    fromStatus: beforeOrder.status,
    toStatus: nextStatus,
    reason: input.observation ?? (allComplete ? "Alistado completo" : "Alistado parcial"),
    createdById: input.actorId,
  });
  await audit({ actorId: input.actorId, action: "update", entity: "order_preparation", entityId: input.orderId, before: beforeOrder, after: { order: afterOrder, items: allItems }, request: input.request });
  await publishOrderEvent(input.orderId, "order.updated", { orderId: input.orderId });
  await publishOrderEvent(input.orderId, "order.statusChanged", { orderId: input.orderId, from: beforeOrder.status, to: nextStatus });
  return { order: afterOrder, items: allItems };
}
