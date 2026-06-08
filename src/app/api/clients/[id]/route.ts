import { eq } from "drizzle-orm";

import { clientSchema, uuidSchema } from "@/lib/validation";
import { audit } from "@/server/audit/log";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { clients } from "@/server/db/schema";
import { error, ok, validationError } from "@/server/http/responses";

export async function GET(_request: Request, ctx: RouteContext<"/api/clients/[id]">) {
  const auth = await requireUser();
  if ("error" in auth) return error(auth.error, auth.status);
  const { id } = await ctx.params;
  const [client] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  if (!client) return error("Client not found", 404);
  return ok(client);
}

export async function PATCH(request: Request, ctx: RouteContext<"/api/clients/[id]">) {
  const auth = await requireUser(["admin", "promoter"]);
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const { id } = await ctx.params;
    uuidSchema.parse(id);
    const body = clientSchema.partial().parse(await request.json());
    const [before] = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
    if (!before) return error("Client not found", 404);
    const [after] = await db.update(clients).set(body).where(eq(clients.id, id)).returning();
    await audit({ actorId: auth.user.id, action: "update", entity: "client", entityId: id, before, after, request });
    return ok(after);
  } catch (err) {
    return validationError(err);
  }
}
