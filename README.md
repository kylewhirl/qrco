## tqrco

This repo contains the main app, the `/api/v1` REST API, and the publishable `tqrco` TypeScript SDK in [packages/tqrco](/Users/kyle/tqrco/packages/tqrco).

Canonical API origin: [https://tqrco.de](https://tqrco.de)  
Marketing domain: [https://theqrcode.co](https://theqrcode.co)

### SDK install

```bash
npm install tqrco
```

### SDK usage

```ts
import { createTqrcoClient } from "tqrco";

const client = createTqrcoClient({
  token: process.env.TQRCO_API_KEY!,
});

const qrCodes = await client.qr.list();
```

```tsx
import { TqrcoProvider, useQRCodes } from "tqrco/react";
import { QRCode } from "tqrco/components";

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

Secret keys are for server-only usage. Publishable tokens are for browser apps and are restricted by origins and scopes.

## Local app development

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
