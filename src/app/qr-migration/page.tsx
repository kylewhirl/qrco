import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  ExternalLink,
  LockKeyhole,
  QrCode,
  Route,
  ShieldCheck,
} from "lucide-react";

import Footer from "@/components/footer";
import Header from "@/components/header";
import { MigrationRequestForm } from "@/components/migration-request-form";
import { Button } from "@/components/ui/button";
import { BILLING_PLANS } from "@/lib/billing-definitions";

export const metadata: Metadata = {
  title: "QR Code Migration Audit | The QR Code Co",
  description:
    "Move QR codes from QRCodeKIT, qrco.de, QRCodeChimp, and other providers with a free safety-first migration audit.",
};

const processSteps = [
  {
    icon: ClipboardCheck,
    title: "Audit what exists",
    body: "Send one QR link. We identify the provider, redirect behavior, destination, and lock-in risk before recommending a move.",
  },
  {
    icon: ShieldCheck,
    title: "Protect printed materials",
    body: "If a printed dynamic QR code is locked to the old provider, we say that plainly and avoid risky cutovers.",
  },
  {
    icon: Route,
    title: "Rebuild the safe parts",
    body: "We recreate codes, match styling, map destinations, configure branded domains, and test scans before launch.",
  },
];

const comparisonRows = [
  {
    label: "Entry plan",
    current: "Often $20+/mo for dynamic QR tiers",
    tqrco: BILLING_PLANS.free.priceLabel,
  },
  {
    label: "Custom domains + API",
    current: "Frequently reserved for higher tiers",
    tqrco: BILLING_PLANS.creator.priceLabel,
  },
  {
    label: "Unlimited API + analytics retention",
    current: "Usually enterprise or premium",
    tqrco: BILLING_PLANS.growth.priceLabel,
  },
];

const providerSignals = ["QRCodeKIT", "qrco.de", "QRCodeChimp", "Hovercode", "QRFY", "QR Tiger"];

export default function QrMigrationPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="border-b bg-[linear-gradient(180deg,var(--background)_0%,color-mix(in_oklab,var(--muted)_44%,var(--background))_100%)] py-14 md:py-20">
          <div className="container mx-auto grid items-start gap-10 px-6 lg:grid-cols-[minmax(0,1fr)_minmax(380px,520px)] lg:gap-14">
            <div className="pt-2">
              <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <QrCode className="size-4 text-primary" />
                <span>Free QR migration review</span>
              </div>
              <h1 className="mt-5 max-w-4xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
                Move your QR codes without breaking printed campaigns
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">
                The QR Code Co helps teams switch from expensive or limiting QR-code platforms with a safety-first audit, lower-cost plans, and free white-glove onboarding.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-11 rounded-lg px-6">
                  <Link href="#migration-request">
                    Request free audit
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-11 rounded-lg px-6">
                  <Link href="/pricing">
                    View pricing
                    <ExternalLink className="size-4" />
                  </Link>
                </Button>
              </div>

              <div className="mt-10 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 size-4 text-primary" />
                  <span>Free migration audit before any switch</span>
                </div>
                <div className="flex items-start gap-2">
                  <CircleDollarSign className="mt-0.5 size-4 text-primary" />
                  <span>Plans from {BILLING_PLANS.free.priceLabel} to {BILLING_PLANS.growth.priceLabel}</span>
                </div>
                <div className="flex items-start gap-2">
                  <LockKeyhole className="mt-0.5 size-4 text-primary" />
                  <span>Printed-code lock-in checked first</span>
                </div>
              </div>
            </div>

            <div id="migration-request" className="scroll-mt-24">
              <MigrationRequestForm />
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container mx-auto px-6">
            <div className="grid gap-8 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight">Built for careful QR moves</h2>
                <p className="mt-4 text-sm leading-7 text-muted-foreground">
                  Dynamic QR codes are only easy to move when the redirect layer is under your control. We separate safe migrations from risky ones before touching anything already printed.
                </p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
                {processSteps.map((step) => {
                  const Icon = step.icon;

                  return (
                    <article key={step.title} className="rounded-lg border bg-background p-5">
                      <Icon className="size-5 text-primary" />
                      <h3 className="mt-4 text-base font-semibold">{step.title}</h3>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{step.body}</p>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="border-y bg-muted/40 py-12 md:py-16">
          <div className="container mx-auto px-6">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
              <div>
                <h2 className="text-3xl font-semibold tracking-tight">Lower QR costs without a blind cutover</h2>
                <div className="mt-7 overflow-hidden rounded-lg border bg-background">
                  <div className="grid grid-cols-[1fr_1fr_1fr] border-b bg-muted/50 px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    <span>Need</span>
                    <span>Typical pressure</span>
                    <span>The QR Code Co</span>
                  </div>
                  {comparisonRows.map((row) => (
                    <div
                      key={row.label}
                      className="grid grid-cols-1 gap-2 border-b px-4 py-4 text-sm last:border-b-0 sm:grid-cols-[1fr_1fr_1fr]"
                    >
                      <span className="font-medium">{row.label}</span>
                      <span className="text-muted-foreground">{row.current}</span>
                      <span className="font-semibold text-primary">{row.tqrco}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border bg-background p-5">
                <h3 className="text-base font-semibold">Provider signals we can review</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {providerSignals.map((provider) => (
                    <span key={provider} className="rounded-md border px-3 py-1.5 text-sm text-muted-foreground">
                      {provider}
                    </span>
                  ))}
                </div>
                <p className="mt-5 text-sm leading-6 text-muted-foreground">
                  If your provider is not listed, send the QR link anyway. The audit focuses on the redirect behavior and what can be moved safely.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12 md:py-16">
          <div className="container mx-auto px-6">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-semibold tracking-tight">Start with one QR link</h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                We will review the provider, what is already printed, whether a custom domain is involved, and the safest migration path. If the right answer is not to move a printed code, we will say that.
              </p>
              <Button asChild size="lg" className="mt-7 h-11 rounded-lg px-6">
                <Link href="#migration-request">
                  Request free migration audit
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
