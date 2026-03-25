"use client";

import { useEffect, useMemo, useState } from "react";
import { PaintbrushVertical, Palette, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import QrPreview from "@/components/qr-preview";
import { StyleDesignerPanel, type StyleDesignerTab } from "@/components/dashboard/style-designer-panel";
import type {
  BrandProfile,
  QrBorderSettings,
  QrLogoSettings,
  QrRenderConfig,
  QrStyleSettings,
  QrTypeDefaults,
  StylePreset,
  StylePresetQrType,
} from "@/lib/types";

const DEFAULT_STYLE_SETTINGS: QrStyleSettings = {
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
  typeDefaults: {},
  createdAt: new Date(0),
  updatedAt: new Date(0),
};

const STYLE_TARGET_OPTIONS: Array<{
  value: StylePresetQrType;
  label: string;
}> = [
  { value: "all", label: "All types" },
  { value: "url", label: "Website" },
  { value: "contact", label: "Contact" },
  { value: "text", label: "Text" },
  { value: "email", label: "Email" },
  { value: "phone", label: "Phone" },
  { value: "sms", label: "SMS" },
  { value: "wifi", label: "WiFi" },
  { value: "file", label: "File" },
];

const PREVIEW_DATA_BY_TYPE: Record<StylePresetQrType, string> = {
  all: "https://tqrco.de/style-preview",
  url: "https://tqrco.de/style-preview",
  contact: "BEGIN:VCARD\nVERSION:3.0\nFN:TQR Co\nEMAIL:hello@tqrco.com\nEND:VCARD",
  text: "TQR Co style preview",
  email: "mailto:hello@tqrco.com?subject=Style%20Preview",
  phone: "tel:+12125550123",
  sms: "SMSTO:+12125550123:Style preview",
  wifi: "WIFI:T:WPA;S:TQRCO;P:preview123;;",
  file: "https://tqrco.de/files/style-preview.pdf",
};

type PresetDraft = {
  id?: string;
  name: string;
  description: string;
  qrType: StylePresetQrType;
  isDefault: boolean;
  config: QrRenderConfig;
};

type StyleTableRow =
  | {
      key: string;
      kind: "brand";
      name: string;
      description: string;
      qrType: StylePresetQrType;
      isDefault: true;
      updatedAt: string | Date;
      config: QrRenderConfig;
    }
  | {
      key: string;
      kind: "preset";
      preset: StylePreset;
      name: string;
      description: string;
      qrType: StylePresetQrType;
      isDefault: boolean;
      updatedAt: string | Date;
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

function normalizeTypeDefaults(typeDefaults?: QrTypeDefaults | null): QrTypeDefaults {
  if (!typeDefaults) {
    return {};
  }

  const normalized: QrTypeDefaults = {};
  for (const option of STYLE_TARGET_OPTIONS) {
    if (option.value === "all") {
      continue;
    }

    const value = typeDefaults[option.value];
    if (value) {
      normalized[option.value] = normalizeConfig(value);
    }
  }

  return normalized;
}

function normalizePreset(preset: StylePreset): StylePreset {
  return {
    ...preset,
    qrType: preset.qrType ?? "all",
    config: normalizeConfig(preset.config),
  };
}

function toPresetDraft(preset?: StylePreset | null): PresetDraft {
  if (!preset) {
    return {
      name: "New style",
      description: "",
      qrType: "all",
      isDefault: false,
      config: normalizeConfig(DEFAULT_CONFIG),
    };
  }

  return {
    id: preset.id,
    name: preset.name,
    description: preset.description ?? "",
    qrType: preset.qrType ?? "all",
    isDefault: preset.isDefault,
    config: normalizeConfig(preset.config),
  };
}

function sortPresets(presets: StylePreset[]) {
  return [...presets].sort((a, b) => {
    if (a.isDefault !== b.isDefault) {
      return Number(b.isDefault) - Number(a.isDefault);
    }

    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
}

function formatDate(value: string | Date) {
  return new Date(value).toLocaleString();
}

function getTypeLabel(value: StylePresetQrType) {
  return STYLE_TARGET_OPTIONS.find((option) => option.value === value)?.label ?? "All types";
}

function getDefaultHelperText(qrType: StylePresetQrType) {
  if (qrType === "all") {
    return "Saving this as default clears any current default styles and makes this the fallback across every QR type.";
  }

  return `Saving this as default clears the current ${getTypeLabel(qrType).toLowerCase()} default and any all-types default.`;
}

function getTablePreviewLogoSettings(logoSettings?: QrLogoSettings | null): QrLogoSettings | undefined {
  if (!logoSettings?.src) {
    return undefined;
  }

  return {
    ...logoSettings,
    size: Math.min(logoSettings.size, 0.24),
    margin: Math.min(logoSettings.margin ?? 10, 2),
    hideBackgroundDots: logoSettings.hideBackgroundDots ?? true,
  };
}

export function StylesStudio() {
  const [brand, setBrand] = useState<BrandProfile>(EMPTY_BRAND);
  const [presets, setPresets] = useState<StylePreset[]>([]);
  const [presetDraft, setPresetDraft] = useState<PresetDraft>(toPresetDraft());
  const [brandTarget, setBrandTarget] = useState<StylePresetQrType>("all");
  const [presetDialogOpen, setPresetDialogOpen] = useState(false);
  const [brandDialogOpen, setBrandDialogOpen] = useState(false);
  const [presetDesignTab, setPresetDesignTab] = useState<StyleDesignerTab>("style");
  const [brandDesignTab, setBrandDesignTab] = useState<StyleDesignerTab>("style");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingBrand, setIsSavingBrand] = useState(false);
  const [isSavingPreset, setIsSavingPreset] = useState(false);
  const [deletingPresetId, setDeletingPresetId] = useState<string | null>(null);

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
          typeDefaults: normalizeTypeDefaults(brandData.brand?.typeDefaults),
        } as BrandProfile;
        const nextPresets = sortPresets((presetsData.presets ?? []).map((preset: StylePreset) => normalizePreset(preset)));

        setBrand(nextBrand);
        setPresets(nextPresets);
      } catch (error) {
        console.error(error);
        toast.error("Failed to load styles");
      } finally {
        setIsLoading(false);
      }
    }

    void loadData();
  }, []);

  const brandDefaultConfig = useMemo(() => {
    if (brandTarget === "all") {
      return normalizeConfig(brand.defaultConfig);
    }

    return normalizeConfig(brand.typeDefaults?.[brandTarget] ?? brand.defaultConfig);
  }, [brand.defaultConfig, brand.typeDefaults, brandTarget]);

  const tableRows = useMemo<StyleTableRow[]>(() => {
    const rows: StyleTableRow[] = [
      {
        key: "brand-all",
        kind: "brand",
        name: `${brand.brandName} default`,
        description: "Shared fallback style from your brand profile.",
        qrType: "all",
        isDefault: true,
        updatedAt: brand.updatedAt,
        config: normalizeConfig(brand.defaultConfig),
      },
    ];

    for (const option of STYLE_TARGET_OPTIONS) {
      if (option.value === "all") {
        continue;
      }

      const config = brand.typeDefaults?.[option.value];
      if (!config) {
        continue;
      }

      rows.push({
        key: `brand-${option.value}`,
        kind: "brand",
        name: `${brand.brandName} ${option.label} default`,
        description: `Type-specific brand default for ${option.label.toLowerCase()} QR codes.`,
        qrType: option.value,
        isDefault: true,
        updatedAt: brand.updatedAt,
        config: normalizeConfig(config),
      });
    }

    for (const preset of presets) {
      rows.push({
        key: preset.id,
        kind: "preset",
        preset,
        name: preset.name,
        description: preset.description || "No description",
        qrType: preset.qrType,
        isDefault: preset.isDefault,
        updatedAt: preset.updatedAt,
        config: preset.config,
      });
    }

    return rows;
  }, [brand.brandName, brand.defaultConfig, brand.typeDefaults, brand.updatedAt, presets]);

  function updateBrandConfig(updater: (config: QrRenderConfig) => QrRenderConfig) {
    setBrand((current) => {
      if (brandTarget === "all") {
        return {
          ...current,
          defaultConfig: normalizeConfig(updater(normalizeConfig(current.defaultConfig))),
        };
      }

      return {
        ...current,
        typeDefaults: {
          ...(current.typeDefaults ?? {}),
          [brandTarget]: normalizeConfig(updater(normalizeConfig(current.typeDefaults?.[brandTarget] ?? current.defaultConfig))),
        },
      };
    });
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

  function createNewPresetDraft() {
    return {
      name: "New style",
      description: "",
      qrType: "all" as const,
      isDefault: false,
      config: applyBrandPaletteToConfig(brand.defaultConfig),
    };
  }

  function openNewPresetDialog() {
    setPresetDraft(createNewPresetDraft());
    setPresetDesignTab("style");
    setPresetDialogOpen(true);
  }

  function openPresetDialog(preset: StylePreset) {
    setPresetDraft(toPresetDraft(preset));
    setPresetDesignTab("style");
    setPresetDialogOpen(true);
  }

  function findConflictingDefaultPreset() {
    if (!presetDraft.isDefault) {
      return null;
    }

    return presets.find((preset) => {
      if (!preset.isDefault || preset.id === presetDraft.id) {
        return false;
      }

      if (presetDraft.qrType === "all") {
        return true;
      }

      return preset.qrType === "all" || preset.qrType === presetDraft.qrType;
    }) ?? null;
  }

  async function saveBrand(closeAfterSave = false) {
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
          typeDefaults: normalizeTypeDefaults(brand.typeDefaults),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save brand");
      }

      const data = await response.json();
      setBrand({
        ...data.brand,
        defaultConfig: normalizeConfig(data.brand.defaultConfig),
        typeDefaults: normalizeTypeDefaults(data.brand.typeDefaults),
      });
      if (closeAfterSave) {
        setBrandDialogOpen(false);
      }
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
      toast.error("Style name is required");
      return;
    }

    const conflictingDefault = findConflictingDefaultPreset();
    if (conflictingDefault) {
      const shouldContinue = window.confirm(
        `"${conflictingDefault.name}" is currently the default for ${getTypeLabel(conflictingDefault.qrType).toLowerCase()}. Save "${presetDraft.name.trim()}" as the new default instead?`,
      );

      if (!shouldContinue) {
        return;
      }
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
            name: presetDraft.name.trim(),
            description: presetDraft.description.trim() || null,
            qrType: presetDraft.qrType,
            isDefault: presetDraft.isDefault,
            config: normalizeConfig(presetDraft.config),
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to save preset");
      }

      const data = await response.json();
      const savedPreset = normalizePreset(data.preset as StylePreset);

      setPresets((current) => sortPresets([savedPreset, ...current.filter((preset) => preset.id !== savedPreset.id)]));
      setPresetDraft(toPresetDraft(savedPreset));
      setPresetDialogOpen(false);
      toast.success(presetDraft.id ? "Style updated" : "Style created");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save style");
    } finally {
      setIsSavingPreset(false);
    }
  }

  async function deletePreset(preset: StylePreset) {
    if (!window.confirm(`Delete "${preset.name}"?`)) {
      return;
    }

    setDeletingPresetId(preset.id);
    try {
      const response = await fetch(`/api/dashboard/styles/${preset.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete preset");
      }

      setPresets((current) => current.filter((item) => item.id !== preset.id));
      if (presetDraft.id === preset.id) {
        setPresetDialogOpen(false);
      }
      toast.success("Style deleted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete style");
    } finally {
      setDeletingPresetId(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-border/70">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Saved styles</CardTitle>
            <CardDescription>Browse, edit, and delete saved styles without leaving the page.</CardDescription>
          </div>
          <Button onClick={openNewPresetDialog}>
            <Plus className="h-4 w-4" />
            Create style
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[92px]">Preview</TableHead>
                <TableHead>Style name</TableHead>
                <TableHead>QR type</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    Loading styles...
                  </TableCell>
                </TableRow>
              ) : (
                tableRows.map((row) => (
                  <TableRow key={row.key}>
                    <TableCell>
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border bg-background p-2">
                        <QrPreview
                          data={PREVIEW_DATA_BY_TYPE[row.qrType]}
                          errorLevel={row.config.errorLevel ?? "M"}
                          size={48}
                          styleSettings={row.config.styleSettings}
                          borderSettings={row.config.borderSettings ?? undefined}
                          logoSettings={getTablePreviewLogoSettings(row.config.logoSettings)}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{row.name}</p>
                          {row.isDefault ? (
                            <Badge className="rounded-full bg-emerald-600 text-white hover:bg-emerald-600">
                              Default
                            </Badge>
                          ) : null}
                        </div>
                        <p className="text-sm text-muted-foreground">{row.description}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="rounded-full">
                        {getTypeLabel(row.qrType)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{formatDate(row.updatedAt)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (row.kind === "brand") {
                              setBrandTarget(row.qrType);
                              setBrandDesignTab("style");
                              setBrandDialogOpen(true);
                              return;
                            }

                            openPresetDialog(row.preset);
                          }}
                        >
                          <PaintbrushVertical className="h-4 w-4" />
                          <span className="sr-only">Edit style</span>
                        </Button>
                        {row.kind === "preset" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={deletingPresetId === row.preset.id}
                            onClick={() => void deletePreset(row.preset)}
                          >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete style</span>
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Brand profile
            </CardTitle>
            <CardDescription>New styles inherit from this palette, and brand defaults power fallback renders.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
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
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {[
                ["Primary", "primaryColor"],
                ["Accent", "accentColor"],
                ["Background", "backgroundColor"],
              ].map(([label, key]) => (
                <div key={key} className="space-y-2">
                  <Label>{label} color</Label>
                  <div className="flex items-center gap-3 rounded-2xl border p-3">
                    <input
                      type="color"
                      className="h-10 w-12 rounded-md border bg-transparent p-1"
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

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button variant="outline" onClick={syncBrandPalette}>
                <Sparkles className="h-4 w-4" />
                Sync palette into selected default
              </Button>
              <Button onClick={() => void saveBrand()} disabled={isSavingBrand}>
                <Save className="h-4 w-4" />
                {isSavingBrand ? "Saving..." : "Save brand profile"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader>
            <CardTitle>Brand default appearance</CardTitle>
            <CardDescription>Keep the API fallback and new-style starting point under control.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="brand-target">Default target</Label>
              <Select value={brandTarget} onValueChange={(value) => setBrandTarget(value as StylePresetQrType)}>
                <SelectTrigger id="brand-target">
                  <SelectValue placeholder="Choose a target" />
                </SelectTrigger>
                <SelectContent>
                  {STYLE_TARGET_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-2xl border bg-muted/35 p-4">
              <p className="text-sm font-medium">{getTypeLabel(brandTarget)}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {brandTarget === "all"
                  ? "This default applies when no type-specific override exists."
                  : "This override only applies to the selected QR type."}
              </p>
            </div>

            <Button className="w-full" onClick={() => setBrandDialogOpen(true)}>
              <PaintbrushVertical className="h-4 w-4" />
              Edit default appearance
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={presetDialogOpen} onOpenChange={setPresetDialogOpen}>
        <DialogContent className="max-h-[min(92vh,980px)] overflow-hidden border-none bg-transparent p-0 shadow-none sm:max-w-6xl">
          <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
            <DialogTitle>{presetDraft.id ? "Edit style" : "Create style"}</DialogTitle>
            <DialogDescription>
              Update the style details at the top, then fine-tune the QR appearance in the designer below.
            </DialogDescription>
          </DialogHeader>

          <StyleDesignerPanel
            topSection={
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Style details</div>
                  <h3 className="text-lg font-semibold">Name, target, and default behavior</h3>
                  <p className="text-sm text-muted-foreground">
                    These settings control how the style shows up in your library and which QR codes it should be used for.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="style-name">Style name</Label>
                    <Input
                      id="style-name"
                      value={presetDraft.name}
                      onChange={(event) => setPresetDraft((current) => ({ ...current, name: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="style-type">QR type</Label>
                    <Select
                      value={presetDraft.qrType}
                      onValueChange={(value) =>
                        setPresetDraft((current) => ({ ...current, qrType: value as StylePresetQrType }))
                      }
                    >
                      <SelectTrigger id="style-type">
                        <SelectValue placeholder="Choose a QR type" />
                      </SelectTrigger>
                      <SelectContent>
                        {STYLE_TARGET_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="space-y-2">
                    <Label htmlFor="style-description">Description</Label>
                    <Textarea
                      id="style-description"
                      value={presetDraft.description}
                      onChange={(event) => setPresetDraft((current) => ({ ...current, description: event.target.value }))}
                      placeholder="What this style is for"
                    />
                  </div>

                  <div className="rounded-2xl border px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">Default style</p>
                        <p className="text-sm text-muted-foreground">Exclusive per target</p>
                      </div>
                      <Switch
                        checked={presetDraft.isDefault}
                        onCheckedChange={(checked) =>
                          setPresetDraft((current) => ({ ...current, isDefault: checked }))
                        }
                      />
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground">{getDefaultHelperText(presetDraft.qrType)}</p>
                    {presetDraft.isDefault ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        If another saved style already owns this default target, saving will ask to replace it.
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            }
            config={normalizeConfig(presetDraft.config)}
            previewData={PREVIEW_DATA_BY_TYPE[presetDraft.qrType]}
            previewLabel={`Previewing a sample ${getTypeLabel(presetDraft.qrType).toLowerCase()} QR.`}
            designTab={presetDesignTab}
            onDesignTabChange={setPresetDesignTab}
            onChange={(config) => setPresetDraft((current) => ({ ...current, config: normalizeConfig(config) }))}
          />

          <DialogFooter className="px-4 pb-4 sm:px-6 sm:pb-6">
            {presetDraft.id ? (
              <Button
                variant="destructive"
                className="mr-auto"
                disabled={deletingPresetId === presetDraft.id}
                onClick={() => {
                  const preset = presets.find((item) => item.id === presetDraft.id);
                  if (preset) {
                    void deletePreset(preset);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            ) : null}
            <Button variant="outline" onClick={() => setPresetDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void savePreset()} disabled={isSavingPreset}>
              <Save className="h-4 w-4" />
              {isSavingPreset ? "Saving..." : presetDraft.id ? "Save changes" : "Create style"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={brandDialogOpen} onOpenChange={setBrandDialogOpen}>
        <DialogContent className="max-h-[min(92vh,980px)] overflow-hidden border-none bg-transparent p-0 shadow-none sm:max-w-6xl">
          <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
            <DialogTitle>Edit brand default appearance</DialogTitle>
            <DialogDescription>
              This controls the reusable fallback style for {getTypeLabel(brandTarget).toLowerCase()} QR codes.
            </DialogDescription>
          </DialogHeader>

          <StyleDesignerPanel
            topSection={
              <div className="space-y-4">
                <div className="space-y-1">
                  <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Brand defaults</div>
                  <h3 className="text-lg font-semibold">Choose the fallback target</h3>
                  <p className="text-sm text-muted-foreground">
                    Use one all-types default or create a type-specific override for a single QR destination.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px]">
                  <div className="space-y-2">
                    <Label htmlFor="brand-style-name">Brand style name</Label>
                    <Input
                      id="brand-style-name"
                      value={brand.brandName}
                      onChange={(event) => setBrand((current) => ({ ...current, brandName: event.target.value }))}
                    />
                    <p className="text-sm text-muted-foreground">
                      This label is shown for your brand default row in the saved styles table.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="brand-dialog-target">Target</Label>
                    <Select value={brandTarget} onValueChange={(value) => setBrandTarget(value as StylePresetQrType)}>
                      <SelectTrigger id="brand-dialog-target">
                        <SelectValue placeholder="Choose a target" />
                      </SelectTrigger>
                      <SelectContent>
                        {STYLE_TARGET_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-2xl border px-4 py-3 md:col-span-2">
                    <p className="font-medium">{getTypeLabel(brandTarget)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {brandTarget === "all"
                        ? "This is the shared fallback when a QR type has no override."
                        : "This override is only used for the selected QR type."}
                    </p>
                  </div>
                </div>
              </div>
            }
            config={brandDefaultConfig}
            previewData={PREVIEW_DATA_BY_TYPE[brandTarget]}
            previewLabel={`Previewing the brand default for ${getTypeLabel(brandTarget).toLowerCase()} QR codes.`}
            designTab={brandDesignTab}
            onDesignTabChange={setBrandDesignTab}
            onChange={(config) => updateBrandConfig(() => normalizeConfig(config))}
          />

          <DialogFooter className="px-4 pb-4 sm:px-6 sm:pb-6">
            <Button variant="outline" onClick={() => setBrandDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void saveBrand(true)} disabled={isSavingBrand}>
              <Save className="h-4 w-4" />
              {isSavingBrand ? "Saving..." : "Save brand defaults"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
