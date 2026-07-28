# Maintainer Operations

The scripts in this repository include project-maintainer workflows that require private service credentials. They are useful for the hosted product, but they are not required for ordinary contributors.

## Public Contributor Scripts

- `npm run dev`
- `npm run dev:docs`
- `npm run check`
- `npm run build:sdk`
- `npm run build`
- `npm --prefix apps/docs run build`

## Maintainer-Only Scripts

- `npm run seed:billing-users`
- `npm run verify:billing-users`
- `scripts/import-whispering-vine-qr.mjs` (ignored by git)

These scripts require private Stack Auth and Stripe credentials. Do not run them against production unless you understand their side effects.

## Credential Handling

- Store credentials in local `.env.local` or the deployment secret manager.
- Do not paste credentials into issues, pull requests, logs, or screenshots.
- Rotate credentials before publishing the repository if there is any chance they were committed or exposed.
