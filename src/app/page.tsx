import Image from "next/image";
import Link from "next/link";

import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Finbers Link | Skill-to-Employment OS",
  description: siteConfig.description,
  openGraph: {
    title: "Finbers Link",
    description: siteConfig.description,
    url: siteConfig.baseUrl,
    siteName: "Finbers Link",
  },
};

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
                Skill-to-Employment Digital Ecosystem
              </Badge>
              <p className="text-sm uppercase tracking-[0.4em] text-primary/80">Integrated</p>
              <h1 className="text-4xl font-serif italic tracking-tight sm:text-5xl lg:text-6xl">
                Build skills, resumes, and hiring outcomes with cinematic precision.
              </h1>
              <p className="text-lg text-slate-200 sm:text-xl">
                Finbers Link unifies a full LMS, AI resume builder, jobs marketplace, and community workspace for every role in the skilling journey.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Button
                  asChild
                  size="lg"
                  className="text-base bg-white text-slate-900 shadow-[0_15px_45px_rgba(56,189,248,0.45)] transition hover:-translate-y-0.5"
                >
                  <Link href="/dashboard">Launch platform</Link>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  size="lg"
                  className="text-base border-slate-200/60 text-white/90 hover:border-primary/70"
                >
                  <Link href="/courses">Browse courses</Link>
                </Button>
              </div>
              <div className="grid gap-6 sm:grid-cols-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-white/40 bg-white/5 p-4 backdrop-blur">
                    <dt className="text-xs uppercase tracking-[0.3em] text-slate-300">{stat.label}</dt>
                    <dd className="text-3xl font-semibold text-white">{stat.value}</dd>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative rounded-3xl border border-white/30 bg-gradient-to-br from-blue-500/30 via-slate-900 to-slate-950 p-6 shadow-2xl">
              <div className="flex items-center justify-between text-sm text-slate-200">
                <span>Resume completion</span>
                <span className="text-white/80">82%</span>
              </div>
              <Progress value={82} className="mt-3 h-3 border border-white/30" />
              <div className="mt-8 space-y-5 rounded-2xl bg-white/10 p-5 shadow-inner">
                <div className="flex items-center justify-between">
                  <p className="text-sm uppercase tracking-[0.3em] text-slate-300">Active modules</p>
                  <span className="text-sm font-semibold text-white">6 / 8</span>
                </div>
                <div className="space-y-3">
                  {["Product Thinking", "AI Resume Studio", "Career Coaching"].map((item) => (
                    <div key={item} className="flex items-center justify-between rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white/90">
                      <span className="font-semibold">{item}</span>
                      <span className="text-xs uppercase tracking-[0.3em] text-amber-300">live</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-slate-800/40 bg-gradient-to-r from-slate-950 via-slate-900/50 to-slate-900/70 px-6 py-4 text-white shadow-[0_20px_50px_rgba(15,23,42,0.6)]">
          <div className="flex flex-wrap items-center justify-between gap-4 text-sm uppercase tracking-[0.3em] text-slate-300">
            <span>Fueling modern cohorts</span>
            <div className="flex items-center gap-6 text-base font-semibold text-white">
              <span>Neutralize siloed stacks</span>
              <span className="h-2 w-2 rounded-full bg-primary" />
              <span>Live syllabus + AI prompts</span>
            </div>
          </div>
        </section>

        <section className="grid gap-4 rounded-3xl border border-slate-200/80 bg-white/95 px-6 py-6 shadow-sm sm:grid-cols-3 sm:px-8">
          {[
            { label: "See active courses", href: "/courses" },
            { label: "Browse roles", href: "/jobs" },
            { label: "Launch resume studio", href: "/resume/builder" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-primary/40 hover:bg-white"
            >
              <span>{item.label}</span>
              <span className="text-xs uppercase tracking-[0.2em] text-primary">Go</span>
            </Link>
          ))}
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white">Modules</p>
            <h2 className="text-3xl font-semibold text-white">One connected platform, seven career pillars.</h2>
            <p className="text-lg text-white">
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
