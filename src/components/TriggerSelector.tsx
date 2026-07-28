import { ReactNode } from "react";

interface TriggerOption {
  id: string;
  label: string;
  description: string;
  icon: string;
}

interface TriggerSelectorProps {
  options: TriggerOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function TriggerSelector({ options, selected, onChange }: TriggerSelectorProps) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => toggle(option.id)}
          className={`rounded-lg border-2 p-4 text-center transition-all ${
            selected.includes(option.id)
              ? "border-violet-500 bg-violet-500/10"
              : "border-zinc-700 bg-zinc-900 hover:border-zinc-600"
          }`}
        >
          <div className="text-2xl mb-2">{option.icon}</div>
          <div className="text-sm font-semibold text-zinc-100">{option.label}</div>
          <div className="text-xs text-zinc-400 mt-1">{option.description}</div>
        </button>
      ))}
    </div>
  );
}
