import Link from "next/link";
import { FileText, Mail, ShieldCheck } from "lucide-react";

import Footer from "@/components/footer";
import Header from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";

type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

type LegalPageShellProps = {
  eyebrow: string;
  title: string;
  summary: string;
  lastUpdated: string;
  sections: LegalSection[];
};

export default function LegalPageShell({
  eyebrow,
  title,
  summary,
  lastUpdated,
  sections,
}: LegalPageShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="border-b bg-muted/40">
          <div className="container mx-auto px-6 py-16">
            <div className="mx-auto max-w-4xl space-y-6">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                {eyebrow}
              </p>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
                  {title}
                </h1>
                <p className="max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                  {summary}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-6 py-10 sm:py-14">
          <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
            <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
              <Card className="border-border/70">
                <CardContent className="space-y-5 pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <ShieldCheck className="h-4 w-4" />
                      Last updated
                    </div>
                    <p className="text-sm text-muted-foreground">{lastUpdated}</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Mail className="h-4 w-4" />
                      Contact
                    </div>
                    <Link
                      href="mailto:hello@tqrco.de"
                      className="text-sm text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
                    >
                      hello@tqrco.de
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/70">
                <CardContent className="space-y-4 pt-6">
                  <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <FileText className="h-4 w-4" />
                    On this page
                  </div>
                  <nav className="space-y-2">
                    {sections.map((section) => (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {section.title}
                      </a>
                    ))}
                  </nav>
                </CardContent>
              </Card>
            </aside>

            <div className="space-y-6">
              {sections.map((section) => (
                <Card
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-24 border-border/70 bg-card/80"
                >
                  <CardContent className="space-y-4 pt-6">
                    <h2 className="text-2xl font-semibold tracking-tight">{section.title}</h2>

                    {section.paragraphs.map((paragraph) => (
                      <p
                        key={paragraph}
                        className="text-sm leading-7 text-muted-foreground sm:text-base"
                      >
                        {paragraph}
                      </p>
                    ))}

                    {section.bullets?.length ? (
                      <ul className="space-y-3 pl-5 text-sm leading-7 text-muted-foreground sm:text-base">
                        {section.bullets.map((bullet) => (
                          <li key={bullet} className="list-disc">
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </CardContent>
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
