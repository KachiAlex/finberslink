"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface AdminNavLinkProps {
  href: string;
  title: string;
  icon?: ReactNode;
}

export function AdminNavLink({ href, title, icon }: AdminNavLinkProps) {
  const pathname = usePathname();
  const isRoot = href === "/admin";
  const isActive = isRoot ? pathname === href : pathname?.startsWith(href ?? "");

  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
        isActive
          ? "bg-slate-900 text-white shadow-lg shadow-slate-900/10"
          : "text-slate-500 hover:bg-slate-100",
      )}
    >
      {icon ? (
        <span className={cn("text-slate-400", isActive && "text-white")}>{icon}</span>
      ) : null}
      <span>{title}</span>
    </Link>
  );
}
