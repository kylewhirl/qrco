// src/app/dashboard/create/page.tsx
"use client";

import Link from "next/link";
import QrCodeCreator from "@/components/qr-code-creator";

export default function CreateQRPage() {
  return (
    <div className="container mx-auto p-4 sm:p-6">
      <header className="mb-6 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
        <h1 className="text-2xl font-bold">Create QR Code</h1>
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to Dashboard
        </Link>
      </header>

      <QrCodeCreator />
    </div>
  );
}
