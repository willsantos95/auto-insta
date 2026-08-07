"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Analytics {
  triggers: Array<{
    automation_id: string;
    automation_name: string;
    event_type: string;
    count: number;
  }>;
  queueStatus: Array<{
    automation_id: string;
    automation_name: string;
    status: string;
    count: number;
  }>;
  timeline: Array<{
    hour: string;
    event_count: number;
    sent_count: number;
  }>;
  recentEvents: Array<{
    id: number;
    event_type: string;
    sender_id: string;
    received_at: string;
    payload: any;
  }>;
  contactStats: {
    total_contacts: number;
    active_contacts_24h: number;
    avg_replies_per_contact: number;
  };
  successRate: Array<{
    automation_id: string;
    automation_name: string;
    total: number;
    sent: number;
    failed: number;
    success_rate: number;
  }>;
  lastExecution: Array<{
    automation_id: string;
    automation_name: string;
    last_event_at: string;
    last_sent_at: string;
    pending_count: number;
  }>;
}

export default function AnalyticsClient() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await fetch("/api/analytics");
        if (!res.ok) throw new Error("Erro ao carregar analytics");
        const data = await res.json();
        setAnalytics(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }
    loadAnalytics();
  }, []);

  if (loading)
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">Carregando analytics...</p>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-red-400">❌ {error}</p>
      </div>
    );

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <header className="border-b border-zinc-700 bg-zinc-900/80 backdrop-blur sticky top-0 z-40">
        <div className="p-6 mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                📊 Analytics
              </p>
              <h1 className="text-2xl font-bold text-zinc-100">Execuções & Gatilhos</h1>
            </div>
            <button
              onClick={() => router.push("/painel")}
              className="px-4 py-2 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              ← Voltar
            </button>
          </div>
        </div>
      </header>

      <main className="p-6 mx-auto max-w-7xl space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-4">
            <p className="text-xs text-zinc-400 uppercase">Total de Contatos</p>
            <p className="text-3xl font-bold text-cyan-400 mt-2">
              {analytics?.contactStats.total_contacts || 0}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              🟢 {analytics?.contactStats.active_contacts_24h || 0} ativos 24h
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-4">
            <p className="text-xs text-zinc-400 uppercase">Taxa de Sucesso</p>
            <p className="text-3xl font-bold text-emerald-400 mt-2">
              {analytics?.successRate[0]?.success_rate || 0}%
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              ✓ Últimos 7 dias
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-4">
            <p className="text-xs text-zinc-400 uppercase">Automações Ativas</p>
            <p className="text-3xl font-bold text-violet-400 mt-2">
              {analytics?.lastExecution.length || 0}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              Configuradas no sistema
            </p>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-4">
            <p className="text-xs text-zinc-400 uppercase">Pendentes</p>
            <p className="text-3xl font-bold text-amber-400 mt-2">
              {analytics?.queueStatus
                .filter((q) => q.status === "pending")
                .reduce((sum, q) => sum + q.count, 0) || 0}
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              ⏳ Aguardando envio
            </p>
          </div>
        </div>

        {/* Status por Automação */}
        <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-6">
          <h2 className="text-lg font-bold text-zinc-100 mb-4">📋 Status por Automação</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="text-left py-3 px-4 text-zinc-400 font-medium">Automação</th>
                  <th className="text-center py-3 px-4 text-zinc-400 font-medium">✓ Enviadas</th>
                  <th className="text-center py-3 px-4 text-zinc-400 font-medium">⏳ Pendentes</th>
                  <th className="text-center py-3 px-4 text-zinc-400 font-medium">❌ Falhas</th>
                  <th className="text-center py-3 px-4 text-zinc-400 font-medium">Taxa Sucesso</th>
                  <th className="text-center py-3 px-4 text-zinc-400 font-medium">Última Execução</th>
                </tr>
              </thead>
              <tbody>
                {analytics?.lastExecution.map((exec) => {
                  const stats = analytics.successRate.find(
                    (s) => s.automation_id === exec.automation_id
                  );
                  const sent = stats?.sent || 0;
                  const pending = exec.pending_count;
                  const failed = stats?.failed || 0;

                  return (
                    <tr
                      key={exec.automation_id}
                      className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-zinc-300 font-medium">
                        {exec.automation_name || "Sem nome"}
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-xs font-medium">
                          {sent}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-medium">
                          {pending}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-xs font-medium">
                          {failed}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className="text-cyan-400 font-medium">
                          {stats?.success_rate.toFixed(1) || 0}%
                        </span>
                      </td>
                      <td className="text-center py-3 px-4 text-xs text-zinc-400">
                        {exec.last_sent_at
                          ? new Date(exec.last_sent_at).toLocaleString("pt-BR")
                          : "Nunca"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gatilhos por Tipo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-6">
            <h2 className="text-lg font-bold text-zinc-100 mb-4">🎯 Gatilhos Recebidos</h2>
            <div className="space-y-3">
              {analytics?.triggers.map((trigger, idx) => (
                <div
                  key={`${trigger.automation_id}-${trigger.event_type}-${idx}`}
                  className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-200">
                      {trigger.automation_name || "Sem nome"}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {trigger.event_type === "comment"
                        ? "💬 Comentários"
                        : trigger.event_type === "story_reply"
                          ? "📖 Stories"
                          : "💌 DMs"}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-violet-400">
                    {trigger.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Fila por Status */}
          <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-6">
            <h2 className="text-lg font-bold text-zinc-100 mb-4">📦 Status da Fila</h2>
            <div className="space-y-3">
              {analytics?.queueStatus.map((status, idx) => {
                const statusColor =
                  status.status === "sent"
                    ? "text-emerald-400"
                    : status.status === "pending"
                      ? "text-amber-400"
                      : status.status === "failed"
                        ? "text-red-400"
                        : "text-cyan-400";

                const statusLabel =
                  status.status === "sent"
                    ? "✓ Enviado"
                    : status.status === "pending"
                      ? "⏳ Pendente"
                      : status.status === "failed"
                        ? "❌ Falha"
                        : "⊘ Pulado";

                return (
                  <div
                    key={`${status.automation_id}-${status.status}-${idx}`}
                    className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700"
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-200">
                        {status.automation_name || "Sem nome"}
                      </p>
                      <p className={`text-xs font-medium ${statusColor}`}>
                        {statusLabel}
                      </p>
                    </div>
                    <span className={`text-lg font-bold ${statusColor}`}>
                      {status.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Últimos Eventos */}
        <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-6">
          <h2 className="text-lg font-bold text-zinc-100 mb-4">
            🔔 Últimos Eventos (24h)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-700">
                  <th className="text-left py-3 px-4 text-zinc-400 font-medium">
                    Tipo
                  </th>
                  <th className="text-left py-3 px-4 text-zinc-400 font-medium">
                    Usuário
                  </th>
                  <th className="text-left py-3 px-4 text-zinc-400 font-medium">
                    Horário
                  </th>
                </tr>
              </thead>
              <tbody>
                {analytics?.recentEvents.slice(0, 10).map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="bg-violet-500/20 text-violet-400 px-2 py-1 rounded text-xs font-medium">
                        {event.event_type === "comment"
                          ? "💬"
                          : event.event_type === "story_reply"
                            ? "📖"
                            : "💌"}{" "}
                        {event.event_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-zinc-400 text-xs">
                      {event.sender_id || "Desconhecido"}
                    </td>
                    <td className="py-3 px-4 text-zinc-500 text-xs">
                      {new Date(event.received_at).toLocaleString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-blue-950/30 border border-blue-700 rounded-lg p-4">
          <p className="text-sm text-blue-300">
            💡 <strong>Dica:</strong> Esta página mostra os últimos eventos e execuções em
            tempo real. Atualize para ver dados novos.
          </p>
        </div>
      </main>
    </div>
  );
}
