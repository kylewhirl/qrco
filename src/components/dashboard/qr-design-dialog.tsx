"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Brush, Download, Frame, ImageIcon, ShieldAlert, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QrPreview from "@/components/qr-preview";
import BorderSettings from "@/components/qr/design/border";
import ErrorLevelSettings from "@/components/qr/design/error-level";
import LogoSettings from "@/components/qr/design/logo";
import StyleSettings, { type StyleSettingsProps } from "@/components/qr/design/style";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { flattenAndDownloadSvg, prepareSvgForExport } from "@/lib/flatten-svg";
import { serialize, cn } from "@/lib/utils";
import { buildPublicQrUrl } from "@/lib/qr-url";
import type { BrandProfile, QR, QRData, QrBorderSettings, QrLogoSettings, QrRenderConfig, StylePreset } from "@/lib/types";
import { toast } from "sonner";
import Scanability from "@/components/ui/scanability";

type DesignTab = "style" | "border" | "logo" | "error-level";

const DEFAULT_STYLE_SETTINGS: StyleSettingsProps["settings"] = {
  dotStyle: "square",
  dotColorType: "solid",
  dotColors: ["#000000"],
  dotGradientType: "linear",
  dotRotation: 0,
  eyeStyle: "square",
  eyeColorType: "solid",
  eyeColors: ["#000000"],
  eyeGradientType: "linear",
  eyeRotation: 0,
  innerEyeStyle: "square",
  innerEyeColorType: "solid",
  innerEyeColors: ["#000000"],
  innerEyeGradientType: "linear",
  innerEyeRotation: 0,
  bgColorType: "solid",
  bgColors: ["#ffffff"],
  bgGradientType: "linear",
  bgRotation: 0,
};

const DEFAULT_BORDER_SETTINGS: QrBorderSettings = {
  shape: "square",
  colorType: "solid",
  colors: ["#ffffff", "#ffffff"],
  gradientType: "linear",
  rotation: 0,
  text: "",
  textStyle: undefined,
  preset: "default",
};

const DESIGN_OPTIONS: Array<{
  value: DesignTab;
  label: string;
  icon: typeof Brush;
}> = [
  { value: "style", label: "Style", icon: Brush },
  { value: "border", label: "Frame", icon: Frame },
  { value: "logo", label: "Logo", icon: ImageIcon },
  { value: "error-level", label: "Error", icon: ShieldAlert },
];

const BRAND_STYLE_ID = "__brand_default__";

interface QrDesignDialogProps {
  qr: QR;
  value: QRData;
  brand: BrandProfile | null;
  presets: StylePreset[];
  stylesLoading: boolean;
  onChange: (data: QRData) => void;
}

function mergeRenderConfig(base: QrRenderConfig, override?: QrRenderConfig | null): QrRenderConfig {
  if (!override) {
    return base;
  }

  const borderSettings =
    override.borderSettings === undefined
      ? base.borderSettings
      : override.borderSettings === null
        ? null
        : {
            ...(base.borderSettings ?? {}),
            ...override.borderSettings,
          };

  return {
    ...base,
    ...override,
    styleSettings: {
      ...(base.styleSettings ?? {}),
      ...(override.styleSettings ?? {}),
    },
    logoSettings: override.logoSettings === undefined ? base.logoSettings : override.logoSettings,
    borderSettings,
  };
}

function applyRenderConfigToData(data: QRData, config?: Partial<QrRenderConfig> | null): QRData {
  if (!config) {
    return data;
  }

  return {
    ...data,
    errorLevel: config.errorLevel ?? data.errorLevel ?? "M",
    styleSettings: config.styleSettings === undefined ? data.styleSettings ?? null : config.styleSettings,
    logoSettings: config.logoSettings === undefined ? data.logoSettings ?? null : config.logoSettings,
    borderSettings: config.borderSettings === undefined ? data.borderSettings ?? null : config.borderSettings,
  };
}

function sanitizeLogoSettings(logo?: {
  src?: string;
  size: number;
  margin?: number;
  hideBackgroundDots?: boolean;
}): QrLogoSettings | null {
  if (!logo?.src) {
    return null;
  }

  return {
    src: logo.src,
    size: logo.size,
    margin: logo.margin,
    hideBackgroundDots: logo.hideBackgroundDots,
  };
}

