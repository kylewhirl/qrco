# Contributing

Thanks for your interest in contributing to tqrco.

## Development Setup

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local`.
4. Fill in the environment variables needed for the area you are working on.
5. Run `npm run dev` for the main app or `npm run dev:docs` for the docs app.

## Checks

Before opening a pull request, run:

```bash
npm run check
```

For changes that affect the production app build, also run:

```bash
npm run build
```

For docs changes, run:

```bash
npm --prefix apps/docs run build
```

## Pull Requests

- Keep changes focused and describe the user-visible behavior.
- Include screenshots for UI changes.
- Document new environment variables in `.env.example`.
- Do not commit generated output, local service state, private keys, or real credentials.

## Security Issues

Please do not report security vulnerabilities in public issues. Follow [SECURITY.md](SECURITY.md).
