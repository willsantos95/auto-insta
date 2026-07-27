import { env } from "@/lib/env";
import { getAccessToken, updateAccessToken } from "@/lib/config";
import { refreshLongToken } from "@/lib/meta";

function authorized(request: Request) {
  return request.headers.get("authorization") === `Bearer ${env.INTERNAL_API_SECRET}`;
}

export async function POST(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Não autorizado." }, { status: 401 });
  try {
    const current = await getAccessToken();
    const refreshed = await refreshLongToken(current);
    const expiresAt = new Date(Date.now() + refreshed.expires_in * 1000);
    await updateAccessToken(refreshed.access_token, expiresAt);
    return Response.json({ ok: true, expiresAt });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Falha ao renovar token." }, { status: 502 });
  }
}
