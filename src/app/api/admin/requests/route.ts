import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/auth";
import { toSubdomainDTO } from "@/lib/dto";
import { isCloudflareConfigured } from "@/lib/cloudflare";
import type { AdminRequestsResponse } from "@/types";

/** GET /api/admin/requests — everything the review dashboard needs. */
export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  const [requests, pending, active, suspended, rejected, total, logs] = await Promise.all([
    db.subdomain.findMany({
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: { owner: { select: { email: true } } },
    }),
    db.subdomain.count({ where: { status: "pending" } }),
    db.subdomain.count({ where: { status: "active" } }),
    db.subdomain.count({ where: { status: "suspended" } }),
    db.subdomain.count({ where: { status: "rejected" } }),
    db.subdomain.count(),
    db.adminLog.findMany({ orderBy: { createdAt: "desc" }, take: 15 }),
  ]);

  const body: AdminRequestsResponse = {
    requests: requests.map(toSubdomainDTO),
    stats: { pending, active, suspended, rejected, total },
    logs: logs.map((log) => ({
      id: log.id,
      actor: log.actor,
      action: log.action,
      target: log.target,
      detail: log.detail,
      createdAt: log.createdAt.toISOString(),
    })),
    dnsConfigured: isCloudflareConfigured(),
  };

  return NextResponse.json(body);
}
