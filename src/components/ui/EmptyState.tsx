import Link from "next/link";
import type { ReactNode } from "react";

export function EmptyState({
  icon = "📭",
  title,
  description,
  action,
  className = "",
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div
      className={`animate-fade-up flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center ${className}`}
    >
      <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-3xl">
        {icon}
      </div>
      <h3 className="mt-4 font-heading text-lg text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      )}
      {action && (
        <Link
          href={action.href}
          className="mt-5 inline-block rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
