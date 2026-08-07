"use client";

import { InstagramAccount } from "@/lib/config";

interface AccountSelectorProps {
  accounts: InstagramAccount[];
  selectedAccountId?: string;
  onChange: (accountId: string) => void;
}

export function AccountSelector({ accounts, selectedAccountId, onChange }: AccountSelectorProps) {
  if (accounts.length === 0) {
    return (
      <div className="bg-yellow-950/30 border border-yellow-700 rounded-lg p-4">
        <p className="text-sm text-yellow-300">
          ℹ️ Nenhuma conta Instagram conectada. Clique em "Conectar Instagram" para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-zinc-300">
        Conta Instagram <span className="text-red-400">*</span>
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {accounts.map((account) => (
          <button
            key={account.id}
            onClick={() => onChange(account.id)}
            className={`p-4 rounded-lg border-2 transition-all text-left ${
              selectedAccountId === account.id
                ? "border-violet-500 bg-violet-500/10"
                : "border-zinc-700 bg-zinc-900/50 hover:border-zinc-600"
            }`}
          >
            <div className="flex items-start gap-3">
              {account.profile_picture_url && (
                <img
                  src={account.profile_picture_url ?? undefined}
                  alt={account.instagram_username ?? ""}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-zinc-100">@{account.instagram_username}</p>
                <p className="text-xs text-zinc-400">{account.instagram_name}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  ID: {account.instagram_user_id}
                </p>
              </div>
              {selectedAccountId === account.id && (
                <span className="text-violet-400 text-lg">✓</span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
