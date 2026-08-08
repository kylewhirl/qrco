"use client";

import Link from "next/link";
import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronDown, ChevronUp, ExternalLink, ImagePlus, Loader2, Plus, Save, ScanLine, Trash2 } from "lucide-react";
import { toast } from "sonner";

import QrPreview from "@/components/qr-preview";
import { ProductBenefitIcon } from "@/components/product-benefit-icon";
import { ProductPageLivePreview } from "@/components/dashboard/product-page-live-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { IconPicker } from "@/components/ui/icon-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { buildGs1DigitalLinkPath } from "@/lib/gs1-digital-link";
import { getProductPageStyleContrastIssues, resolveProductPageStyle } from "@/lib/product-page-style";
import { normalizeProductBenefits } from "@/lib/product-benefits";
import { normalizeProductNutritionFacts } from "@/lib/product-nutrition";
import type { BrandProfile, Product, ProductBenefit, ProductContent, ProductNutritionFacts, ProductPageStyle } from "@/lib/types";

type ProductTextField = Exclude<keyof ProductContent, "benefitItems" | "nutritionFacts">;

const contentFields: Array<[ProductTextField, string]> = [
  ["description", "Description"],
  ["imageUrl", "Product image URL"],
  ["imageAlt", "Image alt text"],
  ["ingredients", "Ingredients"],
  ["allergens", "Allergens"],
  ["nutrition", "Additional nutrition notes"],
  ["instructions", "Instructions"],
  ["certifications", "Certifications"],
  ["origin", "Origin & traceability"],
  ["sustainability", "Sustainability"],
  ["promotion", "More from the brand"],
];

const nutritionMetaFields = [
  ["servingSize", "Serving size", "12 FL OZ (355 mL)"],
  ["servingsPerContainer", "Servings per container", "1"],
  ["calories", "Calories", "0"],
] as const satisfies ReadonlyArray<readonly [keyof ProductNutritionFacts, string, string]>;

const nutritionRows = [
  ["totalFat", "Total fat", "0 g", "totalFatDailyValue"],
  ["saturatedFat", "Saturated fat", "0 g", "saturatedFatDailyValue"],
  ["transFat", "Trans fat", "0 g", null],
  ["cholesterol", "Cholesterol", "0 mg", "cholesterolDailyValue"],
  ["sodium", "Sodium", "0 mg", "sodiumDailyValue"],
  ["totalCarbohydrate", "Total carbohydrate", "0 g", "totalCarbohydrateDailyValue"],
  ["dietaryFiber", "Dietary fiber", "0 g", "dietaryFiberDailyValue"],
  ["totalSugars", "Total sugars", "0 g", null],
  ["addedSugars", "Includes added sugars", "0 g", "addedSugarsDailyValue"],
  ["protein", "Protein", "0 g", "proteinDailyValue"],
  ["vitaminD", "Vitamin D", "0 mcg", "vitaminDDailyValue"],
  ["calcium", "Calcium", "0 mg", "calciumDailyValue"],
  ["iron", "Iron", "0 mg", "ironDailyValue"],
  ["potassium", "Potassium", "0 mg", "potassiumDailyValue"],
] as const satisfies ReadonlyArray<readonly [keyof ProductNutritionFacts, string, string, keyof ProductNutritionFacts | null]>;

