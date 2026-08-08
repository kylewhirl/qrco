"use client";

import type { ComponentProps } from "react";

import { iconsData } from "@/components/icons-data/icons-data";
import { Icon } from "@/components/ui/icon-picker";

type ProductBenefitIconProps = Omit<ComponentProps<typeof Icon>, "name"> & {
  name?: string | null;
};

export function ProductBenefitIcon({ name, strokeWidth, ...props }: ProductBenefitIconProps) {
  const value = name?.trim() || "Sparkles";
  const looksLikeEmoji = !/^[A-Za-z][A-Za-z0-9-]*$/.test(value);

  if (looksLikeEmoji) {
    const { className, style, "aria-hidden": ariaHidden } = props;
    return <span aria-hidden={ariaHidden ?? true} className={`inline-flex items-center justify-center leading-none${className ? ` ${className}` : ""}`} style={style}>{value}</span>;
  }

  const normalizedName = value.startsWith("Si")
    ? value
    : value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/([A-Z])([A-Z][a-z])/g, "$1-$2").toLowerCase();
  const iconName = iconsData.some((icon) => icon.name === normalizedName) ? normalizedName : "sparkles";
  return <Icon name={iconName} strokeWidth={strokeWidth} {...props} />;
}
