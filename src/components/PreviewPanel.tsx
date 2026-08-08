interface PreviewPanelProps {
  title?: string;
  message: string;
  buttonLabel?: string;
  buttonText?: string;
}

export function PreviewPanel({
  title = "👁️ Preview da Mensagem",
  message,
  buttonLabel,
  buttonText = "Abrir",
}: PreviewPanelProps) {
  return (
    <div className="rounded-xl border border-[var(--border-base)] bg-[var(--bg-secondary)] p-6">
      <div className="mb-4">
        <h3 className="text-xs font-bold text-[var(--accent-primary)] uppercase tracking-wider mb-2">{title}</h3>
        <p className="text-xs text-[var(--text-secondary)]">Assim o usuário verá a resposta:</p>
      </div>

      <div className="bg-[var(--bg-tertiary)] border-l-4 border-[var(--accent-primary)] rounded-lg p-4 space-y-3">
        <p className="text-sm text-[var(--text-primary)] leading-relaxed">{message}</p>

        {buttonLabel && (
          <button className="inline-block bg-[var(--accent-primary)] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[var(--accent-dark)] transition-colors">
            👉 {buttonLabel}
          </button>
        )}
      </div>

      {buttonText && (
        <p className="text-xs text-[var(--text-tertiary)] mt-3">
          Depois de {buttonText}, será enviado o link após o atraso configurado.
        </p>
      )}
    </div>
  );
}
