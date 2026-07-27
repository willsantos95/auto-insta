import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET() {
  if (!env.INSTAGRAM_APP_ID) {
    return NextResponse.json({ error: "INSTAGRAM_APP_ID ainda não configurado." }, { status: 503 });
  }
  const state = randomBytes(24).toString("hex");
  const url = new URL("https://www.instagram.com/oauth/authorize");
  url.searchParams.set("client_id", env.INSTAGRAM_APP_ID);
  url.searchParams.set("redirect_uri", `${env.APP_URL}/api/oauth/callback`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set(
    "scope",
    "instagram_business_basic,instagram_business_manage_messages,instagram_business_manage_comments",
  );
  url.searchParams.set("state", state);
  const response = NextResponse.redirect(url);
  response.cookies.set("ig_oauth_state", state, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });
  return response;
}
