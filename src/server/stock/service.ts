import "server-only";

import { and, eq, gt } from "drizzle-orm";

import { audit } from "@/server/audit/log";
import { db } from "@/server/db";
import { orderItems, orders, products, stockMovementTypeEnum, stockMovements } from "@/server/db/schema";

type MovementType = (typeof stockMovementTypeEnum.enumValues)[number];

function money(value: number) {
  return value.toFixed(2);
}

export async function recordStockMovement(input: {
  productId: string;
  orderId?: string;
  orderItemId?: string;
  movementType: MovementType;
  sourceType?: "ORDER" | "STORE_SALE" | "MANUAL" | "PRODUCTION";
  sourceId?: string;
  quantity: number;
  newStockOnHand: number;
  newStockReserved: number;
  previousStockOnHand: number;
  previousStockReserved: number;
  reason?: string;
  actorId: string;
}) {
  const [movement] = await db.insert(stockMovements).values({
    productId: input.productId,
    orderId: input.orderId,
    orderItemId: input.orderItemId,
    movementType: input.movementType,
    sourceType: input.sourceType,
    sourceId: input.sourceId,
    quantity: input.quantity,
    previousStockOnHand: input.previousStockOnHand,
    newStockOnHand: input.newStockOnHand,
    previousStockReserved: input.previousStockReserved,
    newStockReserved: input.newStockReserved,
    reason: input.reason,
    createdById: input.actorId,
  }).returning();
  return movement;
}

export async function stockIn(input: { productId: string; quantity: number; reason?: string; actorId: string; request: Request }) {
  const [before] = await db.select().from(products).where(eq(products.id, input.productId)).limit(1);
  if (!before) throw new Error("Product not found");
  const nextOnHand = before.stockOnHand + input.quantity;
  const [after] = await db.update(products).set({ stockOnHand: nextOnHand, updatedAt: new Date() }).where(eq(products.id, input.productId)).returning();
  const movement = await recordStockMovement({
    productId: input.productId,
    movementType: "IN",
    sourceType: "MANUAL",
    quantity: input.quantity,
    previousStockOnHand: before.stockOnHand,
    newStockOnHand: after.stockOnHand,
    previousStockReserved: before.stockReserved,
    newStockReserved: after.stockReserved,
    reason: input.reason ?? "Ingreso de stock",
    actorId: input.actorId,
  });
  await reservePendingForProduct({ productId: input.productId, actorId: input.actorId });
  await audit({ actorId: input.actorId, action: "update", entity: "product", entityId: input.productId, before, after, request: input.request });
  const [current] = await db.select().from(products).where(eq(products.id, input.productId)).limit(1);
  return { product: current ?? after, movement };
}

export async function reservePendingForProduct(input: { productId: string; actorId: string }) {
  const pendingItems = await db
    .select()
    .from(orderItems)
    .where(and(eq(orderItems.productId, input.productId), gt(orderItems.missingQuantity, 0)));

  for (const item of pendingItems) {
    const [before] = await db.select().from(products).where(eq(products.id, input.productId)).limit(1);
    if (!before) return;
    const available = Math.max(0, before.stockOnHand - before.stockReserved);
    if (available <= 0) return;
    const quantityToReserve = Math.min(available, item.missingQuantity);
    const [after] = await db
      .update(products)
      .set({ stockReserved: before.stockReserved + quantityToReserve, updatedAt: new Date() })
      .where(eq(products.id, input.productId))
      .returning();

    await recordStockMovement({
      productId: input.productId,
      orderId: item.orderId,
      orderItemId: item.id,
      movementType: "RESERVE",
      sourceType: "ORDER",
      sourceId: item.orderId,
      quantity: quantityToReserve,
      previousStockOnHand: before.stockOnHand,
      newStockOnHand: after.stockOnHand,
      previousStockReserved: before.stockReserved,
      newStockReserved: after.stockReserved,
      reason: "Reserva automatica por ingreso de stock",
      actorId: input.actorId,
    });

    await db.update(orderItems).set({
      reservedQuantity: item.reservedQuantity + quantityToReserve,
      missingQuantity: item.missingQuantity - quantityToReserve,
      updatedAt: new Date(),
    }).where(eq(orderItems.id, item.id));

    const remaining = await db
      .select({ id: orderItems.id })
      .from(orderItems)
      .where(and(eq(orderItems.orderId, item.orderId), gt(orderItems.missingQuantity, 0)))
      .limit(1);
    if (!remaining.length) {
      await db.update(orders).set({ hasMissingProducts: false, updatedAt: new Date() }).where(eq(orders.id, item.orderId));
    }
  }
}

export async function adjustStock(input: { productId: string; stockOnHand: number; reason: string; actorId: string; request: Request }) {
  const [before] = await db.select().from(products).where(eq(products.id, input.productId)).limit(1);
  if (!before) throw new Error("Product not found");
  const [after] = await db.update(products).set({ stockOnHand: input.stockOnHand, updatedAt: new Date() }).where(eq(products.id, input.productId)).returning();
  const movement = await recordStockMovement({
    productId: input.productId,
    movementType: "ADJUSTMENT",
    sourceType: "MANUAL",
    quantity: input.stockOnHand - before.stockOnHand,
    previousStockOnHand: before.stockOnHand,
    newStockOnHand: after.stockOnHand,
    previousStockReserved: before.stockReserved,
    newStockReserved: after.stockReserved,
    reason: input.reason,
    actorId: input.actorId,
  });
  await audit({ actorId: input.actorId, action: "update", entity: "product", entityId: input.productId, before, after, request: input.request });
  return { product: after, movement };
}

