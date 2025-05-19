"use client";

import { DynamicIcon } from "lucide-react/dynamic";

type DynamicIconProps = React.ComponentProps<typeof DynamicIcon>;

interface IconProps extends Omit<DynamicIconProps, "name" | "size" | "className"> {
  name: DynamicIconProps["name"]; // use the same type as DynamicIcon's name prop
  className?: string;
  size?: number;
}

export const Icon = ({ name, className, size = 24, ...props }: IconProps) => {
  return <DynamicIcon name={name} className={className} size={size} {...props} />;
};