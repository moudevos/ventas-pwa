import { NextResponse, type NextRequest } from "next/server";

import { sessionCookieName } from "@/server/auth/constants";
import { verifySessionToken } from "@/server/auth/token";

const publicPaths = ["/login", "/api/auth/login"];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublic = publicPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isAsset = pathname.startsWith("/_next") || pathname.includes(".");

  if (isAsset) return NextResponse.next();

  const session = await verifySessionToken(request.cookies.get(sessionCookieName)?.value);

  if (!session && !isPublic && !pathname.startsWith("/api")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (session?.mustChangePassword && !pathname.startsWith("/change-password") && !pathname.startsWith("/api/auth/change-password") && !pathname.startsWith("/api/auth/logout") && !pathname.startsWith("/api/auth/me")) {
    return NextResponse.redirect(new URL("/change-password", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
