"use client";

import type { ReactNode } from "react";
import { useMemo } from "react";
import { Brush, Frame, ImageIcon, ShieldAlert } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QrPreview from "@/components/qr-preview";
import BorderSettings from "@/components/qr/design/border";
import ErrorLevelSettings from "@/components/qr/design/error-level";
import LogoSettings from "@/components/qr/design/logo";
import StyleSettings, { type StyleSettingsProps } from "@/components/qr/design/style";
import type { QrBorderSettings, QrLogoSettings, QrRenderConfig } from "@/lib/types";

export type StyleDesignerTab = "style" | "border" | "logo" | "error-level";

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
  text: "",
  textStyle: undefined,
  preset: "default",
};

const DESIGN_OPTIONS: Array<{
  value: StyleDesignerTab;
  label: string;
  icon: typeof Brush;
}> = [
  { value: "style", label: "Style", icon: Brush },
  { value: "border", label: "Frame", icon: Frame },
  { value: "logo", label: "Logo", icon: ImageIcon },
  { value: "error-level", label: "Error", icon: ShieldAlert },
];

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

interface StyleDesignerPanelProps {
  topSection: ReactNode;
  config: QrRenderConfig;
  previewData: string;
  previewLabel: string;
  designTab: StyleDesignerTab;
  onDesignTabChange: (tab: StyleDesignerTab) => void;
  onChange: (config: QrRenderConfig) => void;
}

export function StyleDesignerPanel({
  topSection,
  config,
  previewData,
  previewLabel,
  designTab,
  onDesignTabChange,
  onChange,
}: StyleDesignerPanelProps) {
  const effectiveErrorLevel = config.errorLevel ?? "M";
  const effectiveStyleSettings = useMemo(
    () => ({
      ...DEFAULT_STYLE_SETTINGS,
      ...(config.styleSettings ?? {}),
    }),
    [config.styleSettings],
  );
  const effectiveBorderSettings = useMemo(
    () => ({
      ...DEFAULT_BORDER_SETTINGS,
      ...(config.borderSettings ?? {}),
    }),
    [config.borderSettings],
  );
  const effectiveLogoSettings = config.logoSettings ?? undefined;
  const previewBorderSettings = config.borderSettings === null ? undefined : effectiveBorderSettings;

  return (
    <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 max-w-full space-y-3">
        <section className="rounded-lg border bg-background p-4 sm:p-5">{topSection}</section>

        <section className="rounded-lg border bg-muted/35 p-3">
          <div className="mb-3 px-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Design
          </div>
          <Tabs value={designTab} onValueChange={(next) => onDesignTabChange(next as StyleDesignerTab)} className="min-h-0">
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
                    ...config,
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
                    ...config,
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
                    ...config,
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
                    ...config,
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
        <Card className="rounded-lg border bg-muted/35 p-3">
          <div className="mb-3 px-1">
            <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Preview</div>
            <p className="text-sm text-muted-foreground">{previewLabel}</p>
          </div>

          <div className="relative flex min-h-[280px] items-center justify-center rounded-lg border bg-background p-4">
            <QrPreview
              data={previewData}
              errorLevel={effectiveErrorLevel}
              size={200}
              styleSettings={effectiveStyleSettings}
              borderSettings={previewBorderSettings}
              logoSettings={effectiveLogoSettings}
            />
          </div>
        </Card>
      </aside>
    </div>
  );
}
