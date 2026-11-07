"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import type { SubdomainDTO } from "@/types";

type CheckState =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "ok" }
  | { state: "invalid" | "taken"; reason: string };

interface SubdomainFormProps {
  rootDomain: string;
}

export function SubdomainForm({ rootDomain }: SubdomainFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [check, setCheck] = useState<CheckState>({ state: "idle" });
  const [submitting, setSubmitting] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Debounced live availability check.
  useEffect(() => {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed) {
      setCheck({ state: "idle" });
      return;
    }

    setCheck({ state: "checking" });
    const timer = setTimeout(() => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      fetch(`/api/subdomains/check?name=${encodeURIComponent(trimmed)}`, {
        signal: controller.signal,
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("check failed");
          const data = (await res.json()) as { valid: boolean; available: boolean; reason: string | null };
          if (data.valid && data.available) {
            setCheck({ state: "ok" });
          } else if (data.valid && !data.available) {
            setCheck({ state: "taken", reason: data.reason ?? "Already taken." });
          } else {
            setCheck({ state: "invalid", reason: data.reason ?? "Invalid name." });
          }
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setCheck({ state: "invalid", reason: "Could not verify availability. Try again." });
        });
    }, 350);

    return () => clearTimeout(timer);
  }, [name]);

  const canSubmit =
    check.state === "ok" && destination.trim().length > 0 && !submitting;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/subdomains", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim().toLowerCase(), destination: destination.trim() }),
      });
      const data = (await res.json()) as { subdomain?: SubdomainDTO; error?: string };
      if (!res.ok || !data.subdomain) {
        toast({ title: "Request failed", description: data.error, variant: "destructive" });
        // Re-run the availability check — the name may have just been taken.
        setCheck({ state: "idle" });
        return;
      }
      toast({
        title: "Request submitted 🎉",
        description: `${data.subdomain.name}.${rootDomain} is now pending review.`,
      });
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast({ title: "Network error", description: "Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-base">1 · Pick a name</CardTitle>
          <CardDescription>
            This becomes the subdomain students will type into their browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subdomain-name">Subdomain</Label>
            <div className="flex items-stretch overflow-hidden rounded-md border border-input bg-transparent focus-within:ring-2 focus-within:ring-ring">
              <Input
                id="subdomain-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="my-science-project"
                className="rounded-none border-0 font-mono focus-visible:ring-0 focus-visible:ring-offset-0"
                autoComplete="off"
                spellCheck={false}
                maxLength={30}
                required
              />
              <span className="flex items-center border-l border-input bg-muted/40 px-3 font-mono text-sm text-muted-foreground">
                .{rootDomain}
              </span>
            </div>

            {check.state === "checking" && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> Checking availability…
              </p>
            )}
            {check.state === "ok" && (
              <p className="flex items-center gap-1.5 text-xs text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> {name.trim().toLowerCase()}.{rootDomain} is available
              </p>
            )}
            {(check.state === "taken" || check.state === "invalid") && (
              <p className="flex items-center gap-1.5 text-xs text-red-400" role="alert">
                <XCircle className="h-3.5 w-3.5 shrink-0" aria-hidden /> {check.reason}
              </p>
            )}
          </div>

          <p className="rounded-md border border-border bg-muted/30 px-3 py-2 font-mono text-xs text-muted-foreground">
            preview:{" "}
            <span className="text-foreground">
              {(name.trim().toLowerCase() || "your-project")}.{rootDomain}
            </span>
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-mono text-base">2 · Where should it point?</CardTitle>
          <CardDescription>
            Any public URL — a Cloudflare Pages site, GitHub Pages, Netlify, your school server…
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="destination">Destination URL</Label>
          <Input
            id="destination"
            value={destination}
            onChange={(event) => setDestination(event.target.value)}
            placeholder="https://my-project.pages.dev"
            className="font-mono text-sm"
            autoComplete="url"
            inputMode="url"
            required
          />
          <p className="text-xs text-muted-foreground">
            Must be an http(s) URL and can&apos;t point back at {rootDomain} itself.
          </p>
        </CardContent>
      </Card>

      <Button type="submit" size="lg" disabled={!canSubmit} className="w-full font-mono sm:w-auto">
        {submitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Submitting…
          </>
        ) : (
          <>
            Request subdomain <ArrowRight className="h-4 w-4" aria-hidden />
          </>
        )}
      </Button>
    </form>
  );
}
