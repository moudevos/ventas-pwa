import { NextResponse } from "next/server";

import { audit } from "@/server/audit/log";
import { clearSessionCookie, getSession } from "@/server/auth/session";

export async function POST(request: Request) {
  const session = await getSession();
  const response = NextResponse.json({ data: { ok: true } });
  clearSessionCookie(response);
  if (session) {
    await audit({ actorId: session.userId, action: "logout", entity: "auth", entityId: session.userId, request });
  }
  return response;
}
