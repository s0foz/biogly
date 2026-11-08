"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Github, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserDTO } from "@/types";

interface LoginCardProps {
  nextPath: string;
}

export function LoginCard({ nextPath }: LoginCardProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || busy) return;
    setBusy(true);
    setError(null);

    try {
      let res: Response;
      try {
        res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        });
      } catch {
        setError("Network error. Please try again.");
        return;
      }

      let data: { user?: UserDTO; error?: string };
      try {
        data = (await res.json()) as { user?: UserDTO; error?: string };
      } catch {
        setError("The sign-in service returned an unexpected response. Please try again.");
        return;
      }

      if (!res.ok || !data.user) {
        setError(data.error ?? "Login failed. Please try again.");
        return;
      }
      router.push(nextPath);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-grid px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 font-mono text-lg font-semibold">
            <span className="flex h-7 w-7 items-center justify-center rounded bg-primary/15 font-mono text-sm text-primary">
              b
            </span>
            biogly<span className="cursor-blink text-primary">_</span>
          </Link>
          <p className="mt-2 font-mono text-xs text-muted-foreground">{"// login"}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sign in to claim subdomains</CardTitle>
            <CardDescription>
              Enter your email to get a session. New address? Your account is created
              automatically.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@school.edu"
                  className="font-mono text-sm"
                  autoComplete="email"
                  autoFocus
                  required
                />
              </div>

              {error && (
                <p role="alert" className="rounded-md border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs text-red-300">
                  {error}
                </p>
              )}

              <Button type="submit" className="w-full font-mono" disabled={busy || !email.trim()}>
                {busy ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Signing in…
                  </>
                ) : (
                  <>
                    Continue <ArrowRight className="h-4 w-4" aria-hidden />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="rounded-md border border-border bg-card/60 px-4 py-3">
          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Github className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              <span className="font-semibold text-foreground">MVP note:</span> Biogly currently
              uses a dev email login. GitHub OAuth through Supabase is planned for the public
              beta — the user table is already shaped for it.
            </span>
          </p>
        </div>
      </div>
    </main>
  );
}
