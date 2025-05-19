import React from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

interface InfoTooltipProps {
  message: string;
  color?: string;
  className?: string;
  onClick?: () => void;
  size?: number;
}

const InfoTooltip: React.FC<InfoTooltipProps> = ({
  message,
  color = "currentColor",
  className,
  onClick,
  size = 5,
}) => {
  const iconSize = `${size * 0.25}rem`;
  const iconStyle = { color, width: iconSize, height: iconSize };
  return (
    <div className={className}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info style={iconStyle} onClick={onClick} />
        </TooltipTrigger>
        <TooltipContent>
          <p>{message}</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default InfoTooltip;
