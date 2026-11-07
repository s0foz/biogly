import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE, isAdminEmail } from "@/lib/auth";
import { signSession } from "@/lib/session";
import { isValidEmail } from "@/lib/validation";
import { rateLimit, clientIp } from "@/lib/rate-limit";
import { toUserDTO } from "@/lib/dto";

/**
 * Dev email login (MVP): no password — identified by email alone.
 * The users table already mirrors a Supabase auth.users shape, so swapping
 * in GitHub OAuth via Supabase later only replaces this route.
 */
export async function POST(request: Request) {
  const limit = rateLimit(`login:${clientIp(request)}`, 10, 60_000);
  if (!limit.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again in a minute." },
      { status: 429 }
    );
  }

  let email: string | undefined;
  try {
    const body = (await request.json()) as { email?: string };
    email = body.email;
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const normalized = email.trim().toLowerCase();

  const user = await db.user.upsert({
    where: { email: normalized },
    create: { email: normalized, isAdmin: isAdminEmail(normalized) },
    update: { isAdmin: isAdminEmail(normalized) },
  });

  const token = await signSession({ uid: user.id, email: user.email });
  const response = NextResponse.json({ user: toUserDTO(user) });
  response.cookies.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
