import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  IconArrowRight,
  IconChartLine,
  IconCreditCardOff,
  IconRefresh,
  IconSparkles,
} from "@tabler/icons-react";
import QrCodeCreator from "@/components/qr-code-creator";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { getCustomDomainFallbackUrlForHostname } from "@/lib/custom-domains";
import { getRequestHostname, isPrimaryAppHost } from "@/lib/qr-url";

const benefits = [
  {
    icon: IconRefresh,
    number: "01",
    title: "Change the destination. Not the code.",
    copy: "Update where your QR code points at any time—without reprinting a thing.",
  },
  {
    icon: IconChartLine,
    number: "02",
    title: "Know what happens after the scan.",
    copy: "See scan activity, devices, and top locations from one focused dashboard.",
  },
  {
    icon: IconSparkles,
    number: "03",
    title: "Make every code unmistakably yours.",
    copy: "Shape, color, frame, and brand your code while keeping it easy to scan.",
  },
];

export default async function HomePage() {
  const requestHeaders = await headers();
  const hostname = getRequestHostname({ headers: requestHeaders });

  if (hostname && !isPrimaryAppHost(hostname)) {
    redirect(await getCustomDomainFallbackUrlForHostname(hostname));
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <Header />
      <main>
        <section className="brand-hero relative overflow-hidden bg-[var(--brand-paper)] pt-12 sm:pt-16 md:pt-20">
          <div aria-hidden="true" className="absolute -left-32 top-8 size-80 rounded-full bg-[color-mix(in_srgb,var(--brand-blue)_14%,transparent)] blur-3xl" />
          <div aria-hidden="true" className="absolute -right-28 top-40 size-72 rounded-full bg-[color-mix(in_srgb,var(--brand-lime)_18%,transparent)] blur-3xl" />
          <div aria-hidden="true" className="hero-frame-decal hero-frame-decal-left" />
          <div aria-hidden="true" className="hero-frame-decal hero-frame-decal-right" />
          <div className="relative z-10 mx-auto max-w-[980px] px-5 text-center sm:px-8">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[color-mix(in_srgb,var(--brand-blue)_18%,var(--border))] bg-[color-mix(in_srgb,var(--brand-blue)_8%,var(--card))] px-3.5 py-2 text-[11px] font-bold tracking-[0.08em] text-[var(--brand-blue)] sm:text-xs">
              <IconSparkles className="size-4" stroke={2.5} aria-hidden="true" />
              Built to change
            </div>
            <h1 className="font-display mx-auto max-w-[880px] text-[clamp(2.7rem,8vw,5.5rem)] leading-[0.98] tracking-[-0.06em]">
              Dynamic QR codes.
              <br />
              Free, forever.
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base font-medium leading-7 text-muted-foreground sm:text-lg">
              Create, update, and track every scan without expired codes or surprise paywalls.
            </p>
            <div className="mt-7 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
              <Link href="/sign-up" className="brand-button bg-[var(--brand-action)] text-white shadow-[0_14px_32px_-18px_var(--brand-action)]">
                Create a free QR code
                <IconArrowRight className="size-4" stroke={2.4} />
              </Link>
              <Link href="#creator" className="brand-button brand-button-outline">
                Explore the platform
              </Link>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 pb-8 text-xs font-semibold text-muted-foreground sm:text-sm">
              <span className="inline-flex items-center gap-2"><IconRefresh className="size-4 text-[var(--brand-blue)]" stroke={3} />Dynamic forever</span>
              <span className="inline-flex items-center gap-2"><IconChartLine className="size-4 text-[var(--brand-blue)]" stroke={3} />Real-time analytics</span>
              <span className="inline-flex items-center gap-2"><IconCreditCardOff className="size-4 text-[var(--brand-blue)]" stroke={3} />No credit card</span>
            </div>
          </div>

          <div id="creator" className="relative z-20 mx-auto max-w-[1240px] px-4 pb-14 sm:px-6 sm:pb-20">
            <QrCodeCreator variant="hero" />
          </div>
        </section>

        <section id="products" className="bg-background py-5">
          <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-center gap-x-10 gap-y-3 rounded-2xl border bg-card px-5 py-5 text-xs font-bold text-muted-foreground shadow-[0_18px_45px_-40px_var(--brand-shadow)] sm:text-sm">
            <span>Unlimited static codes</span>
            <span>Editable destinations</span>
            <span>Actionable analytics</span>
            <span>Built-in scan testing</span>
          </div>
        </section>

        <section id="solutions" className="bg-[var(--brand-paper)] py-20 sm:py-28">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">
              <p className="text-xs font-bold tracking-[0.08em] text-[var(--brand-blue)]">Built for change</p>
              <h2 className="font-display text-[clamp(2.8rem,6vw,5.6rem)] leading-[0.96] tracking-[-0.055em]">
                One code.
                <br />Endless moves.
              </h2>
            </div>
            <div className="mt-10 grid gap-5 lg:grid-cols-3">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <article key={benefit.number} className="group min-h-[320px] rounded-[1.75rem] border bg-card p-7 shadow-[0_24px_60px_-48px_var(--brand-shadow)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_70px_-46px_color-mix(in_srgb,var(--brand-blue)_50%,transparent)] sm:p-9">
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-bold text-muted-foreground">{benefit.number}</span>
                      <span className="grid size-12 place-items-center rounded-2xl bg-[color-mix(in_srgb,var(--brand-blue)_10%,var(--card))]">
                        <Icon className="size-6 text-[var(--brand-blue)] transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110" stroke={1.8} />
                      </span>
                    </div>
                    <h3 className="mt-16 text-2xl font-bold leading-tight tracking-[-0.035em]">{benefit.title}</h3>
                    <p className="mt-4 max-w-sm text-sm font-medium leading-6 text-foreground/70">{benefit.copy}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[var(--brand-paper)] px-4 pb-20 sm:px-6 sm:pb-28">
          <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-[2rem] bg-[var(--brand-action)] px-5 py-20 text-center text-white shadow-[0_32px_90px_-46px_var(--brand-action)] sm:px-8 sm:py-24">
            <div aria-hidden="true" className="absolute -right-20 -top-24 size-72 rounded-full bg-white/10 blur-2xl" />
            <p className="relative text-xs font-bold tracking-[0.1em] text-[var(--brand-lime)]">Ready when you are</p>
            <h2 className="font-display relative mx-auto mt-5 max-w-4xl text-[clamp(3rem,7vw,6.2rem)] leading-[0.94] tracking-[-0.06em]">Make your next QR code last.</h2>
            <Link href="/sign-up" className="brand-button brand-button-lime relative mt-9">
              Start creating free
              <IconArrowRight className="size-4" stroke={2.4} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
