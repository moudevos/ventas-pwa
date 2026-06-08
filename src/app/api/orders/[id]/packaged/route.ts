import { eq } from "drizzle-orm";

import { uuidSchema } from "@/lib/validation";
import { audit } from "@/server/audit/log";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { orders } from "@/server/db/schema";
import { error, ok, validationError } from "@/server/http/responses";
import { changeOrderStatus } from "@/server/orders/service";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(["admin", "promoter"]);
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const { id } = await ctx.params;
    uuidSchema.parse(id);
    const [before] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    if (!before) return error("Order not found", 404);
    await db.update(orders).set({ packagedAt: new Date(), updatedAt: new Date() }).where(eq(orders.id, id)).returning();
    const after = await changeOrderStatus({ orderId: id, toStatus: "READY_TO_SHIP", reason: "Packaged", actorId: auth.user.id, actorRole: auth.user.role, request });
    await audit({ actorId: auth.user.id, action: "update", entity: "order", entityId: id, before, after, request });
    return ok(after);
  } catch (err) {
    return validationError(err);
  }
}
