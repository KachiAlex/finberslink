import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/glass-card";
import { cn } from "@/lib/utils";

export type SectionAction = {
  label: string;
  href: string;
  icon?: LucideIcon;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "default";
};

interface DashboardSectionProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: SectionAction[];
  children: ReactNode;
  alignActions?: "start" | "end";
  className?: string;
}

const actionStyles: Record<Required<SectionAction>["variant"], string> = {
  primary: "bg-slate-900 text-white shadow-lg shadow-slate-900/15 hover:bg-slate-800",
  secondary: "border-slate-200 text-slate-700 hover:bg-slate-100",
  ghost: "text-slate-600 hover:text-slate-900",
};

export function DashboardSection({
  eyebrow,
  title,
  description,
  actions = [],
  children,
  alignActions = "end",
  className,
}: DashboardSectionProps) {
  return (
    <GlassCard variant="bordered" className={cn("p-6 space-y-6", className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {eyebrow ? <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{eyebrow}</p> : null}
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">{title}</h2>
          {description ? <p className="text-sm text-slate-600">{description}</p> : null}
        </div>
        {actions.length ? (
          <div
            className={cn(
              "flex flex-wrap gap-2",
              alignActions === "start" ? "sm:justify-start" : "sm:justify-end"
            )}
          >
            {actions.map(({ label, href, icon: Icon, variant = "primary", size = "sm" }) => (
              <Button
                key={label}
                asChild
                size={size}
                variant={variant === "secondary" ? "outline" : variant === "ghost" ? "ghost" : "default"}
                className={cn("rounded-full", actionStyles[variant])}
              >
                <Link href={href} className="flex items-center gap-2 text-sm font-medium">
                  {label}
                  {Icon ? <Icon className="h-4 w-4" /> : null}
                </Link>
              </Button>
            ))}
          </div>
        ) : null}
      </div>
      {children}
    </GlassCard>
  );
}
