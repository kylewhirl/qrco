import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-10 px-6 py-16">
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.28em] text-muted-foreground">Developer Platform</p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
          Build on top of tqrco with user-scoped QR, analytics, brand, and render APIs.
        </h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          Start with API key auth, manage QR codes, query analytics, save style presets, and render production-ready SVG or PNG assets.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/docs" className="rounded-2xl border p-5 transition hover:bg-muted/30">
          <p className="text-sm font-medium">Quickstart</p>
          <p className="mt-2 text-sm text-muted-foreground">Authentication, first requests, and API conventions.</p>
        </Link>
        <Link href="/docs/qr-codes" className="rounded-2xl border p-5 transition hover:bg-muted/30">
          <p className="text-sm font-medium">QR management</p>
          <p className="mt-2 text-sm text-muted-foreground">Create, update, delete, and render QR codes.</p>
        </Link>
        <Link href="/docs/styling-and-brand" className="rounded-2xl border p-5 transition hover:bg-muted/30">
          <p className="text-sm font-medium">Brand and styles</p>
          <p className="mt-2 text-sm text-muted-foreground">Store brand defaults and reusable render presets.</p>
        </Link>
      </div>
    </div>
  );
}
