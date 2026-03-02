"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface SuperAdminNavLinkProps {
  href: string;
  title: string;
  icon?: ReactNode;
}

export function SuperAdminNavLink({ href, title, icon }: SuperAdminNavLinkProps) {
  const pathname = usePathname();
  const isRoot = href === "/superadmin";
  const isActive = isRoot ? pathname === href : pathname?.startsWith(href ?? "");

  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
        isActive
          ? "bg-white/15 text-white shadow-lg shadow-indigo-500/20"
          : "text-white/60 hover:bg-white/10 hover:text-white"
      )}
    >
      {icon ? (
        <span className={cn("text-white/50", isActive && "text-white")}>{icon}</span>
      ) : null}
      <span>{title}</span>
    </Link>
  );
}
