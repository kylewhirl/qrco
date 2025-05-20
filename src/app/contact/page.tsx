"use client";

import React from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-6 py-16">
        <section className="max-w-2xl mx-auto text-center space-y-6">
          <h1 className="text-4xl font-bold">Contact Us</h1>
          <p className="text-lg text-muted-foreground">
            We’re here to help! Whether you have a question about features, pricing, or anything else,
            our team is ready to answer all your questions.
          </p>
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Phone</h2>
              <Link href="tel:+17753910058" className="text-lg text-primary hover:underline">
                +1 (775) 391-0058
              </Link>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Email</h2>
              <Link href="mailto:hello@tqrco.de" className="text-lg text-primary hover:underline">
                hello@tqrco.de
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}