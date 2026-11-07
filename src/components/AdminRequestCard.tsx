"use client";

import { useState } from "react";
import { Ban, CalendarDays, CheckCircle2, ExternalLink, RotateCcw, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StatusBadge } from "@/components/StatusBadge";
import type { SubdomainDTO } from "@/types";

export type AdminAction = "approve" | "reject" | "suspend";

interface AdminRequestCardProps {
  req: SubdomainDTO;
  rootDomain: string;
  busy: boolean;
  onAction: (action: AdminAction, note?: string) => Promise<boolean>;
}

export function AdminRequestCard({ req, rootDomain, busy, onAction }: AdminRequestCardProps) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [note, setNote] = useState("");

  const fullDomain = `${req.name}.${rootDomain}`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-mono text-base font-semibold break-all">{fullDomain}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <User className="h-3.5 w-3.5" aria-hidden /> {req.ownerEmail}
            </p>
          </div>
          <StatusBadge status={req.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-2 pb-4">
        <p className="text-xs text-muted-foreground">
          Destination:{" "}
          <a
            href={req.destination}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-1 font-mono text-primary hover:underline"
          >
            <span className="truncate">{req.destination}</span>
            <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
          </a>
        </p>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <CalendarDays className="h-3.5 w-3.5" aria-hidden />
          Requested{" "}
          {new Date(req.createdAt).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
          {req.reviewedAt &&
            ` · last review ${new Date(req.reviewedAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            })}`}
        </p>
        {req.recordId && (
          <p className="text-xs text-muted-foreground">
            DNS:{" "}
            <span className={req.dnsMode === "live" ? "text-emerald-400" : "text-amber-400"}>
              {req.dnsMode === "live" ? "live Cloudflare record" : "simulated record (dev)"}
            </span>{" "}
            <span className="font-mono opacity-70">{req.recordId.slice(0, 18)}…</span>
          </p>
        )}
        {req.reviewerNote && (
          <p className="rounded-md border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Last review note:</span> {req.reviewerNote}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex-wrap gap-2 border-t border-border/60 pt-4">
        {(req.status === "pending" || req.status === "suspended") && (
          <Button
            size="sm"
            onClick={() => void onAction("approve")}
            disabled={busy}
            className="font-mono"
          >
            <CheckCircle2 className="h-4 w-4" />
            {req.status === "suspended" ? "Reactivate" : "Approve"}
          </Button>
        )}
        {req.status === "active" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSuspendOpen(true)}
            disabled={busy}
            className="font-mono"
          >
            <Ban className="h-4 w-4" />
            Suspend
          </Button>
        )}
        {req.status !== "active" && req.status !== "rejected" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setRejectOpen(true)}
            disabled={busy}
            className="font-mono text-red-400 hover:bg-red-400/10 hover:text-red-300"
          >
            Reject
          </Button>
        )}
      </CardFooter>

      {/* Reject with optional note */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-mono">Reject {fullDomain}</DialogTitle>
            <DialogDescription>
              The student will see the status change to rejected. Adding a note helps them
              understand what to fix before resubmitting.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor={`note-${req.id}`}>Note for the student (optional)</Label>
            <Textarea
              id={`note-${req.id}`}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g. Destination points to an empty page — deploy your project first."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={async () => {
                const ok = await onAction("reject", note.trim() || undefined);
                if (ok) {
                  setRejectOpen(false);
                  setNote("");
                }
              }}
              className="font-mono"
            >
              Reject request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend confirmation */}
      <AlertDialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend {fullDomain}?</AlertDialogTitle>
            <AlertDialogDescription>
              The DNS record is deleted immediately, so the subdomain stops resolving. The request
              stays in the system and can be reactivated later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                setSuspendOpen(false);
                void onAction("suspend");
              }}
              disabled={busy}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              <RotateCcw className="h-4 w-4" />
              Suspend subdomain
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
