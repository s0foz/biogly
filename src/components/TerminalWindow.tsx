"use client";

import { cn } from "@/lib/utils";

interface TerminalLine {
  text: string;
  className?: string;
}

const LINES: TerminalLine[] = [
  { text: "$ biogly claim my-science-project", className: "text-foreground" },
  { text: "✓ name available", className: "text-emerald-400" },
  { text: "✓ destination → my-project.pages.dev", className: "text-emerald-400" },
  { text: "● submitted — pending review…", className: "text-amber-400" },
  { text: "✓ approved by the Biogly team", className: "text-emerald-400" },
  { text: "✓ CNAME record created on Cloudflare", className: "text-emerald-400" },
  {
    text: "→ live at my-science-project.biogly.tech",
    className: "text-primary font-semibold",
  },
];

export function TerminalWindow({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-zinc-950/90 shadow-2xl shadow-black/40",
        className
      )}
      role="img"
      aria-label="Terminal showing the Biogly claim flow: a student claims my-science-project, it gets approved, and the DNS record is created"
    >
      <div className="flex items-center gap-1.5 border-b border-border/70 bg-zinc-900/80 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" aria-hidden />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" aria-hidden />
        <span className="ml-3 font-mono text-xs text-muted-foreground">student@biogly — zsh</span>
      </div>
      <div className="space-y-2 px-4 py-4 font-mono text-[13px] leading-relaxed sm:px-5">
        {LINES.map((line, index) => (
          <p
            key={index}
            className={cn("term-line", line.className)}
            style={{ animationDelay: `${index * 0.35}s` }}
          >
            {line.text}
          </p>
        ))}
        <p className="term-line text-foreground" style={{ animationDelay: `${LINES.length * 0.35}s` }}>
          $ <span className="cursor-blink text-primary">▊</span>
        </p>
      </div>
    </div>
  );
}
