import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  CalendarClock,
  Check,
  ExternalLink,
  Globe2,
  PackageSearch,
  QrCode,
  RefreshCw,
  ScanBarcode,
} from "lucide-react";

import Footer from "@/components/footer";
import Header from "@/components/header";

export const metadata: Metadata = {
  title: "Retail 2D Barcode & GS1 Digital Link Builder | The QR Code Co",
  description:
    "Prepare product packaging for Ambition 2027 with dynamic QR Codes using GS1 Digital Link syntax, editable destinations, brand domains, and scan analytics.",
};

const outcomes = [
  {
    icon: ScanBarcode,
    eyebrow: "At checkout",
    title: "Carry the GTIN",
    body: "Give upgraded retail point-of-sale systems the product identifier they expect from a next-generation barcode.",
  },
  {
    icon: Boxes,
    eyebrow: "In operations",
    title: "Add useful attributes",
    body: "Optionally encode batch, lot, serial, and expiry data for traceability and operational use cases.",
  },
  {
    icon: Globe2,
    eyebrow: "After the scan",
    title: "Own the experience",
    body: "Send shoppers to brand-authorized product content through a URL you can update after packaging is printed.",
  },
];

const transitionSteps = [
  "Keep the existing linear barcode while retail partners upgrade.",
  "Add a QR Code with GS1 Digital Link syntax near the linear barcode.",
  "Test the final symbol, substrate, placement, and point-of-sale workflow.",
  "Retire dual marking only when your trading-partner ecosystem is ready.",
];

