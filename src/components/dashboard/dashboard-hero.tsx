import Link from "next/link";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type HeroAction = {
  label: string;
  href: string;
  icon?: React.ElementType;
  variant?: "primary" | "secondary" | "ghost";
};

interface DashboardHeroProps {
  eyebrow: string;
  title: ReactNode;
  description: string;
  accent: "blue" | "purple" | "green" | "orange";
  actions: HeroAction[];
  metaSlot?: React.ReactNode;
}

const accentGradients: Record<DashboardHeroProps["accent"], string> = {
  blue: "from-blue-500/10 to-cyan-400/15",
  purple: "from-purple-500/10 to-pink-400/15",
  green: "from-emerald-500/10 to-green-400/15",
  orange: "from-orange-500/10 to-rose-400/15",
};

export function DashboardHero({ eyebrow, title, description, accent, actions, metaSlot }: DashboardHeroProps) {
  return (
    <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-lg shadow-slate-200/70">
      <div className={cn("absolute -right-16 top-6 h-48 w-48 rounded-full blur-3xl", `bg-gradient-to-br ${accentGradients[accent]}`)} />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-4">
          <p className="text-xs uppercase tracking-[0.45em] text-slate-500">{eyebrow}</p>
          <div>
            <h1 className="text-4xl font-semibold text-slate-900 sm:text-5xl">{title}</h1>
            <p className="mt-3 max-w-2xl text-base text-slate-600">{description}</p>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {actions.map(({ label, href, icon: Icon, variant = "primary" }) => (
            <Button
              key={label}
              asChild
              className={cn(
                "rounded-full",
                variant === "primary" && "bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800",
                variant === "secondary" && "border-slate-200 text-slate-700 hover:bg-slate-100",
                variant === "ghost" && "text-slate-600 hover:text-slate-900"
              )}
              variant={variant === "secondary" ? "outline" : variant === "ghost" ? "ghost" : "default"}
            >
              <Link href={href} className="flex items-center gap-2 text-sm font-medium">
                {label}
                {Icon ? <Icon className="h-4 w-4" /> : null}
              </Link>
            </Button>
          ))}
          {metaSlot ? (
            <div className="rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-sm text-slate-700 shadow-sm">
              {metaSlot}
            </div>
          ) : null
          }
        </div>
      </div>
    </header>
  );
}
