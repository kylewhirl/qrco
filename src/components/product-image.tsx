"use client";

import { PackageOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { contrastRatio } from "@/lib/product-page-style";

type ProductImageProps = {
  src?: string | null;
  alt: string;
  primaryColor: string;
  accentColor: string;
  cardColor?: string;
  textColor?: string;
  className?: string;
};

export function ProductImage({ src, alt, primaryColor, accentColor, cardColor = "#ffffff", textColor = "#172033", className = "" }: ProductImageProps) {
  const [failed, setFailed] = useState(false);
  const iconColor = contrastRatio(primaryColor, cardColor) >= 3 ? primaryColor : textColor;
  useEffect(() => setFailed(false), [src]);

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} onError={() => setFailed(true)} decoding="async" className={`size-full object-contain ${className}`} />
    );
  }

  return (
    <div role="img" aria-label={`${alt} product image placeholder`} className={`flex size-full items-center justify-center ${className}`} style={{ background: `linear-gradient(145deg, ${accentColor}18 0%, ${cardColor} 62%, ${primaryColor}0d 100%)` }}>
      <div className="grid size-28 place-items-center rounded-[2rem] border shadow-[0_22px_50px_-28px_rgba(17,24,39,.18)]" style={{ borderColor: `${primaryColor}40`, backgroundColor: `${cardColor}cc`, color: iconColor }}>
        <PackageOpen className="size-14" strokeWidth={1.25} aria-hidden="true" />
      </div>
    </div>
  );
}
