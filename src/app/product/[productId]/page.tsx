import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import {
  ChevronDown,
  CircleAlert,
  CircleSlash,
  ClipboardList,
  Droplet,
  ExternalLink,
  Info,
  Leaf,
  MapPin,
  Megaphone,
  Package,
  Recycle,
  ShieldCheck,
} from "lucide-react";

import { ProductImage } from "@/components/product-image";
import { getBrandProfileForUser } from "@/lib/brand-styles";
import { getPublicProduct } from "@/lib/products";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ productId: string }>;
}): Promise<Metadata> {
  const { productId } = await params;
  const product = await getPublicProduct(productId);
  return product
    ? { title: product.name, description: product.content.description ?? `Product information for ${product.name}` }
    : { title: "Product" };
}

const sections = [
  ["ingredients", "Ingredients", Leaf],
  ["nutrition", "Nutrition", ClipboardList],
  ["allergens", "Allergens", CircleAlert],
  ["sustainability", "Recycling", Recycle],
  ["origin", "Origin", MapPin],
  ["instructions", "Instructions", Info],
  ["certifications", "Certifications", ShieldCheck],
  ["promotion", "More from the brand", Megaphone],
] as const;

const benefitIcons = [Package, Leaf, CircleSlash, Droplet] as const;

function parseBenefits(value: string | null | undefined) {
  return (value ?? "")
    .split("\n")
    .map((line) => {
      const [label, ...rest] = line.split("|");
      return { label: label?.trim(), value: rest.join("|").trim() };
    })
    .filter((benefit): benefit is { label: string; value: string } => Boolean(benefit.label && benefit.value))
    .slice(0, 4);
}

function resolveHostedAsset(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.pathname.startsWith("/product-images/")) {
      return `${url.pathname}${url.search}`;
    }
  } catch {
    // The product editor validates absolute URLs, but keep rendering resilient.
  }
  return value;
}

export default async function HostedProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const { productId } = await params;
  const product = await getPublicProduct(productId);
  if (!product) {
    notFound();
  }

  const brand = await getBrandProfileForUser(product.userId);
  const pageStyle = {
    brandName: product.pageStyle.brandName ?? brand.brandName,
    logoUrl: product.pageStyle.logoUrl ?? brand.logoUrl,
    websiteUrl: product.pageStyle.websiteUrl ?? null,
    primaryColor: product.pageStyle.primaryColor ?? brand.primaryColor,
    accentColor: product.pageStyle.accentColor ?? brand.accentColor,
    backgroundColor: product.pageStyle.backgroundColor ?? brand.backgroundColor,
    cardColor: product.pageStyle.cardColor ?? "#ffffff",
    textColor: product.pageStyle.textColor ?? "#172033",
  };
  const pageVars = {
    "--product-primary": pageStyle.primaryColor,
    "--product-accent": pageStyle.accentColor,
    "--product-background": pageStyle.backgroundColor,
    "--product-text": pageStyle.textColor,
  } as CSSProperties;
  const benefits = parseBenefits(product.content.benefits);
  const visibleSections = sections.filter(([key]) => Boolean(product.content[key]));
  const displayBrandName = pageStyle.brandName || brand.brandName;
  const productImageUrl = product.content.imageKey
    ? `/api/products/${product.id}/image`
    : resolveHostedAsset(product.content.imageUrl);

  return (
    <main style={{ ...pageVars, backgroundColor: pageStyle.backgroundColor, color: pageStyle.textColor }} className="min-h-screen px-3 py-3 sm:px-8 sm:py-5">
      <article className="mx-auto max-w-[1200px] overflow-hidden rounded-[1.5rem] border shadow-[0_30px_90px_-60px_rgba(17,24,39,.55)]" style={{ backgroundColor: pageStyle.cardColor, borderColor: `${pageStyle.primaryColor}18` }}>
        <header className="flex justify-center px-5 pb-7 pt-7 sm:pb-7 sm:pt-5">
          {pageStyle.logoUrl ? (
            // Product logos can be hosted on a customer's own domain.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={resolveHostedAsset(pageStyle.logoUrl) ?? pageStyle.logoUrl} alt={displayBrandName} className="h-14 max-w-[210px] object-contain" />
          ) : (
            <div className="text-center" style={{ color: pageStyle.primaryColor }}>
              <p className="text-2xl font-extrabold uppercase leading-none tracking-[0.08em]">{displayBrandName}</p>
              <p className="mt-2 text-[11px] font-extrabold uppercase tracking-[0.22em] opacity-80">Product information</p>
            </div>
          )}
        </header>

        <div className="mx-auto max-w-[1120px] px-5 pb-10 sm:px-10 sm:pb-14 lg:px-12">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.02fr)_minmax(360px,0.98fr)] lg:items-center lg:gap-14">
            <div className="aspect-[1.16] overflow-hidden rounded-[1rem] border" style={{ borderColor: `${pageStyle.primaryColor}18`, backgroundColor: `${pageStyle.primaryColor}06` }}>
              <ProductImage src={productImageUrl} alt={product.content.imageAlt || product.name} primaryColor={pageStyle.primaryColor} accentColor={pageStyle.accentColor} />
            </div>

            <div>
              <h1 className="max-w-[650px] text-[clamp(2.5rem,5.2vw,4.7rem)] font-extrabold leading-[1.04] tracking-[-0.055em] lg:text-[3.35rem]" style={{ color: pageStyle.textColor }}>
                {product.name}
              </h1>
              {product.content.description ? (
                <p className="mt-5 max-w-[560px] text-base leading-7 opacity-75 sm:text-lg">{product.content.description}</p>
              ) : null}

              {benefits.length > 0 ? (
                <div className="mt-8 grid grid-cols-4 divide-x" style={{ borderColor: `${pageStyle.primaryColor}20` }}>
                  {benefits.map((benefit, index) => {
                    const Icon = benefitIcons[index] ?? Package;
                    return (
                      <div key={`${benefit.label}-${benefit.value}`} className="min-w-0 px-2 text-center first:pl-0 last:pr-0 sm:px-4">
                        <Icon className="mx-auto size-7" strokeWidth={1.5} style={{ color: pageStyle.primaryColor }} aria-hidden="true" />
                        <p className="mt-3 text-[11px] font-semibold leading-5 sm:text-sm">{benefit.label}</p>
                        <p className="text-[11px] leading-5 opacity-70 sm:text-sm">{benefit.value}</p>
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
                  if (!value) return null;
                  return (
                    <details key={key} className="group border-b last:border-b-0" style={{ borderColor: `${pageStyle.primaryColor}18` }}>
                      <summary className="flex cursor-pointer list-none items-center gap-4 px-5 py-5 [&::-webkit-details-marker]:hidden sm:px-7">
                        <Icon className="size-7 shrink-0" strokeWidth={1.45} style={{ color: key === "allergens" ? pageStyle.textColor : pageStyle.primaryColor }} aria-hidden="true" />
                        <span className="flex-1 text-base font-semibold sm:text-lg">{label}</span>
                        <ChevronDown className="size-5 shrink-0 opacity-75 transition-transform group-open:rotate-180" aria-hidden="true" />
                      </summary>
                      <div className="px-5 pb-6 pl-16 pr-8 sm:px-7 sm:pb-7 sm:pl-[4.5rem]">
                        <p className="whitespace-pre-line text-sm leading-7 opacity-75">{value}</p>
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
            <a href={pageStyle.websiteUrl} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold hover:underline" style={{ color: pageStyle.primaryColor }}>
              Visit brand website <ExternalLink className="size-4" />
            </a>
          ) : null}
        </footer>
      </article>
    </main>
  );
}
