import { ReactNode } from "react";

interface FormSectionProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function FormSection({ children, title, description }: FormSectionProps) {
  return (
    <div className="rounded-xl border border-[var(--border-base)] bg-[var(--bg-secondary)] p-6">
      {title && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
          {description && <p className="mt-1 text-xs text-[var(--text-secondary)]">{description}</p>}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
}
