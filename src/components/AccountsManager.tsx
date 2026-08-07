"use client";

import { InstagramAccount } from "@/lib/config";
import { Card, CardBody } from "@/components/Card";
import { Button } from "@/components/Button";

interface AccountsManagerProps {
  accounts: InstagramAccount[];
  onConnect: () => void;
  onDisconnect?: (accountId: string) => void;
  isLoading?: boolean;
}

export function AccountsManager({
  accounts,
  onConnect,
  onDisconnect,
  isLoading,
}: AccountsManagerProps) {
  const isTokenExpired = (expiresAt: Date | null) => {
    if (!expiresAt) return false;
    return new Date() > new Date(expiresAt);
  };

  const getTokenStatus = (expiresAt: Date | null) => {
    if (!expiresAt) return { status: "expired", label: "Token ausente", color: "text-[var(--error)]" };

    const now = new Date();
    const expirationDate = new Date(expiresAt);
    const daysLeft = Math.floor(
      (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysLeft < 0) {
      return {
        status: "expired",
        label: "Token expirado",
        color: "text-[var(--error)]",
      };
    } else if (daysLeft < 7) {
      return {
        status: "expiring",
        label: `Expira em ${daysLeft}d`,
        color: "text-[var(--warning)]",
      };
    } else {
      return {
        status: "valid",
        label: `Válido por ${daysLeft}d`,
        color: "text-[var(--success)]",
      };
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Contas Conectadas
          </h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            {accounts.length} conta{accounts.length !== 1 ? "s" : ""} conectada
            {accounts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button
          onClick={onConnect}
          disabled={isLoading}
          size="sm"
          variant="primary"
        >
          {isLoading ? "Conectando..." : "+ Conectar Nova"}
        </Button>
      </div>

      {accounts.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Nenhuma conta Instagram conectada
            </p>
            <Button onClick={onConnect} disabled={isLoading} size="md">
              Conectar Instagram
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid gap-3">
          {accounts.map((account) => {
            const tokenInfo = getTokenStatus(account.token_expires_at);
            return (
              <Card key={account.id}>
                <CardBody className="flex items-start gap-4 py-4">
                  {account.profile_picture_url && (
                    <img
                      src={account.profile_picture_url ?? undefined}
                      alt={account.instagram_username ?? ""}
                      className="w-14 h-14 rounded-full flex-shrink-0 object-cover"
                    />
                  )}

                  <div className="flex-1">
                    <div className="flex items-start gap-2 mb-1">
                      <div>
                        <p className="font-semibold text-[var(--text-primary)]">
                          @{account.instagram_username}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {account.instagram_name}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${tokenInfo.color}`}
                      >
                        {tokenInfo.status === "expired" && "⚠️"}
                        {tokenInfo.status === "expiring" && "⏰"}
                        {tokenInfo.status === "valid" && "✓"}
                        {" "}
                        {tokenInfo.label}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--text-tertiary)] font-mono">
                      ID: {account.id}
                    </p>
                  </div>

                  {onDisconnect && (
                    <Button
                      onClick={() => onDisconnect(account.id)}
                      disabled={isLoading}
                      size="sm"
                      variant="danger"
                      className="flex-shrink-0"
                    >
                      Desconectar
                    </Button>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <div className="bg-[var(--accent-light)] border border-[var(--accent-primary)]/20 rounded-lg p-4">
        <p className="text-xs text-[var(--accent-dark)] leading-relaxed">
          <strong>💡 Dica:</strong> Após conectar uma conta, ela fica disponível
          para usar em qualquer automação.
        </p>
      </div>
    </div>
  );
}
