"use client";

import Image from "next/image";
import Link from "next/link";

import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { siteConfig } from "@/config/site";

const stats = [
  { label: "Active learners", value: "42k" },
  { label: "Tutors & mentors", value: "1.2k" },
  { label: "Jobs & volunteer roles", value: "3.8k" },
];

const modules = [
  {
    title: "Learning Management",
    description:
      "Structured programs, blended lessons, and tutor-led cohorts with progress insights.",
  },
  {
    title: "AI Resume Studio",
    description:
      "ATS-ready resumes, keyword boosts, and video intros generated in minutes.",
  },
  {
    title: "Jobs & Volunteer",
    description:
      "Curated opportunity feeds, filters, and application tracking dashboards.",
  },
  {
    title: "Community & Messaging",
    description:
      "Live lesson forums, direct messaging, badges, and instant notifications.",
  },
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

const resumeFlow = [
  {
    title: "Personal narrative",
    detail: "Capture goals, industries, and location preferences with smart defaults.",
  },
  {
    title: "AI refinement",
    detail: "OpenAI-powered prompts rewrite summaries, quantify impact, and surface ATS keywords.",
  },
  {
    title: "Portfolio & media",
    detail: "Upload video intros, S3-hosted portfolios, and auto-generated public slug pages.",
  },
  {
    title: "Publish & share",
    detail: "Secure, branded URLs with PDF download, contact cards, and analytics.",
  },
];

const testimonials = [
  {
    quote:
      "We replaced 4 different tools with Finbers Link—students now see their course progress, resume drafts, and job offers in one hub.",
    author: "Amina Yusuf",
    role: "Program Director, Elevate Africa",
  },
  {
    quote:
      "The AI resume studio helped our apprentices land interviews twice as fast, while tutors coach directly inside lesson forums.",
    author: "Miguel Hernández",
    role: "Lead Tutor, FutureLaunch Labs",
  },
];

const footerLinks = {
  platform: [
    { label: "Courses", href: "/courses" },
    { label: "Jobs", href: "/jobs" },
    { label: "Volunteer", href: "/volunteer" },
    { label: "News", href: "/news" },
  ],
  company: [
    { label: "About", href: "/about" },
    { label: "Pricing", href: "/pricing" },
    { label: "Security", href: "/security" },
    { label: "Contact", href: "/contact" },
  ],
  resources: [
    { label: "Documentation", href: "/docs" },
    { label: "Implementation guide", href: "/implementation" },
    { label: "Brand assets", href: "/brand" },
    { label: "Status", href: "https://status.finbers-link.example.com" },
  ],
};

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-[hsl(215,60%,92%)]">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-16 px-4 py-12 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[32px] border border-white/70 bg-white px-6 py-12 shadow-2xl shadow-blue-100/70 sm:px-12">
          <div className="absolute inset-y-0 left-0 hidden h-full w-1/2 bg-[radial-gradient(circle_at_top,_rgba(25,118,210,0.18),_transparent_60%)] lg:block" />
          <div className="relative grid gap-10 text-center sm:text-left lg:grid-cols-[3fr_2fr]">
            <div className="space-y-6">
              <Badge variant="outline" className="border-primary/40 text-primary">
                Skill-to-Employment Digital Ecosystem
              </Badge>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
                Build skills, resumes, and hiring outcomes the modern way.
              </h1>
              <p className="text-lg text-slate-600 sm:text-xl">
                Finbers Link unifies a full LMS, AI resume builder, job & volunteer marketplace, and community messaging in one professional workspace for students, tutors, admins, and employers.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button size="lg" className="text-base">
                  Explore the platform
                </Button>
                <Button asChild variant="outline" size="lg" className="text-base">
                  <Link href="/demo">Book a live demo</Link>
                </Button>
              </div>
              <dl className="grid gap-6 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4">
                    <dt className="text-sm text-slate-500">{stat.label}</dt>
                    <dd className="text-3xl font-semibold text-slate-900">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="rounded-3xl border border-blue-100/80 bg-gradient-to-br from-blue-100 via-white to-amber-50 p-6 shadow-xl">
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Resume completion</span>
                <span>82%</span>
              </div>
              <Progress value={82} className="mt-3" />
              <div className="mt-8 space-y-5 rounded-2xl bg-white/80 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-slate-500">Active course modules</p>
                  <span className="text-sm font-semibold text-slate-900">6 / 8</span>
                </div>
                <div className="space-y-3">
                  {["Product Thinking", "AI Resume Studio", "Career Coaching"].map((item) => (
                    <div key={item} className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                      <span className="text-sm font-semibold text-slate-700">{item}</span>
                      <span className="text-xs text-slate-500">live</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl border border-amber-200/80 bg-amber-50/90 p-4">
                  <p className="text-sm font-medium text-amber-700">Badge unlocked</p>
                  <p className="text-xs text-amber-700/80">Career Catalyst · +120 XP</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Modules</p>
            <h2 className="text-3xl font-semibold text-slate-900">One connected platform, seven career pillars.</h2>
            <p className="text-lg text-slate-600">
              From onboarding to employment, Finbers Link keeps learners, tutors, admins, and employers aligned with real-time data, RBAC, and secure infrastructure.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {modules.map((module) => (
                <Card key={module.title} className="border border-slate-200/80 bg-white/90 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-slate-900">
                      {module.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-500">{module.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <Card className="border border-slate-200/80 bg-white/95 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-slate-900">
                Student & admin experience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 text-sm text-slate-600">
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                <span>Guided onboarding journeys</span>
                <Badge variant="secondary" className="text-xs text-slate-600">
                  Auto
                </Badge>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                <span>Role-based dashboards</span>
                <Badge variant="outline" className="text-xs text-slate-600">
                  RBAC
                </Badge>
              </div>
              <div className="rounded-2xl border border-blue-100/90 bg-blue-50/80 p-4">
                <p className="text-sm font-semibold text-blue-900">AI resume summary snapshot</p>
                <p className="text-xs text-blue-800/80">
                  &ldquo;Your profile is trending in Product &amp; Impact roles across 4 regions. Boost hiring signals with volunteer leadership stories.&rdquo;
                </p>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Notifications</p>
                  <p className="text-xs text-slate-500">Tutor replies · Offer updates · Certificates</p>
                </div>
                <div className="text-right text-2xl font-semibold text-slate-900">12</div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-10 rounded-3xl border border-slate-200/80 bg-white/95 px-6 py-10 shadow-xl sm:px-12 lg:grid-cols-[1.1fr_1fr]">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Global community</p>
            <h2 className="text-3xl font-semibold text-slate-900">Learners, tutors, and employers spanning every region.</h2>
            <p className="text-lg text-slate-600">
              Finbers Link celebrates diverse pathways. Cohorts mix live sessions, async projects, and community forums so everyone sees themselves represented in the journey from skill to employment.
            </p>
            <ul className="space-y-3 text-sm text-slate-600">
              {[
                "Regional cohorts with localized tutors and mentors",
                "Time-zone aware scheduling plus multilingual announcements",
                "Employer showcases highlighting inclusive hiring partners",
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
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

        <section className="grid gap-8 rounded-3xl border border-slate-200/80 bg-white/95 px-6 py-10 shadow-xl sm:px-12 lg:grid-cols-2">
          <div className="space-y-6">
            <Badge variant="secondary" className="border-0 bg-secondary text-primary">
              AI Resume Builder
            </Badge>
            <h2 className="text-3xl font-semibold text-slate-900">From first draft to recruiter-ready in six guided steps.</h2>
            <p className="text-lg text-slate-600">
              The wizard blends human storytelling with AI copywriting, video intros, and employer-specific keyword prompts. Tutors can review drafts and push updates instantly.
            </p>
            <div className="space-y-4">
              {resumeFlow.map((step, idx) => (
                <div key={step.title} className="flex gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-base font-semibold text-primary">
                    {idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                    <p className="text-sm text-slate-500">{step.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl border border-slate-100 bg-gradient-to-br from-blue-600/10 via-white to-amber-100 p-8">
            <p className="text-sm uppercase tracking-[0.4em] text-primary">Live preview</p>
            <div className="mt-6 space-y-4 rounded-2xl border border-white/70 bg-white/90 p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <p className="text-lg font-semibold text-slate-900">Adaeze A.</p>
                  <p className="text-sm text-slate-500">Product Strategist · Lagos</p>
                </div>
                <Badge className="bg-amber-500 text-white">Ready</Badge>
              </div>
              <p className="text-sm text-slate-600">
                &ldquo;Product leader combining impact storytelling and data-informed experimentation across nonprofit and fintech ecosystems.&rdquo;
              </p>
              <div className="space-y-3 rounded-2xl bg-slate-50/70 p-4">
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Keywords</span>
                  <span>8 suggested</span>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  {["Impact", "Product Ops", "Human-centered", "Fintech", "Volunteer"].map((pill) => (
                    <span key={pill} className="rounded-full bg-white px-3 py-1 text-primary shadow">
                      {pill}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-slate-500">
                <span>Public resume link</span>
                <code className="rounded-full bg-slate-900 px-3 py-1 text-xs text-white">finbers.link/adaeze-impact</code>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200/80 bg-white/95 px-6 py-10 shadow-xl sm:px-12">
          <div className="grid gap-10 lg:grid-cols-2">
            {testimonials.map((item) => (
              <Card key={item.author} className="border border-slate-100 bg-slate-50/70">
                <CardHeader>
                  <CardTitle className="text-base font-semibold text-slate-900">
                    {item.author}
                  </CardTitle>
                  <p className="text-xs uppercase tracking-[0.2em] text-primary">{item.role}</p>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600">&ldquo;{item.quote}&rdquo;</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200/80 bg-white/95 px-6 py-10 shadow-xl sm:px-12">
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Launch-ready</p>
              <h2 className="text-3xl font-semibold text-slate-900">Secure, scalable, production-ready.</h2>
              <p className="text-lg text-slate-600">
                JWT auth, Prisma + PostgreSQL, AWS-ready storage, Socket.io realtime, and OpenAI integrations keep every experience performant and trusted.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  "RBAC & JWT security",
                  "Prisma + PostgreSQL",
                  "AWS S3 media",
                  "Socket.io realtime",
                ].map((item) => (
                  <div key={item} className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-700">
                    {item}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-6 rounded-2xl bg-gradient-to-br from-blue-600 via-blue-500 to-amber-400 p-8 text-white">
              <p className="text-sm uppercase tracking-[0.4em] text-white/80">next steps</p>
              <h3 className="text-2xl font-semibold">Deploy Finbers Link for your organization.</h3>
              <p className="text-base text-white/80">
                We deliver migrations, custom branding, and administrator enablement.
              </p>
              <div className="flex flex-col gap-3">
                <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
                  <p className="text-sm font-semibold">Admins</p>
                  <p className="text-xs text-white/80">Approve tutors · Publish news · Moderate forums</p>
                </div>
                <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
                  <p className="text-sm font-semibold">Employers</p>
                  <p className="text-xs text-white/80">Post jobs · Review resumes · Track pipelines</p>
                </div>
              </div>
              <Button size="lg" variant="secondary" className="bg-white text-blue-700 hover:bg-white/90">
                Talk to solutions team
              </Button>
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
