"use client";

import React, { useRef, useState, useEffect } from "react";
import { Slot } from "@radix-ui/react-slot";
import { ArrowRight, Star } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

// Gradient Text Component
export const GradientText = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <span className={`bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent ${className}`}>
    {children}
  </span>
);

// Ripple Button Component
export const RippleButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode; asChild?: boolean }
>(({ children, className = "", asChild = false, ...props }, ref) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();
      
      setRipples(prev => [...prev, { x, y, id }]);
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== id));
      }, 600);
    }
    props.onClick?.(e);
  };

  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      ref={buttonRef || ref}
      className={`relative overflow-hidden transition-all duration-200 ${className}`}
      onClick={handleClick}
      {...props}
    >
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full bg-white/40"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: "20px",
            height: "20px",
            marginLeft: "-10px",
            marginTop: "-10px",
            animation: "ripple 0.6s ease-out",
          }}
        />
      ))}
      <style>{`
        @keyframes ripple {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          100% {
            transform: scale(4);
            opacity: 0;
          }
        }
      `}</style>
      {children}
    </Comp>
  );
});
RippleButton.displayName = "RippleButton";

// Enhanced CourseCard Component with Advanced Animations
export const AnimatedCourseCard = ({
  title,
  enrolled,
  rating,
  delay = 0,
}: {
  title: string;
  enrolled: number;
  rating: number;
  delay?: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <Card 
        className="border-0 bg-white shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 overflow-hidden group relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Animated Top Border with Flowing Effect */}
        <div className={`h-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 group-hover:from-blue-600 group-hover:via-cyan-600 group-hover:to-emerald-600 transition-all duration-300 ${isHovered ? "h-3" : "h-2"}`}
          style={{
            backgroundSize: "200% 100%",
            animation: isHovered ? "shimmer 2s ease-in-out infinite" : "none",
          }}
        />
        
        {/* Background Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-cyan-50/0 to-emerald-50/0 group-hover:from-blue-50/40 group-hover:via-cyan-50/30 group-hover:to-emerald-50/40 transition-all duration-300 pointer-events-none" />
        
        <CardContent className="p-6 relative">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2 transition-colors duration-300 group-hover:text-slate-950">{title}</h3>
              <div className="flex items-center gap-4">
                {/* Animated Enrollment Badge */}
                <div className="flex items-center gap-1 transition-all duration-300 group-hover:translate-x-1 px-2 py-1 rounded-full bg-blue-50 group-hover:bg-blue-100">
                  <span className="text-sm font-bold text-slate-800 transition-colors duration-300 group-hover:text-blue-700">{enrolled}</span>
                  <span className="text-xs text-slate-600 transition-colors duration-300 group-hover:text-blue-600">students</span>
                </div>
                
                {/* Staggered Star Rating Animation */}
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: rating }).map((_, i) => (
                    <div
                      key={i}
                      className="transition-all duration-300"
                      style={{
                        transitionDelay: `${i * 50}ms`,
                        transform: isHovered ? `scale(1.3) rotate(${15 + i * 5}deg)` : "scale(1) rotate(0deg)",
                      }}
                    >
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 drop-shadow-sm" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Animated Action Button with Enhanced Interaction */}
            <div className="pl-4">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-50 text-blue-600 group-hover:from-blue-200 group-hover:to-blue-100 transition-all duration-300 ${isHovered ? "scale-125" : "scale-100"} shadow-sm group-hover:shadow-md`}>
                <ArrowRight className={`h-5 w-5 transition-all duration-300 ${isHovered ? "translate-x-1 rotate-45" : "translate-x-0 rotate-0"}`} />
              </div>
            </div>
          </div>

          {/* Progress Bar Indicator */}
          <div className="mt-4 pt-3 border-t border-slate-100 group-hover:border-slate-200 transition-colors duration-300">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-slate-500 group-hover:text-slate-600">Progress</span>
              <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900">45%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 group-hover:bg-slate-300 transition-colors duration-300 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 transition-all duration-500" style={{ width: "45%" }} />
            </div>
          </div>
        </CardContent>
      </Card>
      <style>{`
        @keyframes shimmer {
          0%, 100% { backgroundPosition: 200% center; }
          50% { backgroundPosition: -200% center; }
        }
      `}</style>
    </div>
  );
};
