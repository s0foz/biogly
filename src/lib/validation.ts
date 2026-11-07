// Validation rules for subdomain names and destination URLs.

export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "biogly.tech";
export const MIN_NAME_LENGTH = 3;
export const MAX_NAME_LENGTH = 30;
export const MAX_SUBDOMAINS_PER_USER = 5;

/** Names that could clash with platform infrastructure or mislead visitors. */
export const RESERVED_NAMES: ReadonlySet<string> = new Set([
  "www", "api", "admin", "app", "biogly", "login", "logout", "signup", "dashboard",
  "mail", "smtp", "ftp", "ns1", "ns2", "cdn", "static", "assets", "status",
  "blog", "docs", "help", "support", "about", "contact", "terms", "privacy",
  "abuse", "report", "root", "dev", "staging", "test", "beta", "auth",
  "account", "billing", "payment", "security", "legal", "null", "undefined",
]);

export interface NameValidation {
  valid: boolean;
  name: string;
  reason?: string;
}

export function validateSubdomainName(raw: string): NameValidation {
  const name = raw.trim().toLowerCase();

  if (!name) return { valid: false, name, reason: "Enter a name for your subdomain." };
  if (name.length < MIN_NAME_LENGTH) {
    return { valid: false, name, reason: `Must be at least ${MIN_NAME_LENGTH} characters.` };
  }
  if (name.length > MAX_NAME_LENGTH) {
    return { valid: false, name, reason: `Must be at most ${MAX_NAME_LENGTH} characters.` };
  }
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(name)) {
    return {
      valid: false,
      name,
      reason: "Lowercase letters, numbers and hyphens only — must start and end with a letter or number.",
    };
  }
  if (RESERVED_NAMES.has(name)) {
    return { valid: false, name, reason: `"${name}" is reserved by Biogly.` };
  }
  return { valid: true, name };
}

export interface DestinationValidation {
  valid: boolean;
  url?: string;
  reason?: string;
}

export function validateDestination(raw: string): DestinationValidation {
  const trimmed = raw.trim();
  if (!trimmed) return { valid: false, reason: "Enter the destination URL." };

  let parsed: URL;
  try {
    parsed = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    return { valid: false, reason: "That doesn't look like a valid URL." };
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { valid: false, reason: "Only http:// and https:// destinations are allowed." };
  }
  if (parsed.hostname === ROOT_DOMAIN || parsed.hostname.endsWith(`.${ROOT_DOMAIN}`)) {
    return { valid: false, reason: "You can't point a Biogly subdomain back at Biogly itself." };
  }
  return { valid: true, url: parsed.toString() };
}

export function isValidEmail(raw: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.trim());
}
