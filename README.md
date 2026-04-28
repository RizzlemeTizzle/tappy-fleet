# Tappy Fleet Portal

Next.js fleet admin portal for company onboarding, members, policies, billing, reimbursements, and reports.

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Set `NEXT_PUBLIC_API_URL` to the Fastify backend origin, for example `http://localhost:8001`.
4. Start development with `npm run dev`.

## Checks

- `npm run build` compiles the portal.
- `npm audit --audit-level=moderate` checks dependency advisories.

## Security Notes

The portal stores the backend access token in an HTTP-only cookie with a short lifetime matching the backend token TTL. Mutating fleet API routes are protected by same-origin checks in `proxy.ts`; keep browser calls same-origin through the Next route handlers.
