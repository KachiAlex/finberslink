import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "gradient" | "bordered";
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-white/80 backdrop-blur-xl border border-white/20 shadow-lg",
      gradient: "bg-gradient-to-br from-white/90 to-white/60 backdrop-blur-xl border border-white/20 shadow-xl",
      bordered: "bg-white/60 backdrop-blur-md border border-slate-200/50 shadow-md",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl transition-all duration-200 hover:shadow-xl",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

GlassCard.displayName = "GlassCard";

export { GlassCard };
