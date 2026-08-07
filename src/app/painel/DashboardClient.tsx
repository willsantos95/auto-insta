"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AppConfig, InstagramAccount } from "@/lib/config";
import type { Automation } from "@/lib/automations";
import { Tabs } from "@/components/Tabs";
import { FormSection } from "@/components/FormSection";
import { TriggerSelector } from "@/components/TriggerSelector";
import { MessagePreview } from "@/components/MessagePreview";
import { AccountsManager } from "@/components/AccountsManager";
import { AccountSelector } from "@/components/AccountSelector";
import { HeaderNav } from "@/components/HeaderNav";
import { Button } from "@/components/Button";
import { Card, CardBody, CardHeader, CardFooter } from "@/components/Card";

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
        alert(`✅ Sucesso!\n\n${data.message}`);
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
      setMessage("Automação criada com sucesso!");
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
      <style>{`
        input:not([type="submit"]), 
        textarea, 
        select {
          background-color: var(--bg-primary);
          color: var(--text-primary);
          border-color: var(--border-base);
        }
        input:focus, textarea:focus, select:focus {
          border-color: var(--accent-primary);
          outline: none;
        }
      `}</style>

      {/* Header */}
      <HeaderNav
        title="Painel de Automações"
        actions={
          <div className="flex gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={() => window.location.href = "/painel/analytics"}
            >
              📊 Analytics
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={handleConnectAccount}
              disabled={connectingAccount}
            >
              + Conectar Nova Conta
            </Button>
          </div>
        }
      />

      <main className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 p-8">
          {/* Sidebar - Automações Existentes */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-[var(--text-primary)] uppercase tracking-wider mb-4">
                  Automações ({initialAutomations.length})
                </h2>

                {initialAutomations.length === 0 ? (
                  <div className="p-4 rounded-lg bg-[var(--bg-secondary)] text-center">
                    <p className="text-xs text-[var(--text-secondary)]">
                      Nenhuma automação criada
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {initialAutomations.map((automation) => (
                      <Card key={automation.id}>
                        <CardBody className="p-3">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-medium text-[var(--text-primary)] truncate">
                                {automation.name}
                              </h3>
                              <p className="text-xs text-[var(--text-secondary)] mt-0.5 truncate">
                                {automation.triggers.join(" • ")}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span
                              className={`px-2 py-1 rounded-full font-medium ${
                                automation.active
                                  ? "bg-[var(--success)]/10 text-[var(--success)]"
                                  : "bg-[var(--text-tertiary)]/10 text-[var(--text-tertiary)]"
                              }`}
                            >
                              {automation.active ? "✓ Ativa" : "⊘ Pausada"}
                            </span>
                          </div>
                          <div className="flex gap-2 mt-2 pt-2 border-t border-[var(--border-subtle)]">
                            <button
                              onClick={() => toggleActive(automation)}
                              className="text-xs text-[var(--accent-primary)] hover:text-[var(--accent-dark)] font-medium"
                            >
                              {automation.active ? "Pausar" : "Ativar"}
                            </button>
                            <button
                              onClick={() => remove(automation.id)}
                              className="text-xs text-[var(--error)] hover:text-[#991b1b] font-medium"
                            >
                              Excluir
                            </button>
                          </div>
                        </CardBody>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Accounts Section */}
            <Card>
              <CardHeader
                title="Contas Instagram"
                description="Gerencie suas contas conectadas"
              />
              <CardBody>
                <AccountsManager
                  accounts={initialAccounts}
                  onConnect={handleConnectAccount}
                  onDisconnect={handleDisconnectAccount}
                  isLoading={connectingAccount}
                />
              </CardBody>
            </Card>

            {/* Form Section */}
            <Card>
              <CardHeader
                title="Criar Nova Automação"
                description="Configure uma automação para responder automaticamente mensagens"
              />
              <CardBody>
                <form onSubmit={create} className="space-y-6">
                  {message && (
                    <div
                      className={`p-4 rounded-lg text-sm ${
                        message.includes("Erro")
                          ? "bg-[var(--error)]/10 text-[var(--error)]"
                          : "bg-[var(--success)]/10 text-[var(--success)]"
                      }`}
                    >
                      {message}
                    </div>
                  )}

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
                    <div className="space-y-6">
                      <FormSection title="Selecione a Conta" description="Escolha qual conta do Instagram usará esta automação">
                        <AccountSelector
                          accounts={initialAccounts}
                          selectedAccountId={form.account_id}
                          onChange={(accountId) => setForm({ ...form, account_id: accountId })}
                        />
                      </FormSection>

                      <FormSection title="Informações Básicas" description="Configure o nome da automação">
                        <div>
                          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                            Nome da Automação
                          </label>
                          <input
                            required
                            type="text"
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="Ex: Link do Produto X"
                            className="w-full rounded-lg px-3 py-2.5 text-sm border border-[var(--border-base)]"
                          />
                        </div>
                      </FormSection>

                      <FormSection title="Status" description="Ative ou pause esta automação">
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, active: true })}
                            className={`py-3 px-4 rounded-lg font-medium text-sm transition-all border-2 ${
                              form.active
                                ? "border-[var(--accent-primary)] bg-[var(--accent-light)] text-[var(--accent-dark)]"
                                : "border-[var(--border-base)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                            }`}
                          >
                            ✓ Ativa
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, active: false })}
                            className={`py-3 px-4 rounded-lg font-medium text-sm transition-all border-2 ${
                              !form.active
                                ? "border-[var(--error)] bg-[var(--error)]/10 text-[var(--error)]"
                                : "border-[var(--border-base)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]"
                            }`}
                          >
                            ⊘ Pausada
                          </button>
                        </div>
                      </FormSection>
                    </div>

                    {/* Aba 2: Gatilhos */}
                    <div className="space-y-6">
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
                    <div className="space-y-6">
                      <FormSection title="Como detectar a mensagem?" description="Configure palavras-chave">
                        <div>
                          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                            Tipo de Correspondência
                          </label>
                          <select
                            value={form.match_type}
                            onChange={(e) => setForm({ ...form, match_type: e.target.value })}
                            className="w-full rounded-lg px-3 py-2.5 text-sm border border-[var(--border-base)]"
                          >
                            <option value="contains">Contém qualquer uma das palavras-chave</option>
                            <option value="exact">Exatamente</option>
                            <option value="not_contains">Não contém</option>
                            <option value="regex">Expressão Regular</option>
                          </select>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                            Palavras-chave (separadas por vírgula)
                          </label>
                          <textarea
                            value={form.keywordsText}
                            onChange={(e) => setForm({ ...form, keywordsText: e.target.value })}
                            placeholder="Ex: link, produto, preço"
                            className="w-full rounded-lg px-3 py-2.5 text-sm border border-[var(--border-base)] min-h-24"
                          />
                          <p className="text-xs text-[var(--text-secondary)] mt-1">
                            Digite as palavras que dispararão essa automação
                          </p>
                        </div>
                      </FormSection>
                    </div>

                    {/* Aba 4: Mídia */}
                    <div className="space-y-6">
                      <FormSection
                        title="Filtrar por Post"
                        description="Deixe em branco para responder a todos os posts"
                      >
                        <button
                          type="button"
                          onClick={loadMedia}
                          disabled={loadingMedia}
                          className="px-4 py-2 text-sm font-medium bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors border border-[var(--border-base)]"
                        >
                          {loadingMedia ? "Carregando..." : "Carregar Posts"}
                        </button>

                        {media.length > 0 && (
                          <div className="mt-4">
                            <select
                              value={form.media_id}
                              onChange={(e) => setForm({ ...form, media_id: e.target.value })}
                              className="w-full rounded-lg px-3 py-2.5 text-sm border border-[var(--border-base)]"
                            >
                              <option value="">Selecione um post...</option>
                              {media.map((m) => (
                                <option key={m.id} value={m.id}>
                                  {m.caption?.substring(0, 50) || "Post sem legenda"}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </FormSection>
                    </div>

                    {/* Aba 5: Respostas */}
                    <div className="space-y-6">
                      <FormSection title="Mensagem no DM" description="Esta mensagem será enviada como mensagem privada">
                        <div>
                          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                            Texto da Mensagem
                          </label>
                          <textarea
                            value={form.welcome_dm}
                            onChange={(e) => setForm({ ...form, welcome_dm: e.target.value })}
                            className="w-full rounded-lg px-3 py-2.5 text-sm border border-[var(--border-base)] min-h-24"
                          />
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                            Label do Botão
                          </label>
                          <input
                            type="text"
                            value={form.quick_reply_label}
                            onChange={(e) => setForm({ ...form, quick_reply_label: e.target.value })}
                            placeholder="Ex: Quero o link"
                            className="w-full rounded-lg px-3 py-2.5 text-sm border border-[var(--border-base)]"
                          />
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                            Respostas em Comentário (uma por linha)
                          </label>
                          <textarea
                            value={form.publicRepliesText}
                            onChange={(e) => setForm({ ...form, publicRepliesText: e.target.value })}
                            placeholder="Ex: Enviando o link no DM!"
                            className="w-full rounded-lg px-3 py-2.5 text-sm border border-[var(--border-base)] min-h-20"
                          />
                        </div>
                      </FormSection>

                      {form.quick_reply_label && (
                        <MessagePreview type="welcome" message={form.welcome_dm} buttonLabel={form.quick_reply_label} />
                      )}
                    </div>

                    {/* Aba 6: Links */}
                    <div className="space-y-6">
                      <FormSection
                        title="Link para Enviar"
                        description="Configure o link que será enviado quando solicitado"
                      >
                        <div>
                          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                            URL
                          </label>
                          <input
                            type="url"
                            value={form.link_url}
                            onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                            placeholder="https://..."
                            className="w-full rounded-lg px-3 py-2.5 text-sm border border-[var(--border-base)]"
                          />
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                            Texto antes do Link
                          </label>
                          <textarea
                            value={form.link_text}
                            onChange={(e) => setForm({ ...form, link_text: e.target.value })}
                            className="w-full rounded-lg px-3 py-2.5 text-sm border border-[var(--border-base)] min-h-16"
                          />
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                            Label do Botão do Link
                          </label>
                          <input
                            type="text"
                            value={form.link_button_label}
                            onChange={(e) => setForm({ ...form, link_button_label: e.target.value })}
                            placeholder="Ex: Abrir"
                            className="w-full rounded-lg px-3 py-2.5 text-sm border border-[var(--border-base)]"
                          />
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                            Delay antes de enviar (segundos)
                          </label>
                          <input
                            type="number"
                            value={form.link_delay_seconds}
                            onChange={(e) => setForm({ ...form, link_delay_seconds: Number(e.target.value) })}
                            className="w-full rounded-lg px-3 py-2.5 text-sm border border-[var(--border-base)]"
                          />
                        </div>
                      </FormSection>

                      <FormSection
                        title="Lembrete"
                        description="Enviar um lembrete após alguns segundos"
                      >
                        <div>
                          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                            Texto do Lembrete
                          </label>
                          <textarea
                            value={form.reminder_text}
                            onChange={(e) => setForm({ ...form, reminder_text: e.target.value })}
                            className="w-full rounded-lg px-3 py-2.5 text-sm border border-[var(--border-base)] min-h-20"
                          />
                          <p className="text-xs text-[var(--text-secondary)] mt-1">
                            Deixe em branco para desativar lembretes
                          </p>
                        </div>

                        <div className="mt-4">
                          <label className="block text-sm font-medium text-[var(--text-primary)] mb-2">
                            Delay do Lembrete (segundos)
                          </label>
                          <input
                            type="number"
                            value={form.reminder_delay_seconds}
                            onChange={(e) => setForm({ ...form, reminder_delay_seconds: Number(e.target.value) })}
                            className="w-full rounded-lg px-3 py-2.5 text-sm border border-[var(--border-base)]"
                          />
                          {warning && (
                            <p className="text-xs text-[var(--warning)] mt-1">⚠️ {warning}</p>
                          )}
                        </div>
                      </FormSection>
                    </div>
                  </Tabs>

                  {/* Form Actions */}
                  <div className="flex gap-3 pt-4 border-t border-[var(--border-subtle)]">
                    <Button
                      type="submit"
                      variant="primary"
                      disabled={saving || !form.name}
                      isLoading={saving}
                    >
                      Salvar Automação
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setForm(blank)}
                    >
                      Limpar
                    </Button>
                  </div>
                </form>
              </CardBody>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
