import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginCard } from "@/components/LoginCard";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  const { next } = await searchParams;
  // Only allow internal redirect targets.
  const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  return <LoginCard nextPath={safeNext} />;
}
