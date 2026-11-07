# Biogly

Biogly is a Next.js app for requesting and managing student project subdomains. It includes a review dashboard and optional Cloudflare DNS automation.

## Development

1. Copy `.env.example` to `.env` and set `DATABASE_URL`, `SESSION_SECRET`, and `ADMIN_EMAILS`.
2. Install dependencies with `npm install`.
3. Create/update the local database with `npm run db:dev`.
4. Start the app with `npm run dev`.

Use `npm run db:migrate` to apply checked-in Prisma migrations in a deployed environment. Configure `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ZONE_ID` to enable real DNS changes; without them approvals use simulated DNS records.

The included email-only login is an MVP flow and does not verify control of an email address. Replace it with a verified identity provider before exposing the app to real users.
