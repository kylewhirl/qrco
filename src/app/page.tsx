import { headers } from "next/headers";
import Link from "next/link"
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button"
import { ArrowRight, BarChart, QrCode, Settings } from "lucide-react"
import QrCodeCreator from "@/components/qr-code-creator"
import { getCustomDomainFallbackUrlForHostname } from "@/lib/custom-domains";
import { getRequestHostname, isPrimaryAppHost } from "@/lib/qr-url";

import Header from "@/components/header";
import Footer from "@/components/footer";

export default async function HomePage() {
  const requestHeaders = await headers();
  const hostname = getRequestHostname({ headers: requestHeaders });

  if (hostname && !isPrimaryAppHost(hostname)) {
    redirect(await getCustomDomainFallbackUrlForHostname(hostname));
  }

  return (
    <div className="flex min-h-screen flex-col">
     <Header/>
      <main className="flex-1">
      <section className="relative w-full overflow-x-clip overflow-y-visible py-12 md:py-20 lg:py-24">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,color-mix(in_oklab,var(--color-muted)_72%,transparent),transparent_28%),radial-gradient(circle_at_top_right,color-mix(in_oklab,var(--color-border)_82%,transparent),transparent_26%),linear-gradient(180deg,var(--color-background)_0%,color-mix(in_oklab,var(--color-muted)_30%,var(--color-background))_100%)]" />
          <div className="absolute -left-24 top-28 h-64 w-64 rounded-full bg-muted/60 blur-3xl" />
          <div className="absolute right-0 top-0 h-80 w-80 rounded-full bg-border/50 blur-3xl" />

          <div className="container relative mx-auto px-6">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">QR code creator</p>
              <h1 className="mt-5 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Create a QR code
              </h1>
              <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                Customize it with colors, gradients, logos, and more.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/sign-up" passHref>
                  <Button className="h-11 rounded-xl px-6">
                    Get Started
                    <ArrowRight className="size-4" />
                  </Button>
                </Link>
                <Link href="/dashboard" passHref>
                  <Button variant="outline" className="h-11 rounded-xl px-6">
                    Open Dashboard
                  </Button>
                </Link>
              </div>
            </div>

            <div className="mt-12">
              <QrCodeCreator variant="hero" />
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted">
          <div className="container mx-auto px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-brand tracking-tight">the qr code co.</h1>
                <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
                  Create, manage, and track QR codes with powerful analytics
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/login" passHref>
                  <Button>Get Started</Button>
                </Link>
                <Link href="/dashboard" passHref>
                  <Button variant="outline">Dashboard</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-6">
            <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="rounded-full bg-primary p-3">
                  <QrCode className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold">Create QR Codes</h3>
                <p className="text-gray-500">Generate unique QR codes that redirect to any URL</p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="rounded-full bg-primary p-3">
                  <BarChart className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold">Track Analytics</h3>
                <p className="text-gray-500">Monitor scan activity and user locations</p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="rounded-full bg-primary p-3">
                  <Settings className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="text-xl font-bold">Manage QR Codes</h3>
                <p className="text-gray-500">Edit, delete, and organize your QR codes</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer/>
    </div>
  )
}
