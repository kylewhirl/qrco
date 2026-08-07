import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Factory, Store } from "lucide-react";

import Footer from "@/components/footer";
import Header from "@/components/header";
import {
  CatalogImportVisual,
  OneCodeJobs,
  StoreReadinessVisual,
  TransitionHeroVisual,
} from "@/components/retail2d/retail-2d-visuals";

export const metadata: Metadata = {
  title: "Retail 2D | The QR Code Co.",
  description:
    "Bring your existing UPC and GTIN catalog to GS1-powered 2D barcodes with The QR Code Co.",
};

export default function Retail2dPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <Header />
      <main>
        <section className="relative overflow-hidden bg-[#101a2d] py-16 text-white sm:py-24 lg:py-28">
          <div aria-hidden="true" className="absolute -left-40 top-0 size-[32rem] rounded-full bg-[#1756e8]/30 blur-[120px]" />
          <div aria-hidden="true" className="absolute -right-40 bottom-0 size-[30rem] rounded-full bg-[#c8f33d]/10 blur-[120px]" />
          <div className="relative mx-auto grid max-w-[1240px] gap-14 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(420px,1.12fr)] lg:items-center lg:gap-16">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#c8f33d]">Retail 2D</p>
              <h1 className="font-display mt-6 max-w-3xl text-[clamp(3.2rem,7vw,6.8rem)] leading-[0.88] tracking-[-0.07em]">
                Prepare your products for the next generation of retail.
              </h1>
              <p className="mt-7 max-w-xl text-base font-medium leading-8 text-white/70 sm:text-lg">
                You already have products and UPCs. Bring them here. We&apos;ll help you move your catalog to GS1-powered 2D barcodes, connect useful product content, and prepare your packaging.
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/retail-2d/brands" className="brand-button bg-[#c8f33d] text-[#172100]">
                  Prepare my products
                  <ArrowRight className="size-4" />
                </Link>
                <Link href="/retail-2d/retailers" className="brand-button border border-white/20 bg-white/[0.06] text-white hover:bg-white/10">
                  Prepare my stores
                  <ArrowRight className="size-4" />
                </Link>
              </div>
              <p className="mt-7 max-w-lg text-xs font-bold leading-5 text-white/50">
                Built for the retail industry&apos;s transition toward 2D barcode acceptance. Existing UPCs aren&apos;t disappearing in 2027.
              </p>
            </div>
            <TransitionHeroVisual />
          </div>
        </section>

        <section className="bg-[var(--brand-paper)] py-20 sm:py-28">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-blue)]">Start where you are</p>
              <h2 className="font-display mt-4 text-[clamp(2.8rem,6vw,5.5rem)] leading-[0.92] tracking-[-0.06em]">Choose your path.</h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">The work is different for the teams putting products on shelves and the teams scanning them at checkout.</p>
            </div>
            <div className="mt-10 grid gap-5 lg:grid-cols-2">
              <article className="overflow-hidden rounded-[2rem] border bg-card shadow-[0_28px_70px_-54px_var(--brand-shadow)]">
                <div className="border-b bg-[#eef3fb] p-4 sm:p-5"><CatalogImportVisual /></div>
                <div className="p-7 sm:p-9">
                  <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#101a2d] text-[#c8f33d]"><Factory className="size-5" /></span><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-blue)]">Brands &amp; manufacturers</p></div>
                  <h3 className="mt-6 text-3xl font-extrabold tracking-[-0.05em]">Make your catalog 2D-ready.</h3>
                  <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">Import the products you already sell, validate the identifiers, create product experiences, and get packaging-ready assets under your brand domain.</p>
                  <Link href="/retail-2d/brands" className="mt-7 inline-flex items-center gap-2 text-sm font-extrabold text-[var(--brand-blue)]">Prepare my products <ArrowRight className="size-4" /></Link>
                </div>
              </article>
              <article className="overflow-hidden rounded-[2rem] border bg-card shadow-[0_28px_70px_-54px_var(--brand-shadow)]">
                <div className="border-b bg-[#eef3fb] p-4 sm:p-5"><StoreReadinessVisual /></div>
                <div className="p-7 sm:p-9">
                  <div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-2xl bg-[#101a2d] text-[#c8f33d]"><Store className="size-5" /></span><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-blue)]">Retailers</p></div>
                  <h3 className="mt-6 text-3xl font-extrabold tracking-[-0.05em]">Make your stores ready.</h3>
                  <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">Test scanners, POS behavior, self-checkout, and private-label products before 2D barcodes become a routine part of the lane.</p>
                  <Link href="/retail-2d/retailers" className="mt-7 inline-flex items-center gap-2 text-sm font-extrabold text-[var(--brand-blue)]">Prepare my stores <ArrowRight className="size-4" /></Link>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="bg-background py-20 sm:py-28">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-blue)]">The useful part</p>
                <p className="mt-3 max-w-xs text-sm leading-6 text-muted-foreground">A 2D barcode can carry the product identity at checkout and open a digital destination for shoppers.</p>
              </div>
              <h2 className="font-display text-[clamp(2.8rem,6vw,5.6rem)] leading-[0.94] tracking-[-0.055em]">One code. Two jobs.</h2>
            </div>
            <div className="mt-10"><OneCodeJobs /></div>
          </div>
        </section>

        <section className="bg-[var(--brand-paper)] px-4 pb-20 sm:px-6 sm:pb-28">
          <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[2rem] bg-[var(--brand-action)] px-6 py-14 text-white shadow-[0_32px_90px_-46px_var(--brand-action)] sm:px-12 sm:py-20">
            <div aria-hidden="true" className="absolute -right-24 -top-28 size-80 rounded-full bg-white/10 blur-3xl" />
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-lime)]">Bring the catalog you have</p>
                <h2 className="font-display mt-4 max-w-3xl text-[clamp(2.8rem,6vw,5.5rem)] leading-[0.92] tracking-[-0.06em]">Start with the products already on your shelves.</h2>
                <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-bold text-white/65"><span className="inline-flex items-center gap-2"><Check className="size-3.5 text-[var(--brand-lime)]" />Existing UPCs welcome</span><span className="inline-flex items-center gap-2"><Check className="size-3.5 text-[var(--brand-lime)]" />Roll out at your pace</span></div>
              </div>
              <Link href="/retail-2d/brands" className="brand-button shrink-0 bg-[var(--brand-lime)] text-[var(--brand-ink)]">Prepare my products <ArrowRight className="size-4" /></Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
