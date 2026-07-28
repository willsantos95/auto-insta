import { ReactNode } from "react";

interface FormSectionProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export function FormSection({ children, title, description }: FormSectionProps) {
  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-6">
      {title && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-zinc-100">{title}</h3>
          {description && <p className="mt-1 text-xs text-zinc-400">{description}</p>}
        </div>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
}
