import Link from "next/link";
import { ArrowRight, Bot, GitBranch, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Navbar } from "@/components/Navbar";
import { TerminalWindow } from "@/components/TerminalWindow";
import { db } from "@/lib/db";
import { ROOT_DOMAIN } from "@/lib/validation";

async function getLandingStats() {
  try {
    const [students, issued, live] = await Promise.all([
      db.user.count(),
      db.subdomain.count(),
      db.subdomain.count({ where: { status: "active" } }),
    ]);
    return { students, issued, live };
  } catch {
    return null;
  }
}

const STEPS = [
  {
    id: "01",
    title: "Sign in",
    body: "Create your account in seconds. No credit card, no school paperwork — just an email address.",
  },
  {
    id: "02",
    title: "Claim a name",
    body: `Pick any free name and tell us where your project lives — a Pages site, GitHub Pages, your own server.`,
  },
  {
    id: "03",
    title: "Get reviewed",
    body: "A human checks the request. Usually quick — it exists so the domain stays clean and safe for everyone.",
  },
  {
    id: "04",
    title: "Go live",
    body: "Approval automatically creates the DNS record on Cloudflare. Your subdomain resolves within a minute.",
  },
];

const FEATURES = [
  {
    icon: Sparkles,
    title: "Free, forever",
    body: "Biogly is free for students. No trials, no premium tier hidden behind your project's URL.",
  },
  {
    icon: ShieldCheck,
    title: "Human-reviewed",
    body: "Every request passes a real review before DNS is touched. It keeps the domain off blocklists and spam folders.",
  },
  {
    icon: Bot,
    title: "One-click automation",
    body: "Approving a request creates the Cloudflare record instantly — no DNS dashboards, no waiting on manual edits.",
  },
  {
    icon: GitBranch,
    title: "Built-in guardrails",
    body: "Reserved names, per-account limits, destination validation and an admin audit log ship from day one.",
  },
];

const RULES = [
  "3–30 characters · lowercase a–z, 0–9 and hyphens",
  "Must start and end with a letter or number",
  "Common infrastructure names (www, api, admin…) are reserved",
  "Up to 5 subdomains per account",
  "Editing the destination of a live subdomain sends it back to review",
];

export default async function LandingPage() {
  const stats = await getLandingStats();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-grid border-b border-border/60">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:gap-12 lg:py-24">
            <div className="space-y-6">
              <p className="font-mono text-sm text-primary">{"// free subdomains for student builders"}</p>
              <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl lg:text-[3.4rem] lg:leading-[1.1]">
                Your project.
                <br />
                <span className="font-mono text-primary">your-name</span>.
                {ROOT_DOMAIN.replace("www.", "")}
              </h1>
              <p className="max-w-lg text-base text-muted-foreground sm:text-lg">
                Biogly gives every student a free subdomain for anything they build. Claim a name,
                point it at your project, and go live after a quick human review — we handle the
                DNS for you.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <Button asChild size="lg" className="font-mono">
                  <Link href="/login?next=/dashboard/new">
                    Claim your subdomain <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="font-mono">
                  <Link href="#how">How it works</Link>
                </Button>
              </div>
              <p className="font-mono text-xs text-muted-foreground">
                free forever for students · human-reviewed · powered by Cloudflare
              </p>
            </div>

            <TerminalWindow className="w-full" />
          </div>
        </section>

        {/* Live stats */}
        {stats && (
          <section className="border-b border-border/60 bg-card/40">
            <div className="mx-auto grid w-full max-w-6xl grid-cols-3 divide-x divide-border/60 px-4 py-6 text-center sm:px-6">
              <div className="px-2">
                <p className="font-mono text-2xl font-bold text-primary sm:text-3xl">{stats.students}</p>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">students onboard</p>
              </div>
              <div className="px-2">
                <p className="font-mono text-2xl font-bold text-primary sm:text-3xl">{stats.issued}</p>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">subdomains issued</p>
              </div>
              <div className="px-2">
                <p className="font-mono text-2xl font-bold text-primary sm:text-3xl">{stats.live}</p>
                <p className="mt-1 text-xs text-muted-foreground sm:text-sm">live right now</p>
              </div>
            </div>
          </section>
        )}

        {/* How it works */}
        <section id="how" className="scroll-mt-16 border-b border-border/60">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">How it works</h2>
            <p className="mt-2 max-w-2xl text-muted-foreground">
              Four steps from an idea to a URL you can put on a poster.
            </p>
            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map((step) => (
                <li key={step.id}>
                  <Card className="h-full">
                    <CardContent className="space-y-3 p-5">
                      <span className="font-mono text-sm text-primary">{step.id}</span>
                      <h3 className="font-semibold">{step.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                    </CardContent>
                  </Card>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="scroll-mt-16 border-b border-border/60">
          <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Why Biogly</h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {FEATURES.map((feature) => (
                <Card key={feature.title} className="h-full">
                  <CardContent className="space-y-3 p-5">
                    <feature.icon className="h-5 w-5 text-primary" aria-hidden />
                    <h3 className="font-semibold">{feature.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">{feature.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Rules */}
        <section className="border-b border-border/60">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">The house rules</h2>
              <p className="mt-2 max-w-xl text-muted-foreground">
                A short list that keeps {ROOT_DOMAIN} fast, clean and welcome on school networks.
              </p>
              <ul className="mt-6 space-y-2.5">
                {RULES.map((rule) => (
                  <li key={rule} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                    <span className="mt-0.5 font-mono text-primary">✓</span>
                    {rule}
                  </li>
                ))}
              </ul>
            </div>
            <Card>
              <CardContent className="p-6 font-mono text-sm leading-loose">
                <p className="text-muted-foreground"># request lifecycle</p>
                <p>
                  <span className="text-amber-400">pending</span> → admin review
                </p>
                <p>
                  <span className="text-amber-400">pending</span> →{" "}
                  <span className="text-emerald-400">active</span> · DNS record created
                </p>
                <p>
                  <span className="text-amber-400">pending</span> →{" "}
                  <span className="text-red-400">rejected</span> · with a note
                </p>
                <p>
                  <span className="text-emerald-400">active</span> →{" "}
                  <span className="text-zinc-400">suspended</span> · record removed
                </p>
                <p className="text-muted-foreground">
                  # every admin action lands in the audit log
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Final CTA */}
        <section>
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-5 px-4 py-16 text-center sm:px-6 sm:py-20">
            <h2 className="max-w-2xl text-balance text-2xl font-bold tracking-tight sm:text-3xl">
              Built something worth sharing? Give it a real address.
            </h2>
            <Button asChild size="lg" className="font-mono">
              <Link href="/login?next=/dashboard/new">
                Claim your subdomain <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <p className="font-mono text-xs text-muted-foreground">takes about 60 seconds</p>
          </div>
        </section>
      </main>

      <footer className="mt-auto border-t border-border/60">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 font-mono text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} biogly — free subdomains for students</p>
          <p>
            {ROOT_DOMAIN} · terms of service arriving with the public beta
          </p>
        </div>
      </footer>
    </div>
  );
}
