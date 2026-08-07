"use client";

import { PackageOpen } from "lucide-react";
import { useState } from "react";

type ProductImageProps = {
  src?: string | null;
  alt: string;
  primaryColor: string;
  accentColor: string;
  className?: string;
};

export function ProductImage({ src, alt, primaryColor, accentColor, className = "" }: ProductImageProps) {
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={alt} onError={() => setFailed(true)} className={`size-full object-contain ${className}`} />
    );
  }

  return (
    <div role="img" aria-label={`${alt} product image placeholder`} className={`flex size-full items-center justify-center ${className}`} style={{ background: `linear-gradient(145deg, ${accentColor}14 0%, #f5f7f3 62%, ${primaryColor}0d 100%)` }}>
      <div className="grid size-28 place-items-center rounded-[2rem] border bg-white/75 shadow-[0_22px_50px_-28px_rgba(17,24,39,.18)]" style={{ borderColor: `${primaryColor}24`, color: primaryColor }}>
        <PackageOpen className="size-14" strokeWidth={1.25} aria-hidden="true" />
      </div>
    </div>
  );
}
