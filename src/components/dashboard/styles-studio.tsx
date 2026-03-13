"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Palette, Plus, Save, Sparkles, Trash2, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import QrPreview from "@/components/qr-preview";
import BorderSettings from "@/components/qr/design/border";
import ErrorLevelSettings from "@/components/qr/design/error-level";
import LogoSettings from "@/components/qr/design/logo";
import StyleSettings, { type StyleSettingsProps } from "@/components/qr/design/style";
import type {
  BrandProfile,
  QrBorderSettings,
  QrLogoSettings,
  QrRenderConfig,
  StylePreset,
} from "@/lib/types";

const SAMPLE_QR_DATA = "https://tqrco.de/style-preview";

const DEFAULT_STYLE_SETTINGS: StyleSettingsProps["settings"] = {
  dotStyle: "square",
  dotColorType: "solid",
  dotColors: ["#111827"],
  dotGradientType: "linear",
  dotRotation: 0,
  eyeStyle: "square",
  eyeColorType: "solid",
  eyeColors: ["#111827"],
  eyeGradientType: "linear",
  eyeRotation: 0,
  innerEyeStyle: "none",
  innerEyeColorType: "solid",
  innerEyeColors: ["#0f766e"],
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
  preset: "custom-svg",
  text: "",
};

const DEFAULT_CONFIG: QrRenderConfig = {
  errorLevel: "M",
  width: 512,
  height: 512,
  margin: 4,
  styleSettings: DEFAULT_STYLE_SETTINGS,
  logoSettings: null,
  borderSettings: DEFAULT_BORDER_SETTINGS,
};

const EMPTY_BRAND: BrandProfile = {
  id: "default",
  userId: "",
  brandName: "My brand",
  logoUrl: null,
  primaryColor: "#111827",
  accentColor: "#0f766e",
  backgroundColor: "#ffffff",
  defaultConfig: DEFAULT_CONFIG,
  createdAt: new Date(0),
  updatedAt: new Date(0),
};

type PresetDraft = {
  id?: string;
  name: string;
  description: string;
  isDefault: boolean;
  config: QrRenderConfig;
};

function normalizeConfig(config?: QrRenderConfig | null): QrRenderConfig {
  return {
    ...DEFAULT_CONFIG,
    ...config,
    styleSettings: {
      ...DEFAULT_STYLE_SETTINGS,
      ...(config?.styleSettings ?? {}),
    },
    borderSettings: {
      ...DEFAULT_BORDER_SETTINGS,
      ...(config?.borderSettings ?? {}),
    },
    logoSettings: config?.logoSettings
      ? {
          ...config.logoSettings,
        }
      : null,
  };
}

function toPresetDraft(preset?: StylePreset | null): PresetDraft {
  if (!preset) {
    return {
      name: "New preset",
      description: "",
      isDefault: false,
      config: normalizeConfig(DEFAULT_CONFIG),
    };
  }

  return {
    id: preset.id,
    name: preset.name,
    description: preset.description ?? "",
    isDefault: preset.isDefault,
    config: normalizeConfig(preset.config),
  };
}

function formatDate(value: string | Date) {
  return new Date(value).toLocaleString();
}

