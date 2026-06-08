import { eq } from "drizzle-orm";

import { evidenceSchema, uuidSchema } from "@/lib/validation";
import { audit } from "@/server/audit/log";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { orderEvidence, orders } from "@/server/db/schema";
import { created, error, validationError } from "@/server/http/responses";
import { publishOrderEvent } from "@/server/realtime/pusher";

export async function POST(request: Request, ctx: RouteContext<"/api/orders/[id]/evidence">) {
  const auth = await requireUser(["admin", "promoter"]);
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const { id } = await ctx.params;
    uuidSchema.parse(id);
    const [order] = await db.select({ id: orders.id }).from(orders).where(eq(orders.id, id)).limit(1);
    if (!order) return error("Order not found", 404);
    const body = evidenceSchema.parse(await request.json());
    const [evidence] = await db
      .insert(orderEvidence)
      .values({ ...body, orderId: id, createdById: auth.user.id })
      .returning();
    await audit({ actorId: auth.user.id, action: "create", entity: "order_evidence", entityId: evidence.id, after: evidence, request });
    await publishOrderEvent(id, "order-evidence-created", { orderId: id, evidence });
    return created(evidence);
  } catch (err) {
    return validationError(err);
  }
}
