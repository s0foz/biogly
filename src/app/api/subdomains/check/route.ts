import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { validateSubdomainName } from "@/lib/validation";

/** GET /api/subdomains/check?name=x — live availability for the claim form. */
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 });
  }

  const raw = new URL(request.url).searchParams.get("name") ?? "";
  const check = validateSubdomainName(raw);

  if (!check.valid) {
    return NextResponse.json({ valid: false, available: false, reason: check.reason });
  }

  const existing = await db.subdomain.findUnique({ where: { name: check.name } });
  if (existing) {
    return NextResponse.json({ valid: true, available: false, reason: `"${check.name}" is already taken.` });
  }

  return NextResponse.json({ valid: true, available: true, reason: null });
}
