"use client";

import { useState } from "react";
import { CalendarDays, ExternalLink, Globe, Link2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { StatusBadge } from "@/components/StatusBadge";
import type { SubdomainDTO } from "@/types";

interface SubdomainCardProps {
  sub: SubdomainDTO;
  rootDomain: string;
  onChanged: () => void;
}

export function SubdomainCard({ sub, rootDomain, onChanged }: SubdomainCardProps) {
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [destination, setDestination] = useState(sub.destination);
  const [busy, setBusy] = useState(false);

  const fullDomain = `${sub.name}.${rootDomain}`;

  async function saveDestination() {
    setBusy(true);
    try {
      const res = await fetch(`/api/subdomains/${sub.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        toast({ title: "Could not update", description: data.error, variant: "destructive" });
        return;
      }
      toast({
        title: "Destination updated",
        description: `${fullDomain} is back in the review queue.`,
      });
      setEditOpen(false);
      onChanged();
    } catch {
      toast({ title: "Network error", description: "Please try again.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    try {
      const res = await fetch(`/api/subdomains/${sub.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        toast({ title: "Could not delete", description: data.error, variant: "destructive" });
        return;
      }
      toast({ title: "Subdomain released", description: `${fullDomain} was deleted.` });
      setDeleteOpen(false);
      onChanged();
    } catch {
      toast({ title: "Network error", description: "Please try again.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="font-mono text-base font-semibold break-all">{fullDomain}</CardTitle>
          <StatusBadge status={sub.status} />
        </div>
        <CardDescription className="flex items-center gap-1.5 text-xs">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          Requested {new Date(sub.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 pb-3">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-medium text-muted-foreground">Points to</p>
          <a
            href={sub.destination}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-1.5 font-mono text-sm text-primary hover:underline"
          >
            <Link2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="truncate">{sub.destination}</span>
            <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
          </a>
        </div>

        {sub.recordId && (
          <p className="text-xs text-muted-foreground">
            DNS record{" "}
            <span
              className={
                sub.dnsMode === "live"
                  ? "text-emerald-400"
                  : "text-amber-400"
              }
            >
              {sub.dnsMode === "live" ? "live on Cloudflare" : "simulated (dev mode)"}
            </span>
          </p>
        )}

        {sub.status === "rejected" && sub.reviewerNote && (
          <p className="rounded-md border border-red-400/25 bg-red-400/10 px-3 py-2 text-xs text-red-300">
            <span className="font-semibold">Reviewer note:</span> {sub.reviewerNote}
          </p>
        )}
        {sub.status === "pending" && (
          <p className="rounded-md border border-amber-400/25 bg-amber-400/10 px-3 py-2 text-xs text-amber-300">
            Waiting for a human review — the DNS record is created automatically once approved.
          </p>
        )}
      </CardContent>

      <CardFooter className="gap-2 border-t border-border/60 pt-4">
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} disabled={busy}>
          <Pencil className="h-3.5 w-3.5" />
          Change destination
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDeleteOpen(true)}
          disabled={busy}
          className="text-red-400 hover:bg-red-400/10 hover:text-red-300"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </Button>
      </CardFooter>

      {/* Change destination */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-mono">Change destination</DialogTitle>
            <DialogDescription>
              Editing a live subdomain removes its DNS record and sends the request back to
              <span className="font-mono text-amber-400"> pending </span>
              review for safety.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`dest-${sub.id}`}>New destination URL</Label>
            <Input
              id={`dest-${sub.id}`}
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              placeholder="https://my-project.pages.dev"
              className="font-mono text-sm"
              autoComplete="url"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditOpen(false); setDestination(sub.destination); }} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={saveDestination} disabled={busy || !destination.trim()}>
              {busy ? "Saving…" : "Save & resubmit"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {fullDomain}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently releases the name and removes its DNS record. The name becomes
              available for other students to claim. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void remove();
              }}
              disabled={busy}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {busy ? "Deleting…" : "Delete permanently"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
