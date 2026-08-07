"use client";

import Link from "next/link";
import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, ExternalLink, ImagePlus, Loader2, Save, ScanLine } from "lucide-react";
import { toast } from "sonner";

import QrPreview from "@/components/qr-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildGs1DigitalLinkPath } from "@/lib/gs1-digital-link";
import type { BrandProfile, Product, ProductContent, ProductPageStyle } from "@/lib/types";

const contentFields: Array<[keyof ProductContent, string]> = [
  ["description", "Description"],
  ["imageUrl", "Product image URL"],
  ["imageAlt", "Image alt text"],
  ["benefits", "Highlights"],
  ["ingredients", "Ingredients"],
  ["allergens", "Allergens"],
  ["nutrition", "Nutrition"],
  ["instructions", "Instructions"],
  ["certifications", "Certifications"],
  ["origin", "Origin & traceability"],
  ["sustainability", "Sustainability"],
  ["promotion", "More from the brand"],
];

export function ProductDetailClient({ initialProduct, brand }: { initialProduct: Product; brand: BrandProfile }) {
  const [product, setProduct] = useState(initialProduct);
  const [name, setName] = useState(initialProduct.name);
  const [destinationUrl, setDestinationUrl] = useState(initialProduct.destinationUrl);
  const [content, setContent] = useState<ProductContent>(initialProduct.content);
  const [pageStyle, setPageStyle] = useState<ProductPageStyle>({
    brandName: initialProduct.pageStyle.brandName ?? brand.brandName,
    logoUrl: initialProduct.pageStyle.logoUrl ?? brand.logoUrl ?? "",
    websiteUrl: initialProduct.pageStyle.websiteUrl ?? "",
    primaryColor: initialProduct.pageStyle.primaryColor ?? brand.primaryColor,
    accentColor: initialProduct.pageStyle.accentColor ?? brand.accentColor,
    backgroundColor: initialProduct.pageStyle.backgroundColor ?? brand.backgroundColor,
    cardColor: initialProduct.pageStyle.cardColor ?? "#ffffff",
    textColor: initialProduct.pageStyle.textColor ?? "#172033",
  });
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentOrigin, setCurrentOrigin] = useState("");
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => setCurrentOrigin(window.location.origin), []);
  const digitalLinkPath = buildGs1DigitalLinkPath({
    gtin: product.gtin,
    productName: product.name,
    batchLot: product.qualifiers.batchLot,
    serial: product.qualifiers.serial,
    expiry: product.qualifiers.expiry,
  });
  const digitalLinkQuery = product.publicUrl.includes("?") ? product.publicUrl.slice(product.publicUrl.indexOf("?")) : "";
  const localDigitalLinkPath = `/${digitalLinkPath}${digitalLinkQuery}`;
  const digitalLinkHref = product.customHostname ? product.publicUrl : localDigitalLinkPath;
  const previewDigitalLinkUrl = product.customHostname
    ? product.publicUrl
    : currentOrigin
      ? `${currentOrigin}${localDigitalLinkPath}`
      : product.publicUrl;

  async function save() {
    setSaving(true);
    try {
      const response = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          destinationUrl: product.hostedExperience ? null : destinationUrl,
          hostedExperience: product.hostedExperience,
          content,
          pageStyle: {
            ...pageStyle,
            brandName: pageStyle.brandName?.trim() || null,
            logoUrl: pageStyle.logoUrl?.trim() || null,
            websiteUrl: pageStyle.websiteUrl?.trim() || null,
          },
        }),
      });
      const result = await response.json() as Product & { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not save product");
      setProduct(result);
      setName(result.name);
      setDestinationUrl(result.destinationUrl);
      setContent(result.content);
      setPageStyle({
        brandName: result.pageStyle.brandName ?? brand.brandName,
        logoUrl: result.pageStyle.logoUrl ?? "",
        websiteUrl: result.pageStyle.websiteUrl ?? "",
        primaryColor: result.pageStyle.primaryColor ?? brand.primaryColor,
        accentColor: result.pageStyle.accentColor ?? brand.accentColor,
        backgroundColor: result.pageStyle.backgroundColor ?? brand.backgroundColor,
        cardColor: result.pageStyle.cardColor ?? "#ffffff",
        textColor: result.pageStyle.textColor ?? "#172033",
      });
      toast.success("Product experience updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save product");
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`/api/products/${product.id}/image`, { method: "POST", body: formData });
      const result = await response.json() as Product & { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not upload product image");
      setProduct(result);
      setContent(result.content);
      toast.success("Product image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload product image");
    } finally {
      setUploadingImage(false);
    }
  }

  function resetPageStyle() {
    setPageStyle({
      brandName: brand.brandName,
      logoUrl: brand.logoUrl ?? "",
      websiteUrl: "",
      primaryColor: brand.primaryColor,
      accentColor: brand.accentColor,
      backgroundColor: brand.backgroundColor,
      cardColor: "#ffffff",
      textColor: "#172033",
    });
  }

  function updatePageStyle(key: keyof ProductPageStyle, value: string) {
    setPageStyle((current) => ({ ...current, [key]: value }));
  }

  const checks = [
    [true, "GTIN check digit validated", product.gtin],
    [product.publicUrl.includes(`/01/${product.gtin}`), "GS1 Digital Link path", digitalLinkPath],
    [Boolean(product.customHostname), "Brand-owned resolver domain", product.customHostname ?? "Platform domain · suitable for pilots"],
    [product.hostedExperience || /^https?:\/\//.test(product.destinationUrl), "Destination available", product.hostedExperience ? "Hosted page" : product.destinationUrl],
  ] as const;

  return (
    <div className="space-y-6 p-4 pt-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/dashboard/products" className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--brand-blue)] hover:underline"><ArrowLeft className="size-3.5" />Products</Link>
          <h1 className="mt-3 text-3xl font-extrabold tracking-[-0.05em]">{product.name}</h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">Submitted {product.identifierSubmitted} · normalized GTIN-14 {product.gtin}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" className="rounded-xl"><a href={digitalLinkHref} target="_blank" rel="noreferrer"><ExternalLink className="size-4" />Open Digital Link</a></Button>
          <Button asChild variant="outline" className="rounded-xl"><Link href={`/dashboard/${product.qrId}`}><ScanLine className="size-4" />Scan analytics</Link></Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="rounded-2xl border-border/80">
          <CardHeader className="border-b p-5 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-xl">Product experience</CardTitle>
                <CardDescription className="mt-1">Change web content without changing the printed identity.</CardDescription>
              </div>
              <Badge className="rounded-full bg-[var(--brand-lime)] text-[#263600] hover:bg-[var(--brand-lime)]">{product.hostedExperience ? "Hosted by The QR Code Co." : "External destination"}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 p-5 sm:p-6">
            <div className="space-y-2">
              <Label htmlFor="product-detail-name">Product name</Label>
              <Input id="product-detail-name" value={name} onChange={(event) => setName(event.target.value)} className="h-11 rounded-xl" />
            </div>
            {product.hostedExperience ? (
              <div className="rounded-xl border bg-muted/25 px-4 py-3 text-sm text-muted-foreground">This identity resolves to the hosted product page. Your public URL is editable content at <span className="font-mono text-xs">{product.destinationUrl}</span>.</div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="product-detail-destination">Default destination URL</Label>
                <Input id="product-detail-destination" type="url" value={destinationUrl} onChange={(event) => setDestinationUrl(event.target.value)} className="h-11 rounded-xl" />
              </div>
            )}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-muted/20 px-4 py-3">
              <div>
                <p className="text-sm font-bold">Product image</p>
                <p className="mt-1 text-xs text-muted-foreground">Uploads use the same asset storage as QR images.</p>
              </div>
              <div className="flex items-center gap-2">
                <input ref={imageInputRef} type="file" accept="image/*" className="sr-only" onChange={uploadImage} />
                <Button type="button" variant="outline" size="sm" onClick={() => imageInputRef.current?.click()} disabled={uploadingImage} className="rounded-lg">
                  {uploadingImage ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
                  {uploadingImage ? "Uploading" : content.imageKey ? "Replace image" : "Upload image"}
                </Button>
                {content.imageKey ? <span className="text-xs font-semibold text-emerald-600">Stored</span> : null}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {contentFields.map(([key, label]) => (
                <div key={key} className="space-y-2 sm:last:col-span-2">
                  <Label htmlFor={`product-detail-${key}`}>{label}</Label>
                  <Textarea id={`product-detail-${key}`} value={content[key] ?? ""} onChange={(event) => setContent((current) => ({ ...current, [key]: event.target.value }))} className="min-h-24 rounded-xl" />
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 border-t pt-5">
              <Button onClick={save} disabled={saving} className="rounded-xl"><Save className="size-4" />{saving ? "Saving" : "Save experience"}</Button>
              <span className="text-xs text-muted-foreground">The GS1 identity remains {digitalLinkPath}.</span>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-2xl border-border/80">
            <CardHeader className="border-b p-5">
              <CardTitle className="text-lg">Page design</CardTitle>
              <CardDescription className="mt-1">Match this product page to your brand.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="space-y-2">
                <Label htmlFor="product-page-brand-name">Display brand name</Label>
                <Input id="product-page-brand-name" value={pageStyle.brandName ?? ""} onChange={(event) => updatePageStyle("brandName", event.target.value)} placeholder="ACME Beverage Co." className="h-10 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-page-logo">Logo URL</Label>
                <Input id="product-page-logo" value={pageStyle.logoUrl ?? ""} onChange={(event) => updatePageStyle("logoUrl", event.target.value)} placeholder="https://brand.com/logo.png" className="h-10 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-page-website">Brand website</Label>
                <Input id="product-page-website" type="url" value={pageStyle.websiteUrl ?? ""} onChange={(event) => updatePageStyle("websiteUrl", event.target.value)} placeholder="https://brand.com" className="h-10 rounded-xl" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {([
                  ["primaryColor", "Primary color", "Headings and links"],
                  ["accentColor", "Accent color", "Product badge"],
                  ["backgroundColor", "Page background", "Outer page background"],
                  ["cardColor", "Card color", "Content surface"],
                  ["textColor", "Text color", "Main page text"],
                ] as const).map(([key, label, description]) => (
                  <div key={key} className="flex items-center gap-3 rounded-xl border p-3">
                    <Input type="color" value={pageStyle[key] ?? "#111827"} onChange={(event) => updatePageStyle(key, event.target.value)} aria-label={`${label} picker`} className="size-10 shrink-0 cursor-pointer rounded-lg p-1" />
                    <div className="min-w-0 flex-1"><p className="text-sm font-bold">{label}</p><p className="text-xs text-muted-foreground">{description}</p></div>
                    <Input value={pageStyle[key] ?? "#111827"} onChange={(event) => updatePageStyle(key, event.target.value)} aria-label={label} maxLength={7} className="h-9 w-24 rounded-lg font-mono text-xs uppercase" />
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2 border-t pt-4">
                <Button type="button" variant="outline" size="sm" onClick={resetPageStyle} className="rounded-lg">Use brand defaults</Button>
                <Button asChild type="button" variant="ghost" size="sm" className="rounded-lg"><a href={`/product/${product.id}`} target="_blank" rel="noreferrer"><ExternalLink className="size-3.5" />Preview page</a></Button>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">Save the experience to publish these design changes to the hosted page.</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden rounded-2xl border-border/80">
              <div className="qr-canvas-grid flex items-center justify-center border-b p-8">
              <div className="rounded-2xl border bg-white p-4 shadow-[0_30px_70px_-42px_rgba(17,24,39,.7)]"><QrPreview data={previewDigitalLinkUrl} errorLevel="M" size={220} margin={12} styleSettings={{ dotStyle: "square", dotColorType: "solid", dotColors: ["#111827"], eyeStyle: "square", eyeColorType: "solid", eyeColors: ["#111827"], innerEyeStyle: "square", innerEyeColorType: "solid", innerEyeColors: ["#111827"], bgColorType: "solid", bgColors: ["#ffffff"] }} /></div>
            </div>
            <CardContent className="space-y-4 p-5">
              <div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">Persistent Digital Link</p><p className="mt-2 break-all font-mono text-xs leading-5">{product.publicUrl}</p></div>
              <div className="border-t pt-4"><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">Readiness</p><div className="mt-3 space-y-3">{checks.map(([complete, label, detail]) => <div key={label} className="grid grid-cols-[20px_minmax(0,1fr)] gap-2.5"><span className={`mt-0.5 grid size-[18px] place-items-center rounded-full ${complete ? "bg-emerald-500 text-white" : "border bg-muted text-muted-foreground"}`}>{complete ? <Check className="size-3" strokeWidth={3} /> : null}</span><div><p className="text-sm font-bold">{label}</p><p className="mt-0.5 break-words text-xs leading-5 text-muted-foreground">{detail}</p></div></div>)}</div></div>
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/7 p-3 text-xs leading-5 text-muted-foreground">Software checks do not replace physical barcode verification. Confirm symbol quality, substrate, placement, quiet zone, and POS behavior with the final package.</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
