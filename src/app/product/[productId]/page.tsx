import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import {
  ChevronDown,
  CircleAlert,
  ClipboardList,
  ExternalLink,
  Info,
  Leaf,
  MapPin,
  Megaphone,
  Recycle,
  ShieldCheck,
} from "lucide-react";

import { ProductBranding } from "@/components/product-branding";
import { ProductBenefitIcon } from "@/components/product-benefit-icon";
import { ProductImage } from "@/components/product-image";
import { ProductNutritionLabel } from "@/components/product-nutrition-label";
import { getBrandProfileForUser } from "@/lib/brand-styles";
import { normalizeProductBenefits } from "@/lib/product-benefits";
import { normalizeProductNutritionFacts } from "@/lib/product-nutrition";
import { getPublicProduct } from "@/lib/products";
import { getPrimaryAppUrl, getRequestHostname, isPrimaryAppHost } from "@/lib/qr-url";
import { ensureReadableProductPageStyle, resolveProductPageStyle } from "@/lib/product-page-style";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>;
}): Promise<Metadata> {
  const { productId } = await params;
  const requestHeaders = await headers();
  const hostname = getRequestHostname({ headers: requestHeaders });
  const product = await getPublicProduct(productId, hostname);
  if (!product) {
    return { title: "Product" };
  }

  const origin = isPrimaryAppHost(hostname) ? getPrimaryAppUrl().origin : `https://${hostname}`;
  const pageUrl = `${origin}/product/${product.id}`;
  const imageUrl = product.content.imageKey
    ? `${origin}/api/products/${product.id}/image?v=${encodeURIComponent(new Date(product.updatedAt).toISOString())}`
    : resolveHostedAsset(product.content.imageUrl);
  const absoluteImageUrl = imageUrl ? new URL(imageUrl, pageUrl).toString() : undefined;
  const description = product.content.description ?? `Product information for ${product.name}`;

  return {
    title: product.name,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: product.name,
      description,
      type: "website",
      url: pageUrl,
      images: absoluteImageUrl ? [absoluteImageUrl] : undefined,
    },
    twitter: {
      card: absoluteImageUrl ? "summary_large_image" : "summary",
      title: product.name,
      description,
      images: absoluteImageUrl ? [absoluteImageUrl] : undefined,
    },
  };
}

const sections = [
  ["nutrition", "Nutrition", ClipboardList],
  ["ingredients", "Ingredients", Leaf],
  ["allergens", "Allergens", CircleAlert],
  ["sustainability", "Recycling", Recycle],
  ["origin", "Origin", MapPin],
  ["instructions", "Instructions", Info],
  ["certifications", "Certifications", ShieldCheck],
  ["promotion", "More from the brand", Megaphone],
] as const;

function resolveHostedAsset(value: string | null | undefined) {
  if (!value) return null;
  if (value.startsWith("/product-images/")) return value;
  try {
    const url = new URL(value);
    const isLocalHost = ["localhost", "127.0.0.1"].includes(url.hostname);
    if (url.pathname.startsWith("/product-images/") && isPrimaryAppHost(url.hostname)) {
      return `${url.pathname}${url.search}`;
    }
    if (url.protocol === "https:" || (url.protocol === "http:" && isLocalHost)) {
      return url.toString();
    }
  } catch {
    // The product editor validates absolute URLs, but keep rendering resilient.
  }
  return null;
}

