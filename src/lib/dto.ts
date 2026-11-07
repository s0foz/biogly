// Shared DTO serializers for API responses.

import type { Subdomain, User } from "@prisma/client";
import type { DnsMode, SubdomainDTO, SubdomainStatus, UserDTO } from "@/types";

export function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    isAdmin: user.isAdmin,
    createdAt: user.createdAt.toISOString(),
  };
}

export function toSubdomainDTO(
  subdomain: Subdomain & { owner: Pick<User, "email"> }
): SubdomainDTO {
  return {
    id: subdomain.id,
    name: subdomain.name,
    destination: subdomain.destination,
    status: subdomain.status as SubdomainStatus,
    ownerId: subdomain.ownerId,
    ownerEmail: subdomain.owner.email,
    recordId: subdomain.recordId,
    dnsMode: (subdomain.dnsMode as DnsMode | null) ?? null,
    reviewerNote: subdomain.reviewerNote,
    reviewedAt: subdomain.reviewedAt?.toISOString() ?? null,
    createdAt: subdomain.createdAt.toISOString(),
    updatedAt: subdomain.updatedAt.toISOString(),
  };
}
