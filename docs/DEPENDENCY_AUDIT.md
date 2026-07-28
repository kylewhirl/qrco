# Dependency Audit

This project keeps dependency audit results visible so maintainers can distinguish known upstream issues from newly introduced risk.

## Current Status

| Workspace | Status | Notes |
| --- | --- | --- |
| Root app (production) | No critical/high/moderate findings | `npm audit --omit=dev` reports four low findings inherited from Stack Auth's current `elliptic` dependency. No forward-compatible upstream fix is available. |
| Docs app (production) | Clean | `npm --prefix apps/docs audit --omit=dev` reports zero vulnerabilities. |
| Development tooling | Known findings remain | Full audits report nine high findings in the ESLint plugin chain through `minimatch` and `brace-expansion`. Forcing the patched `brace-expansion` major breaks the older plugin API, so the advisory remains isolated to local/CI lint tooling pending upstream updates. |

## Maintainer Actions

- Re-run `npm audit` before each release.
- Prefer upstream package updates over incompatible major-version overrides.
- Do not suppress audit output in CI unless the advisory has a documented mitigation and owner.
- Re-check this file whenever `@stackframe/*`, `next-auth`, `eslint-config-next`, `minimatch`, `brace-expansion`, or `elliptic` changes.
