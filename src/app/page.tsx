import Image from "next/image";
import Link from "next/link";
import React from "react";

import { SiteHeader } from "../components/layout/site-header";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { siteConfig } from "../config/site";

export const metadata = {
  title: "Finbers Link | Career Intelligence Platform",
  description: siteConfig.description,
  openGraph: {
    title: "Finbers Link",
    description: siteConfig.description,
    url: siteConfig.baseUrl,
    siteName: "Finbers Link",
  },
};

const careerGpsSteps = [
  {
    title: "Step 1: Identify Where You Are",
    details: [
      "Electronic profile resume",
      "Skills inventory",
      "Verified LMS course completion",
      "Experience mapping"
    ]
  },
  {
    title: "Step 2: Identify Skill Gaps",
    details: [
      "AI-powered skills gap identifier",
      "Industry comparison against real job listings",
      "Labor market trend analysis",
      "High-demand occupation alerts"
    ]
  },
  {
    title: "Step 3: Get a Smart Route",
    details: [
      "Course recommendations",
      "Resume enhancement suggestions",
      "Certifications to pursue",
      "Skills to add",
      "Real-time market alignment"
    ]
  },
  {
    title: "Step 4: See Where You Qualify",
    details: [
      "Jobs matched to verified skills",
      "Predicted hiring probability score",
      "Employer-specific resume versions",
      "Direct job applications"
    ]
  }
];

const platformFeatures = [
  "Integrated LMS Site",
  "Community Feed (Post & Chat)",
  "Blogs & Career Intelligence News",
  "Smart Job Board",
  "Electronic Profile Resume",
  "AI Skills Gap Identifier",
  "Real-Time Labor Market Intelligence",
  "Hiring Probability Score",
  "AI Mock Interview Simulator"
];

const targetAudiences = [
  "Students",
  "Career Switchers",
  "Workforce Programs", 
  "Governments",
  "Employers",
  "Training Institutions",
  "Global Professionals"
];

const communityImages = [
  {
    name: "Kwame, Product Innovator",
    location: "Accra, Ghana",
    src: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Isabella, AI Tutor",
    location: "São Paulo, Brazil",
    src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Lena, Career Coach",
    location: "Berlin, Germany",
    src: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80",
  },
  {
    name: "Omar, Volunteer Lead",
    location: "Dubai, UAE",
    src: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
  },
];

