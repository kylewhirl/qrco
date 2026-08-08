"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Barcode,
  Check,
  CheckCircle2,
  Clipboard,
  Download,
  ExternalLink,
  Globe2,
  Info,
  Loader2,
  PackageCheck,
  Plus,
  ShieldCheck,
  Store,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import QrPreview from "@/components/qr-preview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { flattenAndDownloadSvg } from "@/lib/flatten-svg";
import {
  buildGs1DigitalLinkUrl,
  validateGtin,
  type Gs1DigitalLinkAttributes,
} from "@/lib/gs1-digital-link";
import type { CustomDomain, Product, ProductContent } from "@/lib/types";

type BuilderFields = {
  productName: string;
  gtin: string;
  destinationUrl: string;
  experienceMode: "hosted" | "external";
  batchLot: string;
  serial: string;
  expiry: string;
};

type MarketRouteField = {
  id: string;
  countryCode: string;
  url: string;
};

const sampleAttributes: Gs1DigitalLinkAttributes = {
  gtin: "09506000134352",
};

const fieldClassName =
  "h-11 rounded-xl border-border bg-background px-3.5 shadow-none focus-visible:ring-[3px]";

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

type RetailDigitalLinkBuilderProps = {
  onProductCreated?: (product: Product) => void;
};

