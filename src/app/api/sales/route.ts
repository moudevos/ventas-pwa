import { desc } from "drizzle-orm";

import { createSaleSchema } from "@/lib/validation";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { sales } from "@/server/db/schema";
import { created, error, ok, validationError } from "@/server/http/responses";
import { createStoreSale } from "@/server/sales/service";

export async function GET() {
  const auth = await requireUser();
  if ("error" in auth) return error(auth.error, auth.status);
  return ok(await db.select().from(sales).orderBy(desc(sales.saleDate)).limit(200));
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
