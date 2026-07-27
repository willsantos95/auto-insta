import { env } from "@/lib/env";
import { drainQueue } from "@/lib/queue";

function authorized(request: Request) {
  return request.headers.get("authorization") === `Bearer ${env.INTERNAL_API_SECRET}`;
}

export async function POST(request: Request) {
  if (!authorized(request)) return Response.json({ error: "Não autorizado." }, { status: 401 });
  return Response.json({ processed: await drainQueue(10) });
}
