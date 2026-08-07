import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, ExternalLink, Globe2, Package, QrCode } from "lucide-react";

import Footer from "@/components/footer";
import Header from "@/components/header";
import {
  CatalogImportVisual,
  CatalogToPackageSteps,
  DomainComparison,
  OneCodeJobs,
  PackagingReadinessVisual,
  ProductExperienceVisual,
} from "@/components/retail2d/retail-2d-visuals";

export const metadata: Metadata = {
  title: "Retail 2D for Brands & Manufacturers | The QR Code Co.",
  description:
    "Make an existing product catalog 2D-ready with GS1 Digital Link identities, product experiences, and packaging preflight checks.",
};

const examples = [
  {
    name: "Coca-Cola / Topo Chico",
    detail: "A packaging example showing how a 2D barcode can connect a product to a richer digital experience.",
    href: "https://www.packworld.com/secondary-packaging/article/22910331/coca-cola-2d-codes-connect-topo-chico-consumers-to-brand-experience",
  },
  {
    name: "Mondelēz",
    detail: "An industry example of packaging and product information evolving together across a large portfolio.",
    href: "https://www2.gs1.org/insights-events/case-studies/",
  },
  {
    name: "Three Peaks Organic Mānuka Honey",
    detail: "A product example where packaging can give shoppers more useful provenance and product information.",
    href: "https://www.gs1us.org/industries-and-insights/by-topic/2d-barcodes",
  },
];

