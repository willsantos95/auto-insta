import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, isValidSession } from "./lib/session";

const PUBLIC_PATHS = [
  "/login",
  "/privacidade",
  "/exclusao-de-dados",
  "/api/admin/login",
  "/api/webhook",
  "/api/oauth/callback",
  "/api/internal/",
];

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  if (
    PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path)) ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const session = request.cookies.get(SESSION_COOKIE)?.value;
  if (isValidSession(session)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/((?!.*\\..*).*)"],
};
