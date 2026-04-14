"use client";

import React from "react";
import Link from "next/link";

interface SidebarItem {
  label: string;
  description?: string;
  href: string;
  iconName?: string;
}

interface DashboardSidebarProps {
  title?: string;
  subtitle?: string;
  items?: SidebarItem[];
  footer?: React.ReactNode;
}

export function DashboardSidebar({ title, subtitle, items = [], footer }: DashboardSidebarProps) {
  return (
    <aside className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {title && (
        <div className="mb-6">
          <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
        </div>
      )}
      <nav className="space-y-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col rounded-lg px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
          >
            <span className="font-medium text-slate-800">{item.label}</span>
            {item.description && (
              <span className="text-xs text-slate-500">{item.description}</span>
            )}
          </Link>
        ))}
      </nav>
      {footer && (
        <div className="mt-6 border-t border-slate-100 pt-4 text-sm text-slate-600">
          {footer}
        </div>
      )}
    </aside>
  );
}