function ProductNutritionFactsEditor({
  facts,
  onChange,
}: {
  facts: ProductNutritionFacts;
  onChange: (key: keyof ProductNutritionFacts, value: string) => void;
}) {
  return (
    <div className="space-y-4 rounded-xl border bg-muted/20 p-4">
      <div>
        <p className="text-sm font-bold">Nutrition label</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">Nutrition opens by default on the public page and includes amounts plus % Daily Value when provided.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {nutritionMetaFields.map(([key, label, placeholder]) => (
          <div key={key} className="space-y-1.5">
            <Label htmlFor={`product-nutrition-${key}`}>{label}</Label>
            <Input id={`product-nutrition-${key}`} value={facts[key] ?? ""} onChange={(event) => onChange(key, event.target.value)} placeholder={placeholder} maxLength={120} className="h-10 rounded-lg" />
          </div>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {nutritionRows.map(([key, label, placeholder, dailyValueKey]) => (
          <div key={key} className="space-y-1.5">
            <Label htmlFor={`product-nutrition-${key}`}>{label}</Label>
            <div className={dailyValueKey ? "grid grid-cols-[minmax(0,1fr)_6rem] gap-2" : ""}>
              <Input id={`product-nutrition-${key}`} value={facts[key] ?? ""} onChange={(event) => onChange(key, event.target.value)} placeholder={placeholder} maxLength={120} className="h-10 rounded-lg" />
              {dailyValueKey ? <Input aria-label={`${label} percent Daily Value`} value={facts[dailyValueKey] ?? ""} onChange={(event) => onChange(dailyValueKey, event.target.value)} placeholder="% DV" maxLength={120} className="h-10 rounded-lg" /> : null}
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="product-nutrition-footnote">Nutrition footnote</Label>
        <Textarea id="product-nutrition-footnote" value={facts.footnote ?? ""} onChange={(event) => onChange("footnote", event.target.value)} placeholder="Optional product-specific nutrition note" maxLength={500} className="min-h-20 rounded-lg" />
      </div>
    </div>
  );
}

export function ProductDetailClient({ initialProduct, brand }: { initialProduct: Product; brand: BrandProfile }) {
  const [product, setProduct] = useState(initialProduct);
  const [name, setName] = useState(initialProduct.name);
  const [destinationUrl, setDestinationUrl] = useState(initialProduct.destinationUrl);
  const [content, setContent] = useState<ProductContent>(initialProduct.content);
  const [benefits, setBenefits] = useState<ProductBenefit[]>(() => normalizeProductBenefits(initialProduct.content.benefitItems));
  const [nutritionFacts, setNutritionFacts] = useState<ProductNutritionFacts>(() => normalizeProductNutritionFacts(initialProduct.content.nutritionFacts) ?? {});
  const [pageStyle, setPageStyle] = useState<ProductPageStyle>(initialProduct.pageStyle);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [removingLogo, setRemovingLogo] = useState(false);
  const [currentOrigin, setCurrentOrigin] = useState("");
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const logoInputRef = useRef<HTMLInputElement | null>(null);
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
          content: {
            ...content,
            benefitItems: benefits,
            nutritionFacts,
          },
          pageStyle,
        }),
      });
      const result = await response.json() as Product & { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not save product");
      setProduct(result);
      setName(result.name);
      setDestinationUrl(result.destinationUrl);
      setContent(result.content);
      setBenefits(normalizeProductBenefits(result.content.benefitItems));
      setNutritionFacts(normalizeProductNutritionFacts(result.content.nutritionFacts) ?? {});
      setPageStyle(result.pageStyle);
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
      setBenefits(normalizeProductBenefits(result.content.benefitItems));
      setNutritionFacts(normalizeProductNutritionFacts(result.content.nutritionFacts) ?? {});
      toast.success("Product image uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload product image");
    } finally {
      setUploadingImage(false);
    }
  }

  async function uploadLogo(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }

    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch(`/api/products/${product.id}/logo`, { method: "POST", body: formData });
      const result = await response.json() as Product & { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not upload product logo");
      setProduct(result);
      setPageStyle(result.pageStyle);
      toast.success("Product logo uploaded to R2");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload product logo");
    } finally {
      setUploadingLogo(false);
    }
  }

  async function removeLogo() {
    setRemovingLogo(true);
    try {
      const response = await fetch(`/api/products/${product.id}/logo`, { method: "DELETE" });
      const result = await response.json() as Product & { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not remove product logo");
      setProduct(result);
      setPageStyle(result.pageStyle);
      toast.success("Product logo removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not remove product logo");
    } finally {
      setRemovingLogo(false);
    }
  }

  function updateBenefits(nextBenefits: ProductBenefit[]) {
    setBenefits(nextBenefits);
    setContent((current) => ({ ...current, benefitItems: nextBenefits }));
  }

  function updateBenefit(index: number, key: keyof ProductBenefit, value: string) {
    updateBenefits(benefits.map((benefit, benefitIndex) => benefitIndex === index ? { ...benefit, [key]: value } : benefit));
  }

  function addBenefit() {
    if (benefits.length >= 8) return;
    updateBenefits([...benefits, { icon: "sparkles", title: "New benefit", subtitle: "" }]);
  }

  function removeBenefit(index: number) {
    updateBenefits(benefits.filter((_, benefitIndex) => benefitIndex !== index));
  }

  function moveBenefit(index: number, offset: -1 | 1) {
    const targetIndex = index + offset;
    if (targetIndex < 0 || targetIndex >= benefits.length) return;
    const nextBenefits = [...benefits];
    [nextBenefits[index], nextBenefits[targetIndex]] = [nextBenefits[targetIndex], nextBenefits[index]];
    updateBenefits(nextBenefits);
  }

  function updateNutritionFact(key: keyof ProductNutritionFacts, value: string) {
    const nextFacts = { ...nutritionFacts, [key]: value };
    setNutritionFacts(nextFacts);
    setContent((current) => ({ ...current, nutritionFacts: nextFacts }));
  }

  function resetPageStyle() {
    setPageStyle({});
  }

  function updatePageStyle(key: keyof ProductPageStyle, value: string) {
    setPageStyle((current) => ({ ...current, [key]: value }));
  }

  const resolvedPageStyle = resolveProductPageStyle(pageStyle, brand);
  const contrastIssues = getProductPageStyleContrastIssues(resolvedPageStyle);

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
            <div className="space-y-3 rounded-xl border bg-muted/20 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">Benefits</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Add up to eight highlights. Each one can use any icon, title, and subtitle.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addBenefit} disabled={benefits.length >= 8} className="rounded-lg"><Plus className="size-4" />Add benefit</Button>
              </div>
              {benefits.length ? (
                <div className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="rounded-xl border bg-background p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2">
                          <IconPicker value={benefit.icon ?? "Sparkles"} onValueChange={(iconName) => updateBenefit(index, "icon", iconName)}>
                            <Button type="button" variant="outline" size="icon" title="Choose benefit icon" aria-label={`Choose icon for benefit ${index + 1}`} className="size-10 shrink-0 rounded-lg"><ProductBenefitIcon name={benefit.icon} className="size-5" /></Button>
                          </IconPicker>
                          <p className="truncate text-sm font-bold">Benefit {index + 1}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button type="button" variant="ghost" size="icon" onClick={() => moveBenefit(index, -1)} disabled={index === 0} aria-label={`Move benefit ${index + 1} up`} className="size-9 rounded-lg text-muted-foreground"><ChevronUp className="size-4" /></Button>
                          <Button type="button" variant="ghost" size="icon" onClick={() => moveBenefit(index, 1)} disabled={index === benefits.length - 1} aria-label={`Move benefit ${index + 1} down`} className="size-9 rounded-lg text-muted-foreground"><ChevronDown className="size-4" /></Button>
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeBenefit(index)} aria-label={`Remove benefit ${index + 1}`} className="size-9 rounded-lg text-muted-foreground"><Trash2 className="size-4" /></Button>
                        </div>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <Label htmlFor={`product-benefit-title-${index}`}>Title</Label>
                          <Input id={`product-benefit-title-${index}`} value={benefit.title} onChange={(event) => updateBenefit(index, "title", event.target.value)} placeholder="e.g. Size" maxLength={120} className="h-10 rounded-lg" />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor={`product-benefit-subtitle-${index}`}>Subtitle</Label>
                          <Input id={`product-benefit-subtitle-${index}`} value={benefit.subtitle ?? ""} onChange={(event) => updateBenefit(index, "subtitle", event.target.value)} placeholder="e.g. 12 FL OZ (355 mL)" maxLength={240} className="h-10 rounded-lg" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed px-3 py-5 text-center text-xs text-muted-foreground">No benefits yet. Add a highlight to show it on the product page.</div>
              )}
            </div>
            <ProductNutritionFactsEditor facts={nutritionFacts} onChange={updateNutritionFact} />
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
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold">Live preview</p>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Unsaved</span>
                </div>
                <ProductPageLivePreview product={product} brand={brand} pageStyle={pageStyle} content={content} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-page-brand-name">Display brand name</Label>
                <Input id="product-page-brand-name" value={pageStyle.brandName ?? resolvedPageStyle.brandName} onChange={(event) => updatePageStyle("brandName", event.target.value)} placeholder="ACME Beverage Co." className="h-10 rounded-xl" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Logo</Label>
                  {pageStyle.logoKey ? <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600">Stored in R2</span> : pageStyle.logoUrl ? <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Legacy URL</span> : brand.logoUrl ? <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">Brand default</span> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <input ref={logoInputRef} type="file" accept="image/*" className="sr-only" onChange={uploadLogo} />
                  <Button type="button" variant="outline" size="sm" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo || removingLogo} className="h-10 rounded-xl">
                    {uploadingLogo ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}
                    {uploadingLogo ? "Uploading" : pageStyle.logoKey ? "Replace logo" : "Upload logo"}
                  </Button>
                  {(pageStyle.logoKey || pageStyle.logoUrl !== undefined || brand.logoUrl) ? <Button type="button" variant="ghost" size="sm" onClick={removeLogo} disabled={uploadingLogo || removingLogo} className="h-10 rounded-xl text-muted-foreground"><Trash2 className="size-4" />{removingLogo ? "Removing" : "Remove"}</Button> : null}
                </div>
                <p className="text-xs leading-5 text-muted-foreground">New logos are stored in R2, automatically centered, and shown above the business name.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-page-website">Brand website</Label>
                <Input id="product-page-website" type="url" value={pageStyle.websiteUrl ?? resolvedPageStyle.websiteUrl ?? ""} onChange={(event) => updatePageStyle("websiteUrl", event.target.value)} placeholder="https://brand.com" className="h-10 rounded-xl" />
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
                    <Input type="color" value={resolvedPageStyle[key]} onChange={(event) => updatePageStyle(key, event.target.value)} aria-label={`${label} picker`} className="size-10 shrink-0 cursor-pointer rounded-lg p-1" />
                    <div className="min-w-0 flex-1"><p className="text-sm font-bold">{label}</p><p className="text-xs text-muted-foreground">{pageStyle[key] === undefined ? "Inherited from brand defaults" : description}</p></div>
                    <Input value={pageStyle[key] ?? resolvedPageStyle[key]} onChange={(event) => updatePageStyle(key, event.target.value)} aria-label={label} maxLength={7} className="h-9 w-24 rounded-lg font-mono text-xs uppercase" />
                  </div>
                ))}
              </div>
              {contrastIssues.length ? <p className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs leading-5 text-amber-900 dark:text-amber-200">Some selected colors have low contrast. The public page will use a readable fallback for those elements.</p> : null}
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
