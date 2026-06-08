import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import { loginSchema } from "@/lib/validation";
import { audit } from "@/server/audit/log";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { error, validationError } from "@/server/http/responses";
import { setSessionCookie, signSession } from "@/server/auth/session";

export async function POST(request: Request) {
  try {
    const body = loginSchema.parse(await request.json());
    const [user] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);

    if (!user?.active || !(await bcrypt.compare(body.password, user.passwordHash))) {
      return error("Invalid credentials", 401);
    }

    const token = await signSession({
      userId: user.id,
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
    });
    const response = NextResponse.json({
      data: { id: user.id, name: user.name, email: user.email, role: user.role, mustChangePassword: user.mustChangePassword },
    });
    setSessionCookie(response, token);
    await audit({ actorId: user.id, action: "login", entity: "auth", entityId: user.id, request });
    return response;
  } catch (err) {
    return validationError(err);
  }
}
