import { ilike, or } from "drizzle-orm";

import { productSchema } from "@/lib/validation";
import { audit } from "@/server/audit/log";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { products } from "@/server/db/schema";
import { created, error, ok, validationError } from "@/server/http/responses";

export async function GET(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return error(auth.error, auth.status);
  const search = new URL(request.url).searchParams.get("search");
  const rows = await db
    .select()
    .from(products)
    .where(search ? or(ilike(products.sku, `%${search}%`), ilike(products.description, `%${search}%`)) : undefined)
    .limit(100);
  return ok(rows);
}

export async function POST(request: Request) {
  const auth = await requireUser(["admin"]);
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const body = productSchema.parse(await request.json());
    const [product] = await db
      .insert(products)
      .values({
        sku: body.sku,
        description: body.description,
        defaultUnitPrice: (body.defaultUnitPrice ?? body.basePrice).toFixed(2),
        basePrice: body.basePrice.toFixed(2),
        stockOnHand: body.stockOnHand,
        minStock: body.minStock,
        primaryImageUrl: body.primaryImageUrl ?? null,
        status: body.status,
        active: body.status === "active",
        createdById: auth.user.id,
      })
      .returning();
    await audit({ actorId: auth.user.id, action: "create", entity: "product", entityId: product.id, after: product, request });
    return created(product);
  } catch (err) {
    return validationError(err);
  }
}
