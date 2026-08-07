"use client";

interface CommentFilterSettingsProps {
  preferPublicReply?: boolean;
  onChange: (value: boolean) => void;
}

export function CommentFilterSettings({ preferPublicReply = false, onChange }: CommentFilterSettingsProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <label className="text-sm font-medium text-zinc-100 block mb-1">
              📝 Tipo de Resposta
            </label>
            <p className="text-xs text-zinc-400">
              Escolha como responder aos comentários
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => onChange(false)}
            className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
              !preferPublicReply
                ? "border-violet-500 bg-violet-500/10"
                : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-600"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                !preferPublicReply ? "border-violet-500 bg-violet-500" : "border-zinc-600"
              }`}>
                {!preferPublicReply && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-100">💬 Responder via DM (Padrão)</p>
                <p className="text-xs text-zinc-400">Envia mensagem privada + comentário público opcional</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => onChange(true)}
            className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
              preferPublicReply
                ? "border-violet-500 bg-violet-500/10"
                : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-600"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                preferPublicReply ? "border-violet-500 bg-violet-500" : "border-zinc-600"
              }`}>
                {preferPublicReply && <div className="w-2 h-2 bg-white rounded-full" />}
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-100">🗣️ Responder no Comentário</p>
                <p className="text-xs text-zinc-400">Responde apenas com comentário público (sem DM privada)</p>
              </div>
            </div>
          </button>
        </div>

        <div className="bg-blue-950/30 border border-blue-700 rounded p-2.5">
          <p className="text-xs text-blue-300">
            💡 <strong>Dica:</strong> Use "Responder no Comentário" para manter todas as respostas públicas e visíveis para outros usuários.
          </p>
        </div>
      </div>
    </div>
  );
}
