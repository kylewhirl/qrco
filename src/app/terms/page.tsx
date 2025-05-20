

"use client";

import Footer from "@/components/footer";
import Header from "@/components/header";
import React from "react";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
     <Header/>
    <main className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">1. Overview</h2>
        <p>
          <span className="font-brand font-semibold">The qr code co.</span> (“the Service”) allows users to create, customize, 
          and track QR codes. By using the Service, you agree to the terms 
          outlined in this document.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">2. Account Creation</h2>
        <p>
          To use the Service, you must create an account through Google or 
          via an email magic link (passwordless authentication). By creating 
          an account, you agree to provide accurate information, including 
          your name, email, and, if applicable, a profile photo from your 
          Google account.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">3. Acceptable Use</h2>
        <p>
          You agree to use <span className="font-brand font-semibold">the qr code co.</span> in compliance with all applicable 
          laws. Any use of the Service for illegal activities, spamming, or 
          harmful behavior may result in suspension or termination of your 
          account or the deactivation of specific QR codes.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">4. User Responsibilities</h2>
        <p>
          You are solely responsible for the content encoded in the QR codes 
          you create. This includes ensuring that the content is lawful and 
          non-harmful. <span className="font-brand font-semibold">the qr code co.</span> is not responsible for any consequences 
          arising from the use of QR codes created through the Service.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">5. Service Limitations and Liability</h2>
        <p>
          The Service is provided “as is,” and we do not guarantee that the 
          QR codes generated will always function or remain accessible. We are 
          not liable for:
        </p>
        <ul className="list-disc list-inside ml-4">
          <li>QR codes that lead to harmful, offensive, or inappropriate content.</li>
          <li>Broken or non-functional QR codes due to technical issues or expired links.</li>
        </ul>
        <p>
          You agree that <span className="font-brand font-semibold">the qr code co.</span> is not responsible for any damages 
          arising from your use of the Service or from QR codes failing to 
          work as intended.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">6. Data Collection and Privacy</h2>
        <p>
          When you use the Service, we collect your name, email address, and, 
          if applicable, your profile photo from your Google account. This 
          information is used to manage your account and provide the Service. 
          We do not share QR code analytics or any other user data with third 
          parties. For more details, please refer to our Privacy Policy.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">7. Termination and Suspension</h2>
        <p>
          <span className="font-brand font-semibold">The qr code co.</span> reserves the right to suspend or terminate your 
          account or disable any QR codes if we determine that you have 
          violated these Terms of Service, including but not limited to:
        </p>
        <ul className="list-disc list-inside ml-4">
          <li>Engaging in spam, illegal activities, or abusive behavior.</li>
          <li>Using the Service in a manner that may harm other users or 
              violate applicable laws.</li>
        </ul>
        <p>
          You are not able to terminate your own account.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">8. Changes to the Terms of Service</h2>
        <p>
          We reserve the right to modify or update these Terms of Service at 
          any time. If any changes are made, we will notify you via email. 
          Your continued use of the Service after changes are posted 
          constitutes acceptance of the new terms.
        </p>
      </section>
    </main>
    <Footer/>
    </div>
  );
}