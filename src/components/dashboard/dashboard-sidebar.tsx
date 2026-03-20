"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface DashboardSidebarItem {
  label: string;
  href: string;
  description?: string;
  icon?: LucideIcon;
  badge?: string;
}

interface DashboardSidebarProps {
  title: string;
  subtitle?: string;
  meta?: string;
  items: DashboardSidebarItem[];
  footer?: ReactNode;
  className?: string;
}

export function DashboardSidebar({
  title,
  subtitle,
  meta,
  items,
  footer,
  className,
}: DashboardSidebarProps) {
  return (
    <aside
      className={cn(
        "space-y-4 rounded-[32px] border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur",
        className,
      )}
    >
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-[0.45em] text-slate-400">Workspace</p>
        <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
        {subtitle ? <p className="text-sm text-slate-600">{subtitle}</p> : null}
        {meta ? <span className="inline-flex rounded-full bg-slate-900/5 px-3 py-1 text-xs font-medium text-slate-700">{meta}</span> : null}
      </div>

      <nav className="mt-6 space-y-1" aria-label={`${title} navigation`}>
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-start gap-3 rounded-2xl px-3 py-3 text-left text-sm text-slate-600 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            >
              {Icon ? (
                <span className="mt-1 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700 transition group-hover:bg-slate-900 group-hover:text-white">
                  <Icon className="h-4 w-4" />
                </span>
              ) : null}
              <span className="flex-1">
                <span className="block font-medium text-slate-900">{item.label}</span>
                {item.description ? (
                  <span className="text-xs text-slate-500">{item.description}</span>
                ) : null}
              </span>
              {item.badge ? (
                <span className="rounded-full bg-slate-900/5 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      {footer ? (
        <div className="rounded-2xl border border-dashed border-slate-200/80 bg-slate-50/80 p-4 text-xs text-slate-500">
          {footer}
        </div>
      ) : null}
    </aside>
  );
}
