import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Check, ArrowRight, Sparkles } from "lucide-react";

const plans = [
  {
    name: "Launch",
    headline: "Get started with core LMS, resume studio, and jobs.",
    price: "$49",
    cadence: "per cohort / month",
    description: "Ideal for small academies or pilot programs under 200 learners.",
    highlighted: false,
    features: [
      "Up to 200 active learners",
      "Courses, resume studio, and job board",
      "Tutor messaging + notifications",
      "Email support",
    ],
    cta: { label: "Start launch plan", href: "/register" },
  },
  {
    name: "Scale",
    headline: "Everything in Launch plus multi-tenant RBAC and analytics.",
    price: "$189",
    cadence: "per cohort / month",
    description: "Designed for national programs, workforce teams, and universities.",
    highlighted: true,
    features: [
      "Unlimited learners + cohorts",
      "Advanced analytics + exports",
      "Employer pipelines + volunteer hub",
      "24/5 priority support",
    ],
    cta: { label: "Book live demo", href: "/contact" },
  },
  {
    name: "Enterprise",
    headline: "Custom deployments, white-label portals, and compliance SLAs.",
    price: "Custom",
    cadence: "annual partnerships",
    description: "For governments, Fortune 500 academies, and large NGOs.",
    highlighted: false,
    features: [
      "Dedicated success architect",
      "Single sign-on + SCIM",
      "Private cloud or on-prem",
      "Guaranteed migration window",
    ],
    cta: { label: "Talk to solutions", href: "/contact" },
  },
];

const addOns = [
  {
    title: "Talent concierge",
    detail: "Finbers Link talent ops team sources employers, hosts showcases, and curates partner roles each quarter.",
    price: "$1,200 / quarter",
  },
  {
    title: "Custom AI prompts",
    detail: "Bespoke AI resume + job-match prompts tuned to your industries and competency models.",
    price: "$400 / prompt pack",
  },
  {
    title: "Migration sprint",
    detail: "Two-week white-glove migration from legacy LMS or spreadsheets, including data cleaning and tagging.",
    price: "$2,800 flat",
  },
];

const faqs = [
  {
    question: "Can we switch plans later?",
    answer: "Yes. Upgrade or downgrade anytime. We prorate the difference on your next invoice.",
  },
  {
    question: "Do you offer discounts for non-profits?",
    answer: "Mission-driven programs receive up to 25% off Scale. Enterprise pricing is bespoke based on learner count and compliance needs.",
  },
  {
    question: "What's included in onboarding?",
    answer: "We deliver admin training, template setup, and first-cohort configuration within 72 hours of contract signature.",
  },
];

export const metadata = {
  title: "Pricing | Finbers Link",
  description: "Simple plans for launching and scaling modern skill-to-employment programs.",
};

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950/80 text-white">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-14 px-4 py-16 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-white/20 bg-white/5 px-6 py-12 shadow-[0_30px_80px_rgba(15,23,42,0.65)] backdrop-blur sm:px-10">
          <Badge className="bg-white/10 text-white">Pricing</Badge>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            One platform. Transparent pricing.
          </h1>
          <p className="mt-4 max-w-3xl text-lg text-white/80">
            Launch modern learning, career, and employment journeys without juggling five different tools. Choose the plan that matches your learner volume and compliance requirements.
          </p>
          <div className="mt-6 flex flex-wrap gap-4 text-sm text-white/70">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-300" /> Custom onboarding included
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-300" /> Cancel anytime
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-300" /> 99.5% uptime SLA
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`h-full border border-white/15 bg-white/10 text-white ${plan.highlighted ? "shadow-2xl shadow-amber-500/25" : "shadow-lg shadow-black/20"}`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-semibold">{plan.name}</CardTitle>
                    <CardDescription className="text-white/70">{plan.headline}</CardDescription>
                  </div>
                  {plan.highlighted && (
                    <Badge className="bg-amber-400 text-slate-900">Most popular</Badge>
                  )}
                </div>
                <p className="mt-6 text-4xl font-semibold">
                  {plan.price}
                  <span className="text-base font-normal text-white/60"> {plan.cadence}</span>
                </p>
                <p className="text-sm text-white/60">{plan.description}</p>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3 text-sm text-white/80">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="mt-0.5 h-5 w-5 text-emerald-300" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild size="lg" className="w-full rounded-full bg-white text-slate-900 hover:bg-white/90">
                  <Link href={plan.cta.href} className="flex items-center justify-center gap-2">
                    {plan.cta.label}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 rounded-3xl border border-white/15 bg-white/5 p-8 shadow-lg shadow-black/20 lg:grid-cols-3">
          {addOns.map((addon) => (
            <div key={addon.title} className="space-y-4 rounded-2xl border border-white/15 bg-white/5 p-5">
              <div>
                <p className="text-sm uppercase tracking-[0.3em] text-white/60">Add-on</p>
                <h3 className="mt-2 text-xl font-semibold">{addon.title}</h3>
              </div>
              <p className="text-sm text-white/70">{addon.detail}</p>
              <p className="text-base font-semibold text-amber-300">{addon.price}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-white/15 bg-white/5 p-8 shadow-lg shadow-black/25">
          <div className="grid gap-10 lg:grid-cols-2">
            {faqs.map((faq) => (
              <div key={faq.question} className="space-y-3">
                <h3 className="text-lg font-semibold">{faq.question}</h3>
                <p className="text-white/70">{faq.answer}</p>
                <Separator className="border-white/10" />
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-4 text-sm text-white/70">
            <span>Need procurement paperwork?</span>
            <Button variant="outline" asChild className="rounded-full border-white/30 text-white hover:bg-white/10">
              <Link href="/contact">Connect with finance</Link>
            </Button>
          </div>
        </section>
      </div>
    </main>
  );
}
