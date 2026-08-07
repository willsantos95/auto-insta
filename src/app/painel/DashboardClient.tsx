"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AppConfig, InstagramAccount } from "@/lib/config";
import type { Automation } from "@/lib/automations";
import { Tabs } from "@/components/Tabs";
import { FormSection } from "@/components/FormSection";
import { TriggerSelector } from "@/components/TriggerSelector";
import { PreviewPanel } from "@/components/PreviewPanel";
import { MessagePreview } from "@/components/MessagePreview";
import { FieldStatus } from "@/components/FieldStatus";
import { AccountsManager } from "@/components/AccountsManager";
import { AccountSelector } from "@/components/AccountSelector";

const blank = {
  name: "",
  active: true,
  triggers: ["comment"] as string[],
  keywordsText: "",
  match_type: "contains",
  media_id: "",
  publicRepliesText: "",
  welcome_dm: "Oi! Vi seu comentário 😊 Toque no botão abaixo para receber o link.",
  quick_reply_label: "Quero o link",
  link_text: "Aqui está o link que você pediu:",
  link_button_label: "Abrir link",
  link_url: "",
  link_delay_seconds: 0,
  reminder_text: "Passando para lembrar do link que enviei 😊",
  reminder_delay_seconds: 3600,
  account_id: "",
};

function formatDate(value: string | Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(value));
}

