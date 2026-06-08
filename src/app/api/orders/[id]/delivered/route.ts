import { eq } from "drizzle-orm";

import { uuidSchema } from "@/lib/validation";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { shipments } from "@/server/db/schema";
import { error, ok, validationError } from "@/server/http/responses";
import { changeOrderStatus } from "@/server/orders/service";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(["admin", "promoter"]);
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const { id } = await ctx.params;
    uuidSchema.parse(id);
    await db.update(shipments).set({ deliveredAt: new Date(), updatedAt: new Date() }).where(eq(shipments.orderId, id));
    return ok(await changeOrderStatus({ orderId: id, toStatus: "DELIVERED", reason: "Delivery confirmed", actorId: auth.user.id, actorRole: auth.user.role, request }));
  } catch (err) {
    return validationError(err);
  }
}
