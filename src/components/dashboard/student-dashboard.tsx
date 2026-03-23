"use client";

import React, { useState, useEffect, useRef } from "react";
import { BookOpen, Trophy, Zap, ArrowRight, Star, Sparkles } from "lucide-react";
import Link from "next/link";

import { DashboardSectionsClient } from "@/app/dashboard/sections-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface StudentDashboardProps {
  userId: string;
}

// Skeleton Loader Component
const SkeletonLoader = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded ${className}`} />
);

// Ripple Button Component with Click Animation
const RippleButton = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }
>(({ children, className = "", ...props }, ref) => {
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

  return (
    <button
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
    </button>
  );
});
RippleButton.displayName = "RippleButton";

// Enhanced StatCard with Scroll Animation
const StatCard = ({
  icon: Icon,
  label,
  value,
  accent,
  bgGradient,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  accent: string;
  bgGradient: string;
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Card className={`border-0 ${bgGradient} shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 active:scale-95 group cursor-pointer overflow-hidden`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/0 group-hover:from-white/10 group-hover:to-white/5 transition-all duration-300" />
        <CardContent className="pt-8 pb-6 relative">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className={`rounded-2xl p-4 ${accent} shadow-lg transition-all duration-300 group-hover:scale-110 ${isHovered ? "-rotate-6" : "rotate-0"}`}>
              <Icon className="h-7 w-7" />
            </div>
            <div>
              <p className="text-4xl font-bold text-slate-900 transition-all duration-300">{value}</p>
              <p className="text-sm font-medium text-slate-600 transition-colors duration-300 group-hover:text-slate-700">{label}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Enhanced CourseCard with Rich Animations and Interactions
const CourseCard = ({
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
        className="border-0 bg-white shadow-md hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 overflow-hidden group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Animated Top Border */}
        <div className={`h-2 bg-gradient-to-r from-blue-500 via-cyan-500 to-emerald-500 group-hover:from-blue-600 group-hover:via-cyan-600 group-hover:to-emerald-600 transition-all duration-300 ${isHovered ? "h-3" : "h-2"}`} />
        
        {/* Animated Background Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/0 via-cyan-50/0 to-emerald-50/0 group-hover:from-blue-50/30 group-hover:via-cyan-50/20 group-hover:to-emerald-50/30 transition-all duration-300 pointer-events-none" />
        
        <CardContent className="p-6 relative">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 mb-2 line-clamp-2 transition-colors duration-300">{title}</h3>
              <div className="flex items-center gap-4">
                {/* Animated Student Count */}
                <div className="flex items-center gap-1 transition-all duration-300 group-hover:translate-x-1">
                  <span className="text-sm font-medium text-slate-600 transition-colors duration-300 group-hover:text-slate-900">{enrolled}</span>
                  <span className="text-xs text-slate-500 transition-colors duration-300 group-hover:text-slate-600">students</span>
                </div>
                
                {/* Star Ratings with Stagger Animation */}
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: rating }).map((_, i) => (
                    <div
                      key={i}
                      className="transition-all duration-300"
                      style={{
                        transitionDelay: `${i * 50}ms`,
                        transform: isHovered ? "scale(1.2) rotate(15deg)" : "scale(1) rotate(0deg)",
                      }}
                    >
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Animated Action Button */}
            <div className="pl-4">
              <div className={`inline-flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 group-hover:bg-blue-200 transition-all duration-300 ${isHovered ? "scale-110" : "scale-100"}`}>
                <ArrowRight className={`h-5 w-5 transition-transform duration-300 ${isHovered ? "translate-x-0.5" : "translate-x-0"}`} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Animated Banner Component
const AnimatedBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white shadow-2xl transition-all duration-1000 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {/* Dynamic Gradient Spotlight Effect */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(600px at ${mousePos.x}px ${mousePos.y}px, rgba(59, 130, 246, 0.15), transparent 80%)`,
        }}
      />

      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl animate-pulse" />
        <div className="absolute -left-40 -bottom-40 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="relative z-10 grid gap-8 p-8 md:grid-cols-2 md:items-center md:p-12">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur-sm transition-all duration-300 hover:bg-white/20 hover:scale-105 cursor-pointer group">
            <div className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-widest text-cyan-300 group-hover:text-cyan-200">Featured Opportunity</span>
          </div>
          <h3 className="text-3xl font-bold leading-tight md:text-4xl transition-all duration-500">
            Self-Paced Agile Virtual Certifications
          </h3>
          <p className="text-lg text-blue-100 transition-all duration-500">
            Earn industry-recognized credentials from expert-led sessions at your own pace.
          </p>
          <ul className="space-y-3 pt-2">
            <li className="flex items-center gap-3 text-blue-100 transition-all duration-300 hover:translate-x-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-400/20 transition-transform duration-300">
                <span className="text-sm font-bold text-cyan-300">✓</span>
              </div>
              Agile certification prep
            </li>
            <li className="flex items-center gap-3 text-blue-100 transition-all duration-300 hover:translate-x-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-400/20 transition-transform duration-300">
                <span className="text-sm font-bold text-cyan-300">✓</span>
              </div>
              Industry recognized credentials
            </li>
            <li className="flex items-center gap-3 text-blue-100 transition-all duration-300 hover:translate-x-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-cyan-400/20 transition-transform duration-300">
                <span className="text-sm font-bold text-cyan-300">✓</span>
              </div>
              Expert-led sessions
            </li>
          </ul>
        </div>

        <div className="flex flex-col items-start gap-4 md:items-end">
          <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-md border border-white/20 transition-all duration-300 hover:bg-white/20 hover:border-white/40 hover:scale-105 group cursor-pointer">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-300 mb-2 transition-colors duration-300 group-hover:text-cyan-200">Get in Touch</p>
            <p className="text-2xl font-bold mb-1 group-hover:text-cyan-50 transition-colors duration-300">+234 803 655 5555</p>
            <p className="text-sm text-blue-200 group-hover:text-blue-100 transition-colors duration-300">CYBSECURITY@FINBERSGROUP.COM</p>
          </div>
          
          <RippleButton asChild className="bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-2 rounded-lg font-medium">
            <Link href="/dashboard/courses" className="gap-2 flex items-center">
              Explore Certifications <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </RippleButton>
        </div>
      </div>
    </div>
  );
};

