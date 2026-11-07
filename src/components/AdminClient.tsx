"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCcw, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { AdminRequestCard, type AdminAction } from "@/components/AdminRequestCard";
import type { AdminRequestsResponse, SubdomainDTO } from "@/types";

interface AdminClientProps {
  adminEmail: string;
  rootDomain: string;
}

type TabKey = "pending" | "active" | "suspended" | "rejected" | "all";

const ACTION_TOAST: Record<AdminAction, { title: string }> = {
  approve: { title: "DNS record created" },
  reject: { title: "Request rejected" },
  suspend: { title: "Subdomain suspended" },
};

export function AdminClient({ adminEmail, rootDomain }: AdminClientProps) {
  const { toast } = useToast();
  const [data, setData] = useState<AdminRequestsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("pending");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/admin/requests");
      if (!res.ok) throw new Error("failed");
      setData((await res.json()) as AdminRequestsResponse);
    } catch {
      setError("Couldn't load the review queue.");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAction(action: AdminAction, id: string, note?: string): Promise<boolean> {
    setBusyId(id);
    try {
      const res = await fetch(`/api/admin/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, note }),
      });
      const payload = (await res.json()) as { subdomain?: SubdomainDTO; error?: string };
      if (!res.ok || !payload.subdomain) {
        toast({
          title: "Action failed",
          description: payload.error,
          variant: "destructive",
        });
        return false;
      }
      toast({
        title: ACTION_TOAST[action].title,
        description: `${payload.subdomain.name}.${rootDomain} — status: ${payload.subdomain.status}`,
      });
      await load();
      return true;
    } catch {
      toast({ title: "Network error", description: "Please try again.", variant: "destructive" });
      return false;
    } finally {
      setBusyId(null);
    }
  }

  const filtered: SubdomainDTO[] = (data?.requests ?? []).filter(
    (req) => tab === "all" || req.status === tab
  );

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-xs text-muted-foreground">{"// admin · review queue"}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Review requests</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Signed in as <span className="font-mono text-foreground">{adminEmail}</span>
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void load()} className="font-mono">
          <RefreshCcw className="h-4 w-4" aria-hidden />
          Refresh
        </Button>
      </div>

      {/* DNS mode banner */}
      {data && !data.dnsConfigured && (
        <p className="mt-6 rounded-md border border-amber-400/25 bg-amber-400/10 px-4 py-2.5 text-xs text-amber-300">
          <span className="font-semibold">Simulated DNS mode:</span> no Cloudflare API token is
          configured, so approvals create simulated records. Set{" "}
          <span className="font-mono">CLOUDFLARE_API_TOKEN</span> and{" "}
          <span className="font-mono">CLOUDFLARE_ZONE_ID</span> in <span className="font-mono">.env.local</span>{" "}
          to make approvals write real DNS.
        </p>
      )}

      {/* Stats */}
      {data && (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {(
            [
              ["pending", data.stats.pending],
              ["active", data.stats.active],
              ["suspended", data.stats.suspended],
              ["rejected", data.stats.rejected],
              ["total", data.stats.total],
            ] as const
          ).map(([key, value]) => (
            <Card key={key}>
              <CardContent className="p-4 text-center">
                <p className="font-mono text-xl font-bold text-primary">{value}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{key}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <Card className="mt-6 border-red-400/25">
          <CardContent className="flex items-center justify-between gap-3 p-4 text-sm text-red-300">
            {error}
            <Button variant="outline" size="sm" onClick={() => void load()}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {data === null && !error && (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
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

      {data !== null && (
        <>
          <Tabs value={tab} onValueChange={(value) => setTab(value as TabKey)} className="mt-8">
            <TabsList className="flex-wrap h-auto">
              <TabsTrigger value="pending" className="font-mono text-xs">
                pending ({data.stats.pending})
              </TabsTrigger>
              <TabsTrigger value="active" className="font-mono text-xs">
                active ({data.stats.active})
              </TabsTrigger>
              <TabsTrigger value="suspended" className="font-mono text-xs">
                suspended ({data.stats.suspended})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="font-mono text-xs">
                rejected ({data.stats.rejected})
              </TabsTrigger>
              <TabsTrigger value="all" className="font-mono text-xs">
                all
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {filtered.map((req) => (
              <AdminRequestCard
                key={req.id}
                req={req}
                rootDomain={rootDomain}
                busy={busyId === req.id}
                onAction={(action, note) => handleAction(action, req.id, note)}
              />
            ))}
          </div>

          {filtered.length === 0 && (
            <p className="mt-10 text-center font-mono text-sm text-muted-foreground">
              {busyId ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <>{"// nothing here — queue is clear"}</>
              )}
            </p>
          )}

          {/* Audit log */}
          <section className="mt-14">
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <ScrollText className="h-4 w-4 text-primary" aria-hidden /> Admin audit log
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Latest 15 actions, newest first. Every approve / reject / suspend is recorded.
            </p>
            <div className="scrollbar-slim mt-4 max-h-96 overflow-y-auto rounded-lg border border-border">
              {data.logs.length === 0 ? (
                <p className="p-4 text-center font-mono text-xs text-muted-foreground">
                  {"// no admin actions recorded yet"}
                </p>
              ) : (
                <ul className="divide-y divide-border/60">
                  {data.logs.map((log) => (
                    <li
                      key={log.id}
                      className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-xs"
                    >
                      <span
                        className={
                          log.action === "reject"
                            ? "rounded bg-red-400/10 px-1.5 py-0.5 font-mono text-red-300"
                            : log.action === "suspend"
                              ? "rounded bg-zinc-400/10 px-1.5 py-0.5 font-mono text-zinc-300"
                              : "rounded bg-emerald-400/10 px-1.5 py-0.5 font-mono text-emerald-300"
                        }
                      >
                        {log.action}
                      </span>
                      <span className="font-mono text-foreground">{log.target}</span>
                      <span className="text-muted-foreground">{log.detail}</span>
                      <span className="ml-auto shrink-0 text-muted-foreground">
                        {log.actor} ·{" "}
                        {new Date(log.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
