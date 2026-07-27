import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { expectedSessionToken, isValidPassword, SESSION_COOKIE } from "@/lib/session";

export async function POST(request: Request) {
  const parsed = z.object({ password: z.string() }).safeParse(await request.json().catch(() => null));
  if (!parsed.success || !isValidPassword(parsed.data.password)) {
    return NextResponse.json({ error: "Senha inválida." }, { status: 401 });
  }
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, expectedSessionToken(), {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}
