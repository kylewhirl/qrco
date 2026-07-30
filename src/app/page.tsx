import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  IconArrowRight,
  IconChartLine,
  IconCreditCardOff,
  IconRefresh,
} from "@tabler/icons-react";
import {
  BriefcaseBusiness,
  CalendarDays,
  House,
  Package,
  Store,
  Utensils,
} from "lucide-react";
import QrCodeCreator from "@/components/qr-code-creator";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { getCustomDomainFallbackUrlForHostname } from "@/lib/custom-domains";
import { getRequestHostname, isPrimaryAppHost } from "@/lib/qr-url";

const useCases = [
  {
    icon: Utensils,
    title: "Restaurant menus",
    example: "Put one code on tables, windows, and takeout bags.",
    change: "Swap the menu, daily specials, or ordering link without replacing the printed code.",
  },
  {
    icon: House,
    title: "Property signs",
    example: "Send buyers from a yard sign to the current listing, gallery, or tour.",
    change: "Change the destination when the property sells or the next listing goes live.",
  },
  {
    icon: CalendarDays,
    title: "Events and venues",
    example: "Use the same code for tickets, schedules, maps, and last-minute updates.",
    change: "Redirect attendees as the event moves from registration to the live program.",
  },
  {
    icon: Package,
    title: "Product packaging",
    example: "Connect a label to instructions, warranty registration, or product details.",
    change: "Keep printed packaging useful when documentation or compliance information changes.",
  },
  {
    icon: Store,
    title: "Retail displays",
    example: "Link shelf cards and window signs to inventory, sizing, or a campaign.",
    change: "Move the code to the next offer without rebuilding the physical display.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Business cards",
    example: "Share a portfolio, booking page, contact card, or current campaign.",
    change: "Update where the card points long after it has been handed out.",
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
        <section className="relative overflow-hidden bg-[var(--brand-paper)] pt-10 sm:pt-12">
          <div aria-hidden="true" className="hero-frame-decal hero-frame-decal-left" />
          <div aria-hidden="true" className="hero-frame-decal hero-frame-decal-right" />
          <div className="relative z-10 mx-auto max-w-[980px] px-5 text-center sm:px-8">
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

          <div id="creator" className="relative z-20 mx-auto max-w-[1240px] px-2 pb-14 sm:px-6 sm:pb-20">
            <QrCodeCreator variant="hero" />
          </div>
        </section>

        <section id="solutions" className="bg-[var(--brand-paper)] py-16 sm:py-24">
          <div className="mx-auto max-w-[1240px] px-5 sm:px-8">
            <div className="grid gap-5 border-b border-border pb-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <h2 className="font-display max-w-3xl text-[clamp(2.6rem,5.5vw,5rem)] leading-[0.96] tracking-[-0.055em]">
                Where people actually use dynamic QR codes
              </h2>
              <p className="max-w-xl text-base font-medium leading-7 text-muted-foreground lg:justify-self-end">
                The useful part is not generating a square. It is printing a code once, then changing what happens after someone scans it.
              </p>
            </div>
            <div className="mt-8 grid border-l border-t border-border sm:grid-cols-2 lg:grid-cols-3">
              {useCases.map((useCase) => {
                const Icon = useCase.icon;
                return (
                  <article key={useCase.title} className="group min-h-[300px] border-b border-r border-border bg-card p-6 transition-colors hover:bg-[color-mix(in_srgb,var(--brand-blue)_4%,var(--card))] sm:p-8">
                    <Icon className="size-7 text-[var(--brand-blue)]" strokeWidth={1.8} aria-hidden="true" />
                    <h3 className="mt-12 text-2xl font-bold leading-tight tracking-[-0.035em]">{useCase.title}</h3>
                    <p className="mt-4 text-sm font-semibold leading-6 text-foreground/80">{useCase.example}</p>
                    <p className="mt-3 text-sm font-medium leading-6 text-muted-foreground">{useCase.change}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[var(--brand-paper)] px-4 pb-20 sm:px-6 sm:pb-28">
          <div className="relative mx-auto max-w-[1200px] overflow-hidden rounded-xl bg-[var(--brand-action)] px-5 py-16 text-center text-white shadow-[0_32px_90px_-46px_var(--brand-action)] sm:px-8 sm:py-20">
            <div aria-hidden="true" className="absolute -right-20 -top-24 size-72 rounded-full bg-white/10 blur-2xl" />
            <h2 className="font-display relative mx-auto max-w-4xl text-[clamp(2.8rem,6vw,5.4rem)] leading-[0.94] tracking-[-0.06em]">
              Printing a menu, sign, label, or card?
            </h2>
            <p className="relative mx-auto mt-5 max-w-2xl text-base font-semibold leading-7 text-white/80">
              Make its QR destination editable before the physical version is out in the world.
            </p>
            <Link href="/sign-up" className="brand-button brand-button-lime relative mt-9">
              Create the code
              <IconArrowRight className="size-4" stroke={2.4} />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