// Animated Greeting Section
const AnimatedGreeting = () => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`space-y-6 transition-all duration-1000 ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      <div className="flex items-end gap-6 group">
        <div className="relative">
          <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-blue-400 via-cyan-400 to-emerald-400 opacity-75 blur group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
          <div className={`relative h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 via-cyan-500 to-emerald-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg transition-all duration-500 ${isVisible ? "scale-100 rotate-0" : "scale-75 -rotate-12"}`}>
            F
          </div>
        </div>
        <div className="pb-2">
          <p className={`text-sm font-semibold uppercase tracking-widest text-slate-500 transition-all duration-700 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`} style={{ transitionDelay: "200ms" }}>Welcome back</p>
          <h1 className={`text-4xl font-bold text-slate-900 transition-all duration-700 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`} style={{ transitionDelay: "300ms" }}>Finbers</h1>
        </div>
      </div>
      <p className={`text-slate-600 transition-all duration-700 ${isVisible ? "opacity-100" : "opacity-0"}`} style={{ transitionDelay: "400ms" }}>Continue your learning journey and unlock new opportunities.</p>
    </div>
  );
};

export function StudentDashboard(_props: StudentDashboardProps) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Simulate initial load animation
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-10">
      {/* Animated Banner */}
      <AnimatedBanner />

      {/* Animated Greeting */}
      <AnimatedGreeting />

      {/* Animated Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        <StatCard
          icon={BookOpen}
          label="Enrolled Courses"
          value={isLoading ? <SkeletonLoader className="h-8 w-16" /> : "0"}
          accent="bg-blue-100 text-blue-600"
          bgGradient="bg-gradient-to-br from-blue-50 via-white to-blue-50"
          delay={0}
        />
        <StatCard
          icon={Zap}
          label="Active Courses"
          value={isLoading ? <SkeletonLoader className="h-8 w-16" /> : "0"}
          accent="bg-amber-100 text-amber-600"
          bgGradient="bg-gradient-to-br from-amber-50 via-white to-amber-50"
          delay={100}
        />
        <StatCard
          icon={Trophy}
          label="Completed Courses"
          value={isLoading ? <SkeletonLoader className="h-8 w-16" /> : "0"}
          accent="bg-emerald-100 text-emerald-600"
          bgGradient="bg-gradient-to-br from-emerald-50 via-white to-emerald-50"
          delay={200}
        />
      </div>

      {/* My Courses Section - Enhanced Grid Layout */}
      <div className="space-y-6">
        <div className="flex items-center justify-between group">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 transition-all duration-300">My Learning Path</h2>
            <p className="mt-1 text-sm text-slate-600">Continue where you left off or start something new</p>
          </div>
          <RippleButton asChild className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all px-6 py-2 rounded-lg font-medium">
            <Link href="/dashboard/courses" className="flex items-center">
              View All Courses <ArrowRight className="h-4 w-4" />
            </Link>
          </RippleButton>
        </div>

        {/* Course Cards Grid with Staggered Animation */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <CourseCard title="Infodemic Management" enrolled={0} rating={5} delay={0} />
          <CourseCard title="Process Improvement (Result driven course)" enrolled={23} rating={5} delay={100} />
          <CourseCard title="Soft Skill Course (In conjunction with HCPA) - Cynthia Eguozuwa" enrolled={147} rating={5} delay={200} />
          <CourseCard title="Test Course" enrolled={0} rating={5} delay={300} />
        </div>

        {/* Enhanced Empty State with Animation */}
        <div className="group rounded-2xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-blue-50 p-12 text-center transition-all duration-300 hover:border-blue-400 hover:shadow-lg cursor-pointer">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 transition-all duration-300 group-hover:scale-110 group-hover:bg-blue-200">
            <BookOpen className="h-8 w-8 text-blue-600 transition-transform duration-300 group-hover:rotate-12" />
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2 transition-colors duration-300">No courses yet?</h3>
          <p className="text-slate-600 mb-6 transition-colors duration-300 group-hover:text-slate-700">Discover our comprehensive catalog and start your learning journey today.</p>
          <RippleButton asChild className="gap-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-md hover:shadow-lg transition-all px-6 py-2 rounded-lg font-medium inline-flex items-center">
            <Link href="/dashboard/courses" className="flex items-center">
              Browse Course Catalog <ArrowRight className="h-4 w-4" />
            </Link>
          </RippleButton>
        </div>
      </div>

      {/* Sections Client for Dynamic Content */}
      <DashboardSectionsClient />
    </div>
  );
}
