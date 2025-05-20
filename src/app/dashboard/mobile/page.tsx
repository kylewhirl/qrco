// src/app/dashboard/create/page.tsx
"use client";

import Link from "next/link";
import QrCodeCreator from "@/components/mobile-qr-code-creator";

export default function CreateQRPage() {
  return (
    <div className="container mx-auto p-6">
      {/* Page header */}
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create QR Code</h1>
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground hover:underline"
        >
          ← Back to Dashboard
        </Link>
      </header>

      {/* Main creator component */}
      <QrCodeCreator />
    </div>
  );
}