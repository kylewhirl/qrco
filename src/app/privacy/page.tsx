

"use client";

import React from "react";
import Header from "@/components/header";
import Footer from "@/components/footer";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
     <Header/>
    <main className="max-w-3xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">1. Information We Collect</h2>
        <p>When you use <span className="font-brand font-semibold">the qr code co.</span>, we collect the following types of information:</p>
        <ul className="list-disc list-inside ml-4">
          <li>
            <strong>Personal Information:</strong> Name, email address, and, if applicable,
            profile photo from Google or via email magic link.
          </li>
          <li>
            <strong>QR Code Analytics:</strong> When a QR code is scanned, we collect data such
            as the visitor’s country, city, browser type, device type, and operating system.
          </li>
          <li>
            <strong>Cookies:</strong> We use cookies to manage user sessions and maintain a
            seamless user experience.
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">2. How We Use Your Data</h2>
        <ul className="list-disc list-inside ml-4">
          <li>
            <strong>Managing Your Account:</strong> Your personal information is used to create
            and manage your account.
          </li>
          <li>
            <strong>Service Improvement:</strong> We use QR code scan data to improve the
            functionality and performance of our services.
          </li>
          <li>
            <strong>Security:</strong> We use security measures like Cloudflare and Supabase to
            protect your data and secure our systems.
          </li>
        </ul>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">3. Third-Party Services</h2>
        <p>
          We do not share your personal data with any third parties. However, we use the
          following services to help us provide and analyze the service:
        </p>
        <ul className="list-disc list-inside ml-4">
          <li>Google Tag Manager: Helps us manage website tags.</li>
          <li>Google Analytics: Provides website analytics.</li>
          <li>Vercel Analytics: Monitors the performance of the app.</li>
        </ul>
        <p>
          These third-party services may collect anonymized data, but they do not have access to
          your personal information directly.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">4. Data Retention</h2>
        <p>
          We retain your personal data for as long as your account is active. We do not have a
          specific policy for deleting inactive accounts.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">5. User Rights</h2>
        <p>
          At this time, users cannot request access to, correction of, or deletion of their
          personal data. Additionally, users cannot opt out of data collection for analytics and
          tracking purposes.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">6. Security</h2>
        <p>
          We take the security of your data seriously and employ services such as Cloudflare and
          Supabase to protect your information from unauthorized access or breaches. However, no
          method of transmission over the Internet or electronic storage is 100% secure, so we
          cannot guarantee absolute security.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">7. Children’s Privacy</h2>
        <p>
          We do not restrict access to minors, and our service is available to users of all ages.
          However, if we become aware that a minor under the age of 13 has created an account
          without verifiable parental consent, we may take steps to deactivate the account.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">8. Cookies and Tracking Technologies</h2>
        <p>
          We use cookies to maintain user sessions and monitor user behavior within the app. These
          cookies help us provide a smoother user experience.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-2">9. International Users</h2>
        <p>
          We primarily process and store data within the United States and do not have specific
          policies for users from other countries, including those in the EU regarding GDPR
          compliance.
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-2">10. Changes to this Policy</h2>
        <p>
          We may update this Privacy Policy from time to time to reflect changes in our practices
          or for legal or regulatory reasons. We will notify you via email of any significant
          updates. Your continued use of the Service after changes are posted constitutes
          acceptance of the new policy.
        </p>
      </section>
    </main>
    <Footer/>
    </div>
  );
}