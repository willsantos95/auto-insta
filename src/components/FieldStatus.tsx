interface FieldStatusProps {
  label: string;
  required?: boolean;
  filled: boolean;
  error?: string;
}

export function FieldStatus({ label, required, filled, error }: FieldStatusProps) {
  return (
    <div className="flex items-center justify-between text-xs">
      <div className="flex items-center gap-2">
        <span className="font-medium text-zinc-200">{label}</span>
        {required && <span className="text-red-400">*</span>}
      </div>
      <div className="flex items-center gap-1.5">
        {error && (
          <>
            <span className="text-red-400">⚠️</span>
            <span className="text-red-400">{error}</span>
          </>
        )}
        {!error && filled && (
          <>
            <span className="text-emerald-400">✓</span>
            <span className="text-emerald-400">Preenchido</span>
          </>
        )}
        {!error && !filled && required && (
          <>
            <span className="text-yellow-400">○</span>
            <span className="text-zinc-400">Obrigatório</span>
          </>
        )}
      </div>
    </div>
  );
}
