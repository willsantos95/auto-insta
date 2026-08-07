import { query } from "@/lib/db";

export async function GET() {
  try {
    // Conta total de automações
    const allAutomations = await query<{
      id: string;
      name: string;
    }>(`SELECT id, name FROM automations ORDER BY name`);

    // Estatísticas de contatos
    const contactStats = await query<{
      total_contacts: number;
      active_contacts_24h: number;
    }>(`
      SELECT
        COUNT(*) as total_contacts,
        COUNT(CASE WHEN last_reply_at >= now() - interval '24 hours' THEN 1 END) as active_contacts_24h
      FROM contacts
    `);

    // Taxa de sucesso por automação (últimos 7 dias)
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
        COUNT(*)::int as total,
        COUNT(CASE WHEN q.status = 'sent' THEN 1 END)::int as sent,
        COUNT(CASE WHEN q.status = 'failed' THEN 1 END)::int as failed,
        ROUND(100.0 * COUNT(CASE WHEN q.status = 'sent' THEN 1 END) / NULLIF(COUNT(*), 0), 2)::float as success_rate
      FROM automations a
      LEFT JOIN queue q ON q.automation_id = a.id AND q.created_at >= now() - interval '7 days'
      GROUP BY a.id, a.name
      ORDER BY a.name
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
        COALESCE(q.status, 'none') as status,
        COUNT(q.id)::int as count
      FROM automations a
      LEFT JOIN queue q ON q.automation_id = a.id
      GROUP BY a.id, a.name, q.status
      ORDER BY a.name, q.status
    `);

    // Gatilhos recebidos (eventos por automação e tipo)
    const triggers = await query<{
      automation_id: string;
      automation_name: string;
      event_type: string;
      count: number;
    }>(`
      SELECT
        a.id as automation_id,
        a.name as automation_name,
        e.event_type,
        COUNT(*)::int as count
      FROM automations a
      LEFT JOIN events e ON a.id::text = e.payload->>'automation_id' AND e.event_type IN ('comment', 'story_reply', 'direct_message')
      WHERE e.id IS NOT NULL
      GROUP BY a.id, a.name, e.event_type
      ORDER BY a.name, e.event_type
    `);

    // Últimos eventos (24h)
    const recentEvents = await query<{
      id: number;
      event_type: string;
      sender_id: string;
      received_at: string;
      payload: any;
    }>(`
      SELECT id, event_type, sender_id, received_at, payload
      FROM events
      WHERE received_at >= now() - interval '24 hours'
      ORDER BY received_at DESC
      LIMIT 20
    `);

    // Timeline de eventos por hora (24h)
    const timeline = await query<{
      hour: string;
      event_count: number;
      sent_count: number;
    }>(`
      SELECT
        to_char(date_trunc('hour', COALESCE(e.received_at, q.created_at)), 'YYYY-MM-DD HH24:00') as hour,
        COUNT(DISTINCT e.id)::int as event_count,
        COUNT(DISTINCT CASE WHEN q.status = 'sent' THEN q.id END)::int as sent_count
      FROM events e
      FULL OUTER JOIN queue q ON e.id::text = q.event_id::text
      WHERE COALESCE(e.received_at, q.created_at) >= now() - interval '24 hours'
      GROUP BY date_trunc('hour', COALESCE(e.received_at, q.created_at))
      ORDER BY hour DESC
    `);

    // Última execução por automação
    const lastExecution = await query<{
      automation_id: string;
      automation_name: string;
      last_event_at: string | null;
      last_sent_at: string | null;
      pending_count: number;
    }>(`
      SELECT
        a.id as automation_id,
        a.name as automation_name,
        MAX(e.received_at)::text as last_event_at,
        MAX(CASE WHEN q.status = 'sent' THEN q.sent_at END)::text as last_sent_at,
        COUNT(CASE WHEN q.status = 'pending' THEN 1 END)::int as pending_count
      FROM automations a
      LEFT JOIN queue q ON q.automation_id = a.id
      LEFT JOIN events e ON a.id::text = e.payload->>'automation_id'
      GROUP BY a.id, a.name
      ORDER BY a.name
    `);

    const totalAutomations = allAutomations.rows.length;
    const totalContacts = contactStats.rows[0]?.total_contacts || 0;
    const activeContacts = contactStats.rows[0]?.active_contacts_24h || 0;
    const overallSuccessRate = successRate.rows.length > 0
      ? (successRate.rows.reduce((sum, s) => sum + (s.success_rate || 0), 0) / successRate.rows.length).toFixed(1)
      : 0;
    const pendingCount = queueStatus.rows
      .filter(q => q.status === 'pending')
      .reduce((sum, q) => sum + q.count, 0);

    return Response.json({
      kpis: {
        totalContacts,
        activeContacts,
        totalAutomations,
        successRate: parseFloat(overallSuccessRate as string),
        pendingCount,
      },
      triggers: triggers.rows,
      queueStatus: queueStatus.rows.filter(q => q.status !== 'none' && q.count > 0),
      timeline: timeline.rows,
      recentEvents: recentEvents.rows,
      contactStats: { total_contacts: totalContacts, active_contacts_24h: activeContacts },
      successRate: successRate.rows,
      lastExecution: lastExecution.rows,
    });
  } catch (error) {
    console.error("Analytics error:", error);
    return Response.json(
      {
        error: "Erro ao buscar analytics",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
