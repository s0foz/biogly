import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { validateDestination, validateSubdomainName, MAX_SUBDOMAINS_PER_USER } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { toSubdomainDTO } from "@/lib/dto";

/** GET /api/subdomains — the current student's subdomains. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const subdomains = await db.subdomain.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { owner: { select: { email: true } } },
  });

  return NextResponse.json({
    subdomains: subdomains.map(toSubdomainDTO),
    limit: MAX_SUBDOMAINS_PER_USER,
  });
}

/** POST /api/subdomains — file a new subdomain request (status: pending). */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const limit = rateLimit(`create:${user.id}:${clientIp(request)}`, 10, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Slow down a little — too many requests." },
      { status: 429 }
    );
  }

  let body: { name?: string; destination?: string };
  try {
    body = (await request.json()) as { name?: string; destination?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const nameCheck = validateSubdomainName(body.name ?? "");
  if (!nameCheck.valid) {
    return NextResponse.json({ error: nameCheck.reason }, { status: 400 });
  }

  const destCheck = validateDestination(body.destination ?? "");
  if (!destCheck.valid || !destCheck.url) {
    return NextResponse.json({ error: destCheck.reason }, { status: 400 });
  }

  const owned = await db.subdomain.count({ where: { ownerId: user.id } });
  if (owned >= MAX_SUBDOMAINS_PER_USER) {
    return NextResponse.json(
      { error: `You've reached the limit of ${MAX_SUBDOMAINS_PER_USER} subdomains per account.` },
      { status: 400 }
    );
  }

  const taken = await db.subdomain.findUnique({ where: { name: nameCheck.name } });
  if (taken) {
    return NextResponse.json({ error: `"${nameCheck.name}" is already taken.` }, { status: 409 });
  }

  const created = await db.subdomain.create({
    data: {
      name: nameCheck.name,
      destination: destCheck.url,
      ownerId: user.id,
      status: "pending",
    },
    include: { owner: { select: { email: true } } },
  });

  return NextResponse.json({ subdomain: toSubdomainDTO(created) }, { status: 201 });
}