export default function DashboardClient({
  initialConfig,
  initialAutomations,
  initialAccounts,
}: {
  initialConfig: AppConfig;
  initialAutomations: Automation[];
  initialAccounts: InstagramAccount[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [media, setMedia] = useState<Array<{ id: string; media_type: string; media_url?: string; thumbnail_url?: string; caption?: string; permalink?: string }>>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [connectingAccount, setConnectingAccount] = useState(false);

  const connected = Boolean(initialConfig.instagram_user_id);
  const warning = useMemo(() => {
    if (form.reminder_delay_seconds > 86_400) return "O lembrete ultrapassa a janela de 24 horas e será ignorado.";
    return "";
  }, [form.reminder_delay_seconds]);

  function toggleTrigger(trigger: string) {
    setForm((current) => ({
      ...current,
      triggers: current.triggers.includes(trigger)
        ? current.triggers.filter((item) => item !== trigger)
        : [...current.triggers, trigger],
    }));
  }

  async function handleConnectAccount() {
    setConnectingAccount(true);
    window.location.href = "/api/oauth/start";
  }

  async function handleDisconnectAccount(accountId: string) {
    const account = initialAccounts.find((a) => a.id === accountId);
    const accountName = account ? `@${account.instagram_username}` : "esta conta";

    if (
      !confirm(
        `Desconectar ${accountName}?\n\nIsso deletará qualquer automação associada a esta conta.`
      )
    ) {
      return;
    }

    setConnectingAccount(true);
    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(`❌ Erro: ${data.error}`);
        setMessage(`Erro ao desconectar: ${data.error}`);
      } else {
        alert(
          `✅ Sucesso!\n\n${data.message}`
        );
        setMessage(`${data.message}`);
        router.refresh();
      }
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Erro desconhecido";
      alert(`❌ Erro: ${errorMsg}`);
      setMessage(`Erro ao desconectar: ${errorMsg}`);
    } finally {
      setConnectingAccount(false);
    }
  }

  async function create(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const payload = {
      name: form.name,
      active: form.active,
      triggers: form.triggers,
      keywords: form.keywordsText.split(",").map((item) => item.trim()).filter(Boolean),
      match_type: form.match_type,
      media_id: form.media_id || null,
      public_replies: form.publicRepliesText.split("\n").map((item) => item.trim()).filter(Boolean),
      welcome_dm: form.welcome_dm,
      quick_reply_label: form.quick_reply_label || null,
      link_text: form.link_text || null,
      link_button_label: form.link_button_label || null,
      link_url: form.link_url || null,
      link_delay_seconds: Number(form.link_delay_seconds),
      reminder_text: form.reminder_text || null,
      reminder_delay_seconds: form.reminder_text ? Number(form.reminder_delay_seconds) : null,
      account_id: form.account_id || null,
    };
    const response = await fetch("/api/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data.error || "Não foi possível salvar.");
    } else {
      setForm(blank);
      setMessage("Automação criada.");
      router.refresh();
    }
    setSaving(false);
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta automação?")) return;
    await fetch(`/api/automations/${id}`, { method: "DELETE" });
    router.refresh();
  }

  async function toggleActive(automation: Automation) {
    const response = await fetch(`/api/automations/${automation.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: automation.name,
        active: !automation.active,
        triggers: automation.triggers,
        keywords: automation.keywords,
        match_type: automation.match_type,
        media_id: automation.media_id,
        public_replies: automation.public_replies,
        welcome_dm: automation.welcome_dm,
        quick_reply_label: automation.quick_reply_label,
        link_text: automation.link_text,
        link_button_label: automation.link_button_label,
        link_url: automation.link_url,
        link_delay_seconds: automation.link_delay_seconds,
        reminder_text: automation.reminder_text,
        reminder_delay_seconds: automation.reminder_delay_seconds,
        account_id: automation.account_id || null,
      }),
    });
    if (!response.ok) setMessage("Não foi possível alterar o status.");
    router.refresh();
  }

  async function loadMedia() {
    setLoadingMedia(true);
    setMessage("");
    const response = await fetch("/api/media");
    const data = await response.json();
    if (!response.ok) setMessage(data.error || "Não foi possível carregar os posts.");
    else setMedia(data.data || []);
    setLoadingMedia(false);
  }

  const triggerOptions = [
    { id: "comment", label: "Comentários", description: "Em seus posts", icon: "💬" },
    { id: "story", label: "Stories", description: "Respostas ao story", icon: "📖" },
    { id: "dm", label: "DM", description: "Mensagens diretas", icon: "💌" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "var(--bg-primary)" }}>
      {/* Header */}
      <header className="border-b border-zinc-700 bg-zinc-900/80 backdrop-blur sticky top-0 z-40">
        <div className="p-6 mx-auto max-w-7xl">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-xs font-bold text-violet-400 uppercase tracking-wider">Instagram Auto</p>
              <h1 className="text-2xl font-bold text-zinc-100">Painel de Automações</h1>
            </div>
            <div className="flex gap-3">
              <a
                href="/painel/analytics"
                className="rounded-lg bg-cyan-600 px-5 py-3 font-semibold text-white hover:bg-cyan-500 transition-colors"
              >
                📊 Analytics
              </a>
              <a
                href="/api/oauth/start"
                className="rounded-lg bg-violet-600 px-5 py-3 font-semibold text-white hover:bg-violet-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Conectar Nova Conta
              </a>
            </div>
          </div>

          {/* Accounts Manager */}
          <AccountsManager
            accounts={initialAccounts}
            onConnect={handleConnectAccount}
            onDisconnect={handleDisconnectAccount}
            isLoading={connectingAccount}
          />
        </div>
      </header>

      <main className="flex gap-0 mx-auto max-w-7xl">
        {/* Sidebar */}
        <aside className="w-64 border-r border-zinc-700 bg-zinc-900 flex-shrink-0 sticky top-20 h-[calc(100vh-80px)] overflow-y-auto p-4">
          <div className="space-y-4">
            <div>
              <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-wider px-2 mb-3">
                Automações ({initialAutomations.length})
              </h2>
              <div className="space-y-2">
                {initialAutomations.length === 0 ? (
                  <p className="text-xs text-zinc-500 px-2 py-2">Nenhuma automação criada.</p>
                ) : (
                  initialAutomations.map((automation) => (
                    <div
                      key={automation.id}
                      className="rounded-lg border border-zinc-700 bg-zinc-800 p-3 hover:border-violet-500/50 transition-colors group"
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm text-zinc-100 truncate">{automation.name}</h3>
                          <p className="text-xs text-zinc-400 mt-1">
                            {automation.triggers.join(" • ")}
                          </p>
                        </div>
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap flex-shrink-0 ${
                            automation.active
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-zinc-700 text-zinc-400"
                          }`}
                        >
                          {automation.active ? "Ativa" : "Pausada"}
                        </span>
                      </div>
                      <div className="flex gap-2 text-xs">
                        <button
                          onClick={() => toggleActive(automation)}
                          className="text-violet-400 hover:text-violet-300 transition-colors"
                        >
                          {automation.active ? "Pausar" : "Ativar"}
                        </button>
                        <button
                          onClick={() => remove(automation.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Content */}
        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-3xl">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-zinc-100 mb-2">Nova Automação</h2>
              <p className="text-sm text-zinc-400">Configure uma automação para responder automaticamente mensagens</p>
            </div>

            <form onSubmit={create} className="space-y-6">
              <Tabs
                items={[
                  { id: "basico", label: "Básico", icon: "📋" },
                  { id: "gatilhos", label: "Gatilhos", icon: "🎯" },
                  { id: "deteccao", label: "Detecção", icon: "🔍" },
                  { id: "midia", label: "Mídia", icon: "🖼️" },
                  { id: "respostas", label: "Respostas", icon: "💬" },
                  { id: "links", label: "Links", icon: "🔗" },
                ]}
              >
                {/* Aba 1: Básico */}
                <div className="space-y-4">
                  <FormSection title="Selecione a Conta" description="Escolha qual conta do Instagram usará esta automação">
                    <AccountSelector
                      accounts={initialAccounts}
                      selectedAccountId={form.account_id}
                      onChange={(accountId) => setForm({ ...form, account_id: accountId })}
                    />
                  </FormSection>

                  <FormSection title="Informações Básicas" description="Configure o nome e status da automação">
                    <div>
                      <label className="block text-sm font-semibold text-zinc-200 mb-2">
                        Nome da Automação
                      </label>
                      <input
                        required
                        type="text"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Ex: Link do Produto X"
                        className="w-full rounded-lg px-3 py-2.5 text-sm"
                      />
                    </div>
                  </FormSection>

                  <FormSection title="Status" description="Ative ou pause esta automação">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, active: true })}
                        className={`py-3 px-4 rounded-lg font-semibold text-sm transition-colors ${
                          form.active
                            ? "bg-violet-600 text-white border-2 border-violet-500"
                            : "bg-zinc-800 text-zinc-300 border-2 border-zinc-700"
                        }`}
                      >
                        ✓ Ativa
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, active: false })}
                        className={`py-3 px-4 rounded-lg font-semibold text-sm transition-colors ${
                          !form.active
                            ? "bg-zinc-700 text-white border-2 border-zinc-600"
                            : "bg-zinc-800 text-zinc-300 border-2 border-zinc-700"
                        }`}
                      >
                        ⊘ Pausada
                      </button>
                    </div>
                  </FormSection>
                </div>

                {/* Aba 2: Gatilhos */}
                <div className="space-y-4">
                  <FormSection
                    title="Onde a automação vai funcionar?"
                    description="Selecione um ou mais gatilhos"
                  >
                    <TriggerSelector
                      options={triggerOptions}
                      selected={form.triggers}
                      onChange={(triggers) => setForm({ ...form, triggers })}
                    />
                  </FormSection>
                </div>

                {/* Aba 3: Detecção */}
                <div className="space-y-4">
                  <FormSection title="Como detectar a mensagem?" description="Configure palavras-chave e tipo de correspondência">
                    <div>
                      <label className="block text-sm font-semibold text-zinc-200 mb-2">
                        Tipo de Correspondência
                      </label>
                      <select
                        value={form.match_type}
                        onChange={(e) => setForm({ ...form, match_type: e.target.value })}
                        className="w-full rounded-lg px-3 py-2.5 text-sm"
                      >
                        <option value="contains">Contém qualquer uma das palavras-chave</option>
                        <option value="exact">Exato - precisa ser exatamente igual</option>
                        <option value="any">Qualquer mensagem (sem filtro)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-zinc-200 mb-2">
                        Palavras-chave (separadas por vírgula)
                      </label>
                      <input
                        type="text"
                        value={form.keywordsText}
                        onChange={(e) => setForm({ ...form, keywordsText: e.target.value })}
                        placeholder="link, quero, promoção"
                        className="w-full rounded-lg px-3 py-2.5 text-sm"
                      />
                      <p className="text-xs text-zinc-400 mt-2">Deixe em branco para responder a qualquer mensagem</p>
                    </div>
                  </FormSection>
                </div>

                {/* Aba 4: Mídia */}
                <div className="space-y-4">
                  <FormSection
                    title="Post ou Reels Específico"
                    description="Deixe sem seleção para funcionar em todas as mídias"
                  >
                    <div className="flex justify-between items-center gap-3 mb-4">
                      <p className="text-sm text-zinc-400">
                        {form.media_id ? `Mídia selecionada (ID: ${form.media_id})` : "Nenhuma mídia selecionada"}
                      </p>
                      <button
                        type="button"
                        onClick={loadMedia}
                        disabled={!connected || loadingMedia}
                        className="rounded-lg border border-violet-500 text-violet-400 px-4 py-2 text-sm font-medium hover:bg-violet-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        {loadingMedia ? "Carregando..." : "Carregar posts"}
                      </button>
                    </div>

                    {form.media_id && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, media_id: "" })}
                        className="text-xs text-violet-400 hover:text-violet-300 mb-3"
                      >
                        ✕ Limpar seleção
                      </button>
                    )}

                    {media.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-80 overflow-y-auto mb-4">
                        {media.map((item) => (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => setForm({ ...form, media_id: item.id })}
                            className={`rounded-lg border-2 overflow-hidden transition-all ${
                              form.media_id === item.id
                                ? "border-violet-500"
                                : "border-zinc-700 hover:border-zinc-600"
                            }`}
                          >
                            {item.thumbnail_url || item.media_url ? (
                              <img
                                src={item.thumbnail_url || item.media_url}
                                alt="Mídia"
                                className="aspect-square w-full object-cover"
                              />
                            ) : (
                              <div className="aspect-square bg-zinc-800 flex items-center justify-center text-xs text-zinc-500">
                                Sem miniatura
                              </div>
                            )}
                            <p className="line-clamp-1 p-2 text-xs text-zinc-400 bg-zinc-900">
                              {item.caption || item.media_type}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}

                    <input
                      type="text"
                      value={form.media_id}
                      onChange={(e) => setForm({ ...form, media_id: e.target.value })}
                      placeholder="Ou cole manualmente o ID da mídia"
                      className="w-full rounded-lg px-3 py-2.5 text-sm"
                    />
                  </FormSection>
                </div>

                {/* Aba 5: Respostas */}
                <div className="space-y-4">
                  <FormSection title="Resposta Pública" description="Comentário que será postado no seu post">
                    <div>
                      <label className="block text-sm font-semibold text-zinc-200 mb-2">
                        Respostas públicas (uma por linha)
                      </label>
                      <textarea
                        value={form.publicRepliesText}
                        onChange={(e) => setForm({ ...form, publicRepliesText: e.target.value })}
                        placeholder={"Enviei na sua DM 😊\nDá uma olhada nas mensagens!"}
                        className="w-full rounded-lg px-3 py-2.5 text-sm min-h-24"
                      />
                    </div>
                  </FormSection>

                  <FormSection title="Mensagem Direta" description="DM de boas-vindas que será enviada">
                    <div>
                      <label className="block text-sm font-semibold text-zinc-200 mb-2">
                        DM de Boas-vindas
                      </label>
                      <textarea
                        required
                        value={form.welcome_dm}
                        onChange={(e) => setForm({ ...form, welcome_dm: e.target.value })}
                        className="w-full rounded-lg px-3 py-2.5 text-sm min-h-24"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-zinc-200 mb-2">
                        Texto do Botão (até 20 caracteres)
                      </label>
                      <input
                        type="text"
                        value={form.quick_reply_label}
                        onChange={(e) => setForm({ ...form, quick_reply_label: e.target.value })}
                        maxLength={20}
                        placeholder="Ex: Quero o link"
                        className="w-full rounded-lg px-3 py-2.5 text-sm"
                      />
                    </div>
                  </FormSection>

                  <MessagePreview
                    type="welcome"
                    message={form.welcome_dm}
                    buttonLabel={form.quick_reply_label}
                  />
                </div>

                {/* Aba 6: Links */}
                <div className="space-y-4">
                  <FormSection title="Mensagem com Link" description="Texto e link que será enviado após a resposta rápida">
                    <div>
                      <label className="block text-sm font-semibold text-zinc-200 mb-2">
                        Texto Antes do Link
                      </label>
                      <textarea
                        value={form.link_text}
                        onChange={(e) => setForm({ ...form, link_text: e.target.value })}
                        placeholder="Ex: Aqui está o link que você pediu:"
                        className="w-full rounded-lg px-3 py-2.5 text-sm min-h-20"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-zinc-200 mb-2">
                          Texto do Botão (até 20 caracteres)
                        </label>
                        <input
                          type="text"
                          value={form.link_button_label}
                          onChange={(e) => setForm({ ...form, link_button_label: e.target.value })}
                          maxLength={20}
                          placeholder="Ex: Abrir link"
                          className="w-full rounded-lg px-3 py-2.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-zinc-200 mb-2">
                          URL
                        </label>
                        <input
                          type="url"
                          value={form.link_url}
                          onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                          placeholder="https://..."
                          className="w-full rounded-lg px-3 py-2.5 text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-zinc-200 mb-2">
                        Atraso do Link (em segundos)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={86400}
                        value={form.link_delay_seconds}
                        onChange={(e) => setForm({ ...form, link_delay_seconds: Number(e.target.value) })}
                        className="w-full rounded-lg px-3 py-2.5 text-sm"
                      />
                      <p className="text-xs text-zinc-400 mt-2">Quantos segundos aguardar após o usuário clicar no botão</p>
                    </div>
                  </FormSection>

                  <FormSection title="Mensagem com Link" description="Visualize como ficará a mensagem com o link">
                    <MessagePreview
                      type="link"
                      message={form.link_text || "Aqui está o link que você pediu:"}
                      linkButtonLabel={form.link_button_label}
                      linkUrl={form.link_url}
                    />
                  </FormSection>

                  <FormSection title="Lembrete (Opcional)" description="Enviar uma segunda mensagem dias depois">
                    <div>
                      <label className="block text-sm font-semibold text-zinc-200 mb-2">
                        Texto do Lembrete
                      </label>
                      <textarea
                        value={form.reminder_text}
                        onChange={(e) => setForm({ ...form, reminder_text: e.target.value })}
                        placeholder="Ex: Passando para lembrar do link que enviei 😊"
                        className="w-full rounded-lg px-3 py-2.5 text-sm min-h-20"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-zinc-200 mb-2">
                        Atraso do Lembrete (em segundos)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={86400}
                        value={form.reminder_delay_seconds}
                        onChange={(e) => setForm({ ...form, reminder_delay_seconds: Number(e.target.value) })}
                        className="w-full rounded-lg px-3 py-2.5 text-sm"
                      />
                      <p className="text-xs text-zinc-400 mt-2">3600 = 1 hora, 86400 = 24 horas</p>
                      {warning && <p className="text-xs text-amber-400 mt-2">⚠️ {warning}</p>}
                    </div>
                  </FormSection>

                  <MessagePreview
                    type="reminder"
                    message={form.reminder_text || "Passando para lembrar do link que enviei 😊"}
                  />
                </div>
              </Tabs>

              <div className="flex gap-3 mt-8">
                <button
                  type="submit"
                  disabled={saving || !form.account_id}
                  className="px-6 py-3 bg-violet-600 text-white font-semibold rounded-lg hover:bg-violet-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Salvando..." : "Criar Automação"}
                </button>
              </div>

              {message && (
                <div
                  className={`rounded-lg px-4 py-3 text-sm font-medium mt-4 ${
                    message.includes("Não foi possível")
                      ? "bg-red-500/10 text-red-300 border border-red-500/20"
                      : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                  }`}
                >
                  {message}
                </div>
              )}
            </form>

            <footer className="mt-12 pt-8 border-t border-zinc-700 text-xs text-zinc-500 flex gap-4">
              <a href="/privacidade" className="hover:text-zinc-400 transition-colors">
                Privacidade
              </a>
              <a href="/exclusao-de-dados" className="hover:text-zinc-400 transition-colors">
                Exclusão de dados
              </a>
            </footer>
          </div>
        </div>
      </main>
    </div>
  );
}
