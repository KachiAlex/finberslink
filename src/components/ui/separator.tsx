import { cn } from "../../lib/utils";

interface SeparatorProps {
  className?: string;
}

export function Separator({ className = "" }: SeparatorProps) {
  return <div className={cn("h-px bg-slate-200/40", className)} />;
}
