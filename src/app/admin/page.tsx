import { redirect } from "next/navigation";
import { getCurrentUser, isAdminEmail } from "@/lib/auth";
import { AdminClient } from "@/components/AdminClient";
import { ROOT_DOMAIN } from "@/lib/validation";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Fadmin");
  if (!isAdminEmail(user.email)) redirect("/dashboard");

  return <AdminClient adminEmail={user.email} rootDomain={ROOT_DOMAIN} />;
}
