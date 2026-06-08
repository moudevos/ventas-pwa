import { eq } from "drizzle-orm";

import { shipmentSchema, uuidSchema } from "@/lib/validation";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { shipments } from "@/server/db/schema";
import { changeOrderStatus, upsertShipment } from "@/server/orders/service";
import { error, ok, validationError } from "@/server/http/responses";

export async function GET(_request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if ("error" in auth) return error(auth.error, auth.status);
  const { id } = await ctx.params;
  const [shipment] = await db.select().from(shipments).where(eq(shipments.orderId, id)).limit(1);
  return ok(shipment ?? null);
}

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(["admin", "promoter"]);
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const { id } = await ctx.params;
    uuidSchema.parse(id);
    const body = shipmentSchema.parse(await request.json());
    const shipment = await upsertShipment({ orderId: id, actorId: auth.user.id, ...body, request });
    const order = await changeOrderStatus({ orderId: id, toStatus: "SHIPPED", reason: "Shipment registered", actorId: auth.user.id, actorRole: auth.user.role, request });
    return ok({ shipment, order });
  } catch (err) {
    return validationError(err);
  }
}
