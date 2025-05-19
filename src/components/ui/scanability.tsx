import React from "react";
import { OctagonAlert, TriangleAlert, Info } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface ScanabilityProps {
  score: number;
  className?: string;
}

export default function Scanability({ score, className }: ScanabilityProps) {
  let IconComponent;
  let colorClass;
  let message;

  if (score < 0.08) {
    IconComponent = OctagonAlert;
    colorClass = "text-red-500";
    message = "Your code will not scan reliably.";
  } else if (score < 0.15) {
    IconComponent = TriangleAlert;
    colorClass = "text-yellow-500";
    message = "Your code may not scan reliably.";
  } else {
    IconComponent = Info;
    colorClass = "text-green-500";
    message = "Your code should scan reliably.";
  }

  return (
    <div className={className}>
      <Tooltip>
        <TooltipTrigger asChild>
          <IconComponent className={`h-6 w-6 ${colorClass}`} />
        </TooltipTrigger>
        <TooltipContent>
          <p>{message}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}