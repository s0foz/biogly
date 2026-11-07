import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminUser } from "@/lib/auth";
import { deleteSubdomain } from "@/lib/cloudflare";
import { toSubdomainDTO } from "@/lib/dto";

/** POST /api/admin/reject — refuse a pending/suspended request, with an optional note. */
export async function POST(request: Request) {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required." }, { status: 403 });
  }

  let id: string | undefined;
  let note: string | undefined;
  try {
    const body = (await request.json()) as { id?: string; note?: string };
    id = body.id;
    note = body.note;
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
  if (subdomain.status === "active") {
    return NextResponse.json(
      { error: "This subdomain is live. Suspend it first, then reject." },
      { status: 400 }
    );
  }

  // Safety: make sure no stale DNS record survives a rejection.
  if (subdomain.recordId) {
    await deleteSubdomain(subdomain.recordId).catch(() => null);
  }

  const updated = await db.subdomain.update({
    where: { id },
    data: {
      status: "rejected",
      recordId: null,
      dnsMode: null,
      reviewedAt: new Date(),
      reviewerNote: note?.trim() || null,
    },
    include: { owner: { select: { email: true } } },
  });

  await db.adminLog.create({
    data: {
      actor: admin.email,
      action: "reject",
      target: subdomain.name,
      detail: note?.trim() || "Rejected without a note",
    },
  });

  return NextResponse.json({ subdomain: toSubdomainDTO(updated) });
}
