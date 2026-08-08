import { ProductBenefitIcon } from "@/components/product-benefit-icon";
import { ProductBranding } from "@/components/product-branding";
import { ProductImage } from "@/components/product-image";
import { ensureReadableProductPageStyle, resolveProductPageStyle } from "@/lib/product-page-style";
import { normalizeProductBenefits } from "@/lib/product-benefits";
import type { BrandProfile, Product, ProductContent, ProductPageStyle } from "@/lib/types";

function imageSource(product: Product): string | null {
  if (product.content.imageKey) {
    return `/api/products/${product.id}/image?v=${encodeURIComponent(new Date(product.updatedAt).toISOString())}`;
  }

  return product.content.imageUrl ?? null;
}

export function ProductPageLivePreview({
  product,
  brand,
  pageStyle,
  content,
}: {
  product: Product;
  brand: BrandProfile;
  pageStyle: ProductPageStyle;
  content?: ProductContent;
}) {
  const style = ensureReadableProductPageStyle(resolveProductPageStyle(pageStyle, brand));
  const logoUrl = pageStyle.logoKey
    ? `/api/products/${product.id}/logo?v=${encodeURIComponent(new Date(product.updatedAt).toISOString())}`
    : style.logoUrl;
  const benefits = normalizeProductBenefits((content ?? product.content).benefitItems);

  return (
    <div className="overflow-hidden rounded-[1.25rem] border shadow-[0_24px_60px_-42px_rgba(17,24,39,.7)]" style={{ backgroundColor: style.cardColor, borderColor: `${style.primaryColor}24`, color: style.textColor }}>
      <div className="flex w-full items-center justify-center px-4 py-5 sm:justify-start">
        <ProductBranding logoUrl={logoUrl} brandName={style.brandName} primaryColor={style.primaryColor} />
      </div>
      <div className="grid gap-5 px-4 pb-6 sm:grid-cols-2 sm:items-center">
        <div className="aspect-square overflow-hidden rounded-xl border" style={{ borderColor: `${style.primaryColor}24`, backgroundColor: `${style.primaryColor}08` }}>
          <ProductImage src={imageSource(product)} alt={product.content.imageAlt || product.name} primaryColor={style.primaryColor} accentColor={style.accentColor} cardColor={style.cardColor} textColor={style.textColor} />
        </div>
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.14em]" style={{ color: style.primaryColor, backgroundColor: `${style.accentColor}18`, borderColor: `${style.accentColor}80` }}>
            <span className="size-1.5 rounded-full" style={{ backgroundColor: style.accentColor }} aria-hidden="true" />Product information
          </span>
          <h3 className="mt-3 break-words text-2xl font-extrabold leading-tight tracking-[-0.04em]">{product.name}</h3>
          {product.content.description ? <p className="mt-3 line-clamp-3 text-sm leading-6 opacity-75">{product.content.description}</p> : null}
          {benefits.length ? (
            <div className="mt-5 flex flex-wrap justify-center border-t pt-4" style={{ borderColor: `${style.primaryColor}18` }}>
              {benefits.map((benefit, index) => <div key={index} className="w-1/2 px-1 py-2 text-center text-[10px] leading-4 first:pl-0 last:pr-0"><ProductBenefitIcon name={benefit.icon} className="mx-auto size-4" style={{ color: style.primaryColor }} aria-hidden="true" /><p className="mt-1 whitespace-normal font-bold">{benefit.title}</p>{benefit.subtitle ? <p className="whitespace-normal opacity-70">{benefit.subtitle}</p> : null}</div>)}
            </div>
          ) : null}
        </div>
      </div>
      <div className="border-t px-4 py-3 text-center text-[10px] opacity-70" style={{ borderColor: `${style.primaryColor}18` }}>Product details appear below this preview.</div>
    </div>
  );
}
