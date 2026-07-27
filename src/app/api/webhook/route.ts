import { after } from "next/server";
import { env } from "@/lib/env";
import { drainQueue } from "@/lib/queue";
import { processWebhookPayload, verifyWebhookSignature } from "@/lib/webhook";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  if (mode === "subscribe" && token === env.WEBHOOK_VERIFY_TOKEN && challenge) {
    return new Response(challenge, { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return new Response("Verificação recusada.", { status: 403 });
}

export async function POST(request: Request) {
  const raw = Buffer.from(await request.arrayBuffer());
  if (!verifyWebhookSignature(raw, request.headers.get("x-hub-signature-256"))) {
    return Response.json({ error: "Assinatura inválida." }, { status: 401 });
  }
  const payload = JSON.parse(raw.toString("utf8"));
  await processWebhookPayload(payload);
  after(async () => {
    await drainQueue(3);
  });
  return Response.json({ received: true });
}
