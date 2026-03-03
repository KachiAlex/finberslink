"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { SiteHeader } from "@/components/layout/site-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const mockedProfile = {
  name: "Adaeze A. (Demo)",
  headline: "Product Strategist · Impact Programs",
  location: "Lagos, Nigeria",
  avatar: "/finbers-logo.png",
  stats: [
    { label: "Resume score", value: "82%" },
    { label: "Applications", value: "12" },
    { label: "Interviews", value: "4" },
  ],
  about:
    "I help talent incubators design learner journeys, lead data-informed coaching loops, and prioritize storytelling for hiring readiness.",
  experience: [
    {
      company: "Elevate Africa Fellowship",
      role: "Learning Experience Lead",
      duration: "2023 — Present",
      highlights: [
        "Built blended programs for 400+ fellows across product, data, and talent pathways.",
        "Introduced AI-based skill diagnostics, improving placement velocity by 35%.",
      ],
    },
    {
      company: "Impact Catalyst Network",
      role: "Program Manager",
      duration: "2021 — 2023",
      highlights: [
        "Led partnerships with 18 NGOs, doubling volunteer-to-hire transitions.",
        "Designed mentorship scorecards and storytelling playbooks adopted regionally.",
      ],
    },
  ],
  skills: ["Product Strategy", "Program Design", "Storytelling", "Mentorship", "Impact Metrics"],
  portfolio: [
    {
      title: "Product Fellows Curriculum 2.0",
      url: "https://example.com/case-study",
      description: "Re-architected 8-week sprint with AI prompts and hiring partner showcases.",
    },
    {
      title: "Volunteer-to-Hire Playbook",
      url: "https://example.com/playbook",
      description: "Captured best practices for NGOs turning volunteers into full-time staff.",
    },
  ],
  activity: [
    {
      type: "resume",
      label: "Resume updated",
      timestamp: "2h ago",
      meta: "Added impact bullet points for Elevate Africa engagement",
    },
    {
      type: "application",
      label: "Submitted application",
      timestamp: "Yesterday",
      meta: "Community Programs Lead · Amplify Impact",
    },
    {
      type: "cert",
      label: "Completed Course",
      timestamp: "Last week",
      meta: "AI Resume Studio · Finbers Link",
    },
  ],
};

const demoVolunteers = [
  {
    org: "City Youth Labs",
    title: "Program Mentor (Product)",
    mission: "Support emerging builders on no-code experiments.",
    tags: ["Remote", "6 hrs / wk", "Stipend"],
  },
  {
    org: "SHE Builds Collective",
    title: "Storytelling Coach",
    mission: "Guide apprentices on cover letters and interview narratives.",
    tags: ["In-person", "Lagos", "4 hrs / wk"],
  },
];

const demoNews = [
  {
    title: "Finbers Link launches Volunteer-to-Hire Studio",
    summary: "Admins can now publish mission-led roles alongside jobs.",
    tags: ["Product", "Volunteer"],
    date: "Mar 1, 2026",
  },
  {
    title: "Guardian Mode expands to community partners",
    summary: "Stronger checks for volunteer postings and coaching payouts.",
    tags: ["Security"],
    date: "Feb 20, 2026",
  },
];