function BarcodePanel() {
  return (
    <div className="relative mx-auto w-full max-w-[520px]">
      <div className="absolute -inset-5 rounded-[2.5rem] bg-[#c8f33d]/18 blur-3xl" />
      <div className="relative rotate-[1.5deg] rounded-[2rem] border border-white/15 bg-[#f7f2e8] p-5 text-[#182033] shadow-[0_44px_110px_-60px_#000] sm:p-7">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-[#667085]">Sample product</p>
            <h2 className="mt-2 max-w-[260px] text-2xl font-extrabold leading-[1.05] tracking-[-0.045em] sm:text-3xl">
              One package.
              <br />
              Two scanning eras.
            </h2>
          </div>
          <span className="rounded-full border border-[#182033]/15 px-3 py-1 text-[9px] font-extrabold uppercase tracking-[0.16em]">
            Transition pack
          </span>
        </div>
        <div className="mt-12 grid grid-cols-[minmax(0,1fr)_116px] items-end gap-7">
          <div>
            <div
              aria-label="Illustration of a linear barcode"
              className="h-20 w-full bg-[repeating-linear-gradient(90deg,#111827_0,#111827_2px,transparent_2px,transparent_5px,#111827_5px,#111827_9px,transparent_9px,transparent_12px)]"
            />
            <p className="mt-2 text-center font-mono text-[10px] tracking-[0.14em]">0 950600 013435</p>
            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-[#667085]">
              <span className="size-2 rounded-full bg-[#ff785a]" />
              Linear code stays during transition
            </div>
          </div>
          <div>
            <div className="relative grid aspect-square place-items-center rounded-md bg-white p-2 ring-1 ring-black/10">
              <QrCode className="size-full" strokeWidth={1.35} />
              <span className="absolute -right-2 -top-2 rounded-full bg-[#1756e8] px-2 py-1 text-[8px] font-extrabold uppercase tracking-wider text-white">
                Live
              </span>
            </div>
            <p className="mt-2 text-center text-[9px] font-extrabold uppercase tracking-[0.12em]">GS1 Digital Link</p>
          </div>
        </div>
        <div className="mt-7 flex items-center justify-between border-t border-[#182033]/15 pt-4 text-[10px] font-bold">
          <span className="text-[#667085]">Destination last updated</span>
          <span className="inline-flex items-center gap-1.5 text-[#1756e8]"><RefreshCw className="size-3" />Today · no reprint</span>
        </div>
      </div>
    </div>
  );
}

export default function Retail2dPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <Header />
      <main>
        <section className="relative overflow-hidden bg-[#101a2d] py-16 text-white sm:py-20 lg:py-24">
          <div aria-hidden="true" className="absolute -left-40 top-12 size-[28rem] rounded-full bg-[#1756e8]/30 blur-[110px]" />
          <div aria-hidden="true" className="absolute -right-32 bottom-0 size-[26rem] rounded-full bg-[#c8f33d]/12 blur-[100px]" />
          <div className="relative mx-auto grid max-w-[1240px] gap-14 px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.82fr)] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">
                <CalendarClock className="size-4 text-[#c8f33d]" />
                Retail 2D · Ambition 2027
              </div>
              <h1 className="font-display mt-6 max-w-4xl text-[clamp(3.25rem,7vw,6.7rem)] leading-[0.88] tracking-[-0.065em]">
                Your barcode is becoming a product channel.
              </h1>
              <p className="mt-7 max-w-2xl text-base font-medium leading-8 text-white/68 sm:text-lg">
                Build a dynamic QR Code using GS1 Digital Link syntax—designed to identify the product at retail and connect every package to an editable digital experience.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/sign-up" className="brand-button bg-[#c8f33d] text-[#172100]">
                  Build your first product code
                  <ArrowRight className="size-4" />
                </Link>
                <Link href="/dashboard/retail" className="brand-button border border-white/20 bg-white/[0.06] text-white hover:bg-white/10">
                  Open retail workspace
                </Link>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold text-white/55">
                <span className="inline-flex items-center gap-2"><Check className="size-3.5 text-[#c8f33d]" />GTIN check-digit validation</span>
                <span className="inline-flex items-center gap-2"><Check className="size-3.5 text-[#c8f33d]" />Editable destinations</span>
                <span className="inline-flex items-center gap-2"><Check className="size-3.5 text-[#c8f33d]" />Brand-owned domains</span>
              </div>
            </div>
            <BarcodePanel />
          </div>
        </section>

        <section className="border-b bg-[var(--brand-lime)] px-5 py-4 text-[#263600] sm:px-8">
          <div className="mx-auto flex max-w-[1240px] flex-col gap-2 text-sm font-bold sm:flex-row sm:items-center sm:justify-between">
            <p>Ambition 2027 is an industry readiness goal—not a blanket mandate to remove every 1D barcode.</p>
            <Link
              href="https://support.gs1.org/support/solutions/articles/43000743530-what-is-ambition-2027-in-retail-"
              target="_blank"
              rel="noreferrer"
              className="inline-flex shrink-0 items-center gap-1.5 underline decoration-[#263600]/30 underline-offset-4"
            >
              Read the GS1 explanation <ExternalLink className="size-3.5" />
            </Link>
          </div>
        </section>

        <section className="bg-[var(--brand-paper)] py-20 sm:py-28">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-blue)]">One physical mark</p>
                <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">The next-generation barcode can serve different people at different moments.</p>
              </div>
              <h2 className="font-display text-[clamp(2.8rem,6vw,5.6rem)] leading-[0.94] tracking-[-0.055em]">
                More than a checkout beep.
              </h2>
            </div>
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {outcomes.map((outcome, index) => {
                const Icon = outcome.icon;
                return (
                  <article key={outcome.title} className="group min-h-[340px] rounded-[1.75rem] border bg-card p-7 shadow-[0_24px_60px_-50px_var(--brand-shadow)] transition duration-300 hover:-translate-y-1 sm:p-8">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-extrabold text-muted-foreground">0{index + 1}</span>
                      <span className="grid size-12 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--brand-blue)_10%,var(--card))] text-[var(--brand-blue)]">
                        <Icon className="size-6" strokeWidth={1.8} />
                      </span>
                    </div>
                    <p className="mt-16 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[var(--brand-blue)]">{outcome.eyebrow}</p>
                    <h3 className="mt-2 text-2xl font-extrabold tracking-[-0.035em]">{outcome.title}</h3>
                    <p className="mt-4 text-sm font-medium leading-6 text-foreground/65">{outcome.body}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-background py-20 sm:py-28">
          <div className="mx-auto grid max-w-[1240px] gap-12 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
            <div className="lg:sticky lg:top-24">
              <div className="inline-flex size-12 items-center justify-center rounded-2xl bg-[#101a2d] text-[#c8f33d]">
                <PackageSearch className="size-6" />
              </div>
              <h2 className="font-display mt-6 max-w-xl text-[clamp(2.7rem,5vw,4.8rem)] leading-[0.95] tracking-[-0.055em]">
                Transition without breaking checkout.
              </h2>
              <p className="mt-5 max-w-lg text-sm font-medium leading-7 text-muted-foreground sm:text-base">
                Retail systems will upgrade on different timelines. The practical move is a controlled dual-marking period, backed by testing with printers and trading partners.
              </p>
            </div>
            <div className="space-y-3">
              {transitionSteps.map((step, index) => (
                <div key={step} className="grid grid-cols-[48px_minmax(0,1fr)] gap-4 rounded-2xl border bg-card p-5 sm:p-6">
                  <span className="grid size-10 place-items-center rounded-xl bg-[var(--brand-lime)] text-sm font-extrabold text-[#263600]">{index + 1}</span>
                  <p className="self-center text-sm font-bold leading-6 sm:text-base">{step}</p>
                </div>
              ))}
              <div className="rounded-2xl border border-[color-mix(in_srgb,var(--brand-blue)_24%,var(--border))] bg-[color-mix(in_srgb,var(--brand-blue)_6%,var(--card))] p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <BadgeCheck className="mt-0.5 size-5 shrink-0 text-[var(--brand-blue)]" />
                  <div>
                    <h3 className="font-extrabold">The 50 mm rule, correctly understood</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      GS1 testing says the 2D code should be within 50 mm of the linear barcode&apos;s centre during dual marking. It is a proximity guideline—not a universal 50 mm QR-code size.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[var(--brand-paper)] px-4 pb-20 sm:px-6 sm:pb-28">
          <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[2rem] bg-[var(--brand-action)] px-5 py-16 text-white shadow-[0_32px_90px_-46px_var(--brand-action)] sm:px-10 sm:py-20">
            <div aria-hidden="true" className="absolute -right-20 -top-24 size-72 rounded-full bg-white/10 blur-2xl" />
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-lime)]">Start with one SKU</p>
                <h2 className="font-display mt-4 max-w-3xl text-[clamp(2.8rem,6vw,5.5rem)] leading-[0.92] tracking-[-0.06em]">
                  Make the next packaging run updatable.
                </h2>
              </div>
              <Link href="/sign-up" className="brand-button shrink-0 bg-[var(--brand-lime)] text-[var(--brand-ink)]">
                Create a retail Digital Link
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