export default async function HostedProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const requestHeaders = await headers();
  const hostname = getRequestHostname({ headers: requestHeaders });
  const product = await getPublicProduct(productId, hostname);
  if (!product) {
    notFound();
  }

  const brand = await getBrandProfileForUser(product.userId);
  const pageStyle = ensureReadableProductPageStyle(resolveProductPageStyle(product.pageStyle, brand));
  const pageVars = {
    "--product-primary": pageStyle.primaryColor,
    "--product-accent": pageStyle.accentColor,
    "--product-background": pageStyle.backgroundColor,
    "--product-text": pageStyle.textColor,
  } as CSSProperties;
  const benefits = normalizeProductBenefits(product.content.benefitItems);
  const nutritionFacts = normalizeProductNutritionFacts(product.content.nutritionFacts);
  const visibleSections = sections.filter(([key]) => key === "nutrition"
    ? Boolean(nutritionFacts || product.content.nutrition)
    : Boolean(product.content[key]));
  const displayBrandName = pageStyle.brandName || brand.brandName;
  const productLogoUrl = product.pageStyle.logoKey
    ? `/api/products/${product.id}/logo?v=${encodeURIComponent(new Date(product.updatedAt).toISOString())}`
    : resolveHostedAsset(pageStyle.logoUrl) ?? pageStyle.logoUrl;
  const productImageUrl = product.content.imageKey
    ? `/api/products/${product.id}/image?v=${encodeURIComponent(new Date(product.updatedAt).toISOString())}`
    : resolveHostedAsset(product.content.imageUrl);
  const origin = isPrimaryAppHost(hostname) ? getPrimaryAppUrl().origin : `https://${hostname}`;
  const pageUrl = `${origin}/product/${product.id}`;
  const structuredImageUrl = productImageUrl ? new URL(productImageUrl, pageUrl).toString() : undefined;
  const productStructuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.content.description ?? undefined,
    image: structuredImageUrl ? [structuredImageUrl] : undefined,
    gtin14: product.gtin,
    brand: { "@type": "Brand", name: displayBrandName },
    url: pageUrl,
  };

  return (
    <main style={{ ...pageVars, backgroundColor: pageStyle.backgroundColor, color: pageStyle.textColor }} className="min-h-screen px-3 py-3 sm:px-8 sm:py-5">
      <article className="mx-auto max-w-[1200px] overflow-hidden rounded-[1.5rem] border shadow-[0_30px_90px_-60px_rgba(17,24,39,.55)]" style={{ backgroundColor: pageStyle.cardColor, borderColor: `${pageStyle.primaryColor}18` }}>
        <header className="flex w-full items-center justify-center px-5 pb-7 pt-7 sm:justify-start sm:pb-7 sm:pt-5">
          <ProductBranding logoUrl={productLogoUrl} brandName={displayBrandName} primaryColor={pageStyle.primaryColor} />
        </header>

        <div className="mx-auto max-w-[1120px] px-5 pb-10 sm:px-10 sm:pb-14 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(360px,0.98fr)] lg:items-center lg:gap-14">
            <div className="aspect-[1.16] overflow-hidden rounded-[1rem] border" style={{ borderColor: `${pageStyle.primaryColor}18`, backgroundColor: `${pageStyle.primaryColor}06` }}>
              <ProductImage src={productImageUrl} alt={product.content.imageAlt || product.name} primaryColor={pageStyle.primaryColor} accentColor={pageStyle.accentColor} cardColor={pageStyle.cardColor} textColor={pageStyle.textColor} />
            </div>

            <div>
              <span className="inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em]" style={{ color: pageStyle.primaryColor, backgroundColor: `${pageStyle.accentColor}18`, borderColor: `${pageStyle.accentColor}80` }}>
                <span className="size-2 rounded-full border" style={{ backgroundColor: pageStyle.accentColor, borderColor: pageStyle.primaryColor }} aria-hidden="true" />
                Product information
              </span>
              <h1 className="mt-4 max-w-[650px] break-words text-[clamp(2.5rem,5.2vw,4.7rem)] font-extrabold leading-[1.04] tracking-[-0.055em] lg:text-[3.35rem]" style={{ color: pageStyle.textColor }}>
                {product.name}
              </h1>
              {product.content.description ? (
                <p className="mt-5 max-w-[560px] text-base leading-7 opacity-75 sm:text-lg">{product.content.description}</p>
              ) : null}

              {benefits.length > 0 ? (
                <div className="mx-auto mt-8 grid max-w-4xl grid-cols-2 gap-y-8">
                  {benefits.map((benefit, index) => {
                    return (
                      <div key={index} className="min-w-0 px-2 py-4 text-center sm:px-4 sm:py-0">
                        <ProductBenefitIcon name={benefit.icon} className="mx-auto size-7" strokeWidth={1.5} style={{ color: pageStyle.primaryColor }} aria-hidden="true" />
                        <p className="mt-3 whitespace-normal text-xs font-semibold leading-5 sm:text-sm">{benefit.title}</p>
                        {benefit.subtitle ? <p className="whitespace-normal text-xs leading-5 opacity-70 sm:text-sm">{benefit.subtitle}</p> : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          </div>

          {visibleSections.length > 0 ? (
            <section className="mt-9 sm:mt-11" aria-label="Product details">
              <div className="overflow-hidden rounded-[1rem] border" style={{ borderColor: `${pageStyle.primaryColor}18` }}>
                {sections.map(([key, label, Icon]) => {
                  const value = product.content[key];
                  const isNutrition = key === "nutrition";
                  if (isNutrition ? !nutritionFacts && !value : !value) return null;
                  return (
                    <details key={key} open={isNutrition} className="group border-b last:border-b-0" style={{ borderColor: `${pageStyle.primaryColor}18` }}>
                      <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-5 [&::-webkit-details-marker]:hidden sm:px-7">
                        <Icon className="size-7 shrink-0" strokeWidth={1.45} style={{ color: pageStyle.primaryColor }} aria-hidden="true" />
                        <span className="flex-1 text-base font-semibold sm:text-lg">{label}</span>
                        <ChevronDown className="size-5 shrink-0 opacity-75 transition-transform group-open:rotate-180" aria-hidden="true" />
                      </summary>
                      <div className={isNutrition ? "px-4 pb-6 sm:px-7 sm:pb-7 sm:pl-[4.5rem]" : "px-5 pb-6 pl-16 pr-8 sm:px-7 sm:pb-7 sm:pl-[4.5rem]"}>
                        {isNutrition && nutritionFacts ? <ProductNutritionLabel facts={nutritionFacts} primaryColor={pageStyle.primaryColor} cardColor={pageStyle.cardColor} textColor={pageStyle.textColor} /> : null}
                        {value ? <p className={`${isNutrition && nutritionFacts ? "mt-5" : ""} whitespace-pre-line break-words text-sm leading-7 opacity-75`}>{value}</p> : null}
                      </div>
                    </details>
                  );
                })}
              </div>
            </section>
          ) : null}
        </div>

        <footer className="border-t px-5 py-8 text-center" style={{ borderColor: `${pageStyle.primaryColor}14` }}>
          <p className="text-sm opacity-75">© {new Date().getFullYear()} {displayBrandName}</p>
          {pageStyle.websiteUrl ? (
            <a href={pageStyle.websiteUrl} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold hover:underline" style={{ color: pageStyle.primaryColor }}>
              Visit {displayBrandName} <ExternalLink className="size-4" />
            </a>
          ) : null}
        </footer>
      </article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productStructuredData).replace(/</g, "\\u003c") }} />
    </main>
  );
}
