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
    <Card className="border-dashed border-border/70 bg-muted/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline">
          <Link href="/dashboard/billing?plan=creator">{ctaLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
