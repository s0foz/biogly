import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/auth";
import { deleteSubdomain } from "@/lib/cloudflare";
import { toSubdomainDTO } from "@/lib/dto";

/**
 * POST /api/admin/suspend — take a live subdomain offline. The DNS record is
 * deleted immediately so it stops resolving; the row is kept so the student
 * (or admin) can reactivate it later.
 */
export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  let id: string | undefined;
  try {
    const body = (await request.json()) as { id?: string };
    id = body.id;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }
  if (!id) return NextResponse.json({ error: "Missing request id." }, { status: 400 });

  const subdomain = await db.subdomain.findUnique({
    where: { id },
    include: { owner: { select: { email: true } } },
  });
  if (!subdomain) {
    return NextResponse.json({ error: "Subdomain not found." }, { status: 404 });
  }
  if (subdomain.status !== "active") {
    return NextResponse.json(
      { error: `Only active subdomains can be suspended (current: ${subdomain.status}).` },
      { status: 400 }
    );
  }

  const dns = subdomain.recordId
    ? await deleteSubdomain(subdomain.recordId).catch((error: Error) => {
        return { error: error.message } as const;
      })
    : null;
  if (dns && "error" in dns) {
    return NextResponse.json(
      { error: `DNS record deletion failed: ${dns.error}` },
      { status: 502 }
    );
  }

  const updated = await db.subdomain.update({
    where: { id },
    data: {
      status: "suspended",
      recordId: null,
      dnsMode: null,
      reviewedAt: new Date(),
    },
    include: { owner: { select: { email: true } } },
  });

  await db.adminLog.create({
    data: {
      actor: admin.email,
      action: "suspend",
      target: subdomain.name,
      detail:
        dns?.mode === "live"
          ? `DNS record ${subdomain.recordId} deleted on Cloudflare`
          : "Simulated DNS record removed",
    },
  });

  return NextResponse.json({ subdomain: toSubdomainDTO(updated) });
}
