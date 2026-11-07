"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserDTO } from "@/types";

export function Navbar() {
  const [user, setUser] = useState<UserDTO | null | undefined>(undefined);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) return null;
        const data = (await res.json()) as { user: UserDTO };
        return data.user;
      })
      .then((loaded) => {
        if (!cancelled) setUser(loaded);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    setUser(null);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2 font-mono text-sm font-semibold tracking-tight">
          <span className="flex h-6 w-6 items-center justify-center rounded bg-primary/15 font-mono text-[13px] text-primary">
            b
          </span>
          <span>
            biogly
            <span className="cursor-blink text-primary">_</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {user === undefined ? (
            <div className="h-8 w-24 animate-pulse rounded bg-muted" aria-hidden />
          ) : user === null ? (
            <Button asChild size="sm" className="font-mono">
              <Link href="/login">login</Link>
            </Button>
          ) : (
            <>
              {user.isAdmin && (
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="font-mono text-muted-foreground hover:text-foreground"
                >
                  <Link href="/admin">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="hidden sm:inline">admin</span>
                  </Link>
                </Button>
              )}
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="font-mono text-muted-foreground hover:text-foreground"
              >
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4" />
                  <span className="hidden sm:inline">dashboard</span>
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="font-mono"
                aria-label={`Log out ${user.email}`}
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">logout</span>
              </Button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
