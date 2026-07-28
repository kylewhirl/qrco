import { ArrowRight, Boxes, CalendarClock, Link2, ScanLine } from "lucide-react";

import { RetailDigitalLinkBuilder } from "@/components/dashboard/retail-digital-link-builder";
import { Badge } from "@/components/ui/badge";

const opportunityCards = [
  {
    icon: ScanLine,
    label: "Point of sale",
    value: "GTIN-ready",
    detail: "Encode the product identifier in a retail-readable QR Code.",
  },
  {
    icon: Link2,
    label: "Digital layer",
    value: "Editable",
    detail: "Change the destination without changing printed packaging.",
  },
  {
    icon: Boxes,
    label: "Operations",
    value: "Lot-aware",
    detail: "Optionally carry batch, serial, and expiry data.",
  },
];

export default function RetailDigitalLinkPage() {
  return (
    <div className="flex-1 space-y-6 p-4 pt-6 md:p-8">
      <section className="relative overflow-hidden rounded-[30px] border border-[#203052] bg-[#101a2d] p-6 text-white shadow-[0_30px_80px_-55px_#101a2d] md:p-8 lg:p-10">
        <div aria-hidden="true" className="absolute -right-20 -top-24 size-80 rounded-full bg-[#c8f33d]/15 blur-3xl" />
        <div aria-hidden="true" className="absolute bottom-0 right-0 h-28 w-2/5 bg-[repeating-linear-gradient(90deg,transparent_0,transparent_8px,rgba(255,255,255,.09)_8px,rgba(255,255,255,.09)_11px)] opacity-45" />
        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_540px] xl:items-end">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-white hover:bg-white/10">
                <CalendarClock className="mr-1.5 size-3.5 text-[#c8f33d]" />
                Ambition 2027
              </Badge>
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/55">Retail 2D transition</span>
            </div>
            <h1 className="font-display mt-5 max-w-3xl text-[clamp(2.4rem,5vw,4.7rem)] leading-[0.94] tracking-[-0.055em]">
              Turn a product code into living infrastructure.
            </h1>
            <p className="mt-5 max-w-2xl text-sm font-medium leading-7 text-white/70 md:text-base">
              Create a QR Code with GS1 Digital Link syntax for retail point-of-sale, traceability, and consumer experiences—while keeping the destination under your control.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {opportunityCards.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.label} className="rounded-2xl border border-white/12 bg-white/[0.07] p-4 backdrop-blur-sm">
                  <Icon className="size-4 text-[#c8f33d]" />
                  <p className="mt-4 text-[10px] font-bold uppercase tracking-[0.16em] text-white/50">{card.label}</p>
                  <p className="mt-1 text-lg font-extrabold tracking-[-0.03em]">{card.value}</p>
                  <p className="mt-2 text-xs leading-5 text-white/55">{card.detail}</p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <div className="flex flex-col gap-3 rounded-2xl border border-[color-mix(in_srgb,var(--brand-blue)_20%,var(--border))] bg-[color-mix(in_srgb,var(--brand-blue)_6%,var(--card))] px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="leading-6 text-foreground/75">
          <strong className="text-foreground">Important:</strong> Ambition 2027 is a global industry readiness goal, not a blanket mandate to remove every 1D barcode.
        </p>
        <a
          href="https://support.gs1.org/support/solutions/articles/43000743530-what-is-ambition-2027-in-retail-"
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 font-bold text-[var(--brand-blue)] hover:underline"
        >
          GS1 explainer
          <ArrowRight className="size-4" />
        </a>
      </div>

      <RetailDigitalLinkBuilder />
    </div>
  );
}
