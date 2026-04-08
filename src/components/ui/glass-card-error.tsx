import { AlertCircle } from "lucide-react";

import { GlassCard } from "@/components/ui/glass-card";

interface GlassCardErrorProps {
  className?: string;
  message?: string | null;
}

export function GlassCardError({ message, className }: GlassCardErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <GlassCard className={className} variant="bordered">
      <div className="flex items-center gap-3 text-sm font-medium text-rose-600">
        <AlertCircle className="h-4 w-4" />
        <p>{message}</p>
      </div>
    </GlassCard>
  );
}