export function StylesStudio() {
  const [brand, setBrand] = useState<BrandProfile>(EMPTY_BRAND);
  const [presets, setPresets] = useState<StylePreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [presetDraft, setPresetDraft] = useState<PresetDraft>(toPresetDraft());
  const [activeEditor, setActiveEditor] = useState<"preset" | "brand">("preset");
  const [designTab, setDesignTab] = useState<"style" | "border" | "logo" | "error-level">("style");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingBrand, setIsSavingBrand] = useState(false);
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [isDeletingPreset, setIsDeletingPreset] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [brandResponse, presetsResponse] = await Promise.all([
          fetch("/api/dashboard/brand"),
          fetch("/api/dashboard/styles"),
        ]);

        if (!brandResponse.ok || !presetsResponse.ok) {
          throw new Error("Failed to load styles data");
        }

        const brandData = await brandResponse.json();
        const presetsData = await presetsResponse.json();
        const nextBrand = {
          ...brandData.brand,
          defaultConfig: normalizeConfig(brandData.brand?.defaultConfig),
        } as BrandProfile;
        const nextPresets = (presetsData.presets ?? []).map((preset: StylePreset) => ({
          ...preset,
          config: normalizeConfig(preset.config),
        }));

        setBrand(nextBrand);
        setPresets(nextPresets);

        if (nextPresets.length > 0) {
          setSelectedPresetId(nextPresets[0].id);
          setPresetDraft(toPresetDraft(nextPresets[0]));
        } else {
          setSelectedPresetId(null);
          setPresetDraft({
            name: "New preset",
            description: "",
            isDefault: false,
            config: {
              ...normalizeConfig(nextBrand.defaultConfig),
              styleSettings: {
                ...normalizeConfig(nextBrand.defaultConfig).styleSettings,
                dotColors: [nextBrand.primaryColor],
                eyeColors: [nextBrand.primaryColor],
                innerEyeColors: [nextBrand.accentColor],
                bgColors: [nextBrand.backgroundColor],
              },
            },
          });
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load styles");
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, []);

  const selectedPreset = useMemo(
    () => presets.find((preset) => preset.id === selectedPresetId) ?? null,
    [presets, selectedPresetId],
  );

  const currentConfig = activeEditor === "brand" ? normalizeConfig(brand.defaultConfig) : normalizeConfig(presetDraft.config);

  function updateBrandConfig(updater: (config: QrRenderConfig) => QrRenderConfig) {
    setBrand((current) => ({
      ...current,
      defaultConfig: normalizeConfig(updater(normalizeConfig(current.defaultConfig))),
    }));
  }

  function updatePresetConfig(updater: (config: QrRenderConfig) => QrRenderConfig) {
    setPresetDraft((current) => ({
      ...current,
      config: normalizeConfig(updater(normalizeConfig(current.config))),
    }));
  }

  function updateCurrentConfig(updater: (config: QrRenderConfig) => QrRenderConfig) {
    if (activeEditor === "brand") {
      updateBrandConfig(updater);
      return;
    }

    updatePresetConfig(updater);
  }

  function applyBrandPaletteToConfig(config: QrRenderConfig): QrRenderConfig {
    const nextConfig = normalizeConfig(config);
    return {
      ...nextConfig,
      styleSettings: {
        ...nextConfig.styleSettings,
        dotColors: [brand.primaryColor],
        eyeColors: [brand.primaryColor],
        innerEyeColors: [brand.accentColor],
        bgColors: [brand.backgroundColor],
      },
    };
  }

  function syncBrandPalette() {
    updateBrandConfig((config) => applyBrandPaletteToConfig(config));
  }

  function startNewPreset() {
    setActiveEditor("preset");
    setSelectedPresetId(null);
    setPresetDraft({
      name: "New preset",
      description: "",
      isDefault: false,
      config: applyBrandPaletteToConfig(brand.defaultConfig),
    });
  }

  function selectPreset(preset: StylePreset) {
    setActiveEditor("preset");
    setSelectedPresetId(preset.id);
    setPresetDraft(toPresetDraft(preset));
  }

  async function saveBrand() {
    setIsSavingBrand(true);
    try {
      const response = await fetch("/api/dashboard/brand", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brandName: brand.brandName,
          logoUrl: brand.logoUrl,
          primaryColor: brand.primaryColor,
          accentColor: brand.accentColor,
          backgroundColor: brand.backgroundColor,
          defaultConfig: normalizeConfig(brand.defaultConfig),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save brand");
      }

      const data = await response.json();
      setBrand({
        ...data.brand,
        defaultConfig: normalizeConfig(data.brand.defaultConfig),
      });
      toast.success("Brand defaults saved");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save brand defaults");
    } finally {
      setIsSavingBrand(false);
    }
  }

  async function savePreset() {
    if (!presetDraft.name.trim()) {
      toast.error("Preset name is required");
      return;
    }

    setIsSavingPreset(true);
    try {
      const response = await fetch(
        presetDraft.id ? `/api/dashboard/styles/${presetDraft.id}` : "/api/dashboard/styles",
        {
          method: presetDraft.id ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: presetDraft.name,
            description: presetDraft.description || null,
            isDefault: presetDraft.isDefault,
            config: normalizeConfig(presetDraft.config),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save preset");
      }

      const data = await response.json();
      const savedPreset = {
        ...data.preset,
        config: normalizeConfig(data.preset.config),
      } as StylePreset;

      setPresets((current) => {
        const filtered = current.filter((preset) => preset.id !== savedPreset.id);
        return [savedPreset, ...filtered].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
      });
      setSelectedPresetId(savedPreset.id);
      setPresetDraft(toPresetDraft(savedPreset));
      setActiveEditor("preset");
      toast.success(presetDraft.id ? "Preset updated" : "Preset created");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save preset");
    } finally {
      setIsSavingPreset(false);
    }
  }

  async function deletePreset() {
    if (!presetDraft.id) {
      startNewPreset();
      return;
    }

    setIsDeletingPreset(true);
    try {
      const response = await fetch(`/api/dashboard/styles/${presetDraft.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete preset");
      }

      const nextPresets = presets.filter((preset) => preset.id !== presetDraft.id);
      setPresets(nextPresets);

      if (nextPresets[0]) {
        setSelectedPresetId(nextPresets[0].id);
        setPresetDraft(toPresetDraft(nextPresets[0]));
      } else {
        setSelectedPresetId(null);
        startNewPreset();
      }

      toast.success("Preset deleted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete preset");
    } finally {
      setIsDeletingPreset(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[28px] border border-border/60 bg-[linear-gradient(160deg,rgba(255,255,255,0.96),rgba(241,245,249,0.92))] p-6 shadow-sm md:p-8">
        <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-300/15 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-3">
            <Badge variant="outline" className="rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.24em]">
              Style System
            </Badge>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Brand & preset styles</h1>
              <p className="max-w-2xl text-sm leading-6 text-muted-foreground md:text-base">
                This is the QR creator focused on design only. Build one brand default, save reusable presets, and use
                those same styles in the REST render API.
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Brand</p>
              <p className="mt-2 text-lg font-semibold">{brand.brandName}</p>
              <p className="mt-1 text-sm text-muted-foreground">One default look for every QR you generate.</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Presets</p>
              <p className="mt-2 text-lg font-semibold">{presets.length}</p>
              <p className="mt-1 text-sm text-muted-foreground">Saved campaign and client variations.</p>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Render API</p>
              <p className="mt-2 text-lg font-semibold">Style-ready</p>
              <p className="mt-1 text-sm text-muted-foreground">Render SVG or PNG with a preset id or brand defaults.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Brand profile
              </CardTitle>
              <CardDescription>
                Set the palette that new presets inherit and the API can use as your default render style.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brand-name">Brand name</Label>
                <Input
                  id="brand-name"
                  value={brand.brandName}
                  onChange={(event) => setBrand((current) => ({ ...current, brandName: event.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand-logo">Logo URL</Label>
                <Input
                  id="brand-logo"
                  placeholder="https://..."
                  value={brand.logoUrl ?? ""}
                  onChange={(event) => setBrand((current) => ({ ...current, logoUrl: event.target.value.trim() || null }))}
                />
              </div>

              <div className="grid gap-3">
                {[
                  ["Primary", "primaryColor"],
                  ["Accent", "accentColor"],
                  ["Background", "backgroundColor"],
                ].map(([label, key]) => (
                  <div key={key} className="space-y-2">
                    <Label>{label} color</Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        className="h-10 w-14 rounded-md border bg-transparent p-1"
                        value={brand[key as keyof Pick<BrandProfile, "primaryColor" | "accentColor" | "backgroundColor">]}
                        onChange={(event) =>
                          setBrand((current) => ({
                            ...current,
                            [key]: event.target.value,
                          }))
                        }
                      />
                      <Input
                        value={brand[key as keyof Pick<BrandProfile, "primaryColor" | "accentColor" | "backgroundColor">]}
                        onChange={(event) =>
                          setBrand((current) => ({
                            ...current,
                            [key]: event.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col gap-3">
                <Button variant="outline" onClick={syncBrandPalette}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Sync palette into brand default
                </Button>
                <Button
                  variant={activeEditor === "brand" ? "default" : "secondary"}
                  onClick={() => setActiveEditor("brand")}
                >
                  <Wand2 className="mr-2 h-4 w-4" />
                  Edit brand default style
                </Button>
                <Button onClick={saveBrand} disabled={isSavingBrand}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSavingBrand ? "Saving..." : "Save brand profile"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/70">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Presets</CardTitle>
                <CardDescription>Reusable saved styles for the dashboard and API.</CardDescription>
              </div>
              <Button size="sm" variant="outline" onClick={startNewPreset}>
                <Plus className="mr-2 h-4 w-4" />
                New
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Loading styles...</p>
              ) : presets.length === 0 ? (
                <p className="text-sm text-muted-foreground">No presets yet. Start from your brand default and save one.</p>
              ) : (
                presets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => selectPreset(preset)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedPresetId === preset.id && activeEditor === "preset"
                        ? "border-foreground/40 bg-muted/50"
                        : "border-border/60 hover:border-foreground/20 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{preset.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {preset.description || "No description"}
                        </p>
                      </div>
                      {preset.isDefault ? <Badge>Default</Badge> : null}
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">Updated {formatDate(preset.updatedAt)}</p>
                  </button>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="border-border/70">
          <CardHeader className="space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle>
                  {activeEditor === "brand" ? "Brand default editor" : "Preset editor"}
                </CardTitle>
                <CardDescription>
                  Same creator controls, stripped down to QR appearance only.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => updateCurrentConfig((config) => applyBrandPaletteToConfig(config))}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Apply brand palette
                </Button>
                {activeEditor === "preset" ? (
                  <Button onClick={savePreset} disabled={isSavingPreset}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSavingPreset ? "Saving..." : "Save preset"}
                  </Button>
                ) : null}
              </div>
            </div>

            {activeEditor === "preset" ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="preset-name">Preset name</Label>
                  <Input
                    id="preset-name"
                    value={presetDraft.name}
                    onChange={(event) => setPresetDraft((current) => ({ ...current, name: event.target.value }))}
                  />
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-border/60 px-4 py-3">
                  <div>
                    <p className="font-medium">Default preset</p>
                    <p className="text-sm text-muted-foreground">Use this style when no preset is specified.</p>
                  </div>
                  <Switch
                    checked={presetDraft.isDefault}
                    onCheckedChange={(checked) => setPresetDraft((current) => ({ ...current, isDefault: checked }))}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="preset-description">Description</Label>
                  <Textarea
                    id="preset-description"
                    value={presetDraft.description}
                    onChange={(event) => setPresetDraft((current) => ({ ...current, description: event.target.value }))}
                    placeholder="Campaign, client, or use case notes"
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
                Editing the brand default changes the baseline style used for new presets and default API renders.
              </div>
            )}
          </CardHeader>

          <CardContent className="space-y-6">
            <Tabs value={designTab} onValueChange={(value) => setDesignTab(value as typeof designTab)}>
              <div className="overflow-x-auto">
                <TabsList>
                  {["style", "border", "logo", "error-level"].map((tab) => (
                    <TabsTrigger key={tab} value={tab} className="capitalize">
                      {tab.replace("-", " ")}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value="style">
                <StyleSettings
                  settings={{
                    ...DEFAULT_STYLE_SETTINGS,
                    ...(currentConfig.styleSettings ?? {}),
                  }}
                  onChange={(nextStyle) =>
                    updateCurrentConfig((config) => ({
                      ...config,
                      styleSettings:
                        typeof nextStyle === "function"
                          ? nextStyle({
                              ...DEFAULT_STYLE_SETTINGS,
                              ...(config.styleSettings ?? {}),
                            })
                          : nextStyle,
                    }))
                  }
                />
              </TabsContent>

              <TabsContent value="border">
                <BorderSettings
                  settings={currentConfig.borderSettings ?? DEFAULT_BORDER_SETTINGS}
                  onChange={(nextBorder) =>
                    updateCurrentConfig((config) => ({
                      ...config,
                      borderSettings:
                        typeof nextBorder === "function"
                          ? nextBorder(config.borderSettings ?? DEFAULT_BORDER_SETTINGS)
                          : nextBorder,
                    }))
                  }
                />
              </TabsContent>

              <TabsContent value="logo">
                <LogoSettings
                  settings={currentConfig.logoSettings ?? undefined}
                  onChange={(nextLogo) =>
                    updateCurrentConfig((config) => ({
                      ...config,
                      logoSettings: nextLogo
                        ? {
                            src: nextLogo.src || "",
                            size: nextLogo.size,
                            margin: nextLogo.margin,
                            hideBackgroundDots: nextLogo.hideBackgroundDots,
                          }
                        : (brand.logoUrl
                            ? ({
                                src: brand.logoUrl,
                                size: 0.24,
                                margin: 2,
                                hideBackgroundDots: true,
                              } satisfies QrLogoSettings)
                            : null),
                    }))
                  }
                />
              </TabsContent>

              <TabsContent value="error-level">
                <ErrorLevelSettings
                  value={currentConfig.errorLevel}
                  onChange={(nextErrorLevel) =>
                    updateCurrentConfig((config) => ({
                      ...config,
                      errorLevel:
                        typeof nextErrorLevel === "function"
                          ? nextErrorLevel(config.errorLevel)
                          : nextErrorLevel,
                    }))
                  }
                />
              </TabsContent>
            </Tabs>

            {activeEditor === "preset" ? (
              <div className="flex justify-end">
                <Button variant="destructive" onClick={deletePreset} disabled={isDeletingPreset}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeletingPreset ? "Deleting..." : presetDraft.id ? "Delete preset" : "Discard draft"}
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="sticky top-6 border-border/70">
            <CardHeader>
              <CardTitle>Live preview</CardTitle>
              <CardDescription>
                Content is fixed here on purpose. This screen is only about the look and feel of the QR.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-[28px] border border-border/60 bg-[radial-gradient(circle_at_top,rgba(15,118,110,0.10),transparent_55%),linear-gradient(180deg,rgba(248,250,252,1),rgba(241,245,249,0.75))] p-6">
                <div className="flex justify-center">
                  <QrPreview
                    data={SAMPLE_QR_DATA}
                    errorLevel={currentConfig.errorLevel}
                    styleSettings={currentConfig.styleSettings}
                    logoSettings={currentConfig.logoSettings ?? undefined}
                    borderSettings={currentConfig.borderSettings ?? undefined}
                  />
                </div>
              </div>

              <div className="grid gap-3">
                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Editing</p>
                  <p className="mt-2 text-base font-semibold">
                    {activeEditor === "brand" ? "Brand default" : presetDraft.name || "Untitled preset"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {activeEditor === "brand"
                      ? "This becomes the fallback style for API renders."
                      : presetDraft.description || "Save this style and use it from the dashboard or API."}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/60 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">API usage</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Render with this style by sending a `presetId`, or omit it to fall back to the saved brand default.
                  </p>
                </div>

                {selectedPreset ? (
                  <div className="rounded-2xl border border-border/60 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Selected preset</p>
                    <p className="mt-2 text-base font-semibold">{selectedPreset.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">Last updated {formatDate(selectedPreset.updatedAt)}</p>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
