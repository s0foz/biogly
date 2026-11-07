import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/auth";
import { createSubdomain } from "@/lib/cloudflare";
import { toSubdomainDTO } from "@/lib/dto";

/**
 * POST /api/admin/approve — approve a pending (or re-activate a suspended)
 * request. Hybrid DNS mode: creates a real Cloudflare record when the API
 * token is configured, otherwise simulates one.
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
  if (subdomain.status !== "pending" && subdomain.status !== "suspended") {
    return NextResponse.json(
      { error: `Only pending or suspended requests can be approved (current: ${subdomain.status}).` },
      { status: 400 }
    );
  }

  // Create the DNS record first — if Cloudflare fails, the request stays
  // untouched so the admin can simply retry.
  const dns = await createSubdomain(subdomain.name, subdomain.destination).catch((error: Error) => {
    return { error: error.message } as const;
  });
  if ("error" in dns) {
    return NextResponse.json(
      { error: `DNS record creation failed: ${dns.error}` },
      { status: 502 }
    );
  }

  const updated = await db.subdomain.update({
    where: { id },
    data: {
      status: "active",
      recordId: dns.recordId,
      dnsMode: dns.mode,
      reviewedAt: new Date(),
      reviewerNote: null,
    },
    include: { owner: { select: { email: true } } },
  });

  await db.adminLog.create({
    data: {
      actor: admin.email,
      action: subdomain.status === "suspended" ? "reactivate" : "approve",
      target: subdomain.name,
      detail:
        dns.mode === "live"
          ? `DNS record ${dns.recordId} created on Cloudflare`
          : "Simulated DNS record created (no Cloudflare token configured)",
    },
  });

  return NextResponse.json({ subdomain: toSubdomainDTO(updated) });
}
