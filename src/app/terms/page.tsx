import LegalPageShell from "@/components/legal-page-shell";

const sections = [
  {
    id: "acceptance",
    title: "1. Acceptance of these Terms",
    paragraphs: [
      "These Terms of Use govern your access to and use of the tqrco website, dashboard, APIs, and related services for creating, managing, and tracking QR codes.",
      "By accessing or using the service, you agree to be bound by these terms. If you do not agree, do not use the service.",
    ],
  },
  {
    id: "accounts",
    title: "2. Accounts and access",
    paragraphs: [
      "You may need to create an account to use certain features. You are responsible for keeping your login credentials secure and for activity that occurs under your account.",
      "You agree to provide accurate information when registering and to keep your account details reasonably current.",
    ],
  },
  {
    id: "acceptable-use",
    title: "3. Acceptable use",
    paragraphs: [
      "You may use the service only for lawful purposes and in a way that does not harm the platform, other users, or third parties.",
    ],
    bullets: [
      "Do not use QR codes generated through the service for unlawful, deceptive, abusive, or infringing content.",
      "Do not attempt to interfere with platform security, reverse engineer restricted systems, or abuse rate limits.",
      "Do not use the service to distribute malware, spam, or content designed to mislead scan recipients.",
    ],
  },
  {
    id: "your-content",
    title: "4. Your content and QR destinations",
    paragraphs: [
      "You remain responsible for the URLs, files, text, and other content you connect to your QR codes. You represent that you have the rights needed to use that content and destination material.",
      "We do not assume responsibility for content hosted on third-party destinations that your QR codes point to.",
    ],
  },
  {
    id: "availability",
    title: "5. Service availability",
    paragraphs: [
      "We work to keep the service available and accurate, but we do not guarantee uninterrupted availability, error-free operation, or that every QR code will remain reachable at all times.",
      "Features may change, be improved, or be removed as the product evolves.",
    ],
  },
  {
    id: "termination",
    title: "6. Suspension and termination",
    paragraphs: [
      "We may suspend or terminate access to the service if we reasonably believe you have violated these terms, created risk for other users, or used the platform in a way that could expose us to legal or operational harm.",
      "You may stop using the service at any time.",
    ],
  },
  {
    id: "intellectual-property",
    title: "7. Intellectual property",
    paragraphs: [
      "The service, including its software, branding, and original content, is owned by tqrco or its licensors and is protected by applicable intellectual property laws.",
      "These terms do not give you ownership of the service itself, only a limited right to use it in accordance with these terms.",
    ],
  },
  {
    id: "disclaimers",
    title: "8. Disclaimers and limits of liability",
    paragraphs: [
      "The service is provided on an as-is and as-available basis to the maximum extent permitted by law.",
      "To the maximum extent permitted by law, tqrco will not be liable for indirect, incidental, special, consequential, or punitive damages, or for lost profits, revenues, data, or business opportunities arising from your use of the service.",
    ],
  },
  {
    id: "changes",
    title: "9. Changes to these terms",
    paragraphs: [
      "We may update these Terms of Use from time to time. When we do, we will post the revised version on this page and update the effective date below.",
      "Your continued use of the service after a revision becomes effective means you accept the updated terms.",
    ],
  },
  {
    id: "contact",
    title: "10. Contact",
    paragraphs: [
      "Questions about these Terms of Use can be sent to hello@tqrco.de.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPageShell
      eyebrow="Legal"
      title="Terms of Use"
      summary="These terms describe the rules for using tqrco, including account access, acceptable use, service limits, and how changes to the product and terms are handled."
      lastUpdated="March 13, 2026"
      sections={sections}
    />
  );
}
