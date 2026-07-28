import Link from "next/link";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function FeatureLockCard({
  title,
  description,
  ctaLabel = "Upgrade",
}: {
  title: string;
  description: string;
  ctaLabel?: string;
}) {
  return (
    <Card className="gap-0 rounded-2xl border border-dashed border-border bg-card py-0 shadow-none">
      <CardHeader className="px-3 py-3">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="px-3 pb-3">
        <Button asChild variant="outline" className="rounded-xl border border-border">
          <Link href="/checkout?plan=creator">{ctaLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
