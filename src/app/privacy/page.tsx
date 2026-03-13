import LegalPageShell from "@/components/legal-page-shell";

const sections = [
  {
    id: "information-we-collect",
    title: "1. Information we collect",
    paragraphs: [
      "We collect information you provide directly, such as your email address, profile details, billing information if applicable, support messages, and content you submit when creating or managing QR codes.",
      "We also collect usage and device information associated with activity on the service, which can include IP address, browser type, device characteristics, pages visited, referral data, and QR scan analytics.",
    ],
  },
  {
    id: "how-we-use-information",
    title: "2. How we use information",
    paragraphs: [
      "We use personal information to operate the service, authenticate users, process transactions, provide support, analyze performance, prevent abuse, and improve the product.",
    ],
    bullets: [
      "Provide and secure your account.",
      "Generate and manage QR codes and analytics.",
      "Communicate about product updates, support requests, and service notices.",
      "Detect fraud, misuse, and technical incidents.",
    ],
  },
  {
    id: "sharing",
    title: "3. When we share information",
    paragraphs: [
      "We may share information with vendors and service providers that help us operate the platform, such as hosting, analytics, payments, customer support, and infrastructure providers.",
      "We may also disclose information when required by law, to protect rights and safety, or in connection with a business transaction such as a merger, acquisition, or asset sale.",
    ],
  },
  {
    id: "cookies",
    title: "4. Cookies and similar technologies",
    paragraphs: [
      "We use cookies and similar technologies to keep you signed in, remember preferences, understand product usage, and improve performance.",
      "Browser controls may let you limit some cookie behavior, though disabling certain cookies can affect how the service works.",
    ],
  },
  {
    id: "retention",
    title: "5. Data retention",
    paragraphs: [
      "We retain information for as long as needed to provide the service, comply with legal obligations, resolve disputes, enforce agreements, and maintain legitimate business records.",
      "Retention periods may vary depending on the type of data and the reason it was collected.",
    ],
  },
  {
    id: "security",
    title: "6. Security",
    paragraphs: [
      "We use reasonable administrative, technical, and organizational safeguards designed to protect personal information. No method of transmission or storage is completely secure, so absolute security cannot be guaranteed.",
    ],
  },
  {
    id: "your-choices",
    title: "7. Your choices and rights",
    paragraphs: [
      "Depending on where you live, you may have rights to request access, correction, deletion, portability, or restriction of certain personal information.",
      "To make a request, contact hello@tqrco.de. We may need to verify your identity before processing a request.",
    ],
  },
  {
    id: "children",
    title: "8. Children's privacy",
    paragraphs: [
      "The service is not intended for children under 13, and we do not knowingly collect personal information from children under 13.",
      "If you believe a child has provided personal information through the service, contact us so we can review and address the issue.",
    ],
  },
  {
    id: "changes",
    title: "9. Changes to this policy",
    paragraphs: [
      "We may update this Privacy Policy from time to time. If we make material changes, we will revise the date on this page and may provide additional notice when appropriate.",
    ],
  },
  {
    id: "contact",
    title: "10. Contact",
    paragraphs: [
      "Questions or privacy requests can be sent to hello@tqrco.de.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPageShell
      eyebrow="Privacy"
      title="Privacy Policy"
      summary="This policy explains what information tqrco collects, how it is used, when it may be shared, and the choices available to users."
      lastUpdated="March 13, 2026"
      sections={sections}
    />
  );
}
