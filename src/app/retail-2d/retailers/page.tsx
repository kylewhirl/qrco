import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, ScanBarcode, Store, TestTube2 } from "lucide-react";

import Footer from "@/components/footer";
import Header from "@/components/header";
import {
  CheckoutTestingVisual,
  PrivateLabelFlowVisual,
  StoreReadinessVisual,
} from "@/components/retail2d/retail-2d-visuals";

export const metadata: Metadata = {
  title: "Retail 2D for Retailers | The QR Code Co.",
  description:
    "Prepare scanners, POS systems, self-checkout, and private-label products for 2D barcode acceptance.",
};

const readinessItems = [
  ["Scanner decode", "Can the lane read the 2D symbol at the package angle and distance your stores actually use?"],
  ["POS behavior", "Does the system turn the product identifier into one item, with the right data passed downstream?"],
  ["Self-checkout", "Does the customer-facing flow work without adding confusion or a second scan?"],
  ["Trading partners", "Which suppliers and private-label teams need a test window, sample package, or rollout note?"],
] as const;

export default function Retail2dRetailersPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <Header />
      <main>
        <section className="relative overflow-hidden bg-[#101a2d] py-16 text-white sm:py-24 lg:py-28">
          <div aria-hidden="true" className="absolute -left-40 bottom-0 size-[32rem] rounded-full bg-[#1756e8]/30 blur-[120px]" />
          <div aria-hidden="true" className="absolute -right-32 -top-28 size-[28rem] rounded-full bg-[#c8f33d]/12 blur-[110px]" />
          <div className="relative mx-auto grid max-w-[1240px] gap-14 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(420px,1.12fr)] lg:items-center lg:gap-16">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#c8f33d]">For retailers</p>
              <h1 className="font-display mt-6 max-w-3xl text-[clamp(3.1rem,7vw,6.5rem)] leading-[0.88] tracking-[-0.07em]">Make sure 2D barcodes work at checkout.</h1>
              <p className="mt-7 max-w-xl text-base font-medium leading-8 text-white/70 sm:text-lg">Test scanners, POS behavior, self-checkout, and private-label products before your stores need to handle a new kind of barcode every day.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row"><Link href="/contact" className="brand-button bg-[#c8f33d] text-[#172100]">Assess my stores <ArrowRight className="size-4" /></Link><Link href="/retail-2d/brands" className="brand-button border border-white/20 bg-white/[0.06] text-white hover:bg-white/10">Prepare private-label products <ArrowRight className="size-4" /></Link></div>
              <p className="mt-7 max-w-lg text-xs font-bold leading-5 text-white/50">Start with a controlled pilot. Existing UPC workflows can remain in place while compatible 2D acceptance is introduced.</p>
            </div>
            <StoreReadinessVisual />
          </div>
        </section>

        <section className="bg-[var(--brand-paper)] py-20 sm:py-28">
          <div className="mx-auto grid max-w-[1240px] gap-12 px-5 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <div className="grid size-12 place-items-center rounded-2xl bg-[#101a2d] text-[#c8f33d]"><TestTube2 className="size-6" /></div>
              <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-blue)]">The test that matters</p>
              <h2 className="font-display mt-4 max-w-xl text-[clamp(2.8rem,5vw,5rem)] leading-[0.94] tracking-[-0.06em]">Know what works before rollout.</h2>
              <p className="mt-5 max-w-lg text-sm leading-7 text-muted-foreground sm:text-base">A package may carry a linear barcode and a 2D barcode together for a while. Validate how each symbol behaves, and confirm the combined package becomes one item at checkout.</p>
              <Link href="/contact" className="mt-7 inline-flex items-center gap-2 text-sm font-extrabold text-[var(--brand-blue)]">Plan a store test <ArrowRight className="size-4" /></Link>
            </div>
            <CheckoutTestingVisual />
          </div>
        </section>

        <section className="bg-background py-20 sm:py-28">
          <div className="mx-auto grid max-w-[1240px] gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <PrivateLabelFlowVisual />
            <div>
              <div className="grid size-12 place-items-center rounded-2xl bg-[var(--brand-lime)] text-[#263600]"><Store className="size-6" /></div>
              <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-blue)]">A practical starting point</p>
              <h2 className="font-display mt-4 max-w-xl text-[clamp(2.8rem,5vw,5rem)] leading-[0.94] tracking-[-0.06em]">Start with products you already control.</h2>
              <p className="mt-5 max-w-lg text-sm leading-7 text-muted-foreground sm:text-base">Private-label products give retailers a clear place to coordinate identifiers, packaging, product content, and checkout testing across one team.</p>
              <Link href="/sign-up" className="mt-7 inline-flex items-center gap-2 text-sm font-extrabold text-[var(--brand-blue)]">Prepare a private-label catalog <ArrowRight className="size-4" /></Link>
            </div>
          </div>
        </section>

        <section className="bg-[var(--brand-paper)] py-20 sm:py-28">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <div className="max-w-2xl"><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-blue)]">Before you call it ready</p><h2 className="font-display mt-4 text-[clamp(2.8rem,6vw,5.4rem)] leading-[0.92] tracking-[-0.06em]">Document the lane, not just the ambition.</h2><p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">Use a repeatable test plan so store operations, technology teams, suppliers, and private-label teams have the same definition of ready.</p></div>
            <div className="mt-10 grid gap-4 lg:grid-cols-2">
              {readinessItems.map(([title, detail], index) => (
                <article key={title} className="grid gap-4 rounded-[1.5rem] border bg-card p-6 sm:grid-cols-[48px_1fr] sm:p-7"><span className="grid size-10 place-items-center rounded-xl bg-[#101a2d] text-[#c8f33d] text-sm font-extrabold">0{index + 1}</span><div><h3 className="text-lg font-extrabold tracking-[-0.03em]">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</p></div></article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-background py-20 sm:py-28">
          <div className="mx-auto grid max-w-[1240px] gap-6 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
            <div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-blue)]">The transition is shared</p><h2 className="font-display mt-4 max-w-xl text-[clamp(2.8rem,5vw,5rem)] leading-[0.94] tracking-[-0.06em]">Products need a plan. Stores need proof.</h2></div>
            <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-[1.5rem] border bg-card p-6"><ScanBarcode className="size-5 text-[var(--brand-blue)]" /><h3 className="mt-8 text-xl font-extrabold tracking-[-0.035em]">Product side</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">Identifiers, destinations, packaging, and product content are ready for the partner conversation.</p><Link href="/retail-2d/brands" className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[var(--brand-blue)]">For brands <ArrowRight className="size-4" /></Link></div><div className="rounded-[1.5rem] border bg-card p-6"><ClipboardCheck className="size-5 text-[var(--brand-blue)]" /><h3 className="mt-8 text-xl font-extrabold tracking-[-0.035em]">Store side</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">Scanners, POS, self-checkout, and rollout notes are tested with the people who run the lanes.</p><Link href="/contact" className="mt-5 inline-flex items-center gap-2 text-sm font-extrabold text-[var(--brand-blue)]">Plan a test <ArrowRight className="size-4" /></Link></div></div>
          </div>
        </section>

        <section className="bg-[var(--brand-paper)] px-4 pb-20 sm:px-6 sm:pb-28">
          <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[2rem] bg-[var(--brand-action)] px-6 py-14 text-white shadow-[0_32px_90px_-46px_var(--brand-action)] sm:px-12 sm:py-20"><div aria-hidden="true" className="absolute -right-20 -top-24 size-72 rounded-full bg-white/10 blur-3xl" /><div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-lime)]">Retail readiness starts with a test</p><h2 className="font-display mt-4 max-w-3xl text-[clamp(2.8rem,6vw,5.5rem)] leading-[0.92] tracking-[-0.06em]">Prepare your stores before 2D becomes routine.</h2></div><Link href="/contact" className="brand-button shrink-0 bg-[var(--brand-lime)] text-[var(--brand-ink)]">Assess my stores <ArrowRight className="size-4" /></Link></div></div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
