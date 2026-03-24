"use client";

import React, { useState, useEffect, useRef } from "react";
import { BookOpen, Trophy, Zap, ArrowRight, Star, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";

import { DashboardSectionsClient } from "@/app/dashboard/sections-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GradientText, RippleButton } from "@/components/shared/animated-components";

interface StudentDashboardProps {
  userId: string;
}

// Floating Particles Component
const FloatingParticles = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={i}
          className="absolute animate-pulse rounded-full bg-gradient-to-r from-blue-400/20 to-cyan-400/20 blur-xl"
          style={{
            width: `${Math.random() * 200 + 100}px`,
            height: `${Math.random() * 200 + 100}px`,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animation: `float ${Math.random() * 20 + 15}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 5}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -20px) scale(1.1); }
          50% { transform: translate(-10px, 50px) scale(0.95); }
          75% { transform: translate(-30px, -10px) scale(1.05); }
        }
      `}</style>
    </div>
  );
};

// Animated Corner Accent Component
const CornerAccent = ({ position }: { position: "top-left" | "top-right" | "bottom-left" | "bottom-right" }) => {
  const positions = {
    "top-left": "top-0 left-0",
    "top-right": "top-0 right-0",
    "bottom-left": "bottom-0 left-0",
    "bottom-right": "bottom-0 right-0",
  };

  return (
    <div className={`absolute ${positions[position]} w-32 h-32 pointer-events-none`}>
      <div className={`absolute inset-0 opacity-20 animate-pulse ${
        position.includes("top-left") || position.includes("bottom-right")
          ? "bg-gradient-to-br from-blue-500 to-transparent"
          : "bg-gradient-to-tl from-cyan-500 to-transparent"
      }`} />
    </div>
  );
};

// Skeleton Loader Component
const SkeletonLoader = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 rounded ${className}`} />
);

// Bounce Animation Icon
const BounceIcon = ({ Icon, className = "" }: { Icon: React.ComponentType<{ className?: string }>; className?: string }) => (
  <div className={`animate-bounce ${className}`} style={{ animationDelay: "0s" }}>
    <Icon className="h-7 w-7" />
  </div>
);

// Enhanced StatCard with Decorative Elements
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
      className={`transition-all duration-700 ease-out relative ${
        isVisible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Corner Accents */}
      <div className="absolute -top-2 -right-2 w-6 h-6 border-t-2 border-r-2 border-blue-300 rounded-tr-lg opacity-0 group-hover:opacity-100 transition-all duration-300" />
      <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b-2 border-l-2 border-blue-300 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-all duration-300" />

      <Card className={`border-0 ${bgGradient} shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1 active:scale-95 group cursor-pointer overflow-hidden relative`}>
        {/* Animated Background Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/0 group-hover:from-white/15 group-hover:via-white/5 group-hover:to-white/10 transition-all duration-300 pointer-events-none" />
        
        {/* Flowing Border Animation */}
        <div className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{
            background: `linear-gradient(90deg, transparent 0%, rgba(147, 197, 253, 0.3) 50%, transparent 100%)`,
            animation: "flow 2s ease-in-out infinite",
          }}
        >
          <style>{`
            @keyframes flow {
              0%, 100% { transform: translateX(-100%); }
              50% { transform: translateX(100%); }
            }
          `}</style>
        </div>

        <CardContent className="pt-8 pb-6 relative">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className={`rounded-2xl p-4 ${accent} shadow-lg transition-all duration-300 group-hover:scale-110 ${isHovered ? "rotate-12" : "rotate-0"}`}>
              <Icon className="h-7 w-7" />
            </div>
            <div>
              <p className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent transition-all duration-300">{value}</p>
              <p className="text-sm font-medium text-slate-600 transition-colors duration-300 group-hover:text-slate-800">{label}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Enhanced CourseCard with Advanced Animations
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

