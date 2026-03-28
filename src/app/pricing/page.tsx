'use client';

import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';
import { useUser } from '@stackframe/stack';

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

const plans = [
  {
    name: 'Free',
    price: '$0',
    subtitle: '/mo',
    highlighted: false,
    cta: 'Get Started',
    href: '/sign-up',
    features: [
      'Unlimited QR codes',
      'PNG and SVG downloads',
      '10 AI-generated QR codes per month',
      '30 days of analytics history',
    ],
  },
  {
    name: 'Creator',
    price: '$4.99',
    subtitle: '/mo',
    highlighted: false,
    cta: 'Subscribe',
    href: '/dashboard/billing?plan=creator',
    features: [
      'Everything in Free',
      'Unlimited AI-generated QR codes',
      'Uploads for QR images and file destinations',
      'Custom domains',
      'API access up to 5,000 requests per month',
      '180 days of analytics history',
      'Advanced analytics including top locations',
    ],
  },
  {
    name: 'Growth',
    price: '$9.99',
    subtitle: '/mo',
    highlighted: true,
    cta: 'Go Growth',
    href: '/dashboard/billing?plan=growth',
    features: [
      'Everything in Creator',
      'Unlimited API usage',
      'Unlimited analytics history',
      'Highest access tier in the current app',
    ],
  },
];

export default function PricingPage() {
  const user = useUser();

  function resolvePlanHref(href: string) {
    if (href === '/sign-up') {
      return href;
    }

    return user ? href : '/sign-up';
  }

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
              <p className="mt-4 text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                Real plan enforcement now controls uploads, domains, API usage, AI limits, and analytics retention.
              </p>
            </div>

            <div className="grid gap-8 mt-12 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <Card
                  key={plan.name}
                  className={`flex flex-col ${plan.highlighted ? 'border-2 border-primary shadow-lg' : ''}`}
                >
                  <CardHeader className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <CardTitle>{plan.name}</CardTitle>
                      {plan.highlighted ? <Sparkles className="h-4 w-4 text-primary" /> : null}
                    </div>
                    <CardDescription className="mt-1 text-3xl font-semibold">
                      {plan.price}
                      <span className="text-base font-medium"> {plan.subtitle}</span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <ul className="space-y-3 text-sm text-left">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start">
                          <Check className="h-4 w-4 mr-2 mt-0.5 text-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button asChild className="w-full" variant={plan.highlighted ? 'default' : 'outline'}>
                      <Link href={resolvePlanHref(plan.href)}>{plan.cta}</Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
