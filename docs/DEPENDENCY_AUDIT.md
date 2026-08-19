# Dependency Audit

This project keeps dependency audit results visible so maintainers can distinguish known upstream issues from newly introduced risk.

## Current Status

| Workspace | Status | Notes |
| --- | --- | --- |
| Root app (production) | No critical/high/moderate findings | `npm audit --omit=dev` reports four low findings inherited from Stack Auth's current `elliptic` dependency. No forward-compatible upstream fix is available. |
| Docs app (production) | Clean | `npm --prefix apps/docs audit --omit=dev` reports zero vulnerabilities. |
| Full dependency graph | No additional findings | The full root audit reports the same four low Stack Auth findings; the full docs audit is clean. |

## Compatibility Overrides

- `deepmerge-ts@8.0.1` replaces Prisma 6's vulnerable `7.1.5` transitive dependency. Prisma's config loader uses the stable `deepmerge` export, and the application build exercises the config and migration path.
- Stack Auth's direct `lucide-react` dependency is held at `0.523.0`, which supports React 19. Remove the override after Stack Auth updates its own dependency range.
- Do not use `npm audit fix --force` for the remaining low findings: npm resolves them by downgrading `@stackframe/stack` to `2.5.30`, which would discard the current auth SDK line.

## Maintainer Actions

- Re-run `npm audit` before each release.
- Prefer upstream package updates over incompatible major-version overrides.
- Do not suppress audit output in CI unless the advisory has a documented mitigation and owner.
- Re-check this file whenever `@stackframe/*`, `deepmerge-ts`, `lucide-react`, `prisma`, or `elliptic` changes.
