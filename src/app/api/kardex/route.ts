import { and, desc, eq, gte, lte, sql } from "drizzle-orm";

import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { orders, products, sales, stockMovementTypeEnum, stockMovements, stockSourceTypeEnum, users } from "@/server/db/schema";
import { error, ok } from "@/server/http/responses";

export async function GET(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return error(auth.error, auth.status);
  const params = new URL(request.url).searchParams;
  const productId = params.get("productId");
  const orderId = params.get("orderId");
  const sourceType = params.get("sourceType");
  const sourceId = params.get("sourceId");
  const movementType = params.get("movementType");
  const dateFrom = params.get("dateFrom");
  const dateTo = params.get("dateTo");
  const filters = [
    productId ? eq(stockMovements.productId, productId) : undefined,
    orderId ? eq(stockMovements.orderId, orderId) : undefined,
    sourceId ? eq(stockMovements.sourceId, sourceId) : undefined,
    sourceType && stockSourceTypeEnum.enumValues.includes(sourceType as (typeof stockSourceTypeEnum.enumValues)[number])
      ? eq(stockMovements.sourceType, sourceType as (typeof stockSourceTypeEnum.enumValues)[number])
      : undefined,
    movementType && stockMovementTypeEnum.enumValues.includes(movementType as (typeof stockMovementTypeEnum.enumValues)[number])
      ? eq(stockMovements.movementType, movementType as (typeof stockMovementTypeEnum.enumValues)[number])
      : undefined,
    dateFrom ? gte(stockMovements.createdAt, new Date(dateFrom)) : undefined,
    dateTo ? lte(stockMovements.createdAt, new Date(dateTo)) : undefined,
  ].filter(Boolean);
  return ok(await db
    .select({
      id: stockMovements.id,
      movementType: stockMovements.movementType,
      quantity: stockMovements.quantity,
      previousStockOnHand: stockMovements.previousStockOnHand,
      newStockOnHand: stockMovements.newStockOnHand,
      previousStockReserved: stockMovements.previousStockReserved,
      newStockReserved: stockMovements.newStockReserved,
      sourceType: stockMovements.sourceType,
      sourceId: stockMovements.sourceId,
      reason: stockMovements.reason,
      createdAt: stockMovements.createdAt,
      sku: products.sku,
      productDescription: products.description,
      orderCode: orders.code,
      saleCode: sales.code,
      actorName: users.name,
    })
    .from(stockMovements)
    .leftJoin(products, eq(products.id, stockMovements.productId))
    .leftJoin(orders, eq(orders.id, stockMovements.orderId))
    .leftJoin(sales, sql`${sales.id}::text = ${stockMovements.sourceId}`)
    .leftJoin(users, eq(users.id, stockMovements.createdById))
    .where(filters.length ? and(...filters) : undefined)
    .orderBy(desc(stockMovements.createdAt))
    .limit(200));
}
