"use client";

import Link from "next/link";
import { ReactNode } from "react";

interface HeaderNavProps {
  title: string;
  breadcrumb?: { label: string; href?: string }[];
  actions?: ReactNode;
}

export function HeaderNav({ title, breadcrumb, actions }: HeaderNavProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border-subtle)] bg-[var(--bg-primary)] backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-8 py-4">
        <div className="flex items-center justify-between gap-8 mb-3">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h1>
          </div>
          {actions && <div className="flex gap-3">{actions}</div>}
        </div>

        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="text-sm">
            <ol className="flex items-center gap-2">
              {breadcrumb.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2">
                  {item.href ? (
                    <Link
                      href={item.href}
                      className="text-[var(--accent-primary)] hover:underline"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-[var(--text-secondary)]">{item.label}</span>
                  )}
                  {idx < breadcrumb.length - 1 && (
                    <span className="text-[var(--text-tertiary)]">/</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
      </div>
    </header>
  );
}
