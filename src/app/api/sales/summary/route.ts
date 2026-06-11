import { desc, inArray } from "drizzle-orm";

import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { orders, sales } from "@/server/db/schema";
import { error, ok } from "@/server/http/responses";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return error(auth.error, auth.status);
  const storeRows = await db.select().from(sales).orderBy(desc(sales.saleDate)).limit(500);
  const orderRows = await db
    .select()
    .from(orders)
    .where(inArray(orders.status, ["PAID", "PRODUCTS_INCOMPLETE", "PRODUCTS_COMPLETE", "READY_TO_SHIP", "PACKAGING_PAID", "SHIPPED", "CLOSED"]))
    .orderBy(desc(orders.productPaymentDate))
    .limit(500);
  const rows = [
    ...storeRows.map((sale) => ({ saleDate: sale.saleDate, totalAmount: sale.totalAmount })),
    ...orderRows.map((order) => ({ saleDate: order.productPaymentDate ?? order.createdAt, totalAmount: order.productPaymentAmount ?? order.totalProductsAmount ?? order.total ?? "0" })),
  ];
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const startOfWeek = new Date(startOfDay);
  startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7));
  const amount = (value: string) => Number(value);
  return ok({
    total: rows.reduce((sum, sale) => sum + amount(sale.totalAmount), 0),
    today: rows.filter((sale) => sale.saleDate >= startOfDay).reduce((sum, sale) => sum + amount(sale.totalAmount), 0),
    week: rows.filter((sale) => sale.saleDate >= startOfWeek).reduce((sum, sale) => sum + amount(sale.totalAmount), 0),
    count: rows.length,
    latest: rows.slice(0, 20),
  });
}
