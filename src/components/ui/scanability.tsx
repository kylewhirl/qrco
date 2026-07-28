import React from "react";
import { OctagonAlert, TriangleAlert, Info } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface ScanabilityProps {
  score: number;
  className?: string;
  showScore?: boolean;
}

export default function Scanability({ score, className, showScore = false }: ScanabilityProps) {
  let IconComponent;
  let colorClass;
  let message;
  let status;

  if (score < 0.08) {
    IconComponent = OctagonAlert;
    colorClass = "text-red-500";
    message = "Your code will not scan reliably.";
    status = "Poor";
  } else if (score < 0.15) {
    IconComponent = TriangleAlert;
    colorClass = "text-yellow-500";
    message = "Your code may not scan reliably.";
    status = "Needs work";
  } else {
    IconComponent = Info;
    colorClass = "text-green-500";
    message = "Your code should scan reliably.";
    status = "Good";
  }

  const percentage = Math.round(Math.max(0, Math.min(1, score)) * 100);

  return (
    <div className={className}>
      <Tooltip>
        <TooltipTrigger asChild>
          {showScore ? (
            <button
              type="button"
              aria-label={`Scanability ${percentage} percent, ${status}`}
              className="flex items-center gap-2 rounded-xl border border-border bg-card/95 px-2.5 py-1.5 text-left shadow-[0_12px_26px_-18px_color-mix(in_srgb,var(--foreground)_45%,transparent)] backdrop-blur"
            >
              <IconComponent className={`h-4 w-4 shrink-0 ${colorClass}`} />
              <span className="leading-none">
                <span className="block text-[9px] font-extrabold uppercase tracking-[0.12em] text-muted-foreground">Scanability</span>
                <span className="mt-1 flex items-baseline gap-1.5">
                  <strong className="font-display text-lg leading-none">{percentage}%</strong>
                  <span className="text-[9px] font-bold uppercase">{status}</span>
                </span>
              </span>
            </button>
          ) : (
            <IconComponent className={`h-6 w-6 ${colorClass}`} />
          )}
        </TooltipTrigger>
        <TooltipContent>
          <p>{message}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
