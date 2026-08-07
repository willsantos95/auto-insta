"use client";

import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

interface CardHeaderProps {
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
}

interface CardBodyProps {
  children: ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "", onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        rounded-xl
        border border-[var(--border-base)]
        bg-[var(--bg-primary)]
        shadow-sm
        hover:shadow-md
        transition-all
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, description, children, className = "" }: CardHeaderProps) {
  return (
    <div className={`border-b border-[var(--border-subtle)] px-6 py-5 ${className}`}>
      {title && (
        <h3 className="text-base font-semibold text-[var(--text-primary)] mb-1">
          {title}
        </h3>
      )}
      {description && (
        <p className="text-sm text-[var(--text-secondary)]">{description}</p>
      )}
      {children}
    </div>
  );
}

export function CardBody({ children, className = "" }: CardBodyProps) {
  return (
    <div className={`px-6 py-5 ${className}`}>
      {children}
    </div>
  );
}

export function CardFooter({ children, className = "" }: CardFooterProps) {
  return (
    <div className={`border-t border-[var(--border-subtle)] px-6 py-4 flex gap-3 justify-end ${className}`}>
      {children}
    </div>
  );
}