const footerLinks = {
  platform: [
    { label: "Courses", href: "/courses" },
    { label: "Jobs", href: "/jobs" },
    { label: "Volunteer opportunities", href: "/volunteer" },
    { label: "Career insights", href: "/news" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Pricing", href: "/pricing" },
    { label: "Security", href: "/security" },
    { label: "Contact", href: "/contact" },
  ],
  resources: [
    { label: "Guides", href: "/docs" },
    { label: "Implementation support", href: "/implementation" },
    { label: "Platform resources", href: "/brand" },
    { label: "Status", href: "https://status.finbers-link.example.com" },
  ],
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900/80 to-slate-50">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-12 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[32px] border border-white/20 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900/80 px-6 py-12 shadow-[0_30px_80px_rgba(15,23,42,0.65)] text-white sm:px-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.35),_transparent_55%)]" />
          <div className="absolute inset-y-8 right-4 hidden h-72 w-72 rounded-full bg-gradient-to-br from-cyan-500/30 via-blue-500/10 to-transparent blur-3xl lg:block" />
          <div className="absolute inset-y-12 left-0 h-64 w-64 rounded-full bg-gradient-to-br from-amber-400/30 via-slate-900 to-transparent blur-3xl lg:hidden" />
          <div className="relative grid gap-10 text-center sm:text-left lg:grid-cols-[3fr_2fr]">
            <div className="space-y-6">
              <Badge variant="outline" className="border-primary/40 text-primary">
                FINBERS LINK
              </Badge>
              <p className="text-sm uppercase tracking-[0.4em] text-primary/80">The Career Intelligence Platform</p>
              <h1 className="text-4xl font-serif italic tracking-tight sm:text-5xl lg:text-6xl">
                Welcome to the Future of Career Navigation
              </h1>
              <div className="relative rounded-2xl overflow-hidden mt-8">
                <Image
                  src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80"
                  alt="Diverse professionals in career development"
                  fill
                  sizes="(max-width: 640px) 100vw, 600px"
                  className="object-cover"
                />
              </div>
            </div>
            <div className="relative rounded-3xl border border-white/30 bg-gradient-to-br from-blue-500/30 via-slate-900 to-slate-950 p-6 shadow-2xl">
              <div className="flex items-center justify-between text-sm text-slate-200">
                <span>Career Intelligence Score</span>
                <span className="text-white/80">92%</span>
              </div>
              <Progress value={92} className="mt-3 h-3 border border-white/30" />
              <div className="mt-8 space-y-5 rounded-2xl bg-white/10 p-5 shadow-inner">
                <div className="flex items-center justify-between">
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-300">Career Path Progress</p>
                  <span className="text-sm font-semibold text-white">4 / 4</span>
                </div>
                <div className="space-y-3">
                  {["Profile Complete", "Skills Identified", "Learning Path", "Job Ready"].map((item) => (
                    <div key={item} className="flex items-center justify-between rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white/90">
                      <span className="font-semibold">{item}</span>
                      <span className="text-xs uppercase tracking-[0.2em] text-green-300">complete</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 px-6 py-16 shadow-xl sm:px-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_80%,_rgba(59,130,246,0.1),_transparent_50%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,_rgba(168,85,247,0.1),_transparent_50%)]" />
          
          <div className="relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-800 to-purple-800 bg-clip-text text-transparent sm:text-5xl">
                Welcome to the future of Career Development
              </h2>
            </div>
            
            <div className="grid gap-8 lg:grid-cols-[1fr_2fr] items-center">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                    <div className="relative bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
                      <div className="text-3xl mb-2">💼</div>
                      <p className="text-sm font-medium text-slate-700">Traditional Job Board</p>
                    </div>
                  </div>
                  
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                    <div className="relative bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
                      <div className="text-3xl mb-2">📚</div>
                      <p className="text-sm font-medium text-slate-700">Standard LMS</p>
                    </div>
                  </div>
                  
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                    <div className="relative bg-white/80 backdrop-blur-sm border border-white/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
                      <div className="text-3xl mb-2">📄</div>
                      <p className="text-sm font-medium text-slate-700">Resume Builder</p>
                    </div>
                  </div>
                  
                  <div className="group relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all" />
                    <div className="relative bg-gradient-to-br from-blue-600/10 to-purple-600/10 backdrop-blur-sm border border-purple-200/50 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
                      <div className="text-3xl mb-2">🚀</div>
                      <p className="text-sm font-medium text-slate-700">Career Intelligence</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-4 text-center lg:text-left">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100/80 backdrop-blur-sm border border-slate-200/50">
                    <span className="text-slate-500 text-sm">Finbers Link is not just a job board.</span>
                  </div>
                  
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50/80 backdrop-blur-sm border border-blue-200/50">
                    <span className="text-blue-700 text-sm font-medium">It&apos;s not just an LMS.</span>
                  </div>
                  
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50/80 backdrop-blur-sm border border-purple-200/50">
                    <span className="text-purple-700 text-sm font-medium">It&apos;s not just a resume builder.</span>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-3xl blur-2xl" />
                  <div className="relative bg-gradient-to-r from-blue-600/10 to-purple-600/10 backdrop-blur-sm border border-white/50 rounded-3xl p-8 shadow-2xl">
                    <p className="text-xl font-bold text-center lg:text-left bg-gradient-to-r from-blue-800 to-purple-800 bg-clip-text text-transparent">
                      It&apos;s a Career Intelligence Ecosystem designed to guide individuals from
                    </p>
                    
                    <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-2">
                      {[
                        { label: "confusion", color: "from-red-500 to-orange-500" },
                        { label: "clarity", color: "from-amber-500 to-yellow-500" },
                        { label: "qualification", color: "from-green-500 to-emerald-500" },
                        { label: "confidence", color: "from-blue-500 to-cyan-500" },
                        { label: "employment", color: "from-purple-500 to-pink-500" }
                      ].map((item, idx) => (
                        <React.Fragment key={item.label}>
                          <div className={`relative group`}>
                            <div className={`absolute inset-0 bg-gradient-to-r ${item.color} rounded-full blur-lg opacity-50 group-hover:opacity-70 transition-opacity`} />
                            <span className={`relative px-4 py-2 rounded-full bg-gradient-to-r ${item.color} text-white text-sm font-semibold shadow-lg`}>
                              {item.label}
                            </span>
                          </div>
                          {idx < 4 && (
                            <span className="text-2xl text-slate-400 animate-pulse">➝</span>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-8">
          <div className="text-center space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white">What Makes Finbers Link Different?</p>
            <h2 className="text-3xl font-semibold text-white">Your Career GPS</h2>
            <p className="text-lg text-white/80">
              A systematic approach to career navigation that shows you exactly where you are and where you need to go.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {careerGpsSteps.map((step, idx) => (
              <Card key={step.title} className="border border-slate-200/80 bg-white/95 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="relative">
                  <div className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white text-sm font-bold">
                    {idx + 1}
                  </div>
                  <CardTitle className="text-lg font-semibold text-slate-900 pr-12">
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {step.details.map((detail) => (
                      <div key={detail} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0 mt-2" />
                        <span className="text-sm text-slate-600">{detail}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-8">
          <div className="text-center space-y-4">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Platform Features</p>
            <h2 className="text-3xl font-semibold text-slate-900">Comprehensive Career Intelligence Tools</h2>
            <p className="text-lg text-slate-600">
              Everything you need to navigate your career journey in one integrated platform.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {platformFeatures.map((feature, idx) => {
              const icons = [
                "📚", // Integrated LMS Site
                "💬", // Community Feed
                "📰", // Blogs & Career Intelligence News
                "💼", // Smart Job Board
                "📄", // Electronic Profile Resume
                "🔍", // AI Skills Gap Identifier
                "📊", // Real-Time Labor Market Intelligence
                "📈", // Hiring Probability Score
                "🎯", // AI Mock Interview Simulator
              ];
              const categories = [
                "bg-blue-50 border-blue-200 hover:bg-blue-100",
                "bg-green-50 border-green-200 hover:bg-green-100", 
                "bg-purple-50 border-purple-200 hover:bg-purple-100",
                "bg-amber-50 border-amber-200 hover:bg-amber-100",
                "bg-rose-50 border-rose-200 hover:bg-rose-100",
                "bg-cyan-50 border-cyan-200 hover:bg-cyan-100",
                "bg-indigo-50 border-indigo-200 hover:bg-indigo-100",
                "bg-emerald-50 border-emerald-200 hover:bg-emerald-100",
                "bg-orange-50 border-orange-200 hover:bg-orange-100",
              ];
              
              return (
                <div 
                  key={feature} 
                  className={`rounded-xl border p-4 text-center transition-all hover:shadow-md hover:-translate-y-0.5 ${categories[idx]}`}
                >
                  <div className="text-2xl mb-2">{icons[idx]}</div>
                  <p className="text-sm font-semibold text-slate-800">{feature}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid gap-10 rounded-3xl border border-slate-200/80 bg-white/95 px-6 py-10 shadow-xl sm:px-12 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Who Is Finbers Link For?</p>
            <h2 className="text-3xl font-semibold text-slate-900">Designed for diverse career journeys.</h2>
            <p className="text-lg text-slate-600">
              Whether you're starting your career, switching paths, or managing talent programs, Finbers Link provides the intelligence you need to succeed.
            </p>
            <div className="space-y-3">
              {targetAudiences.map((audience) => (
                <div key={audience} className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-sm font-semibold text-slate-700">{audience}</span>
                </div>
              ))}
            </div>
            <p className="text-lg font-semibold text-primary">This is global career navigation.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {communityImages.map((person) => (
              <div key={person.name} className="relative overflow-hidden rounded-3xl border border-white/60 bg-slate-900/80 shadow-xl">
                <div className="relative h-64 w-full">
                  <Image
                    src={person.src}
                    alt={person.name}
                    fill
                    sizes="(max-width: 640px) 50vw, 280px"
                    loading="lazy"
                    className="object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/90 to-transparent p-4 text-white">
                    <p className="text-sm font-semibold">{person.name}</p>
                    <p className="text-xs text-white/80">{person.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200/80 bg-white/95 px-6 py-10 shadow-xl sm:px-12">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Why It Matters</p>
              <h2 className="text-3xl font-semibold text-slate-900">Stop guessing. Start moving with clear career direction.</h2>
              <p className="text-lg text-slate-600">
                Too many people take random courses, apply blindly, rewrite resumes endlessly, and miss opportunities they&apos;re almost qualified for. Finbers Link eliminates the guesswork.
              </p>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-slate-900">Finbers Link tells you:</p>
                  <div className="space-y-1">
                    {["What to fix", "What to learn", "Where to apply", "When you&apos;re ready"].map((item) => (
                      <div key={item} className="flex items-center gap-3">
                        <span className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-sm font-semibold text-slate-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-amber-400 p-8 text-white">
              <p className="text-sm uppercase tracking-[0.4em] text-white/80">Built with Integrity & Innovation</p>
              <h3 className="text-2xl font-semibold">Career Intelligence Model™</h3>
              <p className="text-base text-white/80">
                Structured as a proprietary Career Intelligence Model™, Finbers Link integrates learning, qualification, and employment readiness into one seamless ecosystem.
              </p>
            </div>
          </div>
        </section>
      </main>
      <footer className="mt-16 border-t border-slate-200/60 bg-slate-900 text-white">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4 sm:px-6 lg:px-8">
          <div className="space-y-4">
            <Image src="/finbers-logo.png" alt="Finbers Link" width={160} height={48} className="h-10 w-auto" />
            <p className="text-sm text-white/70">
              {siteConfig.description}
            </p>
            <p className="text-xs text-white/50">© {new Date().getFullYear()} Finbers Link. All rights reserved.</p>
          </div>
          <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
              Platform
            </p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              {footerLinks.platform.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
              Company
            </p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
              Resources
            </p>
            <ul className="mt-4 space-y-2 text-sm text-white/70">
              {footerLinks.resources.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
