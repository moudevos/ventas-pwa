import { eq } from "drizzle-orm";

import { scheduleShipmentSchema, uuidSchema } from "@/lib/validation";
import { audit } from "@/server/audit/log";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { orders } from "@/server/db/schema";
import { error, ok, validationError } from "@/server/http/responses";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(["admin", "promoter"]);
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const { id } = await ctx.params;
    uuidSchema.parse(id);
    const body = scheduleShipmentSchema.parse(await request.json());
    const [before] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!before) return error("Order not found", 404);
    const [after] = await db.update(orders).set({ scheduledShippingAt: new Date(body.scheduledShippingAt), updatedAt: new Date() }).where(eq(orders.id, id)).returning();
    await audit({ actorId: auth.user.id, action: "update", entity: "order", entityId: id, before, after, request });
    return ok(after);
  } catch (err) {
    return validationError(err);
  }
}
