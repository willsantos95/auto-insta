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
        <span className="font-medium text-[var(--text-primary)]">{label}</span>
        {required && <span className="text-[var(--error)]">*</span>}
      </div>
      <div className="flex items-center gap-1.5">
        {error && (
          <>
            <span className="text-[var(--error)]">⚠️</span>
            <span className="text-[var(--error)]">{error}</span>
          </>
        )}
        {!error && filled && (
          <>
            <span className="text-[var(--success)]">✓</span>
            <span className="text-[var(--success)]">Preenchido</span>
          </>
        )}
        {!error && !filled && required && (
          <>
            <span className="text-[var(--warning)]">○</span>
            <span className="text-[var(--text-secondary)]">Obrigatório</span>
          </>
        )}
      </div>
    </div>
  );
}
