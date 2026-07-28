"use client";

import { useState, ReactNode } from "react";

interface TabItem {
  id: string;
  label: string;
  icon?: string;
}

interface TabsProps {
  items: TabItem[];
  children: ReactNode[];
  defaultTab?: string;
  onChange?: (tabId: string) => void;
}

export function Tabs({ items, children, defaultTab, onChange }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || items[0]?.id);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleTabChange = (tabId: string) => {
    if (tabId === activeTab) return;

    setIsTransitioning(true);
    setTimeout(() => {
      setActiveTab(tabId);
      onChange?.(tabId);
      setIsTransitioning(false);
    }, 150);
  };

  const activeIndex = items.findIndex((item) => item.id === activeTab);
  const progress = ((activeIndex + 1) / items.length) * 100;

  return (
    <div className="flex flex-col gap-6">
      {/* Progress Bar */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
            Progresso
          </span>
          <span className="text-xs text-zinc-500">
            {activeIndex + 1} de {items.length} etapas
          </span>
        </div>
        <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden shadow-sm">
          <div
            className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-cyan-500 rounded-full transition-all duration-500 ease-out shadow-lg shadow-violet-500/50"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-zinc-700 overflow-x-auto pb-0 -mx-8 px-8 relative">
        <div className="flex gap-2">
          {items.map((item, index) => (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              disabled={isTransitioning}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all duration-200 disabled:cursor-not-allowed relative group ${
                activeTab === item.id
                  ? "border-violet-500 text-violet-400"
                  : "border-transparent text-zinc-400 hover:text-zinc-300"
              }`}
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.label}

              {/* Indicator dot */}
              {activeTab !== item.id && (
                <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full transition-opacity ${
                  index < activeIndex
                    ? "bg-emerald-500 opacity-100"
                    : "bg-zinc-700 opacity-0"
                }`} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content with fade animation */}
      <div className={`min-h-96 transition-opacity duration-150 ${isTransitioning ? "opacity-50" : "opacity-100"}`}>
        {children[activeIndex]}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center gap-3 pt-6 border-t border-zinc-800">
        <button
          onClick={() => {
            if (activeIndex > 0) {
              handleTabChange(items[activeIndex - 1].id);
            }
          }}
          disabled={activeIndex === 0 || isTransitioning}
          className="px-4 py-2.5 text-sm font-medium text-zinc-400 hover:text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:translate-x-[-2px]"
        >
          ← Voltar
        </button>
        <div className="flex gap-3">
          <button className="px-6 py-2.5 text-sm font-semibold border-2 border-zinc-700 text-zinc-300 rounded-lg hover:border-zinc-600 hover:bg-zinc-900/50 transition-all duration-200 hover:translate-y-[-1px]">
            💾 Salvar Rascunho
          </button>
          <button
            onClick={() => {
              if (activeIndex < items.length - 1) {
                handleTabChange(items[activeIndex + 1].id);
              }
            }}
            disabled={isTransitioning}
            className="px-6 py-2.5 text-sm font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:translate-y-[-1px] hover:shadow-lg hover:shadow-violet-500/20"
          >
            {activeIndex === items.length - 1 ? "✓ Criar Automação" : "Próximo →"}
          </button>
        </div>
      </div>
    </div>
  );
}
