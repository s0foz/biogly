import { cn } from "@/lib/utils";
import type { SubdomainStatus } from "@/types";

const STATUS_CONFIG: Record<
  SubdomainStatus,
  { label: string; dot: string; chip: string }
> = {
  pending: {
    label: "Pending review",
    dot: "bg-amber-400",
    chip: "text-amber-300 bg-amber-400/10 border-amber-400/25",
  },
  active: {
    label: "Active",
    dot: "bg-emerald-400",
    chip: "text-emerald-300 bg-emerald-400/10 border-emerald-400/25",
  },
  rejected: {
    label: "Rejected",
    dot: "bg-red-400",
    chip: "text-red-300 bg-red-400/10 border-red-400/25",
  },
  suspended: {
    label: "Suspended",
    dot: "bg-zinc-400",
    chip: "text-zinc-300 bg-zinc-400/10 border-zinc-400/25",
  },
};

export function StatusBadge({ status, className }: { status: SubdomainStatus; className?: string }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
        config.chip,
        className
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", config.dot)} aria-hidden />
      {config.label}
    </span>
  );
}
