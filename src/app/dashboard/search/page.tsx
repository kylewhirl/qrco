import { QRSearchClient } from "@/components/dashboard/qr-search-client";
import { getAllQRCodes } from "@/lib/qr-service";

export default async function DashboardSearchPage() {
  const qrCodes = await getAllQRCodes();

  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <section className="space-y-2">
        <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Library Search</p>
        <h1 className="text-3xl font-bold tracking-tight">Search</h1>
        <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
          Find QR codes fast across names, payloads, public URLs, and activity metadata.
        </p>
      </section>

      <QRSearchClient qrCodes={qrCodes} />
    </div>
  );
}
