import { desc, eq } from "drizzle-orm";

import { createOrderSchema } from "@/lib/validation";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { orderStatusEnum, orders } from "@/server/db/schema";
import { created, error, ok, validationError } from "@/server/http/responses";
import { createOrder } from "@/server/orders/service";

export async function GET(request: Request) {
  const auth = await requireUser();
  if ("error" in auth) return error(auth.error, auth.status);

  const status = new URL(request.url).searchParams.get("status");
  if (status && orderStatusEnum.enumValues.includes(status as (typeof orderStatusEnum.enumValues)[number])) {
    return ok(
      await db
        .select()
        .from(orders)
        .where(eq(orders.status, status as (typeof orderStatusEnum.enumValues)[number]))
        .orderBy(desc(orders.createdAt))
        .limit(100),
    );
  }

  return ok(await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(100));
}

export async function POST(request: Request) {
  const auth = await requireUser(["admin", "promoter"]);
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const body = createOrderSchema.parse(await request.json());
    return created(await createOrder({ ...body, actorId: auth.user.id, request }));
  } catch (err) {
    return validationError(err);
  }
}
