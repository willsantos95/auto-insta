"use client";

interface ResponseLimitSettingsProps {
  respondOncePerUser?: boolean;
  onChange: (value: boolean) => void;
}

export function ResponseLimitSettings({ respondOncePerUser = false, onChange }: ResponseLimitSettingsProps) {
  return (
    <div className="rounded-lg border border-[var(--border-base)] bg-[var(--bg-secondary)] p-4 space-y-3">
      <label className="block">
        <div className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={respondOncePerUser}
            onChange={(e) => onChange(e.target.checked)}
            className="w-4 h-4 rounded border-[var(--border-base)] cursor-pointer accent-[var(--accent-primary)]"
          />
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              🎯 Responder apenas 1x por pessoa
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              {respondOncePerUser
                ? "✓ Ativado: Responde apenas o primeiro comentário da pessoa"
                : "Desativado: Responde sempre que matchear"}
            </p>
          </div>
        </div>
      </label>

      <div className="bg-[var(--accent-light)] border border-[var(--accent-primary)]/30 rounded p-2.5">
        <p className="text-xs text-[var(--accent-dark)]">
          💡 <strong>Dica:</strong> Ative para evitar respostas repetidas da mesma pessoa. Útil para economizar limite de mensagens.
        </p>
      </div>
    </div>
  );
}
