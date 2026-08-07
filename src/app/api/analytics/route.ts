import { query } from "@/lib/db";

export async function GET() {
  try {
    // Total de eventos por automação (gatilhos)
    const triggersData = await query<{
      automation_id: string;
      automation_name: string;
      event_type: string;
      count: number;
    }>(`
      SELECT
        a.id as automation_id,
        a.name as automation_name,
        e.event_type,
        COUNT(*) as count
      FROM events e
      LEFT JOIN automations a ON a.id::text = e.payload->>'automation_id'
      WHERE e.event_type IN ('comment', 'story_reply', 'direct_message')
      GROUP BY a.id, a.name, e.event_type
      ORDER BY a.name, e.event_type
    `);

    // Status das mensagens na fila
    const queueStatus = await query<{
      automation_id: string;
      automation_name: string;
      status: string;
      count: number;
    }>(`
      SELECT
        a.id as automation_id,
        a.name as automation_name,
        q.status,
        COUNT(*) as count
      FROM queue q
      LEFT JOIN automations a ON q.automation_id = a.id
      GROUP BY a.id, a.name, q.status
      ORDER BY a.name, q.status
    `);

    // Timeline de execuções (últimas 24 horas)
    const timeline = await query<{
      hour: string;
      event_count: number;
      sent_count: number;
    }>(`
      SELECT
        to_char(date_trunc('hour', COALESCE(e.received_at, q.created_at)), 'YYYY-MM-DD HH24:00') as hour,
        COUNT(DISTINCT e.id) as event_count,
        COUNT(DISTINCT CASE WHEN q.status = 'sent' THEN q.id END) as sent_count
      FROM events e
      FULL OUTER JOIN queue q ON e.id = q.event_id
      WHERE COALESCE(e.received_at, q.created_at) >= now() - interval '24 hours'
      GROUP BY date_trunc('hour', COALESCE(e.received_at, q.created_at))
      ORDER BY hour DESC
    `);

    // Últimos eventos
    const recentEvents = await query<{
      id: number;
      event_type: string;
      sender_id: string;
      received_at: string;
      payload: any;
    }>(`
      SELECT
        id,
        event_type,
        sender_id,
        received_at,
        payload
      FROM events
      WHERE received_at >= now() - interval '24 hours'
      ORDER BY received_at DESC
      LIMIT 20
    `);

    // Estatísticas de contatos
    const contactStats = await query<{
      total_contacts: number;
      active_contacts_24h: number;
      avg_replies_per_contact: number;
    }>(`
      SELECT
        COUNT(*) as total_contacts,
        COUNT(CASE WHEN last_reply_at >= now() - interval '24 hours' THEN 1 END) as active_contacts_24h,
        ROUND(AVG(CAST((SELECT COUNT(*) FROM queue q WHERE q.contact_id = c.instagram_user_id AND q.status = 'sent') AS numeric)), 2) as avg_replies_per_contact
      FROM contacts c
    `);

    // Taxa de sucesso por automação
    const successRate = await query<{
      automation_id: string;
      automation_name: string;
      total: number;
      sent: number;
      failed: number;
      success_rate: number;
    }>(`
      SELECT
        a.id as automation_id,
        a.name as automation_name,
        COUNT(*) as total,
        COUNT(CASE WHEN q.status = 'sent' THEN 1 END) as sent,
        COUNT(CASE WHEN q.status = 'failed' THEN 1 END) as failed,
        ROUND(100.0 * COUNT(CASE WHEN q.status = 'sent' THEN 1 END) / NULLIF(COUNT(*), 0), 2) as success_rate
      FROM queue q
      LEFT JOIN automations a ON q.automation_id = a.id
      WHERE q.created_at >= now() - interval '7 days'
      GROUP BY a.id, a.name
      ORDER BY a.name
    `);

    // Última execução por automação
    const lastExecution = await query<{
      automation_id: string;
      automation_name: string;
      last_event_at: string;
      last_sent_at: string;
      pending_count: number;
    }>(`
      SELECT
        a.id as automation_id,
        a.name as automation_name,
        MAX(e.received_at)::text as last_event_at,
        MAX(CASE WHEN q.status = 'sent' THEN q.sent_at END)::text as last_sent_at,
        COUNT(CASE WHEN q.status = 'pending' THEN 1 END) as pending_count
      FROM automations a
      LEFT JOIN queue q ON q.automation_id = a.id
      LEFT JOIN events e ON e.payload->>'automation_id' = a.id::text
      GROUP BY a.id, a.name
      ORDER BY a.name
    `);

    return Response.json({
      triggers: triggersData.rows,
      queueStatus: queueStatus.rows,
      timeline: timeline.rows,
      recentEvents: recentEvents.rows,
      contactStats: contactStats.rows[0],
      successRate: successRate.rows,
      lastExecution: lastExecution.rows,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return Response.json(
      { error: "Erro ao buscar analytics" },
      { status: 500 }
    );
  }
}