export default function Retail2dBrandsPage() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <Header />
      <main>
        <section className="relative overflow-hidden bg-[var(--brand-paper)] py-16 sm:py-24 lg:py-28">
          <div aria-hidden="true" className="absolute -right-40 -top-32 size-[34rem] rounded-full bg-[var(--brand-blue)]/10 blur-[120px]" />
          <div className="relative mx-auto grid max-w-[1240px] gap-14 px-5 sm:px-8 lg:grid-cols-[minmax(0,0.88fr)_minmax(420px,1.12fr)] lg:items-center lg:gap-16">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--brand-blue)]">For brands &amp; manufacturers</p>
              <h1 className="font-display mt-6 max-w-3xl text-[clamp(3.1rem,7vw,6.5rem)] leading-[0.88] tracking-[-0.07em]">Your products already have GTINs. Now make them 2D-ready.</h1>
              <p className="mt-7 max-w-xl text-base font-medium leading-8 text-muted-foreground sm:text-lg">Import the product catalog you already manage, create persistent Digital Link identities, and prepare every packaging run for a more useful barcode.</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link href="/sign-up" className="brand-button bg-[var(--brand-action)] text-white">Start with my product catalog <ArrowRight className="size-4" /></Link>
                <Link href="/contact" className="brand-button border border-border bg-card text-foreground hover:bg-muted">Talk to us about migration</Link>
              </div>
              <p className="mt-7 text-xs font-bold leading-5 text-muted-foreground">Existing UPCs remain part of the transition. Add 2D capability as your packaging and retail partners are ready.</p>
            </div>
            <CatalogImportVisual />
          </div>
        </section>

        <section className="bg-background py-20 sm:py-28">
          <div className="mx-auto grid max-w-[1240px] gap-12 px-5 sm:px-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div className="lg:sticky lg:top-24">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-blue)]">A practical workflow</p>
              <h2 className="font-display mt-5 max-w-lg text-[clamp(2.8rem,5vw,5rem)] leading-[0.94] tracking-[-0.06em]">From spreadsheet to packaging.</h2>
              <p className="mt-5 max-w-md text-sm leading-7 text-muted-foreground sm:text-base">The first step is not a new catalog. It&apos;s the one you already have. Turn product rows into identities, destinations, and packaging-ready assets.</p>
              <Link href="/sign-up" className="mt-7 inline-flex items-center gap-2 text-sm font-extrabold text-[var(--brand-blue)]">Import a catalog <ArrowRight className="size-4" /></Link>
            </div>
            <CatalogToPackageSteps />
          </div>
        </section>

        <section className="bg-[var(--brand-paper)] py-20 sm:py-28">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-blue)]">The product identity</p>
              <h2 className="font-display mt-4 text-[clamp(2.8rem,6vw,5.5rem)] leading-[0.92] tracking-[-0.06em]">One code. Two jobs.</h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground">Use the same printed 2D identity for retail operations and the product information shoppers want after the scan.</p>
            </div>
            <div className="mt-10"><OneCodeJobs /></div>
          </div>
        </section>

        <section className="bg-background py-20 sm:py-28">
          <div className="mx-auto grid max-w-[1240px] gap-10 px-5 sm:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
            <div>
              <div className="grid size-12 place-items-center rounded-2xl bg-[#101a2d] text-[#c8f33d]"><Globe2 className="size-6" /></div>
              <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-blue)]">Your domain, your relationship</p>
              <h2 className="font-display mt-4 max-w-xl text-[clamp(2.6rem,5vw,4.8rem)] leading-[0.94] tracking-[-0.055em]">Put your brand on the package. Not ours.</h2>
              <p className="mt-5 max-w-lg text-sm leading-7 text-muted-foreground sm:text-base">A product identity should be recognizable when it is printed, scanned, shared, and updated. Use a brand-owned domain where it makes sense for your packaging architecture.</p>
            </div>
            <DomainComparison />
          </div>
        </section>

        <section className="bg-[var(--brand-paper)] py-20 sm:py-28">
          <div className="mx-auto grid max-w-[1240px] gap-12 px-5 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
            <ProductExperienceVisual />
            <div>
              <div className="grid size-12 place-items-center rounded-2xl bg-[var(--brand-lime)] text-[#263600]"><QrCode className="size-6" /></div>
              <p className="mt-7 text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-blue)]">After the scan</p>
              <h2 className="font-display mt-4 max-w-xl text-[clamp(2.6rem,5vw,4.8rem)] leading-[0.94] tracking-[-0.055em]">Give every product somewhere useful to go.</h2>
              <p className="mt-5 max-w-lg text-sm leading-7 text-muted-foreground sm:text-base">Connect an existing product page or host a structured experience that can evolve after the package is printed.</p>
              <div className="mt-7 grid max-w-lg grid-cols-2 gap-x-5 gap-y-3 text-sm font-bold text-foreground/70"><span className="inline-flex items-center gap-2"><Check className="size-4 text-[var(--brand-blue)]" />Nutrition</span><span className="inline-flex items-center gap-2"><Check className="size-4 text-[var(--brand-blue)]" />Ingredients</span><span className="inline-flex items-center gap-2"><Check className="size-4 text-[var(--brand-blue)]" />Allergens</span><span className="inline-flex items-center gap-2"><Check className="size-4 text-[var(--brand-blue)]" />Origin</span><span className="inline-flex items-center gap-2"><Check className="size-4 text-[var(--brand-blue)]" />Recycling</span><span className="inline-flex items-center gap-2"><Check className="size-4 text-[var(--brand-blue)]" />Recipes</span></div>
            </div>
          </div>
        </section>

        <section className="bg-background py-20 sm:py-28">
          <div className="mx-auto grid max-w-[1240px] gap-10 px-5 sm:px-8 lg:grid-cols-[1fr_0.95fr] lg:items-center">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-blue)]">Before the print run</p>
              <h2 className="font-display mt-4 max-w-xl text-[clamp(2.8rem,5vw,5rem)] leading-[0.94] tracking-[-0.06em]">Don&apos;t discover a problem after 100,000 packages are printed.</h2>
              <p className="mt-5 max-w-lg text-sm leading-7 text-muted-foreground sm:text-base">Run a digital preflight for identifiers, destinations, domains, and QR assets before they reach artwork review. Then verify the physical symbol with the right printer and testing process.</p>
              <Link href="/sign-up" className="mt-7 inline-flex items-center gap-2 text-sm font-extrabold text-[var(--brand-blue)]">Check a product before print <ArrowRight className="size-4" /></Link>
            </div>
            <PackagingReadinessVisual />
          </div>
        </section>

        <section className="bg-[var(--brand-paper)] py-20 sm:py-28">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--brand-blue)]">See the pattern</p><h2 className="font-display mt-4 max-w-2xl text-[clamp(2.8rem,5vw,5rem)] leading-[0.94] tracking-[-0.06em]">Packaging is becoming a product surface.</h2></div>
              <p className="max-w-sm text-xs leading-5 text-muted-foreground">Industry examples for inspiration—not QR Code Co. customer claims.</p>
            </div>
            <div className="mt-10 grid gap-4 lg:grid-cols-3">
              {examples.map((example) => (
                <a key={example.name} href={example.href} target="_blank" rel="noreferrer" className="group rounded-[1.5rem] border bg-card p-6 transition hover:-translate-y-1 hover:border-[var(--brand-blue)] sm:p-7">
                  <div className="flex items-center justify-between"><Package className="size-5 text-[var(--brand-blue)]" /><ExternalLink className="size-4 text-muted-foreground transition group-hover:text-[var(--brand-blue)]" /></div>
                  <p className="mt-12 text-[10px] font-extrabold uppercase tracking-[0.15em] text-[var(--brand-blue)]">Industry example</p>
                  <h3 className="mt-2 text-xl font-extrabold tracking-[-0.035em]">{example.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">{example.detail}</p>
                </a>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[var(--brand-paper)] px-4 pb-20 sm:px-6 sm:pb-28">
          <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[2rem] bg-[#101a2d] px-6 py-14 text-white shadow-[0_32px_90px_-46px_#101a2d] sm:px-12 sm:py-20">
            <div aria-hidden="true" className="absolute -right-20 -top-24 size-72 rounded-full bg-[var(--brand-blue)]/35 blur-3xl" />
            <div className="relative flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between"><div><p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[#c8f33d]">Ready when your catalog is</p><h2 className="font-display mt-4 max-w-3xl text-[clamp(2.8rem,6vw,5.5rem)] leading-[0.92] tracking-[-0.06em]">See how many products are ready to move to 2D.</h2></div><div className="flex flex-col items-start gap-3 sm:flex-row"><Link href="/sign-up" className="brand-button bg-[#c8f33d] text-[#172100]">Import my products <ArrowRight className="size-4" /></Link><Link href="/contact" className="brand-button border border-white/20 bg-white/[0.06] text-white hover:bg-white/10">Talk to us</Link></div></div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
