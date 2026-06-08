import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/server/db";
import { users, type UserRole } from "@/server/db/schema";
import { sessionCookieName } from "./constants";
import { getSession } from "./session";
import { verifySessionToken, type SessionPayload } from "./token";

type AuthFailure = {
  error: string;
  status: number;
};

type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  mustChangePassword: boolean;
};

type AuthSuccess = {
  user: AuthUser;
};

const roleRank: Record<UserRole, number> = {
  promoter: 1,
  admin: 2,
};

async function requireUserForSession(session: SessionPayload | null, roles?: UserRole[]): Promise<AuthSuccess | AuthFailure> {
  if (!session) return { error: "Unauthorized", status: 401 };

  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      active: users.active,
      mustChangePassword: users.mustChangePassword,
    })
    .from(users)
    .where(eq(users.id, session.userId))
    .limit(1);

  if (!user?.active) return { error: "Unauthorized", status: 401 };
  if (roles && !roles.includes(user.role)) return { error: "Sin Autorizacion", status: 403 };

  return { user };
}

export async function requireUser(roles?: UserRole[]): Promise<AuthSuccess | AuthFailure> {
  return requireUserForSession(await getSession(), roles);
}

export async function requireUserFromRequest(request: Request, roles?: UserRole[]): Promise<AuthSuccess | AuthFailure> {
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${sessionCookieName}=`))
    ?.slice(sessionCookieName.length + 1);

  return requireUserForSession(await verifySessionToken(cookie ? decodeURIComponent(cookie) : undefined), roles);
}

export function hasRoleAtLeast(role: UserRole, minimum: UserRole) {
  return roleRank[role] >= roleRank[minimum];
}
