'use client';

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { QrCode, BarChart, Settings } from "lucide-react"
import dynamic from "next/dynamic"

const QrCodeCreator = dynamic(() => import("@/components/qr-code-creator"), {
  ssr: false,
  loading: () => (
    <div className="min-h-[600px] flex items-center justify-center">
      Loading QR UI...
    </div>
  ),
})

import Header from "@/components/header";
import Footer from "@/components/footer";


export default function HomePage() {


  return (
    <div className="flex min-h-screen flex-col">
     <Header/>
      <main className="flex-1">
      <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-brand tracking-tight">Create a QR code</h1>
                <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
                  Customize it with colors, logos, and more.
                  </p>
              </div>
              <QrCodeCreator/>
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
