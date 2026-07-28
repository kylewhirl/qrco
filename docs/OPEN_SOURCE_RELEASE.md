# Open Source Release Checklist

Use this checklist before or immediately after making the repository public.

## Repository State

- [ ] Commit the removal of `packages/tqrco/node_modules`.
- [ ] Confirm `git status` contains only intentional source changes.
- [ ] Run `npm run check`.
- [ ] Run `npm --prefix apps/docs install` and `npm --prefix apps/docs run build` when local disk space allows reinstalling docs dependencies.
- [ ] Run `npm run build`.
- [ ] Run `git diff --check`.
- [ ] Run a secret scan against full history, not only the current tree.

## Secret Rotation

Rotate any real credentials that may have existed in local files, deployment config, logs, screenshots, or old commits:

- [ ] Stack Auth keys
- [ ] Neon/Postgres URLs
- [ ] Stripe secret and webhook keys
- [ ] Cloudflare R2 access keys
- [ ] Vercel tokens
- [ ] Domain Connect private keys
- [ ] Mistral API keys
- [ ] Any manually created API keys used during testing

## GitHub Settings

Configure these in GitHub before or immediately after publishing:

- [ ] Push `.github/workflows/ci.yml` to `main`.
- [ ] Enable branch protection for `main`.
- [ ] Require CI checks before merge after the first CI run has completed.
- [ ] Require pull request review before merge.
- [ ] Enable secret scanning and push protection.
- [ ] Enable Dependabot alerts and security updates.
- [ ] Enable private vulnerability reporting.
- [ ] Add repository topics and a concise description.

## Legal And Assets

- [ ] Confirm the MIT copyright holder in `LICENSE`.
- [ ] Complete `docs/ASSET_LICENSES.md`.
- [ ] Remove unused starter assets.
- [ ] Confirm the public security contact in `SECURITY.md`.

## Communication

- [ ] Decide whether issues are open for support, bugs only, or feature requests.
- [ ] Publish a short roadmap or project status statement.
- [ ] Tag the first public release after visibility changes.
