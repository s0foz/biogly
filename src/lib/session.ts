// Edge-safe session utilities — pure Web Crypto, no Node/Prisma imports.
// Works in middleware (edge runtime), route handlers and server components.

export const SESSION_COOKIE_NAME = "biogly_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface SessionPayload {
  uid: string;
  email: string;
  iat: number;
  exp: number;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getSessionSecret(): string {
  return process.env.SESSION_SECRET || "biogly-dev-secret-do-not-use-in-production";
}

let cachedKey: Promise<CryptoKey> | null = null;

function getHmacKey(): Promise<CryptoKey> {
  if (!cachedKey) {
    cachedKey = crypto.subtle.importKey(
      "raw",
      encoder.encode(getSessionSecret()),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign", "verify"]
    );
  }
  return cachedKey;
}

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = "";
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function signSession(payload: Omit<SessionPayload, "iat" | "exp">): Promise<string> {
  const now = Date.now();
  const full: SessionPayload = {
    ...payload,
    iat: now,
    exp: now + SESSION_MAX_AGE * 1000,
  };
  const body = toBase64Url(encoder.encode(JSON.stringify(full)));
  const signature = await crypto.subtle.sign("HMAC", await getHmacKey(), encoder.encode(body));
  return `${body}.${toBase64Url(signature)}`;
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return null;
  const [body, signature] = parts;
  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await getHmacKey(),
      fromBase64Url(signature),
      encoder.encode(body)
    );
    if (!valid) return null;
    const payload = JSON.parse(decoder.decode(fromBase64Url(body))) as SessionPayload;
    if (!payload?.uid || !payload?.email || typeof payload.exp !== "number") return null;
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