// Animated Premium Badge
const PremiumBadge = () => (
  <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-50 to-orange-50 px-4 py-2 border border-yellow-200 backdrop-blur-sm group hover:shadow-lg hover:border-yellow-300 transition-all duration-300">
    <Sparkles className="h-4 w-4 text-yellow-600 animate-pulse" />
    <span className="text-xs font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">Premium Features</span>
  </div>
);

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
      className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 text-white shadow-2xl transition-all duration-1000 group ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {/* Corner Accents */}
      <CornerAccent position="top-left" />
      <CornerAccent position="top-right" />
      <CornerAccent position="bottom-left" />
      <CornerAccent position="bottom-right" />

      {/* Dynamic Gradient Spotlight */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(600px at ${mousePos.x}px ${mousePos.y}px, rgba(59, 130, 246, 0.15), transparent 80%)`,
        }}
      />

      {/* Decorative Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -right-40 -top-40 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl animate-pulse" />
        <div className="absolute -left-40 -bottom-40 h-80 w-80 rounded-full bg-cyan-500/10 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute top-1/2 -left-20 h-60 w-60 rounded-full bg-emerald-500/5 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 grid gap-8 p-8 md:grid-cols-2 md:items-center md:p-12">
        <div className="space-y-4">
          <PremiumBadge />
          <h3 className="text-3xl font-bold leading-tight md:text-4xl transition-all duration-500">
            <GradientText className="block">Self-Paced Agile</GradientText>
            Virtual Certifications
          </h3>
          <p className="text-lg text-blue-100 transition-all duration-500">
            Earn industry-recognized credentials from expert-led sessions at your own pace.
          </p>
          <ul className="space-y-3 pt-2">
            {["Agile certification prep", "Industry recognized credentials", "Expert-led sessions"].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-blue-100 transition-all duration-300 hover:translate-x-3 group cursor-pointer">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400/40 to-cyan-400/20 transition-all duration-300 group-hover:scale-110 group-hover:from-cyan-400/60 group-hover:to-cyan-400/40">
                  <span className="text-sm font-bold text-cyan-300">✓</span>
                </div>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col items-start gap-4 md:items-end">
          <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-md border border-white/20 transition-all duration-300 hover:bg-white/20 hover:border-white/40 hover:scale-105 group cursor-pointer">
            <p className="text-sm font-semibold uppercase tracking-widest text-cyan-300 mb-2 transition-colors duration-300 group-hover:text-cyan-200">Get in Touch</p>
            <p className="text-2xl font-bold mb-1 group-hover:text-cyan-50 transition-colors duration-300">+234 803 655 5555</p>
            <p className="text-sm text-blue-200 group-hover:text-blue-100 transition-colors duration-300">CYBSECURITY@FINBERSGROUP.COM</p>
          </div>
          
          <RippleButton asChild className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all px-6 py-2 rounded-lg font-medium">
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
          <div className={`relative h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 via-cyan-500 to-emerald-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg transition-all duration-500 ${isVisible ? "scale-100 rotate-0" : "scale-75 -rotate-12"}`}
            style={{ animation: isVisible ? "float 3s ease-in-out infinite" : "none" }}
          >
            <style>{`
              @keyframes float {
                0%, 100% { transform: translateY(0px) rotateZ(0deg); }
                50% { transform: translateY(-10px) rotateZ(5deg); }
              }
            `}</style>
            F
          </div>
        </div>
        <div className="pb-2">
          <p className={`text-sm font-semibold uppercase tracking-widest text-slate-500 transition-all duration-700 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`} style={{ transitionDelay: "200ms" }}>Welcome back</p>
          <h1 className={`text-4xl font-bold transition-all duration-700 ${isVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"}`} style={{ transitionDelay: "300ms" }}>
            <GradientText className="text-4xl">Finbers</GradientText>
          </h1>
        </div>
      </div>
      <p className={`text-slate-600 transition-all duration-700 ${isVisible ? "opacity-100" : "opacity-0"}`} style={{ transitionDelay: "400ms" }}>Continue your learning journey and unlock new opportunities.</p>
    </div>
  );
};

export function StudentDashboard(_props: StudentDashboardProps) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="space-y-10 relative">
      {/* Floating Particles Background */}
      <FloatingParticles />

      {/* Animated Banner */}
      <AnimatedBanner />

      {/* Animated Greeting */}
      <AnimatedGreeting />

      {/* Animated Stats Cards with Decorative Elements */}
      <div className="grid gap-6 sm:grid-cols-3 relative z-10">
        <StatCard
          icon={BookOpen}
          label="Enrolled Courses"
          value={isLoading ? "Loading..." : "0"}
          accent="bg-blue-100 text-blue-600"
          bgGradient="bg-gradient-to-br from-blue-50 via-white to-blue-50"
          delay={0}
        />
        <StatCard
          icon={Zap}
          label="Active Courses"
          value={isLoading ? "Loading..." : "0"}
          accent="bg-amber-100 text-amber-600"
          bgGradient="bg-gradient-to-br from-amber-50 via-white to-amber-50"
          delay={100}
        />
        <StatCard
          icon={Trophy}
          label="Completed Courses"
          value={isLoading ? "Loading..." : "0"}
          accent="bg-emerald-100 text-emerald-600"
          bgGradient="bg-gradient-to-br from-emerald-50 via-white to-emerald-50"
          delay={200}
        />
      </div>

      {/* Sections Client for Dynamic Content */}
      <div className="relative z-10">
        <DashboardSectionsClient />
      </div>
    </div>
  );
}
