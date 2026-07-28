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
    <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-6">
      <div className="mb-4">
        <h3 className="text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">{title}</h3>
        <p className="text-xs text-zinc-400">Assim o usuário verá a resposta:</p>
      </div>

      <div className="bg-zinc-950 border-l-4 border-cyan-500 rounded-lg p-4 space-y-3">
        <p className="text-sm text-zinc-100 leading-relaxed">{message}</p>

        {buttonLabel && (
          <button className="inline-block bg-cyan-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-cyan-600 transition-colors">
            👉 {buttonLabel}
          </button>
        )}
      </div>

      {buttonText && (
        <p className="text-xs text-zinc-500 mt-3">
          Depois de {buttonText}, será enviado o link após o atraso configurado.
        </p>
      )}
    </div>
  );
}
