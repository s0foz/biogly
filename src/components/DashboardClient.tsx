"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SubdomainCard } from "@/components/SubdomainCard";
import type { SubdomainDTO } from "@/types";

interface DashboardClientProps {
  userEmail: string;
  rootDomain: string;
}

export function DashboardClient({ userEmail, rootDomain }: DashboardClientProps) {
  const [subdomains, setSubdomains] = useState<SubdomainDTO[] | null>(null);
  const [limit, setLimit] = useState(5);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/subdomains");
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { subdomains: SubdomainDTO[]; limit: number };
      setSubdomains(data.subdomains);
      setLimit(data.limit);
    } catch {
      setError("Couldn't load your subdomains.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-muted-foreground">{"// dashboard"}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Your subdomains</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as <span className="font-mono text-foreground">{userEmail}</span>
            {subdomains && (
              <>
                {" · "}
                {subdomains.length}/{limit} used
              </>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()} className="font-mono">
            <RefreshCcw className="h-4 w-4" aria-hidden />
            Refresh
          </Button>
          <Button asChild size="sm" className="font-mono">
            <Link href="/dashboard/new">
              <Plus className="h-4 w-4" aria-hidden />
              Claim a subdomain
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <Card className="mt-8 border-red-400/25">
          <CardContent className="flex items-center justify-between gap-3 p-4 text-sm text-red-300">
            {error}
            <Button variant="outline" size="sm" onClick={() => void load()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {subdomains === null && !error && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {[0, 1].map((index) => (
            <Card key={index}>
              <CardContent className="space-y-3 p-6">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {subdomains !== null && subdomains.length === 0 && (
        <Card className="mt-8 border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
            <p className="font-mono text-sm text-muted-foreground">$ biogly claim _</p>
            <div>
              <h2 className="text-lg font-semibold">No subdomains yet</h2>
              <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                Claim your first {rootDomain} name and point it at anything you&apos;ve built — a
                science fair project, a club site, a game, whatever.
              </p>
            </div>
            <Button asChild className="font-mono">
              <Link href="/dashboard/new">
                <Plus className="h-4 w-4" aria-hidden />
                Claim your first subdomain
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {subdomains !== null && subdomains.length > 0 && (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {subdomains.map((sub) => (
            <SubdomainCard key={sub.id} sub={sub} rootDomain={rootDomain} onChanged={() => void load()} />
          ))}
        </div>
      )}
    </main>
  );
}
