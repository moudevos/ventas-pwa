import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { changePasswordSchema } from "@/lib/validation";
import { audit } from "@/server/audit/log";
import { requireUserFromRequest } from "@/server/auth/guards";
import { setSessionCookie, signSession } from "@/server/auth/session";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { error, validationError } from "@/server/http/responses";

export async function POST(request: Request) {
  const auth = await requireUserFromRequest(request);
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const body = changePasswordSchema.parse(await request.json());
    const [user] = await db.select().from(users).where(eq(users.id, auth.user.id)).limit(1);
    if (!user || !(await bcrypt.compare(body.currentPassword, user.passwordHash))) {
      return error("Invalid current password", 400);
    }
    await db
      .update(users)
      .set({
        passwordHash: await bcrypt.hash(body.newPassword, 12),
        mustChangePassword: false,
        temporaryPasswordVisible: null,
        active: true,
        status: "active",
        updatedAt: new Date(),
      })
      .where(eq(users.id, auth.user.id));
    const [updatedUser] = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        mustChangePassword: users.mustChangePassword,
      })
      .from(users)
      .where(eq(users.id, auth.user.id))
      .limit(1);
    if (!updatedUser) return error("User not found", 404);
    await audit({ actorId: auth.user.id, action: "change_password", entity: "user", entityId: auth.user.id, request });
    const response = NextResponse.json({
      data: {
        ok: true,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          mustChangePassword: false,
        },
      },
    });
    setSessionCookie(
      response,
      await signSession({
        userId: updatedUser.id,
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        mustChangePassword: false,
      }),
    );
    return response;
  } catch (err) {
    return validationError(err);
  }
}
