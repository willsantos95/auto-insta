import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { exchangeLongToken, exchangeShortToken, fetchMyProfile, subscribeAccount } from "@/lib/meta";
import { saveInstagramConnection } from "@/lib/config";
import { env } from "@/lib/env";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error_description") || url.searchParams.get("error");
  if (error) return NextResponse.redirect(`${env.APP_URL}/painel?oauth_error=${encodeURIComponent(error)}`);

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("ig_oauth_state")?.value;
  if (!code || !state || state !== expectedState) {
    return NextResponse.json({ error: "Estado OAuth inválido ou expirado." }, { status: 400 });
  }

  try {
    const short = await exchangeShortToken(code);
    const long = await exchangeLongToken(short.access_token);
    const profile = await fetchMyProfile(long.access_token);
    await subscribeAccount(profile.user_id, long.access_token);
    await saveInstagramConnection({
      accessToken: long.access_token,
      expiresAt: new Date(Date.now() + long.expires_in * 1000),
      userId: profile.user_id,
      username: profile.username,
      name: profile.name,
      profilePictureUrl: profile.profile_picture_url,
    });
    const response = NextResponse.redirect(`${env.APP_URL}/painel?connected=1`);
    response.cookies.delete("ig_oauth_state");
    return response;
  } catch (oauthError) {
    const message = oauthError instanceof Error ? oauthError.message : String(oauthError);
    return NextResponse.redirect(`${env.APP_URL}/painel?oauth_error=${encodeURIComponent(message)}`);
  }
}
