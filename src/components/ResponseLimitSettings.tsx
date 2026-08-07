"use client";

interface ResponseLimitSettingsProps {
  respondOncePerUser?: boolean;
  onChange: (value: boolean) => void;
}

export function ResponseLimitSettings({ respondOncePerUser = false, onChange }: ResponseLimitSettingsProps) {
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900/50 p-4 space-y-3">
      <label className="block">
        <div className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={respondOncePerUser}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded bg-zinc-800 border-zinc-600 cursor-pointer"
          />
          <div>
            <p className="text-sm font-medium text-zinc-100">
              🎯 Responder apenas 1x por pessoa
            </p>
            <p className="text-xs text-zinc-400">
              {respondOncePerUser
                ? "✓ Ativado: Responde apenas o primeiro comentário da pessoa"
                : "Desativado: Responde sempre que matchear"}
            </p>
          </div>
        </div>
      </label>

      <div className="bg-blue-950/30 border border-blue-700 rounded p-2.5">
        <p className="text-xs text-blue-300">
          💡 <strong>Dica:</strong> Ative para evitar respostas repetidas da mesma pessoa. Útil para economizar limite de mensagens.
        </p>
      </div>
    </div>
  );
}