export async function reserveProduct(input: { productId: string; quantity: number; orderId: string; orderItemId?: string; actorId: string }) {
  const [before] = await db.select().from(products).where(eq(products.id, input.productId)).limit(1);
  if (!before) throw new Error("Product not found");
  const available = Math.max(0, before.stockOnHand - before.stockReserved);
  const reservedQuantity = Math.min(available, input.quantity);
  const missingQuantity = input.quantity - reservedQuantity;
  if (reservedQuantity > 0) {
    const [after] = await db.update(products).set({ stockReserved: before.stockReserved + reservedQuantity, updatedAt: new Date() }).where(eq(products.id, input.productId)).returning();
    await recordStockMovement({
      productId: input.productId,
      orderId: input.orderId,
      orderItemId: input.orderItemId,
      movementType: "RESERVE",
      sourceType: "ORDER",
      sourceId: input.orderId,
      quantity: reservedQuantity,
      previousStockOnHand: before.stockOnHand,
      newStockOnHand: after.stockOnHand,
      previousStockReserved: before.stockReserved,
      newStockReserved: after.stockReserved,
      reason: "Reserva por pedido",
      actorId: input.actorId,
    });
  }
  if (missingQuantity > 0) {
    await recordStockMovement({
      productId: input.productId,
      orderId: input.orderId,
      orderItemId: input.orderItemId,
      movementType: "PENDING_PRODUCTION",
      sourceType: "ORDER",
      sourceId: input.orderId,
      quantity: missingQuantity,
      previousStockOnHand: before.stockOnHand,
      newStockOnHand: before.stockOnHand,
      previousStockReserved: before.stockReserved + reservedQuantity,
      newStockReserved: before.stockReserved + reservedQuantity,
      reason: "Faltante para confeccion",
      actorId: input.actorId,
    });
  }
  return { reservedQuantity, missingQuantity };
}

export async function ensureProductBySku(input: { sku: string; description: string; unitPrice: number; actorId: string }) {
  const [existing] = await db.select().from(products).where(eq(products.sku, input.sku)).limit(1);
  if (existing) return existing;
  const [product] = await db.insert(products).values({
    sku: input.sku,
    description: input.description,
    defaultUnitPrice: money(input.unitPrice),
    basePrice: money(input.unitPrice),
    createdById: input.actorId,
  }).returning();
  return product;
}

export async function convertOrderReservationsToOut(input: { orderId: string; actorId: string }) {
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, input.orderId));
  for (const item of items) {
    if (!item.productId) continue;
    if (item.missingQuantity > 0 || item.reservedQuantity < item.quantity) {
      throw new Error("Order has incomplete products");
    }
    const [before] = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
    if (!before) throw new Error("Product not found");
    const nextOnHand = before.stockOnHand - item.quantity;
    const nextReserved = before.stockReserved - item.quantity;
    if (nextOnHand < 0 || nextReserved < 0) throw new Error("Invalid stock state");
    const [after] = await db.update(products).set({ stockOnHand: nextOnHand, stockReserved: nextReserved, updatedAt: new Date() }).where(eq(products.id, item.productId)).returning();
    await recordStockMovement({
      productId: item.productId,
      orderId: input.orderId,
      orderItemId: item.id,
      movementType: "OUT",
      sourceType: "ORDER",
      sourceId: input.orderId,
      quantity: item.quantity,
      previousStockOnHand: before.stockOnHand,
      newStockOnHand: after.stockOnHand,
      previousStockReserved: before.stockReserved,
      newStockReserved: after.stockReserved,
      reason: "Salida vendida por listo para envio",
      actorId: input.actorId,
    });
  }
}

export async function fulfillMissingProducts(input: { orderId: string; actorId: string }) {
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, input.orderId));
  for (const item of items) {
    if (!item.productId || item.missingQuantity <= 0) continue;
    const reservation = await reserveProduct({ productId: item.productId, quantity: item.missingQuantity, orderId: input.orderId, orderItemId: item.id, actorId: input.actorId });
    const reservedQuantity = item.reservedQuantity + reservation.reservedQuantity;
    const missingQuantity = item.missingQuantity - reservation.reservedQuantity;
    await db.update(orderItems).set({
      reservedQuantity,
      missingQuantity,
      fulfilledQuantity: reservedQuantity,
      isComplete: missingQuantity === 0,
      updatedAt: new Date(),
    }).where(eq(orderItems.id, item.id));
  }
}

export async function releaseOrderReservations(input: { orderId: string; actorId: string }) {
  const items = await db.select().from(orderItems).where(eq(orderItems.orderId, input.orderId));
  for (const item of items) {
    if (!item.productId || item.reservedQuantity <= 0) continue;
    const [before] = await db.select().from(products).where(eq(products.id, item.productId)).limit(1);
    if (!before) continue;
    const nextReserved = Math.max(0, before.stockReserved - item.reservedQuantity);
    const [after] = await db.update(products).set({ stockReserved: nextReserved, updatedAt: new Date() }).where(eq(products.id, item.productId)).returning();
    await recordStockMovement({
      productId: item.productId,
      orderId: input.orderId,
      orderItemId: item.id,
      movementType: "RELEASE",
      sourceType: "ORDER",
      sourceId: input.orderId,
      quantity: item.reservedQuantity,
      previousStockOnHand: before.stockOnHand,
      newStockOnHand: after.stockOnHand,
      previousStockReserved: before.stockReserved,
      newStockReserved: after.stockReserved,
      reason: "Liberacion por cancelacion",
      actorId: input.actorId,
    });
    await db.update(orderItems).set({ reservedQuantity: 0, fulfilledQuantity: 0, updatedAt: new Date() }).where(eq(orderItems.id, item.id));
  }
}
