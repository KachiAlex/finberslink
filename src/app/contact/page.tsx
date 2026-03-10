import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const metadata = {
  title: "Contact | Finbers Link",
  description: "Reach the Finbers Link team for demos, partnerships, or support.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950/70 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-4 py-16 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-white/20 bg-white/5 px-6 py-10 shadow-[0_25px_60px_rgba(15,23,42,0.5)] backdrop-blur sm:px-10">
          <Badge className="bg-white/10 text-white">Contact</Badge>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight">Talk with the Finbers Link team.</h1>
          <p className="mt-4 max-w-3xl text-lg text-white/80">
            Whether you need a live demo, implementation roadmap, or account support, we respond within one business day. Existing enterprise customers can reach the 24/5 hotline from their admin portal.
          </p>
        </section>

        <section className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-white/15 bg-white/5 text-white shadow-xl shadow-black/30">
            <CardHeader>
              <CardTitle className="text-2xl">Send a message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <label className="text-sm text-white/70">Name</label>
                <Input className="mt-2 border-white/20 bg-white/10 text-white placeholder:text-white/50" placeholder="Adaeze Ada" />
              </div>
              <div>
                <label className="text-sm text-white/70">Work email</label>
                <Input className="mt-2 border-white/20 bg-white/10 text-white placeholder:text-white/50" placeholder="you@organization.org" />
              </div>
              <div>
                <label className="text-sm text-white/70">How can we help?</label>
                <Textarea className="mt-2 border-white/20 bg-white/10 text-white placeholder:text-white/50" rows={5} placeholder="Requesting a buyer dashboard demo..." />
              </div>
              <Button className="w-full rounded-full bg-white text-slate-900 hover:bg-white/90">Submit request</Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            {[
              {
                title: "Sales & demos",
                detail: "Schedule a live walk-through or get a tailored quote for your cohorts.",
                action: { label: "Book a demo", href: "/pricing" },
              },
              {
                title: "Support",
                detail: "Email support@finbers.link or use the in-app messenger for 24/5 help.",
                action: { label: "Open support", href: "/dashboard" },
              },
              {
                title: "Partnerships",
                detail: "Collaborate on curriculum, employer showcases, or grant programs.",
                action: { label: "Partner with us", href: "/brand" },
              },
            ].map((item) => (
              <Card key={item.title} className="border-white/15 bg-white/5 text-white shadow-lg shadow-black/20">
                <CardHeader>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-white/70">
                  <p>{item.detail}</p>
                  <Button variant="outline" asChild className="rounded-full border-white/30 text-white hover:bg-white/10">
                    <Link href={item.action.href}>{item.action.label}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
