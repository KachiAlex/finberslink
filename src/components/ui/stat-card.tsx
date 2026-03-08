import { cn } from "@/lib/utils";
import { forwardRef } from "react";
import { Icon as LucideIcon } from "lucide-react";

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "gradient" | "minimal";
}

const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, title, value, icon: Icon, trend, variant = "default", ...props }, ref) => {
    const variants = {
      default: "bg-gradient-to-br from-white to-white/80 backdrop-blur-xl border border-white/20 shadow-lg",
      gradient: "bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-xl border border-white/20 shadow-xl",
      minimal: "bg-white/60 backdrop-blur-md border border-slate-200/50 shadow-md",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden rounded-2xl p-6 transition-all duration-200 hover:shadow-xl",
          variants[variant],
          className
        )}
        {...props}
      >
        <div className="flex items-start justify-between">
          <div className="sm space-y-2">
            <p className="text-sm font-medium text-slate-600">{title}</p>
            <p className="text-3xl font-bold text-slate-900">{value}</p>
            {trend && (
              <div className="flex items-center space-x-1">
                <span
                  className={cn(
                    "text-xs font-medium",
                    trend.isPositive ? "text-green-600" : "text-red-600"
                  )}
                >
                  {trend.isPositive ? "+" : "-"}{trend.value}%
                </span>
                <span className="text-xs text-slate-500">vs last period</span>
              </div>
            )}
          </div>
          <div className="rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-3 text-white shadow-lg">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        
        {/* Decorative gradient */}
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-xl" />
      </div>
    );
  }
);

StatCard.displayName = "StatCard";

export { StatCard };
