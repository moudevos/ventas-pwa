import { desc, gt } from "drizzle-orm";

import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { orderItems, orders, products, sales, stockMovements } from "@/server/db/schema";
import { error, ok } from "@/server/http/responses";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return error(auth.error, auth.status);

  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(200);
  const now = Date.now();
  const byStatus = rows.reduce<Record<string, number>>((acc, order) => {
    acc[order.status] = (acc[order.status] ?? 0) + 1;
    return acc;
  }, {});
  const active = rows.filter((order) => !["CLOSED", "CANCELLED"].includes(order.status));
  const overdue = active.filter((order) => order.scheduledShippingDate && order.scheduledShippingDate.getTime() < now);
  const dueSoon = active.filter((order) => {
    if (!order.scheduledShippingDate) return false;
    const diff = order.scheduledShippingDate.getTime() - now;
    return diff >= 0 && diff <= 24 * 60 * 60 * 1000;
  });
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7));
  const paidOrders = rows.filter((order) => order.productPaymentConfirmed);
  const salesAmount = (order: typeof rows[number]) => Number(order.totalProductsAmount ?? order.totalOrderAmount ?? order.totalAmount ?? order.total ?? 0);
  const salesToday = paidOrders
    .filter((order) => order.productPaymentDate && order.productPaymentDate >= startOfDay)
    .reduce((sum, order) => sum + salesAmount(order), 0);
  const salesWeek = paidOrders
    .filter((order) => order.productPaymentDate && order.productPaymentDate >= startOfWeek)
    .reduce((sum, order) => sum + salesAmount(order), 0);
  const totalProductsAmount = paidOrders.reduce((sum, order) => sum + salesAmount(order), 0);
  const closed = byStatus.CLOSED ?? 0;
  const missingItems = await db.select().from(orderItems).where(gt(orderItems.missingQuantity, 0)).limit(100);
  const productRows = await db.select().from(products).limit(200);
  const saleRows = await db.select().from(sales).orderBy(desc(sales.saleDate)).limit(500);
  const latestKardex = await db.select().from(stockMovements).orderBy(desc(stockMovements.createdAt)).limit(20);
  const lowStock = productRows
    .map((product) => ({ ...product, stockAvailable: product.stockOnHand - product.stockReserved }))
    .filter((product) => product.active && product.stockAvailable <= product.minStock);
  const storeSalesToday = saleRows
    .filter((sale) => sale.saleDate >= startOfDay)
    .reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
  const storeSalesWeek = saleRows
    .filter((sale) => sale.saleDate >= startOfWeek)
    .reduce((sum, sale) => sum + Number(sale.totalAmount), 0);
  const storeSalesTotal = saleRows.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);

  return ok({
    total: rows.length,
    byStatus,
    registered: byStatus.REGISTERED ?? 0,
    created: byStatus.CREATED ?? 0,
    paid: byStatus.PAID ?? 0,
    productsIncomplete: byStatus.PRODUCTS_INCOMPLETE ?? 0,
    productsComplete: byStatus.PRODUCTS_COMPLETE ?? 0,
    scheduled: byStatus.SCHEDULED ?? 0,
    readyToShip: byStatus.READY_TO_SHIP ?? 0,
    shipped: byStatus.SHIPPED ?? 0,
    delivered: byStatus.DELIVERED ?? 0,
    closed,
    observed: byStatus.OBSERVED ?? 0,
    cancelled: byStatus.CANCELLED ?? 0,
    salesToday,
    salesWeek,
    storeSalesToday,
    storeSalesWeek,
    storeSalesTotal,
    salesByChannel: { ORDER: totalProductsAmount, STORE_SALE: storeSalesTotal },
    paidOrdersCount: paidOrders.length,
    averageTicket: paidOrders.length ? totalProductsAmount / paidOrders.length : 0,
    totalProductsAmount,
    incompleteOrders: rows.filter((order) => order.hasMissingProducts || order.status === "PRODUCTS_INCOMPLETE"),
    missingItems,
    lowStock,
    productionAlerts: missingItems,
    latestKardex,
    overdue,
    dueSoon,
    orders: rows,
  });
}
