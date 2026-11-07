import { Navbar } from "@/components/Navbar";

/** Shared shell for authenticated areas: sticky navbar + min-height column. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      {children}
    </div>
  );
}