export function RetailDigitalLinkBuilder({ onProductCreated }: RetailDigitalLinkBuilderProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [fields, setFields] = useState<BuilderFields>({
    productName: "",
    gtin: "",
    destinationUrl: "",
    experienceMode: "hosted",
    batchLot: "",
    serial: "",
    expiry: "",
  });
  const [domains, setDomains] = useState<CustomDomain[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState("platform");
  const [domainsLocked, setDomainsLocked] = useState(false);
  const [loadingDomains, setLoadingDomains] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createdProduct, setCreatedProduct] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const [marketRoutes, setMarketRoutes] = useState<MarketRouteField[]>([]);
  const [content, setContent] = useState<ProductContent>({});

  useEffect(() => {
    let ignore = false;

    async function loadDomains() {
      try {
        const response = await fetch("/api/dashboard/domains");
        const result = (await response.json().catch(() => ({}))) as {
          domains?: CustomDomain[];
          code?: string;
        };

        if (!response.ok) {
          if (!ignore) {
            setDomainsLocked(response.status === 402 || result.code === "billing_required");
          }
          return;
        }

        const readyDomains = (result.domains ?? []).filter((domain) => domain.status === "ready");
        if (!ignore) {
          setDomains(readyDomains);
          const primary = readyDomains.find((domain) => domain.isPrimary) ?? readyDomains[0];
          if (primary) {
            setSelectedDomainId(primary.id);
          }
        }
      } catch {
        // The platform hostname remains available if domain discovery is unavailable.
      } finally {
        if (!ignore) {
          setLoadingDomains(false);
        }
      }
    }

    void loadDomains();
    return () => {
      ignore = true;
    };
  }, []);

  const gtinValidation = validateGtin(fields.gtin);
  const normalizedGtin = gtinValidation.gtin14 ?? "";
  const gtinValid = gtinValidation.valid;
  const hostedExperience = fields.experienceMode === "hosted";
  const destinationValid = hostedExperience || isHttpUrl(fields.destinationUrl);
  const selectedDomain = domains.find((domain) => domain.id === selectedDomainId) ?? null;
  const usingBrandDomain = Boolean(selectedDomain);

  const attributes = useMemo<Gs1DigitalLinkAttributes>(
    () => ({
      gtin: gtinValid ? normalizedGtin : sampleAttributes.gtin,
      productName: fields.productName.trim() || null,
      batchLot: fields.batchLot.trim() || null,
      serial: fields.serial.trim() || null,
      expiry: fields.expiry || null,
      marketRoutes: marketRoutes
        .filter((route) => /^[A-Za-z]{2}$/.test(route.countryCode) && isHttpUrl(route.url))
        .map((route) => ({
          countryCode: route.countryCode.toUpperCase(),
          url: route.url.trim(),
        })),
    }),
    [
      fields.batchLot,
      fields.expiry,
      fields.productName,
      fields.serial,
      gtinValid,
      marketRoutes,
      normalizedGtin,
    ],
  );

  const previewUrl = createdProduct?.publicUrl
    ?? (hostedExperience
      ? `${process.env.NEXT_PUBLIC_APP_URL ?? "https://theqrcode.co"}/product/preview`
      : buildGs1DigitalLinkUrl(attributes, selectedDomain?.hostname ?? null));

  const readiness = [
    {
      label: "Valid GTIN and check digit",
      complete: gtinValid,
      detail: gtinValid ? normalizedGtin : "Enter the GS1-issued product identifier",
    },
    {
      label: "Brand-owned resolver domain",
      complete: usingBrandDomain,
      detail: usingBrandDomain ? selectedDomain?.hostname ?? "" : "Recommended for control and portability",
    },
    {
      label: "Editable digital destination",
      complete: destinationValid,
      detail: hostedExperience
        ? "Hosted product page stays linked to this identity"
        : destinationValid ? "Destination can change without reprinting" : "Add the product experience URL",
    },
  ];

  function updateField(key: keyof BuilderFields, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
    setCreatedProduct(null);
    setError("");
  }

  function updateContent(key: keyof ProductContent, value: string) {
    setContent((current) => ({ ...current, [key]: value }));
    setCreatedProduct(null);
    setError("");
  }

  function updateMarketRoute(id: string, key: "countryCode" | "url", value: string) {
    setMarketRoutes((current) =>
      current.map((route) => route.id === id ? { ...route, [key]: value } : route),
    );
    setCreatedProduct(null);
    setError("");
  }

  function addMarketRoute() {
    setMarketRoutes((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        countryCode: "",
        url: "",
      },
    ]);
    setCreatedProduct(null);
  }

  function removeMarketRoute(id: string) {
    setMarketRoutes((current) => current.filter((route) => route.id !== id));
    setCreatedProduct(null);
  }

  async function handleCreate() {
    if (!gtinValid || !destinationValid || !fields.productName.trim()) {
      setError(hostedExperience
        ? "Add a product name and a valid GTIN before creating the product."
        : "Add a product name, a valid GTIN, and a valid web destination before creating the product.");
      return;
    }

    const invalidMarketRoute = marketRoutes.some(
      (route) => !/^[A-Za-z]{2}$/.test(route.countryCode) || !isHttpUrl(route.url),
    );
    const marketCodes = marketRoutes.map((route) => route.countryCode.toUpperCase());
    if (invalidMarketRoute || new Set(marketCodes).size !== marketCodes.length) {
      setError("Each market route needs a unique two-letter country code and a valid web destination.");
      return;
    }

    setCreating(true);
    setError("");

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fields.productName.trim(),
          identifierSubmitted: fields.gtin,
          destinationUrl: hostedExperience ? null : fields.destinationUrl.trim(),
          hostedExperience,
          content,
          qualifiers: {
            batchLot: fields.batchLot.trim() || null,
            serial: fields.serial.trim() || null,
            expiry: fields.expiry || null,
          },
          marketRoutes: marketRoutes.map((route) => ({
            countryCode: route.countryCode.toUpperCase(),
            url: route.url.trim(),
          })),
          customDomainId: selectedDomain?.id ?? null,
        }),
      });

      const result = (await response.json().catch(() => ({}))) as Product & {
        error?: string;
        requiredTier?: string;
      };

      if (!response.ok) {
        throw new Error(
          response.status === 409
            ? "A product with this identifier already exists on the selected domain."
            : result.error || "The product could not be created.",
        );
      }

      setCreatedProduct(result);
      onProductCreated?.(result);
      toast.success("Product identity created");
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "The product could not be created.");
    } finally {
      setCreating(false);
    }
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(previewUrl);
    toast.success("Digital Link copied");
  }

  async function downloadSvg() {
    const svg = previewRef.current?.querySelector("svg");
    if (!svg) {
      return;
    }

    await flattenAndDownloadSvg(svg);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
      <Card className="overflow-hidden rounded-lg border-border/80 bg-card shadow-[0_24px_64px_-52px_var(--brand-shadow)]">
        <CardHeader className="border-b bg-[color-mix(in_srgb,var(--muted)_38%,var(--card))] p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl tracking-[-0.03em]">New product</CardTitle>
              <CardDescription className="mt-1.5">
                Set the product identifier, destination, and QR code options.
              </CardDescription>
            </div>
            <Badge className="rounded-full bg-[var(--brand-lime)] px-3 py-1 text-[#263600] hover:bg-[var(--brand-lime)]">
              GS1 Digital Link URI
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-7 p-5 sm:p-7">
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="retail-product-name">Product name</Label>
              <Input
                id="retail-product-name"
                value={fields.productName}
                onChange={(event) => updateField("productName", event.target.value)}
                placeholder="Organic oat milk · 1 L"
                className={fieldClassName}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="retail-gtin">GTIN</Label>
                {fields.gtin ? (
                  <span className={`text-[11px] font-bold ${gtinValid ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"}`}>
                    {gtinValid ? "Check digit valid" : "Check digit invalid"}
                  </span>
                ) : null}
              </div>
              <Input
                id="retail-gtin"
                value={fields.gtin}
                onChange={(event) => updateField("gtin", event.target.value)}
                placeholder="09506000134352"
                inputMode="numeric"
                className={fieldClassName}
                aria-invalid={Boolean(fields.gtin) && !gtinValid}
              />
            </div>
          </div>

          <div className="space-y-4 rounded-2xl border border-border/80 bg-muted/25 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <Label htmlFor="retail-experience-mode">Digital experience</Label>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  Keep the identity permanent while the shopper destination evolves.
                </p>
              </div>
              <Select
                value={fields.experienceMode}
                onValueChange={(value) => updateField("experienceMode", value as BuilderFields["experienceMode"])}
              >
                <SelectTrigger id="retail-experience-mode" className="h-11 w-full rounded-xl bg-background sm:w-[230px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hosted">Host a product page</SelectItem>
                  <SelectItem value="external">Use an existing URL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {hostedExperience ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="retail-content-description">Product description</Label>
                  <Textarea
                    id="retail-content-description"
                    value={content.description ?? ""}
                    onChange={(event) => updateContent("description", event.target.value)}
                    placeholder="A short, customer-facing description for the hosted product page"
                    className="min-h-24 rounded-xl bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retail-content-image-url">Product image URL</Label>
                  <Input
                    id="retail-content-image-url"
                    type="url"
                    value={content.imageUrl ?? ""}
                    onChange={(event) => updateContent("imageUrl", event.target.value)}
                    placeholder="https://brand.com/products/oat-milk.jpg"
                    className="h-11 rounded-xl bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="retail-content-image-alt">Image alt text</Label>
                  <Input
                    id="retail-content-image-alt"
                    value={content.imageAlt ?? ""}
                    onChange={(event) => updateContent("imageAlt", event.target.value)}
                    placeholder="Organic oat milk carton"
                    className="h-11 rounded-xl bg-background"
                  />
                </div>
                {([
                  ["ingredients", "Ingredients"],
                  ["allergens", "Allergens"],
                  ["instructions", "Instructions"],
                  ["origin", "Origin & traceability"],
                ] as const).map(([key, label]) => (
                  <div key={key} className="space-y-2">
                    <Label htmlFor={`retail-content-${key}`}>{label}</Label>
                    <Textarea
                      id={`retail-content-${key}`}
                      value={content[key] ?? ""}
                      onChange={(event) => updateContent(key, event.target.value)}
                      placeholder={`Add ${label.toLowerCase()} if useful`}
                      className="min-h-24 rounded-xl bg-background"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="retail-destination">Default product experience URL</Label>
                <Input
                  id="retail-destination"
                  type="url"
                  value={fields.destinationUrl}
                  onChange={(event) => updateField("destinationUrl", event.target.value)}
                  placeholder="https://brand.com/products/oat-milk"
                  className={fieldClassName}
                  aria-invalid={Boolean(fields.destinationUrl) && !destinationValid}
                />
                <p className="text-xs leading-5 text-muted-foreground">
                  Update this destination later for product details, recalls, instructions, campaigns, or local experiences.
                </p>
              </div>
            )}
          </div>

          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="grid size-8 place-items-center rounded-lg bg-[color-mix(in_srgb,var(--brand-blue)_10%,var(--card))] text-[var(--brand-blue)]">
                <PackageCheck className="size-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold">Optional product-level data</h3>
                <p className="text-xs text-muted-foreground">Use only identifiers your packaging and operations can maintain.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="retail-lot">Batch / lot <span className="font-normal text-muted-foreground">(10)</span></Label>
                <Input
                  id="retail-lot"
                  value={fields.batchLot}
                  onChange={(event) => updateField("batchLot", event.target.value)}
                  placeholder="ABC123"
                  maxLength={20}
                  className={fieldClassName}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retail-serial">Serial <span className="font-normal text-muted-foreground">(21)</span></Label>
                <Input
                  id="retail-serial"
                  value={fields.serial}
                  onChange={(event) => updateField("serial", event.target.value)}
                  placeholder="000042"
                  maxLength={20}
                  className={fieldClassName}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="retail-expiry">Expiry <span className="font-normal text-muted-foreground">(17)</span></Label>
                <Input
                  id="retail-expiry"
                  type="date"
                  value={fields.expiry}
                  onChange={(event) => updateField("expiry", event.target.value)}
                  className={fieldClassName}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-muted/25 p-4">
            <div className="flex items-start gap-3">
              <Store className="mt-0.5 size-4 shrink-0 text-[var(--brand-blue)]" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Label htmlFor="retail-domain">Resolver domain</Label>
                  <Link href="/dashboard/settings#domains" className="text-xs font-bold text-[var(--brand-blue)] hover:underline">
                    Manage domains
                  </Link>
                </div>
                <Select
                  value={selectedDomainId}
                  onValueChange={(value) => {
                    setSelectedDomainId(value);
                    setCreatedProduct(null);
                  }}
                  disabled={loadingDomains}
                >
                  <SelectTrigger id="retail-domain" className="mt-2 h-11 w-full rounded-xl bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="platform">theqrcode.co platform domain</SelectItem>
                    {domains.map((domain) => (
                      <SelectItem key={domain.id} value={domain.id}>
                        {domain.hostname} {domain.isPrimary ? "· Primary" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  {domainsLocked
                    ? "A Creator plan unlocks the brand-owned domain GS1 recommends for Digital Link URIs."
                    : usingBrandDomain
                      ? "This product identifier will resolve through your verified brand domain."
                      : "Use the platform domain for a pilot; connect a brand-owned domain before production packaging."}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/80 bg-muted/25 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <Globe2 className="mt-0.5 size-4 shrink-0 text-[var(--brand-blue)]" />
                <div>
                  <h3 className="text-sm font-bold">Market destinations</h3>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Route shoppers by country while keeping one physical product code. Everyone else uses the default experience.
                  </p>
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" className="rounded-lg" onClick={addMarketRoute}>
                <Plus className="size-3.5" />
                Add market
              </Button>
            </div>

            {marketRoutes.length ? (
              <div className="mt-4 space-y-3">
                {marketRoutes.map((route) => (
                  <div key={route.id} className="grid grid-cols-[72px_minmax(0,1fr)_40px] gap-2">
                    <Input
                      value={route.countryCode}
                      onChange={(event) => updateMarketRoute(
                        route.id,
                        "countryCode",
                        event.target.value.replace(/[^A-Za-z]/g, "").slice(0, 2).toUpperCase(),
                      )}
                      placeholder="US"
                      aria-label="Two-letter market country code"
                      className="h-10 rounded-xl bg-background px-3 text-center font-mono uppercase"
                    />
                    <Input
                      type="url"
                      value={route.url}
                      onChange={(event) => updateMarketRoute(route.id, "url", event.target.value)}
                      placeholder="https://brand.com/us/product"
                      aria-label={`${route.countryCode || "Market"} destination URL`}
                      className="h-10 rounded-xl bg-background px-3"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-10 rounded-xl text-muted-foreground hover:text-destructive"
                      onClick={() => removeMarketRoute(route.id)}
                      aria-label="Remove market route"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed bg-background/60 px-4 py-3 text-xs leading-5 text-muted-foreground">
                No overrides yet. The default product experience will be used in every market.
              </div>
            )}
          </div>

          {error ? (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive" role="alert">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              type="button"
              onClick={handleCreate}
              disabled={creating}
              className="h-12 rounded-xl bg-[var(--brand-action)] px-6 font-bold text-white hover:bg-[var(--brand-action)]/90"
            >
              {creating ? <Loader2 className="size-4 animate-spin" /> : <Barcode className="size-4" />}
              {creating ? "Creating product" : "Add product"}
            </Button>
            <span className="text-xs leading-5 text-muted-foreground">
              Creates a tracked, editable resolver record in your account.
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="overflow-hidden rounded-lg border-border/80 shadow-[0_24px_64px_-52px_var(--brand-shadow)] xl:sticky xl:top-6">
          <div className="qr-canvas-grid relative flex min-h-[360px] items-center justify-center border-b p-8">
            <div className="absolute left-4 top-4">
              <Badge variant="outline" className="rounded-full border-border bg-card/85 backdrop-blur">
                Live symbol
              </Badge>
            </div>
            <div
              ref={previewRef}
              className="flex aspect-square w-full max-w-[270px] items-center justify-center rounded-2xl border border-black/10 bg-white p-4 shadow-[0_30px_70px_-42px_rgba(17,24,39,.7)]"
            >
              <QrPreview
                data={previewUrl}
                errorLevel="M"
                size={238}
                margin={12}
                styleSettings={{
                  dotStyle: "square",
                  dotColorType: "solid",
                  dotColors: ["#111827"],
                  eyeStyle: "square",
                  eyeColorType: "solid",
                  eyeColors: ["#111827"],
                  innerEyeStyle: "square",
                  innerEyeColorType: "solid",
                  innerEyeColors: ["#111827"],
                  bgColorType: "solid",
                  bgColors: ["#ffffff"],
                }}
              />
            </div>
          </div>

          <CardContent className="space-y-6 p-5 sm:p-6">
            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Encoded URI
                </p>
                {createdProduct ? (
                  <Badge className="rounded-full bg-emerald-500/12 text-emerald-700 hover:bg-emerald-500/12 dark:text-emerald-300">
                    <CheckCircle2 className="mr-1 size-3" />
                    Live
                  </Badge>
                ) : (
                  <Badge variant="outline" className="rounded-full">Preview</Badge>
                )}
              </div>
              <p className="mt-3 break-all rounded-xl bg-muted/50 p-3 font-mono text-[11px] leading-5 text-foreground/75">
                {previewUrl}
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button variant="outline" className="rounded-xl" onClick={copyUrl}>
                  <Clipboard className="size-4" />
                  Copy URI
                </Button>
                <Button variant="outline" className="rounded-xl" onClick={downloadSvg}>
                  <Download className="size-4" />
                  SVG
                </Button>
              </div>
              {createdProduct ? (
                <Button asChild className="mt-2 h-10 w-full rounded-xl">
                  <Link href={`/dashboard/products/${createdProduct.id}`}>
                    Open product
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : null}
            </div>

            <div className="border-t pt-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Readiness checks
              </p>
              <div className="mt-3 space-y-3">
                {readiness.map((item) => (
                  <div key={item.label} className="grid grid-cols-[22px_minmax(0,1fr)] gap-2.5">
                    <span className={`mt-0.5 grid size-[18px] place-items-center rounded-full ${item.complete ? "bg-emerald-500 text-white" : "border border-border bg-muted text-muted-foreground"}`}>
                      {item.complete ? <Check className="size-3" strokeWidth={3} /> : <span className="size-1 rounded-full bg-current" />}
                    </span>
                    <div>
                      <p className="text-sm font-bold">{item.label}</p>
                      <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{item.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/7 p-4">
              <div className="flex items-start gap-3">
                <Info className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-300" />
                <div>
                  <p className="text-sm font-bold">Dual-marking transition</p>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    Keep the linear barcode during transition. GS1 guidance says place the 2D code within 50 mm of the linear barcode&apos;s centre—not that the QR code itself must be 50 mm.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 text-xs leading-5 text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[var(--brand-blue)]" />
              <p>
                Production print targets depend on symbol data and substrate. GS1&apos;s retail target X-dimension is 0.495 mm with a 4X quiet zone for QR Codes. Verify final artwork and POS performance before a packaging run.
              </p>
            </div>

            <Link
              href="https://ref.gs1.org/guidelines/2d-in-retail/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--brand-blue)] hover:underline"
            >
              Read the official GS1 implementation guideline
              <ExternalLink className="size-3.5" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