const demoThreads = [
  {
    title: "How do you measure storytelling outcomes?",
    course: "Career Design Studio",
    meta: "12 replies · updated 3h ago",
  },
  {
    title: "Share AI prompts for faster resume rewrites",
    course: "AI Resume Studio",
    meta: "7 replies · updated 1d ago",
  },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.8fr_1fr]">
          <div className="space-y-6">
            <Card className="border border-slate-200/80 bg-white/95">
              <CardContent className="p-6 flex flex-col gap-6 md:flex-row md:items-center">
                <div className="flex items-center gap-4">
                  <div className="relative h-20 w-20 overflow-hidden rounded-3xl border border-slate-200">
                    <Image src={mockedProfile.avatar} alt={mockedProfile.name} fill className="object-contain p-3" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-semibold text-slate-900">{mockedProfile.name}</h1>
                    <p className="text-slate-600 text-sm">{mockedProfile.headline}</p>
                    <p className="text-xs uppercase tracking-[0.3em] text-primary mt-1">Demo profile</p>
                  </div>
                </div>
                <div className="flex flex-1 flex-wrap justify-end gap-3">
                  {mockedProfile.stats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-2 text-center">
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{stat.label}</p>
                      <p className="text-lg font-semibold text-slate-900">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <TabsList className="bg-slate-100/80">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="resume">Resume</TabsTrigger>
                  <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                  <TabsTrigger value="activity">Activity</TabsTrigger>
                </TabsList>
                <Button asChild>
                  <Link href="/dashboard/resume">Open Resume Studio</Link>
                </Button>
              </div>

              <TabsContent value="overview" className="mt-6 space-y-6">
                <Card className="border border-slate-200/80 bg-white/95">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-slate-900">About</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 leading-relaxed">{mockedProfile.about}</p>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200/80 bg-white/95">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-slate-900">Experience</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {mockedProfile.experience.map((item) => (
                      <div key={item.company} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                        <div className="flex items-center justify-between text-sm text-slate-500">
                          <span className="font-semibold text-slate-900">{item.role}</span>
                          <span>{item.duration}</span>
                        </div>
                        <p className="text-sm text-primary">{item.company}</p>
                        <ul className="mt-3 space-y-2 text-sm text-slate-600">
                          {item.highlights.map((highlight) => (
                            <li key={highlight} className="flex items-start gap-2">
                              <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" />
                              <span>{highlight}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border border-slate-200/80 bg-white/95">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-slate-900">Skills & Signals</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-2">
                    {mockedProfile.skills.map((skill) => (
                      <Badge key={skill} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="resume" className="mt-6">
                <Card className="border border-slate-200/80 bg-white/95">
                  <CardHeader>
                    <CardTitle className="text-base font-semibold text-slate-900">Quick edit</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input placeholder="Headline" defaultValue={mockedProfile.headline} />
                    <Textarea placeholder="About" rows={4} defaultValue={mockedProfile.about} />
                    <div className="text-right">
                      <Button>Save demo changes</Button>
                    </div>
                    <p className="text-xs text-slate-400">
                      This is a demo read-only surface. Connect your account to edit your actual resume.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="portfolio" className="mt-6 space-y-4">
                {mockedProfile.portfolio.map((project) => (
                  <Card key={project.title} className="border border-slate-200/80 bg-white/95">
                    <CardContent className="space-y-2 py-6">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold text-slate-900">{project.title}</CardTitle>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={project.url} target="_blank">
                            View
                          </Link>
                        </Button>
                      </div>
                      <p className="text-sm text-slate-600">{project.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="activity" className="mt-6">
                <Card className="border border-slate-200/80 bg-white/95">
                  <CardContent className="divide-y divide-slate-100 px-0">
                    {mockedProfile.activity.map((item) => (
                      <div key={item.label} className="flex items-center justify-between px-6 py-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                          <p className="text-xs text-slate-500">{item.meta}</p>
                        </div>
                        <span className="text-xs text-slate-400">{item.timestamp}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card className="border border-blue-200/80 bg-blue-50/80">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-900">Volunteer spotlight</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  Explore mission-led opportunities curated by tenant admins. These are read-only previews in this demo.
                </p>
                <div className="space-y-4">
                  {demoVolunteers.map((role) => (
                    <div key={role.title} className="rounded-2xl border border-white/70 bg-white/90 p-4">
                      <p className="text-xs uppercase tracking-[0.3em] text-primary">{role.org}</p>
                      <p className="text-sm font-semibold text-slate-900">{role.title}</p>
                      <p className="text-xs text-slate-500 mt-1">{role.mission}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {role.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" className="w-full">
                  View volunteer marketplace
                </Button>
              </CardContent>
            </Card>

            <Card className="border border-slate-200/80 bg-white/95">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-900">News pulse</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {demoNews.map((news) => (
                  <div key={news.title} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">{news.title}</p>
                      <span className="text-xs text-slate-400">{news.date}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{news.summary}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {news.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px]">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border border-slate-200/80 bg-white/95">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-slate-900">Forum activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {demoThreads.map((thread) => (
                  <div key={thread.title} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                    <p className="text-sm font-semibold text-slate-900">{thread.title}</p>
                    <p className="text-xs text-primary">{thread.course}</p>
                    <p className="text-xs text-slate-500 mt-1">{thread.meta}</p>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  Visit forum
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
