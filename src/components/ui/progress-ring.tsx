import { cn } from "@/lib/utils";
import { forwardRef } from "react";

interface ProgressRingProps extends React.SVGAttributes<SVGSVGElement> {
  value: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

const ProgressRing = forwardRef<SVGSVGElement, ProgressRingProps>(
  ({ value, size = 60, strokeWidth = 4, className, ...props }, ref) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
      <svg
        ref={ref}
        width={size}
        height={size}
        className={cn("transform -rotate-90", className)}
        {...props}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-slate-200"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-blue-600 transition-all duration-500 ease-out"
        />
      </svg>
    );
  }
);

ProgressRing.displayName = "ProgressRing";

export { ProgressRing };
