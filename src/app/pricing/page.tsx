

'use client';

import Link from 'next/link';
import { Check, X } from 'lucide-react';
import Header from '@/components/header';
import Footer from '@/components/footer';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-6">
            <div className="text-center">
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold font-brand tracking-tight">
                Pricing
              </h1>
              <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto">
                Choose the plan that fits your needs. Upgrade or downgrade
                anytime.
              </p>
            </div>

            <div className="grid gap-8 mt-12 sm:grid-cols-2 lg:grid-cols-3">
              {/* Free */}
              <Card className="flex flex-col">
                <CardHeader className="text-center">
                  <CardTitle>Free</CardTitle>
                  <CardDescription className="mt-1 text-3xl font-semibold">
                    $0<span className="text-base font-medium"> / mo</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3 text-sm text-left">
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                      Unlimited Scans
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                      Unlimited QR Codes
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                      No ads ever
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                      No expiration
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                      Advanced Customization
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                      PNG&nbsp;&amp;&nbsp;SVG Downloads
                    </li>
                    <li className="flex items-start text-muted-foreground line-through">
                      <X className="h-4 w-4 mr-2 mt-0.5" />
                      File Uploads
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                      Limited AI‑Generated Codes
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                      Basic Analytics
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                      Community Support
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                      1 Month Analytics History
                    </li>
                    <li className="flex items-start">
                      <Check className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                      Bulk QR Code Creation
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href="/login" passHref>
                    <Button className="w-full" variant="outline">
                      Get Started
                    </Button>
                  </Link>
                </CardFooter>
              </Card>

              {/* Creator */}
              <Card className="flex flex-col border-2 border-primary shadow-lg">
                <CardHeader className="text-center">
                  <CardTitle>Creator</CardTitle>
                  <CardDescription className="mt-1 text-3xl font-semibold">
                    $9<span className="text-base font-medium"> / mo</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3 text-sm text-left">
                    {[
                      'Everything in Free',
                      'Unlimited AI‑Generated Codes',
                      'File Uploads (SVG, PNG, PDF)',
                      'High‑Resolution PDF Downloads',
                      'Custom Domains',
                      '6 Months Analytics History',
                      'Advanced Analytics (geo & device)',
                      'API Access (5 k req/mo)',
                      'Email & Community Support',
                      'Team Collaboration (3 seats)',
                    ].map((feature) => (
                      <li key={feature} className="flex items-start">
                        <Check className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                <Button
                    className="w-full"
                    onClick={async () => {
                        const res = await fetch('/api/checkout', { method: 'POST' });
                        if (res.status === 401) {
                            window.location.assign('/sign-up');
                            return;
                        }
                        const { url } = await res.json();
                        window.location.assign(url);
                    }}
                >
                    Subscribe
                </Button>  </CardFooter>
              </Card>

              {/* Business */}
              <Card className="flex flex-col">
                <CardHeader className="text-center">
                  <CardTitle>Business</CardTitle>
                  <CardDescription className="mt-1 text-3xl font-semibold">
                    $29<span className="text-base font-medium"> / mo</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-3 text-sm text-left">
                    {[
                      'Everything in Pro',
                      'Unlimited API Access',
                      'Unlimited Analytics History',
                      'White‑label QR Codes',
                      'Priority Email Support & SLAs',
                      'Team Collaboration (10 seats)',
                      'Single Sign‑On (SSO)',
                      'Webhooks & Zapier Integration',
                    ].map((feature) => (
                      <li key={feature} className="flex items-start">
                        <Check className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href="/contact" passHref>
                    <Button className="w-full" variant="outline">
                      Contact Sales
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}