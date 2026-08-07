"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Analytics {
  kpis: {
    totalContacts: number;
    activeContacts: number;
    totalAutomations: number;
    successRate: number;
    pendingCount: number;
  };
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
    last_event_at: string | null;
    last_sent_at: string | null;
    pending_count: number;
  }>;
}

const StatCard = ({ label, value, icon, color, subtext }: any) => (
  <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-700/50 rounded-xl p-6 hover:border-zinc-600 transition-colors">
    <div className="flex items-start justify-between mb-3">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{label}</p>
      <span className="text-2xl">{icon}</span>
    </div>
    <div className={`text-4xl font-bold ${color} mb-2`}>{value}</div>
    {subtext && <p className="text-xs text-zinc-500">{subtext}</p>}
  </div>
);

export default function AnalyticsClient() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = async () => {
    try {
      setRefreshing(true);
      const res = await fetch("/api/analytics");
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details || "Erro ao carregar analytics");
      }
      const data = await res.json();
      setAnalytics(data);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const formatEventType = (type: string) => {
    switch (type) {
      case "comment":
        return "💬 Comentário";
      case "story_reply":
        return "📖 Story";
      case "direct_message":
        return "💌 DM";
      default:
        return type;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Nunca";
    try {
      return new Date(dateString).toLocaleString("pt-BR");
    } catch {
      return "Data inválida";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-zinc-700 border-t-violet-500 rounded-full animate-spin mb-4" />
        <p className="text-zinc-400">Carregando análise...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-gradient-to-br from-red-950/30 to-red-900/20 border border-red-700/50 rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-red-300 mb-2">Erro ao carregar analytics</h2>
          <p className="text-sm text-red-200/70 mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={loadAnalytics}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors"
            >
              Tentar Novamente
            </button>
            <button
              onClick={() => router.push("/painel")}
              className="flex-1 px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-colors"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <p className="text-zinc-400">Nenhum dado disponível</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-violet-400 uppercase tracking-widest mb-1">
                📊 Análise em Tempo Real
              </p>
              <h1 className="text-3xl font-bold text-white">Painel de Execuções</h1>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={loadAnalytics}
                disabled={refreshing}
                className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white rounded-lg border border-zinc-700 hover:border-zinc-600 transition-colors disabled:opacity-50"
              >
                {refreshing ? "Atualizando..." : "🔄 Atualizar"}
              </button>
              <button
                onClick={() => router.push("/painel")}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                ← Voltar
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* KPIs Section */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              label="Total de Contatos"
              value={analytics.kpis.totalContacts}
              icon="👥"
              color="text-cyan-400"
              subtext={`${analytics.kpis.activeContacts} ativos 24h`}
            />
            <StatCard
              label="Taxa de Sucesso"
              value={`${analytics.kpis.successRate}%`}
              icon="✓"
              color="text-emerald-400"
              subtext="Últimos 7 dias"
            />
            <StatCard
              label="Automações"
              value={analytics.kpis.totalAutomations}
              icon="⚙️"
              color="text-violet-400"
              subtext="Configuradas"
            />
            <StatCard
              label="Pendentes"
              value={analytics.kpis.pendingCount}
              icon="⏳"
              color="text-amber-400"
              subtext="Aguardando envio"
            />
            <StatCard
              label="Atualizado"
              value={new Date().toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
              icon="⏱️"
              color="text-zinc-400"
              subtext="Agora"
            />
          </div>
        </section>

        {/* Status por Automação */}
        <section>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white">📋 Status por Automação</h2>
              {analytics.lastExecution.length === 0 && (
                <span className="text-xs bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full">
                  Nenhuma automação
                </span>
              )}
            </div>
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-700/50 rounded-xl overflow-hidden">
              {analytics.lastExecution.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-zinc-500">Nenhuma automação configurada ainda</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-zinc-800/50 border-b border-zinc-700">
                      <tr>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-zinc-300">
                          Automação
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-emerald-400">
                          ✓ Enviadas
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-amber-400">
                          ⏳ Pendentes
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-red-400">
                          ❌ Falhas
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-violet-400">
                          Taxa Sucesso
                        </th>
                        <th className="text-right py-3 px-6 text-sm font-semibold text-zinc-400">
                          Última Execução
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {analytics.lastExecution.map((exec) => {
                        const stats = analytics.successRate.find(
                          (s) => s.automation_id === exec.automation_id
                        );
                        return (
                          <tr
                            key={exec.automation_id}
                            className="hover:bg-zinc-800/30 transition-colors"
                          >
                            <td className="py-4 px-6 font-medium text-white">
                              {exec.automation_name || "Sem nome"}
                            </td>
                            <td className="text-center py-4 px-4">
                              <span className="inline-block bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full text-sm font-semibold">
                                {stats?.sent || 0}
                              </span>
                            </td>
                            <td className="text-center py-4 px-4">
                              <span className="inline-block bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-sm font-semibold">
                                {exec.pending_count}
                              </span>
                            </td>
                            <td className="text-center py-4 px-4">
                              <span className="inline-block bg-red-500/20 text-red-400 px-3 py-1 rounded-full text-sm font-semibold">
                                {stats?.failed || 0}
                              </span>
                            </td>
                            <td className="text-center py-4 px-4">
                              <span className="text-violet-400 font-semibold">
                                {stats?.success_rate.toFixed(1) || 0}%
                              </span>
                            </td>
                            <td className="text-right py-4 px-6 text-sm text-zinc-400">
                              {formatDate(exec.last_sent_at || exec.last_event_at)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Gatilhos e Fila */}
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gatilhos */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">🎯 Gatilhos Recebidos (24h)</h2>
              <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-700/50 rounded-xl p-6">
                {analytics.triggers.length === 0 ? (
                  <p className="text-center text-zinc-500 py-8">Nenhum gatilho recebido</p>
                ) : (
                  <div className="space-y-3">
                    {analytics.triggers.map((trigger, idx) => (
                      <div
                        key={`${trigger.automation_id}-${trigger.event_type}-${idx}`}
                        className="flex items-center justify-between p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-zinc-700/30 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-zinc-100">
                            {trigger.automation_name || "Sem nome"}
                          </p>
                          <p className="text-xs text-zinc-400 mt-1">{formatEventType(trigger.event_type)}</p>
                        </div>
                        <span className="text-2xl font-bold text-violet-400">{trigger.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Fila */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-white">📦 Status da Fila</h2>
              <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-700/50 rounded-xl p-6">
                {analytics.queueStatus.length === 0 ? (
                  <p className="text-center text-zinc-500 py-8">Fila vazia</p>
                ) : (
                  <div className="space-y-3">
                    {analytics.queueStatus.map((status, idx) => {
                      const colorMap: any = {
                        sent: { color: "text-emerald-400", bg: "bg-emerald-500/20", label: "✓ Enviado" },
                        pending: {
                          color: "text-amber-400",
                          bg: "bg-amber-500/20",
                          label: "⏳ Pendente",
                        },
                        failed: { color: "text-red-400", bg: "bg-red-500/20", label: "❌ Falha" },
                        skipped: { color: "text-cyan-400", bg: "bg-cyan-500/20", label: "⊘ Pulado" },
                      };
                      const info = colorMap[status.status] || colorMap.pending;

                      return (
                        <div
                          key={`${status.automation_id}-${status.status}-${idx}`}
                          className="flex items-center justify-between p-4 bg-zinc-800/50 hover:bg-zinc-800 rounded-lg border border-zinc-700/30 transition-colors"
                        >
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-zinc-100">
                              {status.automation_name || "Sem nome"}
                            </p>
                            <p className={`text-xs font-medium mt-1 ${info.color}`}>{info.label}</p>
                          </div>
                          <div className={`${info.bg} ${info.color} px-3 py-1 rounded-full text-sm font-bold`}>
                            {status.count}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Últimos Eventos */}
        <section>
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">🔔 Últimos Eventos (24h)</h2>
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-700/50 rounded-xl overflow-hidden">
              {analytics.recentEvents.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-zinc-500">Nenhum evento recebido nas últimas 24h</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-zinc-800/50 border-b border-zinc-700">
                      <tr>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-zinc-300">
                          Tipo
                        </th>
                        <th className="text-left py-3 px-6 text-sm font-semibold text-zinc-300">
                          Usuário
                        </th>
                        <th className="text-right py-3 px-6 text-sm font-semibold text-zinc-300">
                          Horário
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {analytics.recentEvents.slice(0, 15).map((event) => (
                        <tr key={event.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="py-3 px-6">
                            <span className="inline-block bg-violet-500/20 text-violet-400 px-2 py-1 rounded text-xs font-semibold">
                              {formatEventType(event.event_type)}
                            </span>
                          </td>
                          <td className="py-3 px-6 text-sm text-zinc-300">
                            {event.sender_id || "Desconhecido"}
                          </td>
                          <td className="text-right py-3 px-6 text-sm text-zinc-500">
                            {formatDate(event.received_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Info Box */}
        <section className="bg-gradient-to-r from-blue-950/40 to-cyan-950/40 border border-blue-700/30 rounded-xl p-6">
          <p className="text-sm text-blue-200">
            💡 <strong>Dica:</strong> Esta página atualiza automaticamente. Use o botão "🔄 Atualizar" para
            ver dados em tempo real ou recarregue a página a cada minuto.
          </p>
        </section>
      </main>
    </div>
  );
}
