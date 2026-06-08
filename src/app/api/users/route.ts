import bcrypt from "bcryptjs";

import { createUserSchema } from "@/lib/validation";
import { audit } from "@/server/audit/log";
import { requireUser } from "@/server/auth/guards";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { created, error, ok, validationError } from "@/server/http/responses";

export async function GET() {
  const auth = await requireUser(["admin"]);
  if ("error" in auth) return error(auth.error, auth.status);
  const data = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      phone: users.phone,
      status: users.status,
      active: users.active,
      mustChangePassword: users.mustChangePassword,
      temporaryPasswordVisible: users.temporaryPasswordVisible,
    })
    .from(users);
  return ok(data);
}

export async function POST(request: Request) {
  const auth = await requireUser(["admin"]);
  if ("error" in auth) return error(auth.error, auth.status);
  try {
    const body = createUserSchema.parse(await request.json());
    const { temporaryPassword, status, ...userData } = body;
    const [user] = await db
      .insert(users)
      .values({
        ...userData,
        status,
        active: status === "active",
        passwordHash: await bcrypt.hash(temporaryPassword, 12),
        temporaryPasswordVisible: userData.mustChangePassword ? temporaryPassword : null,
      })
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
    await audit({ actorId: auth.user.id, action: "create", entity: "user", entityId: user.id, after: user, request });
    return created(user);
  } catch (err) {
    return validationError(err);
  }
}
