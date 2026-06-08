import { desc } from "drizzle-orm";

import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { sales } from "@/server/db/schema";
import { error, ok } from "@/server/http/responses";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return error(auth.error, auth.status);
  const rows = await db.select().from(sales).orderBy(desc(sales.saleDate)).limit(500);
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
