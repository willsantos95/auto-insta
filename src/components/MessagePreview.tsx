"use client";

interface MessagePreviewProps {
  type: "welcome" | "link" | "reminder";
  message: string;
  buttonLabel?: string;
  linkUrl?: string;
  linkButtonLabel?: string;
}

export function MessagePreview({
  type,
  message,
  buttonLabel,
  linkUrl,
  linkButtonLabel,
}: MessagePreviewProps) {
  const isValid = message && message.trim().length > 0;

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-6">
      <div className="mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider mb-2">
          {type === "welcome" && "💬 Preview - Mensagem de Boas-vindas"}
          {type === "link" && "🔗 Preview - Mensagem com Link"}
          {type === "reminder" && "🔔 Preview - Lembrete"}
        </h3>
        <p className="text-xs text-zinc-400">
          {type === "welcome" && "Assim o usuário verá após comentar ou enviar DM"}
          {type === "link" && "Mensagem enviada após o usuário clicar no botão"}
          {type === "reminder" && `Lembrete enviado após alguns segundos/horas`}
        </p>
      </div>

      {!isValid ? (
        <div className="bg-zinc-950 border-l-4 border-zinc-700 rounded-lg p-4 text-sm text-zinc-500">
          ✕ Preencha a mensagem para ver o preview
        </div>
      ) : (
        <div className="space-y-3">
          {/* Simulação de DM do Instagram */}
          <div className="bg-gradient-to-br from-cyan-600 to-cyan-700 rounded-2xl p-4">
            <p className="text-white text-sm leading-relaxed font-medium">{message}</p>

            {/* Botão de resposta rápida */}
            {buttonLabel && type === "welcome" && (
              <div className="mt-3 pt-3 border-t border-cyan-600/50">
                <button className="w-full bg-white text-cyan-600 rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-100 transition-colors">
                  👉 {buttonLabel}
                </button>
              </div>
            )}

            {/* Link na mensagem */}
            {linkUrl && linkButtonLabel && type === "link" && (
              <div className="mt-3 pt-3 border-t border-cyan-600/50">
                <button className="w-full bg-white text-cyan-600 rounded-lg py-2.5 text-sm font-semibold hover:bg-gray-100 transition-colors">
                  🔗 {linkButtonLabel}
                </button>
              </div>
            )}
          </div>

          {/* Info sobre fluxo */}
          <div className="flex gap-2 text-xs text-zinc-400 bg-zinc-950 p-3 rounded-lg">
            <span>ℹ️</span>
            <div className="space-y-1">
              {type === "welcome" && (
                <>
                  <p>1. Usuário comenta ou envia DM</p>
                  <p>2. Bot envia esta mensagem</p>
                  <p>3. Se clicar no botão → próxima mensagem é enviada</p>
                </>
              )}
              {type === "link" && (
                <>
                  <p>Esta mensagem é enviada após o usuário clicar no botão da mensagem anterior</p>
                  {linkUrl && <p>Link: {linkUrl}</p>}
                </>
              )}
              {type === "reminder" && (
                <p>Esta mensagem é enviada como lembrete após o tempo configurado</p>
              )}
            </div>
          </div>

          {/* Exemplo de conversa completa */}
          {type === "welcome" && (
            <div className="mt-4 pt-4 border-t border-zinc-700">
              <p className="text-xs font-semibold text-zinc-300 mb-2">📱 Fluxo Completo da Conversa:</p>
              <div className="space-y-2 text-xs">
                <div className="flex gap-2">
                  <span className="text-gray-400">👤</span>
                  <span className="text-zinc-400">Usuário: [comentário com a palavra-chave]</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-cyan-400">🤖</span>
                  <span className="text-zinc-300 bg-cyan-600/20 px-3 py-2 rounded">
                    {message}
                  </span>
                </div>
                {buttonLabel && (
                  <div className="flex gap-2 ml-4">
                    <span className="text-gray-400">👤</span>
                    <span className="text-zinc-400">Clica em: {buttonLabel}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
