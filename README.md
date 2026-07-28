# tqrco

tqrco is a Next.js QR-code platform with a public REST API, dashboard UI, docs site, and a publishable TypeScript SDK.

## What is in this repo

- `src/app`: main Next.js app, dashboard, public pages, and API routes
- `src/lib`: service-layer code for QR rendering, storage, billing, domains, and API auth
- `packages/tqrco`: TypeScript SDK, React hooks, and reusable QR components
- `apps/docs`: Fumadocs-powered documentation site
- `scripts`: local operational scripts for style assets and billing test data

The SDK defaults to `https://tqrco.de` as the API origin. The marketing domain is `https://theqrcode.co`.

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- Accounts and credentials for the external services you enable locally

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Fill in the values needed for the features you plan to run. Many dashboard and API flows require external services such as Stack Auth, Neon/Postgres, Stripe, Cloudflare R2, Vercel, and Mistral.

Start the main app:

```bash
npm run dev
```

Open `http://localhost:3002`.

Start the docs site:

```bash
npm run dev:docs
```

Open `http://localhost:3003`.

## Useful Scripts

- `npm run dev`: run the main app on port 3002
- `npm run dev:docs`: run the docs app on port 3003
- `npm run dev:all`: run both apps
- `npm run lint`: run ESLint
- `npm run check`: run lint, TypeScript, and SDK build checks
- `npm run check:docs`: build the docs app
- `npm run build:sdk`: build the `tqrco` package
- `npm run build`: production build for the main app

## SDK

Install:

```bash
npm install tqrco
```

Server-side usage:

```ts
import { createTqrcoClient } from "tqrco";

const client = createTqrcoClient({
  token: process.env.TQRCO_API_KEY!,
});

const qrCodes = await client.qr.list();
```

React usage:

```tsx
import { QRCode } from "tqrco/components";
import { TqrcoProvider, useQRCodes } from "tqrco/react";

function QRList() {
  const { data } = useQRCodes();

  return (
    <div>
      {data?.map((qr) => <QRCode key={qr.id} qrId={qr.id} />)}
    </div>
  );
}

export function App() {
  return (
    <TqrcoProvider options={{ token: import.meta.env.VITE_TQRCO_PUBLISHABLE_TOKEN }}>
      <QRList />
    </TqrcoProvider>
  );
}
```

Secret API keys are for server-only usage. Publishable tokens are intended for browser apps and should be restricted by origins and scopes.

## Security

Do not commit `.env.local`, `.vercel`, private keys, production exports, or generated build output. Use `.env.example` for documenting configuration without secrets.

To report a vulnerability, see [SECURITY.md](SECURITY.md).

## Project Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [Asset license review](docs/ASSET_LICENSES.md)
- [Dependency audit](docs/DEPENDENCY_AUDIT.md)
- [Open source release checklist](docs/OPEN_SOURCE_RELEASE.md)
- [Maintainer operations](docs/maintainers/OPERATIONS.md)

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
