import "server-only";

import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

import { sessionCookieName } from "./constants";
import { signSession, verifySessionToken, type SessionPayload } from "./token";

export { sessionCookieName, signSession, verifySessionToken, type SessionPayload };

function shouldUseSecureCookie() {
  return process.env.VERCEL === "1" || process.env.FORCE_SECURE_COOKIES === "true";
}

export async function getSession() {
  const store = await cookies();
  return verifySessionToken(store.get(sessionCookieName)?.value);
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(),
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureCookie(),
    path: "/",
    maxAge: 0,
  });
}

export async function getSessionFromRequest(request: NextRequest) {
  return verifySessionToken(request.cookies.get(sessionCookieName)?.value);
}
