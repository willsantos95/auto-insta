"use client";

import { InstagramAccount } from "@/lib/config";
import { Card, CardBody } from "@/components/Card";

interface AccountSelectorProps {
  accounts: InstagramAccount[];
  selectedAccountId: string;
  onChange: (accountId: string) => void;
}

export function AccountSelector({
  accounts,
  selectedAccountId,
  onChange,
}: AccountSelectorProps) {
  if (accounts.length === 0) {
    return (
      <Card>
        <CardBody className="text-center py-8">
          <p className="text-sm text-[var(--text-secondary)]">
            Nenhuma conta Instagram conectada
          </p>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="grid gap-3">
      {accounts.map((account) => (
        <div
          key={account.id}
          onClick={() => onChange(account.id)}
          className={`
            p-4 rounded-lg border-2 cursor-pointer transition-all
            ${
              selectedAccountId === account.id
                ? "border-[var(--accent-primary)] bg-[var(--accent-light)]"
                : "border-[var(--border-subtle)] bg-[var(--bg-primary)] hover:border-[var(--border-base)]"
            }
          `}
        >
          <div className="flex items-center gap-3">
            {account.profile_picture_url && (
              <img
                src={account.profile_picture_url ?? undefined}
                alt={account.instagram_username ?? ""}
                className="w-12 h-12 rounded-full object-cover flex-shrink-0"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[var(--text-primary)] truncate">
                @{account.instagram_username}
              </p>
              <p className="text-xs text-[var(--text-secondary)] truncate">
                {account.instagram_name}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] font-mono mt-1">
                {account.id}
              </p>
            </div>
            {selectedAccountId === account.id && (
              <div className="flex-shrink-0">
                <div className="w-6 h-6 rounded-full bg-[var(--accent-primary)] flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
