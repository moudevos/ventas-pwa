import { eq } from "drizzle-orm";

import { updateUserSchema, uuidSchema } from "@/lib/validation";
import { audit } from "@/server/audit/log";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { error, ok, validationError } from "@/server/http/responses";

export async function PATCH(request: Request, ctx: RouteContext<"/api/users/[id]">) {
  const auth = await requireUser(["admin"]);
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const { id } = await ctx.params;
    uuidSchema.parse(id);
    const body = updateUserSchema.parse(await request.json());
    const [before] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!before) return error("User not found", 404);
    const patch = { ...body, active: body.status ? body.status === "active" : body.active };
    const [after] = await db.update(users).set(patch).where(eq(users.id, id)).returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      phone: users.phone,
      status: users.status,
      active: users.active,
      mustChangePassword: users.mustChangePassword,
      temporaryPasswordVisible: users.temporaryPasswordVisible,
    });
    await audit({ actorId: auth.user.id, action: "update", entity: "user", entityId: id, before, after, request });
    return ok(after);
  } catch (err) {
    return validationError(err);
  }
}
