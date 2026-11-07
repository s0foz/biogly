import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { SubdomainForm } from "@/components/SubdomainForm";
import { ROOT_DOMAIN, MAX_SUBDOMAINS_PER_USER, RESERVED_NAMES } from "@/lib/validation";

export default async function NewSubdomainPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Fdashboard%2Fnew");

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 font-mono text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden /> back to dashboard
      </Link>

      <div className="mt-4">
        <p className="font-mono text-xs text-muted-foreground">{"// claim a subdomain"}</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Claim a subdomain</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Requests are reviewed by a human before the DNS record is created. You currently have up
          to {MAX_SUBDOMAINS_PER_USER} subdomains per account.
        </p>
      </div>

      <div className="mt-8 space-y-6">
        <SubdomainForm rootDomain={ROOT_DOMAIN} />

        <div className="rounded-lg border border-border bg-card/50 p-4">
          <p className="font-mono text-xs text-muted-foreground"># naming rules</p>
          <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
            <li>· lowercase letters, numbers and hyphens; 3–30 characters</li>
            <li>· starts and ends with a letter or number</li>
            <li>· reserved names are blocked ({RESERVED_NAMES.size} names incl. www, api, admin)</li>
            <li>· destination must be a public http(s) URL, not on {ROOT_DOMAIN}</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
