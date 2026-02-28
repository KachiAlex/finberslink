import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface AdminShellProps {
  title: string;
  description?: string;
  actions?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function AdminShell({
  title,
  description,
  actions,
  className,
  children,
}: AdminShellProps) {
  return (
    <section
      className={cn(
        "space-y-6 rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-sm",
        className,
      )}
    >
      <header className="flex flex-col gap-4 border-b border-slate-100 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
          {description ? (
            <p className="text-sm text-slate-600">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
      </header>
      <div className="space-y-6">{children}</div>
    </section>
  );
}
