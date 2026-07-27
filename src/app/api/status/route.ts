import { getPublicConfig } from "@/lib/config";
import { query } from "@/lib/db";

export async function GET() {
  const [config, queue, events] = await Promise.all([
    getPublicConfig(),
    query<{ status: string; count: string }>(`SELECT status, count(*)::text AS count FROM queue GROUP BY status`),
    query<{ count: string }>(`SELECT count(*)::text AS count FROM events WHERE received_at >= now()-interval '24 hours'`),
  ]);
  return Response.json({ config, queue: queue.rows, eventsLast24h: Number(events.rows[0]?.count ?? 0) });
}
