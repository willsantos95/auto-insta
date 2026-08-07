"use client";

import { InstagramAccount } from "@/lib/config";

interface AccountsManagerProps {
  accounts: InstagramAccount[];
  onConnect: () => void;
  onDisconnect?: (accountId: string) => void;
  isLoading?: boolean;
}

export function AccountsManager({ accounts, onConnect, onDisconnect, isLoading }: AccountsManagerProps) {
  const isTokenExpired = (expiresAt: Date | null) => {
    if (!expiresAt) return false;
    return new Date() > new Date(expiresAt);
  };

  const getTokenStatus = (expiresAt: Date | null) => {
    if (!expiresAt) return { status: "expired", label: "Token ausente", color: "text-red-400" };

    const now = new Date();
    const expirationDate = new Date(expiresAt);
    const daysLeft = Math.floor((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) {
      return { status: "expired", label: "Token expirado", color: "text-red-400" };
    } else if (daysLeft < 7) {
      return { status: "expiring", label: `Expira em ${daysLeft}d`, color: "text-yellow-400" };
    } else {
      return { status: "valid", label: `Válido por ${daysLeft}d`, color: "text-emerald-400" };
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-100">Contas Conectadas ({accounts.length})</h3>
        <button
          onClick={onConnect}
          disabled={isLoading}
          className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Conectando..." : "+ Conectar Nova Conta"}
        </button>
      </div>

      {accounts.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-700 rounded-lg p-6 text-center">
          <p className="text-sm text-zinc-400 mb-3">Nenhuma conta Instagram conectada</p>
          <button
            onClick={onConnect}
            disabled={isLoading}
            className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-lg hover:bg-violet-500 transition-colors disabled:opacity-50"
          >
            Conectar Instagram
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {accounts.map((account) => {
            const tokenInfo = getTokenStatus(account.token_expires_at);
            return (
              <div
                key={account.id}
                className="flex items-center gap-4 p-4 rounded-lg border border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900/70 transition-colors"
              >
                {account.profile_picture_url && (
                  <img
                    src={account.profile_picture_url ?? undefined}
                    alt={account.instagram_username ?? ""}
                    className="w-12 h-12 rounded-full"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium text-zinc-100">@{account.instagram_username}</p>
                  <p className="text-xs text-zinc-400">{account.instagram_name}</p>
                  <p className={`text-xs mt-1 ${tokenInfo.color}`}>
                    {tokenInfo.status === "expired" && "⚠️ "}
                    {tokenInfo.status === "expiring" && "⏰ "}
                    {tokenInfo.status === "valid" && "✓ "}
                    {tokenInfo.label}
                  </p>
                </div>
                {onDisconnect && (
                  <button
                    onClick={() => onDisconnect(account.id)}
                    disabled={isLoading}
                    className="px-3 py-2 text-xs bg-red-900/20 text-red-400 rounded hover:bg-red-900/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Desconectar
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-blue-950/30 border border-blue-700 rounded-lg p-3">
        <p className="text-xs text-blue-300">
          💡 Dica: Após conectar uma conta, ela fica disponível para usar em qualquer automação.
        </p>
      </div>
    </div>
  );
}
