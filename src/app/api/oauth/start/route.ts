import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";

const OAUTH_COOKIE_MAX_AGE = 600;

export async function GET() {
  if (!env.INSTAGRAM_APP_ID) {
    return NextResponse.json({ error: "INSTAGRAM_APP_ID ainda não configurado." }, { status: 503 });
  }

  const state = randomBytes(24).toString("hex");
  const redirectUri = `${env.APP_URL.replace(/\/$/, "")}/api/oauth/callback`;

  // A URL exata é salva em cookie e reutilizada na troca do código. Isso evita
  // qualquer divergência causada por proxy, barra final ou variável alterada.
  const url = new URL("https://www.instagram.com/oauth/authorize");
  url.searchParams.set("client_id", env.INSTAGRAM_APP_ID);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set(
    "scope",
    "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments",
  );
  url.searchParams.set("state", state);

  const response = NextResponse.redirect(url);
  const cookieOptions = {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: OAUTH_COOKIE_MAX_AGE,
  };

  response.cookies.set("ig_oauth_state", state, cookieOptions);
  response.cookies.set("ig_oauth_redirect_uri", redirectUri, cookieOptions);
  return response;
}
