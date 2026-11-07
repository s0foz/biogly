// Shared TypeScript types used by both API routes and UI components.

export type SubdomainStatus = "pending" | "active" | "rejected" | "suspended";

export type DnsMode = "live" | "simulated";

export interface UserDTO {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  createdAt: string;
}

export interface SubdomainDTO {
  id: string;
  name: string;
  destination: string;
  status: SubdomainStatus;
  ownerId: string;
  ownerEmail: string;
  recordId: string | null;
  dnsMode: DnsMode | null;
  reviewerNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminLogDTO {
  id: string;
  actor: string;
  action: "approve" | "reject" | "suspend" | "reactivate" | string;
  target: string;
  detail: string | null;
  createdAt: string;
}

export interface AdminStats {
  pending: number;
  active: number;
  suspended: number;
  rejected: number;
  total: number;
}

export interface AdminRequestsResponse {
  requests: SubdomainDTO[];
  stats: AdminStats;
  logs: AdminLogDTO[];
  dnsConfigured: boolean;
}