export function QrDesignDialog({
  qr,
  value,
  brand,
  presets,
  stylesLoading,
  onChange,
}: QrDesignDialogProps) {
  const [designTab, setDesignTab] = useState<DesignTab>("style");
  const [lastAppliedStyleId, setLastAppliedStyleId] = useState<string | null>(null);
  const [scanability, setScanability] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDesignTab("style");
    setLastAppliedStyleId(null);
  }, [qr.id]);

  const publicUrl = qr.publicUrl ?? buildPublicQrUrl(qr.code, qr.customHostname ?? null);
  const resolvedConfig = useMemo(() => {
    const brandConfig = brand?.defaultConfig;
    const typeConfig = brand?.typeDefaults?.[qr.data.type];

    if (!brandConfig) {
      return {
        errorLevel: value.errorLevel ?? "M",
        styleSettings: value.styleSettings ?? undefined,
        logoSettings: value.logoSettings ?? undefined,
        borderSettings: value.borderSettings ?? undefined,
      };
    }

    return mergeRenderConfig(mergeRenderConfig(brandConfig, typeConfig), {
      errorLevel: value.errorLevel ?? brandConfig.errorLevel,
      styleSettings: value.styleSettings,
      logoSettings: value.logoSettings,
      borderSettings: value.borderSettings,
    });
  }, [brand, qr.data.type, value.borderSettings, value.errorLevel, value.logoSettings, value.styleSettings]);

  const effectiveErrorLevel = resolvedConfig.errorLevel ?? "M";
  const effectiveStyleSettings = useMemo(
    () => ({
      ...DEFAULT_STYLE_SETTINGS,
      ...(resolvedConfig.styleSettings ?? {}),
    }),
    [resolvedConfig.styleSettings],
  );
  const effectiveBorderSettings = useMemo(
    () => ({
      ...DEFAULT_BORDER_SETTINGS,
      ...(resolvedConfig.borderSettings ?? {}),
    }),
    [resolvedConfig.borderSettings],
  );
  const effectiveLogoSettings = resolvedConfig.logoSettings ?? undefined;
  const previewBorderSettings = resolvedConfig.borderSettings === null ? undefined : effectiveBorderSettings;

  const styleLibrary = useMemo(() => {
    const items: Array<{ id: string; name: string; description: string; config: Partial<QrRenderConfig> | null }> = [];

    if (brand?.defaultConfig) {
      items.push({
        id: BRAND_STYLE_ID,
        name: `${brand.brandName} default`,
        description: "Apply your saved dashboard brand style.",
        config: brand.defaultConfig,
      });
    }

    for (const preset of presets) {
      items.push({
        id: preset.id,
        name: preset.name,
        description: preset.description ?? "Saved style preset",
        config: preset.config,
      });
    }

    return items;
  }, [brand, presets]);

  const handleDownloadSvg = async () => {
    if (!previewRef.current) {
      return;
    }

    const svg = previewRef.current.querySelector("svg");
    if (!svg) {
      toast.error("Preview is not ready yet");
      return;
    }

    await flattenAndDownloadSvg(svg);
  };

  const handleDownloadPng = async () => {
    if (!previewRef.current) {
      return;
    }

    const svg = previewRef.current.querySelector("svg");
    if (!svg) {
      toast.error("Preview is not ready yet");
      return;
    }

    const svgData = await prepareSvgForExport(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const objectUrl = URL.createObjectURL(svgBlob);
    const image = new window.Image();

    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = svg.width.baseVal.value || 512;
      canvas.height = svg.height.baseVal.value || 512;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        return;
      }

      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (blob) {
          const anchor = document.createElement("a");
          anchor.href = URL.createObjectURL(blob);
          anchor.download = `${qr.code}.png`;
          document.body.appendChild(anchor);
          anchor.click();
          document.body.removeChild(anchor);
          URL.revokeObjectURL(anchor.href);
        }

        URL.revokeObjectURL(objectUrl);
      }, "image/png");
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      toast.error("Failed to export PNG");
    };

    image.src = objectUrl;
  };

  const applyStyleLibraryItem = (item: { id: string; name: string; config: Partial<QrRenderConfig> | null }) => {
    onChange(applyRenderConfigToData(value, item.config));
    setLastAppliedStyleId(item.id);
    toast.success(`Applied ${item.name}`);
  };

  return (
    <div className="rounded-[28px] border bg-card p-3 shadow-xl sm:p-4">
      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 max-w-full space-y-3">
          <section className="rounded-[22px] border bg-background p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1">
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Style Library</div>
                <h3 className="text-lg font-semibold">Apply a saved theme</h3>
                <p className="text-sm text-muted-foreground">
                  Use your brand default or any preset from{" "}
                  <Link href="/dashboard/styles" className="underline underline-offset-4">
                    the styles library
                  </Link>
                  .
                </p>
              </div>

              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/styles">Manage styles</Link>
              </Button>
            </div>

            {stylesLoading ? (
              <div className="rounded-2xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
                Loading saved styles...
              </div>
            ) : styleLibrary.length === 0 ? (
              <div className="rounded-2xl border border-dashed px-4 py-6 text-sm text-muted-foreground">
                No saved styles yet. Create one on the styles page, then apply it here.
              </div>
            ) : (
              <div className="grid gap-2 md:grid-cols-2">
                {styleLibrary.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => applyStyleLibraryItem(item)}
                    className={cn(
                      "rounded-2xl border p-4 text-left transition",
                      lastAppliedStyleId === item.id
                        ? "border-foreground/30 bg-muted/40 shadow-sm"
                        : "border-border/70 hover:border-foreground/20 hover:bg-muted/25",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{item.name}</p>
                      <Sparkles className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-[22px] border bg-muted/35 p-3">
            <div className="mb-3 px-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Design</div>
            <Tabs value={designTab} onValueChange={(next) => setDesignTab(next as DesignTab)} className="min-h-0">
              <div className="overflow-x-auto">
                <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-2xl bg-transparent p-0 xl:grid-cols-4">
                  {DESIGN_OPTIONS.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="min-h-10 rounded-xl border bg-background px-3 data-[state=active]:border-foreground/15 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                      >
                        <Icon className="size-3.5 shrink-0" />
                        <span>{tab.label}</span>
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>

              <TabsContent value="style">
                <StyleSettings
                  settings={effectiveStyleSettings}
                  onChange={(nextStyle) =>
                    onChange({
                      ...value,
                      styleSettings:
                        typeof nextStyle === "function"
                          ? nextStyle(effectiveStyleSettings)
                          : nextStyle,
                    })
                  }
                />
              </TabsContent>

              <TabsContent value="border">
                <BorderSettings
                  settings={effectiveBorderSettings}
                  onChange={(nextBorder) =>
                    onChange({
                      ...value,
                      borderSettings:
                        typeof nextBorder === "function"
                          ? nextBorder(effectiveBorderSettings)
                          : nextBorder,
                    })
                  }
                />
              </TabsContent>

              <TabsContent value="logo">
                <LogoSettings
                  settings={effectiveLogoSettings}
                  onChange={(nextLogo) =>
                    onChange({
                      ...value,
                      logoSettings: sanitizeLogoSettings(nextLogo),
                    })
                  }
                />
              </TabsContent>

              <TabsContent value="error-level">
                <ErrorLevelSettings
                  value={effectiveErrorLevel}
                  onChange={(nextErrorLevel) =>
                    onChange({
                      ...value,
                      errorLevel:
                        typeof nextErrorLevel === "function"
                          ? nextErrorLevel(effectiveErrorLevel)
                          : nextErrorLevel,
                    })
                  }
                />
              </TabsContent>
            </Tabs>
          </section>
        </div>

        <aside className="relative lg:sticky lg:top-4 lg:self-start">
          <Card className="rounded-[22px] border bg-muted/35 p-3">
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-2">
                <div>
                  <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Preview</div>
                  <p className="text-sm text-muted-foreground">Download the styled QR directly from this modal.</p>
                </div>
                <Scanability score={scanability} className="flex items-center" />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="size-8 rounded-lg">
                    <Download className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDownloadSvg}>Download SVG</DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDownloadPng}>Download PNG</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="relative flex min-h-[280px] items-center justify-center rounded-[20px] border bg-background p-4">
              <div ref={previewRef} className="flex h-full w-full items-center justify-center">
                <QrPreview
                  data={publicUrl}
                  errorLevel={effectiveErrorLevel}
                  size={200}
                  styleSettings={effectiveStyleSettings}
                  borderSettings={previewBorderSettings}
                  logoSettings={effectiveLogoSettings}
                  onScanabilityChange={setScanability}
                />
              </div>
            </div>

            <div className="mt-3 space-y-3">
              <div className="rounded-xl border bg-background px-3 py-2">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Public URL</p>
                <p className="mt-1 break-all font-mono text-xs text-foreground">{publicUrl}</p>
              </div>
              <div className="rounded-xl border bg-background px-3 py-2">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Destination</p>
                <p className="mt-1 break-all text-sm text-muted-foreground">{serialize(value)}</p>
              </div>
            </div>
          </Card>
        </aside>
      </div>
    </div>
  );
}
