import { eq } from "drizzle-orm";

import { updateProductSchema } from "@/lib/validation";
import { audit } from "@/server/audit/log";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { products } from "@/server/db/schema";
import { error, ok, validationError } from "@/server/http/responses";

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(["admin", "promoter"]);
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const { id } = await ctx.params;
    const body = updateProductSchema.parse(await request.json());
    const [before] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    if (!before) return error("Product not found", 404);
    const patch = {
      sku: body.sku,
      description: body.description,
      defaultUnitPrice: body.defaultUnitPrice === undefined ? (body.basePrice === undefined ? undefined : body.basePrice.toFixed(2)) : body.defaultUnitPrice.toFixed(2),
      basePrice: body.basePrice === undefined ? undefined : body.basePrice.toFixed(2),
      stockOnHand: body.stockOnHand,
      minStock: body.minStock,
      status: body.status,
      active: body.status ? body.status === "active" : undefined,
      updatedAt: new Date(),
    };
    const [after] = await db.update(products).set(patch).where(eq(products.id, id)).returning();
    await audit({ actorId: auth.user.id, action: "update", entity: "product", entityId: id, before, after, request });
    return ok(after);
  } catch (err) {
    return validationError(err);
  }
}
