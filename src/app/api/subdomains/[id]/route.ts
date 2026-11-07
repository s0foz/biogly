import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { validateDestination } from "@/lib/validation";
import { deleteSubdomain } from "@/lib/cloudflare";
import { toSubdomainDTO } from "@/lib/dto";

type RouteContext = { params: Promise<{ id: string }> };

async function findOwned(id: string) {
  const user = await getCurrentUser();
  if (!user) return { error: "auth" as const };

  const subdomain = await db.subdomain.findUnique({
    where: { id },
    include: { owner: { select: { email: true } } },
  });
  if (!subdomain || subdomain.ownerId !== user.id) return { error: "notfound" as const };
  return { subdomain };
}

/**
 * PATCH /api/subdomains/[id] — change the destination.
 * Per Biogly's safety rule: once a subdomain is live, editing its destination
 * tears down the DNS record and sends the request back to pending review.
 */
export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const found = await findOwned(id);
  if (found.error === "auth") {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (found.error === "notfound" || !found.subdomain) {
    return NextResponse.json({ error: "Subdomain not found." }, { status: 404 });
  }

  let destination: string | undefined;
  try {
    const body = (await request.json()) as { destination?: string };
    destination = body.destination;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const destCheck = validateDestination(destination ?? "");
  if (!destCheck.valid || !destCheck.url) {
    return NextResponse.json({ error: destCheck.reason }, { status: 400 });
  }
  if (destCheck.url === found.subdomain.destination) {
    return NextResponse.json({ error: "That's already the current destination." }, { status: 400 });
  }

  // Tear down the existing DNS record, if any — it points at the old target.
  if (found.subdomain.recordId) {
    await deleteSubdomain(found.subdomain.recordId).catch(() => null);
  }

  const updated = await db.subdomain.update({
    where: { id },
    data: {
      destination: destCheck.url,
      status: "pending",
      recordId: null,
      dnsMode: null,
      reviewedAt: null,
      reviewerNote: null,
    },
    include: { owner: { select: { email: true } } },
  });

  return NextResponse.json({ subdomain: toSubdomainDTO(updated) });
}

/** DELETE /api/subdomains/[id] — release a subdomain (removes its DNS record). */
export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const found = await findOwned(id);
  if (found.error === "auth") {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (found.error === "notfound" || !found.subdomain) {
    return NextResponse.json({ error: "Subdomain not found." }, { status: 404 });
  }

  if (found.subdomain.recordId) {
    await deleteSubdomain(found.subdomain.recordId).catch(() => null);
  }

  await db.subdomain.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
