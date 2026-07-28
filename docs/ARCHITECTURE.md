# Architecture

This repository contains three related surfaces:

- Main app: `src/app`, a Next.js App Router application for public pages, dashboard pages, and API routes.
- Service layer: `src/lib`, shared server-side modules for persistence, billing, storage, QR rendering, API auth, domains, and URL generation.
- SDK package: `packages/tqrco`, a publishable TypeScript SDK with React hooks and embeddable QR components.
- Docs app: `apps/docs`, a standalone Fumadocs application with its own lockfile and dependency install.

## Runtime Boundaries

- Browser code must only receive publishable tokens or public configuration.
- Server-only code reads secret environment variables and should stay behind Route Handlers or server components.
- `src/lib/db.ts`, `src/lib/storage.ts`, `src/lib/stripe.ts`, and `src/lib/custom-domains.ts` are server-side integration modules.
- `packages/tqrco` is intended for external consumers and should not depend on private app internals.

## Request Flow

1. Dashboard and public pages render through `src/app`.
2. Public API consumers call `/api/v1/*`.
3. API key and publishable token checks run through auth helpers in `src/lib`.
4. QR data is created, rendered, and updated through service-layer functions.
5. QR image assets are stored in Cloudflare R2 when upload features are enabled.
6. Billing state is resolved through Stripe and app billing helpers.
7. Custom domains are managed through Vercel domain APIs when configured.

## QR Rendering

QR rendering uses `qr-code-styling`, `jsdom`, and `canvas`. The server renderer lives in `src/lib/qr-renderer.ts`; the SDK and UI renderers have client-side paths for browser previews and embeddable components.

## Security Notes

- Treat all `NEXT_PUBLIC_*` values as public browser-visible configuration.
- Keep `.env.local`, `.vercel`, private keys, production exports, and generated output out of git.
- State-changing API routes should enforce authentication and authorization at the route or service boundary.
- The app sets conservative global security headers in `next.config.ts`; stronger CSP may require additional runtime testing.
