import { desc, inArray } from "drizzle-orm";

import { createSaleSchema } from "@/lib/validation";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { orders, sales } from "@/server/db/schema";
import { created, error, ok, validationError } from "@/server/http/responses";
import { createStoreSale } from "@/server/sales/service";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return error(auth.error, auth.status);
  const storeSales = await db.select().from(sales).orderBy(desc(sales.saleDate)).limit(200);
  const orderSales = await db
    .select()
    .from(orders)
    .where(inArray(orders.status, ["PAID", "PRODUCTS_INCOMPLETE", "PRODUCTS_COMPLETE", "READY_TO_SHIP", "PACKAGING_PAID", "SHIPPED", "CLOSED"]))
    .orderBy(desc(orders.productPaymentDate))
    .limit(200);
  return ok([
    ...storeSales.map((sale) => ({ ...sale, source: "STORE_SALE" as const })),
    ...orderSales.map((order) => ({
      id: order.id,
      code: order.code,
      saleDate: order.productPaymentDate ?? order.createdAt,
      paymentMethod: order.productPaymentMethod ?? "Pedido",
      totalAmount: order.productPaymentAmount ?? order.totalProductsAmount ?? order.totalOrderAmount ?? order.total ?? "0",
      electronicInvoiceStatus: "NOT_REQUIRED",
      electronicInvoiceType: null,
      source: "ORDER" as const,
    })),
  ].sort((a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime()).slice(0, 200));
}

export async function POST(request: Request) {
  const auth = await requireUser(["admin", "promoter"]);
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const body = createSaleSchema.parse(await request.json());
    return created(await createStoreSale({ ...body, actorId: auth.user.id, request }));
  } catch (err) {
    return err instanceof Error ? error(err.message, 409) : validationError(err);
  }
}
