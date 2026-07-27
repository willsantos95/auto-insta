"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AppConfig } from "@/lib/config";
import type { Automation } from "@/lib/automations";

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
}: {
  initialConfig: AppConfig;
  initialAutomations: Automation[];
}) {
  const router = useRouter();
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [media, setMedia] = useState<Array<{ id: string; media_type: string; media_url?: string; thumbnail_url?: string; caption?: string; permalink?: string }>>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

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

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-8">
      <header className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-fuchsia-400">Instagram Auto</p>
          <h1 className="text-2xl font-bold">Painel @poraodanet</h1>
          <p className="mt-1 text-sm text-zinc-400">Horários exibidos em America/Sao_Paulo.</p>
        </div>
        {connected ? (
          <div className="rounded-xl bg-emerald-950 px-4 py-3 text-sm text-emerald-300">
            Conectado: @{initialConfig.instagram_username}<br />
            Token válido até {formatDate(initialConfig.token_expires_at)}
          </div>
        ) : (
          <a href="/api/oauth/start" className="rounded-xl bg-fuchsia-600 px-5 py-3 text-center font-semibold hover:bg-fuchsia-500">
            Conectar Instagram
          </a>
        )}
      </header>

      <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-lg font-semibold">Automações</h2>
          <div className="mt-4 space-y-3">
            {initialAutomations.length === 0 && <p className="text-sm text-zinc-500">Nenhuma automação criada.</p>}
            {initialAutomations.map((automation) => (
              <article key={automation.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{automation.name}</h3>
                    <p className="mt-1 text-xs text-zinc-400">{automation.triggers.join(" • ")} · {automation.match_type}</p>
                    <p className="mt-2 text-sm text-zinc-300">Palavras: {automation.keywords.join(", ") || "qualquer mensagem"}</p>
                  </div>
                  <span className={`rounded-full px-2 py-1 text-xs ${automation.active ? "bg-emerald-950 text-emerald-300" : "bg-zinc-800 text-zinc-400"}`}>
                    {automation.active ? "Ativa" : "Pausada"}
                  </span>
                </div>
                <div className="mt-3 flex gap-4 text-xs">
                  <button onClick={() => toggleActive(automation)} className="text-fuchsia-400 hover:text-fuchsia-300">{automation.active ? "Pausar" : "Ativar"}</button>
                  <button onClick={() => remove(automation.id)} className="text-red-400 hover:text-red-300">Excluir</button>
                </div>
              </article>
            ))}
          </div>
        </div>

        <form onSubmit={create} className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <h2 className="text-lg font-semibold">Nova automação</h2>
          <div className="mt-4 grid gap-4">
            <label className="text-sm">Nome<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3" placeholder="Link do produto X" /></label>
            <div>
              <p className="text-sm">Gatilhos</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {[['comment','Comentário'],['story','Resposta ao story'],['dm','DM comum']].map(([value,label]) => (
                  <button type="button" key={value} onClick={() => toggleTrigger(value)} className={`rounded-lg border px-3 py-2 text-sm ${form.triggers.includes(value) ? "border-fuchsia-500 bg-fuchsia-950" : "border-zinc-700"}`}>{label}</button>
                ))}
              </div>
            </div>
            <label className="text-sm">Tipo de correspondência<select value={form.match_type} onChange={(e) => setForm({ ...form, match_type: e.target.value })} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3"><option value="contains">Contém</option><option value="exact">Exato</option><option value="any">Qualquer mensagem</option></select></label>
            <label className="text-sm">Palavras-chave, separadas por vírgula<input value={form.keywordsText} onChange={(e) => setForm({ ...form, keywordsText: e.target.value })} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3" placeholder="link, quero, promoção" /></label>
            <div className="rounded-xl border border-zinc-800 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">Post ou reels específico</p>
                  <p className="text-xs text-zinc-500">Deixe sem seleção para funcionar em todas as mídias.</p>
                </div>
                <button type="button" onClick={loadMedia} disabled={!connected || loadingMedia} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs disabled:opacity-40">
                  {loadingMedia ? "Carregando..." : "Carregar posts"}
                </button>
              </div>
              {form.media_id && <button type="button" onClick={() => setForm({ ...form, media_id: "" })} className="mt-3 text-xs text-fuchsia-400">Limpar seleção</button>}
              {media.length > 0 && (
                <div className="mt-4 grid max-h-80 grid-cols-2 gap-3 overflow-y-auto md:grid-cols-3">
                  {media.map((item) => (
                    <button type="button" key={item.id} onClick={() => setForm({ ...form, media_id: item.id })} className={`overflow-hidden rounded-lg border text-left ${form.media_id === item.id ? "border-fuchsia-500" : "border-zinc-800"}`}>
                      {(item.thumbnail_url || item.media_url) ? <img src={item.thumbnail_url || item.media_url} alt="Mídia do Instagram" className="aspect-square w-full object-cover" /> : <div className="grid aspect-square place-items-center bg-zinc-900 text-xs">Sem miniatura</div>}
                      <p className="line-clamp-2 p-2 text-xs text-zinc-400">{item.caption || item.media_type}</p>
                    </button>
                  ))}
                </div>
              )}
              <input value={form.media_id} onChange={(e) => setForm({ ...form, media_id: e.target.value })} className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-sm" placeholder="Ou cole manualmente o ID da mídia" />
            </div>
            <label className="text-sm">Respostas públicas, uma por linha<textarea value={form.publicRepliesText} onChange={(e) => setForm({ ...form, publicRepliesText: e.target.value })} className="mt-1 min-h-24 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3" placeholder={'Enviei na sua DM 😊\nDá uma olhada nas mensagens!'} /></label>
            <label className="text-sm">DM de boas-vindas<textarea required value={form.welcome_dm} onChange={(e) => setForm({ ...form, welcome_dm: e.target.value })} className="mt-1 min-h-24 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3" /></label>
            <label className="text-sm">Texto do botão de resposta rápida<input value={form.quick_reply_label} onChange={(e) => setForm({ ...form, quick_reply_label: e.target.value })} maxLength={20} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3" /></label>
            <label className="text-sm">Texto antes do link<textarea value={form.link_text} onChange={(e) => setForm({ ...form, link_text: e.target.value })} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3" /></label>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm">Rótulo do botão<input value={form.link_button_label} onChange={(e) => setForm({ ...form, link_button_label: e.target.value })} maxLength={20} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3" /></label>
              <label className="text-sm">URL do link<input type="url" value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3" placeholder="https://..." /></label>
            </div>
            <label className="text-sm">Atraso do link, em segundos<input type="number" min={0} max={86400} value={form.link_delay_seconds} onChange={(e) => setForm({ ...form, link_delay_seconds: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3" /></label>
            <label className="text-sm">Texto do lembrete<textarea value={form.reminder_text} onChange={(e) => setForm({ ...form, reminder_text: e.target.value })} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3" /></label>
            <label className="text-sm">Atraso do lembrete, em segundos<input type="number" min={0} max={86400} value={form.reminder_delay_seconds} onChange={(e) => setForm({ ...form, reminder_delay_seconds: Number(e.target.value) })} className="mt-1 w-full rounded-lg border border-zinc-700 bg-zinc-900 p-3" /></label>
            {warning && <p className="text-sm text-amber-300">{warning}</p>}
            {message && <p className="text-sm text-zinc-300">{message}</p>}
            <button disabled={saving || form.triggers.length === 0} className="rounded-xl bg-fuchsia-600 px-5 py-3 font-semibold hover:bg-fuchsia-500 disabled:opacity-50">{saving ? "Salvando..." : "Criar automação"}</button>
          </div>
        </form>
      </section>

      <footer className="mt-8 flex gap-4 text-sm text-zinc-500">
        <a href="/privacidade" className="hover:text-zinc-300">Privacidade</a>
        <a href="/exclusao-de-dados" className="hover:text-zinc-300">Exclusão de dados</a>
      </footer>
    </main>
  );
}
