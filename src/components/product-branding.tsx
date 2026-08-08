"use client";

import { useEffect, useState } from "react";

type ProductBrandingProps = {
  logoUrl?: string | null;
  brandName: string;
  primaryColor: string;
};

export function ProductBranding({ logoUrl, brandName, primaryColor }: ProductBrandingProps) {
  const [failed, setFailed] = useState(false);
  const displayName = brandName || "My brand";
  useEffect(() => setFailed(false), [logoUrl]);

  const hasLogo = Boolean(logoUrl && !failed);

  return (
    <div className="flex w-full max-w-[32rem] flex-col items-center justify-center text-center sm:flex-row sm:items-center sm:justify-start sm:gap-4 sm:text-left" style={{ color: primaryColor }}>
      {hasLogo ? (
        <div className="flex min-h-16 w-full shrink-0 items-center justify-center px-3 sm:w-auto sm:max-w-[12rem] sm:justify-start sm:px-0">
          {/* Product logos are customer-controlled assets; the text fallback keeps a broken URL from blanking the page header. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl!} alt={displayName} onError={() => setFailed(true)} className="max-h-16 max-w-[15rem] w-auto object-contain sm:max-w-[12rem]" />
        </div>
      ) : null}
      <p className={`${hasLogo ? "mt-3 text-xs font-semibold tracking-[0.12em] opacity-80 sm:mt-0" : "text-2xl font-extrabold tracking-[-0.03em]"} max-w-full break-words leading-tight`}>
        {displayName}
      </p>
      {!hasLogo ? <p className="mt-2 text-[11px] font-extrabold uppercase tracking-[0.22em] opacity-80">Product information</p> : null}
    </div>
  );
}
