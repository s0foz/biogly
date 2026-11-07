import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DashboardClient } from "@/components/DashboardClient";
import { ROOT_DOMAIN } from "@/lib/validation";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Fdashboard");

  return <DashboardClient userEmail={user.email} rootDomain={ROOT_DOMAIN} />;
}
