// Hybrid Cloudflare DNS automation.
//
// When CLOUDFLARE_API_TOKEN + CLOUDFLARE_ZONE_ID are configured, real DNS
// records are created on api.cloudflare.com. Without them, the same functions
// simulate record creation and return a "sim_*" record id so the whole
// approval flow stays demoable in development.

import { ROOT_DOMAIN } from "@/lib/validation";

const CF_API_BASE = "https://api.cloudflare.com/client/v4";
const CF_TIMEOUT_MS = 15_000;

export type DnsMode = "live" | "simulated";

export interface DnsWriteResult {
  recordId: string;
  mode: DnsMode;
}

export interface DnsDeleteResult {
  mode: "live" | "simulated" | "skipped";
}

export function isCloudflareConfigured(): boolean {
  return Boolean(process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ZONE_ID);
}

function fullRecordName(name: string): string {
  return `${name}.${ROOT_DOMAIN}`;
}

function isIpv4(host: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(host);
}

interface CloudflareResponse<T> {
  success: boolean;
  errors: { code: number; message: string }[];
  result: T;
}

async function cfFetch<T>(
  path: string,
  init: { method: string; body?: unknown }
): Promise<T> {
  const response = await fetch(`${CF_API_BASE}${path}`, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(CF_TIMEOUT_MS),
  });

  const json = (await response.json().catch(() => null)) as CloudflareResponse<T> | null;
  if (!response.ok || !json?.success) {
    const message = json?.errors?.[0]?.message ?? `Cloudflare API error (HTTP ${response.status})`;
    throw new Error(message);
  }
  return json.result;
}

interface DnsRecord {
  id: string;
  type: string;
  name: string;
  content: string;
}

/** Creates the DNS record for an approved subdomain (CNAME, or A for IPv4 targets). */
export async function createSubdomain(name: string, destination: string): Promise<DnsWriteResult> {
  if (!isCloudflareConfigured()) {
    return { recordId: `sim_${crypto.randomUUID()}`, mode: "simulated" };
  }

  const url = new URL(destination);
  const type = isIpv4(url.hostname) ? "A" : "CNAME";

  const record = await cfFetch<DnsRecord>(
    `/zones/${process.env.CLOUDFLARE_ZONE_ID}/dns_records`,
    {
      method: "POST",
      body: {
        type,
        name: fullRecordName(name),
        content: url.hostname,
        ttl: 3600,
        proxied: false,
      },
    }
  );
  return { recordId: record.id, mode: "live" };
}

/** Removes the DNS record for a suspended or deleted subdomain. */
export async function deleteSubdomain(recordId: string): Promise<DnsDeleteResult> {
  if (recordId.startsWith("sim_")) return { mode: "simulated" };
  if (!isCloudflareConfigured()) return { mode: "simulated" };

  await cfFetch(`/zones/${process.env.CLOUDFLARE_ZONE_ID}/dns_records/${recordId}`, {
    method: "DELETE",
  });
  return { mode: "live" };
}

/** Updates the destination of an existing DNS record. */
export async function updateSubdomain(recordId: string, destination: string): Promise<DnsDeleteResult> {
  if (recordId.startsWith("sim_")) return { mode: "simulated" };
  if (!isCloudflareConfigured()) return { mode: "simulated" };

  const url = new URL(destination);
  const type = isIpv4(url.hostname) ? "A" : "CNAME";

  await cfFetch(`/zones/${process.env.CLOUDFLARE_ZONE_ID}/dns_records/${recordId}`, {
    method: "PATCH",
    body: { type, content: url.hostname },
  });
  return { mode: "live" };
}
