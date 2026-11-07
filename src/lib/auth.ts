// Server-side auth helpers — session cookie, current user, admin allowlist.

import { cookies } from "next/headers";
import { db } from "@/lib/db";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
  verifySessionToken,
  type SessionPayload,
} from "@/lib/session";

export { SESSION_COOKIE_NAME, SESSION_MAX_AGE };
export type { SessionPayload };

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
}

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  return getAdminEmails().includes(email.toLowerCase());
}

/** Reads and verifies the session cookie, then loads the user from the DB. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = await verifySessionToken(token);
  if (!payload) return null;

  const user = await db.user.findUnique({ where: { id: payload.uid } });
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: isAdminEmail(user.email),
  };
}

/** Returns the current user when they are on the admin allowlist, else null. */
export async function getAdminUser(): Promise<SessionUser | null> {
  const user = await getCurrentUser();
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}
