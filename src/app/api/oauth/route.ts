import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { exchangeLongToken, exchangeShortToken, fetchMyProfile, subscribeAccount } from "@/lib/meta";
import { saveInstagramConnection, saveInstagramAccount } from "@/lib/config";
import { env } from "@/lib/env";

function painelRedirect(message: string) {
  return NextResponse.redirect(`${env.APP_URL.replace(/\/$/, "")}/painel?oauth_error=${encodeURIComponent(message)}`);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const rawCode = url.searchParams.get("code");
  const code = rawCode?.trim().replace(/#_$/, "") ?? null;
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error_description") || url.searchParams.get("error");

  if (error) return painelRedirect(error);

  const cookieStore = await cookies();
  const expectedState = cookieStore.get("ig_oauth_state")?.value;
  const redirectUri = cookieStore.get("ig_oauth_redirect_uri")?.value;

  if (!code || !state || state !== expectedState) {
    return NextResponse.json({ error: "Estado OAuth inválido ou expirado." }, { status: 400 });
  }

  if (!redirectUri) {
    return painelRedirect("A URL OAuth expirou. Clique em Conectar Instagram novamente.");
  }

  try {
    // Usa exatamente a mesma string enviada no diálogo OAuth.
    const short = await exchangeShortToken(code, redirectUri);
    const long = await exchangeLongToken(short.access_token);
    const profile = await fetchMyProfile(long.access_token);
    await subscribeAccount(profile.user_id, long.access_token);

    // Salva na nova tabela de múltiplas contas
    await saveInstagramAccount({
      accessToken: long.access_token,
      expiresAt: new Date(Date.now() + long.expires_in * 1000),
      userId: profile.user_id,
      username: profile.username,
      name: profile.name,
      profilePictureUrl: profile.profile_picture_url,
    });

    // Mantém compatibilidade com código legado (salva também na tabela config)
    await saveInstagramConnection({
      accessToken: long.access_token,
      expiresAt: new Date(Date.now() + long.expires_in * 1000),
      userId: profile.user_id,
      username: profile.username,
      name: profile.name,
      profilePictureUrl: profile.profile_picture_url,
    });

    const response = NextResponse.redirect(`${env.APP_URL.replace(/\/$/, "")}/painel?connected=1`);
    response.cookies.delete("ig_oauth_state");
    response.cookies.delete("ig_oauth_redirect_uri");
    return response;
  } catch (oauthError) {
    const message = oauthError instanceof Error ? oauthError.message : String(oauthError);
    const response = painelRedirect(message);
    response.cookies.delete("ig_oauth_state");
    response.cookies.delete("ig_oauth_redirect_uri");
    return response;
  }
}
