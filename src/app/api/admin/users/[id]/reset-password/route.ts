import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { resetPasswordSchema } from "@/lib/validation";
import { audit } from "@/server/audit/log";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { error, ok, validationError } from "@/server/http/responses";

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser(["admin"]);
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const { id } = await ctx.params;
    const body = resetPasswordSchema.parse(await request.json());
    const [before] = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (!before) return error("User not found", 404);
    const [after] = await db
      .update(users)
      .set({
        passwordHash: await bcrypt.hash(body.temporaryPassword, 12),
        temporaryPasswordVisible: body.temporaryPassword,
        mustChangePassword: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning({
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
    await audit({ actorId: auth.user.id, action: "update", entity: "user_password", entityId: id, before, after, request });
    return ok(after);
  } catch (err) {
    return validationError(err);
  }
}
