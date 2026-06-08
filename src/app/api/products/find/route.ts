import { eq } from "drizzle-orm";

import { productFindSchema } from "@/lib/validation";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { products } from "@/server/db/schema";
import { error, ok, validationError } from "@/server/http/responses";

export async function GET(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const input = productFindSchema.parse(Object.fromEntries(new URL(request.url).searchParams));
    const [product] = await db.select().from(products).where(eq(products.sku, input.sku)).limit(1);
    return ok(product ?? null);
  } catch (err) {
    return validationError(err);
  }
}
