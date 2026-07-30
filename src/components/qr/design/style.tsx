"use client";

import React, { Dispatch, SetStateAction } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { ColorPicker } from "@/components/ui/color-picker";
import { averageColors, cn, parseColorValue } from "@/lib/utils";

type DotStyle = StyleSettingsProps["settings"]["dotStyle"];
type EyeStyle = StyleSettingsProps["settings"]["eyeStyle"];
type InnerEyeStyle = StyleSettingsProps["settings"]["innerEyeStyle"];

const DOT_STYLE_OPTIONS: DotStyle[] = [
  "square",
  "dots",
  "rounded",
  "extra-rounded",
  "classy",
  "classy-rounded",
];

const EYE_STYLE_OPTIONS: EyeStyle[] = [
  "square",
  "extra-rounded",
  "dot",
  "rounded",
  "classy",
  "classy-rounded",
  "dots",
];

const INNER_EYE_STYLE_OPTIONS: InnerEyeStyle[] = [
  "none",
  "square",
  "dot",
  "rounded",
  "extra-rounded",
  "classy",
  "classy-rounded",
  "dots",
];
const swatchMarkupCache = new Map<string, string>();

function formatStyleLabel(style: string) {
  return style.replace("-", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function NoneSwatch({ active, label }: { active: boolean; label: string }) {
  return (
    <div
      className={cn(
        "flex size-11 items-center justify-center rounded-md border bg-background text-muted-foreground transition hover:border-[var(--brand-blue)] sm:size-10",
        active ? "border-[var(--brand-blue)] bg-[color-mix(in_srgb,var(--brand-blue)_9%,var(--card))] shadow-[0_8px_18px_-14px_var(--brand-blue)]" : "border-border"
      )}
    >
      <svg viewBox="0 0 50 50" className="size-6" aria-hidden="true">
        <path d="M10 40 L40 10" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  );
}

function getSwatchAssetPath(
  kind: "dots" | "eyes" | "innerEyes",
  style: Exclude<DotStyle | EyeStyle | InnerEyeStyle, "none">
) {
  return `/qr-style-swatches/${kind}-${style}.svg`;
}

function StaticSwatch({
  kind,
  style,
  active,
  swatchColor,
  swatchBackground,
}: {
  kind: "dots" | "eyes" | "innerEyes";
  style: Exclude<DotStyle | EyeStyle | InnerEyeStyle, "none">;
  active: boolean;
  swatchColor: string;
  swatchBackground?: string;
}) {
  const assetPath = getSwatchAssetPath(kind, style);
  const [markup, setMarkup] = React.useState<string | null>(() => swatchMarkupCache.get(assetPath) ?? null);

  React.useEffect(() => {
    const cached = swatchMarkupCache.get(assetPath);
    if (cached) {
      setMarkup(cached);
      return;
    }

    let activeRun = true;

    fetch(assetPath)
      .then((response) => response.text())
      .then((text) => {
        swatchMarkupCache.set(assetPath, text);
        if (activeRun) {
          setMarkup(text);
        }
      });

    return () => {
      activeRun = false;
    };
  }, [assetPath]);

  return (
    <div
      className={cn(
        "flex size-11 items-center justify-center overflow-hidden rounded-md border bg-background transition hover:border-[var(--brand-blue)] sm:size-10",
        active ? "border-[var(--brand-blue)] bg-[color-mix(in_srgb,var(--brand-blue)_9%,var(--card))] shadow-[0_8px_18px_-14px_var(--brand-blue)]" : "border-border"
      )}
      style={{
        color: swatchColor,
        ...(swatchBackground
          ? swatchBackground.includes("gradient(")
            ? { backgroundImage: swatchBackground, backgroundColor: undefined }
            : { backgroundColor: swatchBackground, backgroundImage: "none" }
          : {}),
      }}
    >
      {markup ? (
        <div
          className="flex size-11 items-center justify-center sm:size-10"
          dangerouslySetInnerHTML={{ __html: markup }}
        />
      ) : (
        <div className="size-10 animate-pulse bg-muted" />
      )}
    </div>
  );
}

function StyleOptionGrid<T extends string>({
  options,
  value,
  onChange,
  kind,
  swatchColor,
  swatchBackground,
}: {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  kind: "dots" | "eyes" | "innerEyes";
  swatchColor: string;
  swatchBackground?: string;
}) {
  return (
    <div className="grid min-w-0 grid-cols-3 gap-2">
      {options.map((option) =>
        option === "none" ? (
          <div key={option} className="flex min-w-0 flex-col items-center gap-1">
            <button type="button" onClick={() => onChange(option)} className="flex min-w-0 flex-col items-center gap-1">
              <NoneSwatch active={value === option} label={formatStyleLabel(option)} />
            </button>
            <span className="max-w-full truncate text-[9px] font-bold text-muted-foreground">{formatStyleLabel(option)}</span>
          </div>
        ) : (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className="flex min-w-0 flex-col items-center gap-1"
          >
            <StaticSwatch
              kind={kind}
              style={option as Exclude<DotStyle | EyeStyle | InnerEyeStyle, "none">}
              active={value === option}
              swatchColor={swatchColor}
              swatchBackground={swatchBackground}
            />
            <span className="max-w-full truncate text-[9px] font-bold text-muted-foreground">{formatStyleLabel(option)}</span>
          </button>
        )
      )}
    </div>
  );
}

export interface StyleSettingsProps {
  settings: {
    // Shape
    dotStyle: "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded";
    eyeStyle: "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded" | "dot";
    innerEyeStyle: "none" | "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded" | "dot";
    // Color & Gradient
    dotColorType: "solid" | "gradient";
    dotColors: string[];
    dotGradientType?: "linear" | "radial";
    dotRotation?: number;
    eyeColorType: "solid" | "gradient";
    eyeColors: string[];
    eyeGradientType?: "linear" | "radial";
    eyeRotation?: number;
    innerEyeColorType: "solid" | "gradient";
    innerEyeColors: string[];
    innerEyeGradientType?: "linear" | "radial";
    innerEyeRotation?: number;
    bgColorType: "solid" | "gradient";
    bgColors: string[];
    bgGradientType?: "linear" | "radial";
    bgRotation?: number;
  };
  onChange: Dispatch<SetStateAction<StyleSettingsProps["settings"]>>;
  className?: string;
}

export default function StyleSettings({ settings, onChange, className }: StyleSettingsProps) {
  const [advancedOpen, setAdvancedOpen] = React.useState(false);

  // Compute display value for color pickers: solid or CSS gradient
  const getPickerValue = (
    colorType: "solid" | "gradient",
    colors: string[] = [],
    gradientType?: "linear" | "radial",
    rotation?: number
  ): string => {
    if (colorType === "gradient" && colors.length >= 2 && gradientType) {
      // Percentage stops mapping
      const stops = colors
        .map((c, i) => `${c} ${i === 0 ? 0 : 100}%`)
        .join(", ");
      if (gradientType === "linear") {
        return `linear-gradient(${rotation ?? 0}deg, ${stops})`;
      }
      // radial
      return `radial-gradient(circle, ${stops})`;
    }
    return colors[0] || "";
  };

  const unifiedValue = getPickerValue(
    settings.dotColorType,
    settings.dotColors,
    settings.dotGradientType,
    settings.dotRotation
  );
  const dotValue = getPickerValue(
    settings.dotColorType,
    settings.dotColors,
    settings.dotGradientType,
    settings.dotRotation
  );
  const eyeValue = getPickerValue(
    settings.eyeColorType,
    settings.eyeColors,
    settings.eyeGradientType,
    settings.eyeRotation
  );
  const innerEyeValue = getPickerValue(
    settings.innerEyeColorType,
    settings.innerEyeColors,
    settings.innerEyeGradientType,
    settings.innerEyeRotation
  );
  const bgValue = getPickerValue(
      settings.bgColorType,
      settings.bgColors,
      settings.bgGradientType,
      settings.bgRotation
  );
  const dotSwatchColor = averageColors(settings.dotColors) || "#000000";
  const eyeSwatchColor = averageColors(settings.eyeColors) || "#000000";
  const innerEyeSwatchColor = averageColors(settings.innerEyeColors) || "#000000";
  const swatchBackground = bgValue || "#ffffff";

  return (
    <Card className={`w-full min-w-0 gap-4 rounded-md border-0 bg-transparent p-0 shadow-none ${className ?? ""}`}>
      <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Code style</h3>

      <div className="grid w-full min-w-0 grid-cols-1 gap-4">
        <div className="flex min-w-0 flex-col space-y-1">
          <Label htmlFor="all-style">Style</Label>
          <div className={advancedOpen ? "pointer-events-none opacity-50" : ""}>
            <StyleOptionGrid
              options={DOT_STYLE_OPTIONS}
              value={settings.dotStyle}
              kind="dots"
              swatchColor={dotSwatchColor}
              swatchBackground={swatchBackground}
              onChange={(value) =>
                onChange({
                  ...settings,
                  dotStyle: value,
                  eyeStyle: value as StyleSettingsProps["settings"]["eyeStyle"],
                  innerEyeStyle: "none",
                })
              }
            />
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="flex min-w-0 items-center justify-between gap-2 rounded-md border border-border bg-[color-mix(in_srgb,var(--muted)_32%,transparent)] p-2">
            <Label htmlFor="all-color" className="min-w-0 truncate text-xs">Code color</Label>
            <ColorPicker
              id="all-color"
              className="size-9 shrink-0"
              color={unifiedValue}
              onChange={(e) => {
                const { colorType, colors, gradientType, rotation } = parseColorValue(
                  e.target.value,
                  {
                    gradientType: settings.dotGradientType,
                    rotation: settings.dotRotation,
                    colors: settings.dotColors,
                  }
                );
                onChange({
                  ...settings,
                  // dots
                  dotColorType: colorType,
                  dotColors: colors,
                  dotGradientType: gradientType,
                  dotRotation: rotation,
                  // eyes
                  eyeColorType: colorType,
                  eyeColors: colors,
                  eyeGradientType: gradientType,
                  eyeRotation: rotation,
                  // inner eyes
                  innerEyeColorType: colorType,
                  innerEyeColors: colors,
                  innerEyeGradientType: gradientType,
                  innerEyeRotation: rotation,
                });
              }}
              disabled={advancedOpen}
            />
          </div>
          <div className="flex min-w-0 items-center justify-between gap-2 rounded-md border border-border bg-[color-mix(in_srgb,var(--muted)_32%,transparent)] p-2">
            <Label htmlFor="background-color" className="min-w-0 truncate text-xs">Background</Label>
            <ColorPicker
              id="background-color"
              className="size-9 shrink-0"
              color={settings.bgColorType !== "gradient" ? settings.bgColors[0] : bgValue}
              onChange={(e) => {
                const { colorType, colors, gradientType, rotation } = parseColorValue(
                  e.target.value,
                  {
                    gradientType: settings.bgGradientType,
                    rotation: settings.bgRotation,
                    colors: settings.bgColors,
                  }
                );
                onChange({
                  ...settings,
                  bgColorType: colorType,
                  bgColors: colors,
                  bgGradientType: gradientType,
                  bgRotation: rotation,
                });
              }}
            />
          </div>
        </div>
      </div>

      <Accordion
        type="single"
        collapsible
        defaultValue=""
        onValueChange={val => setAdvancedOpen(!!val)}
      >
        <AccordionItem value="advanced">
          <AccordionTrigger>Advanced</AccordionTrigger>
          <AccordionContent>
            <div className="grid w-full min-w-0 grid-cols-1 gap-4">
              {/* Shape Settings */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold">Shape</h4>
            
                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="flex min-w-0 flex-col space-y-1">
                    <Label htmlFor="dot-style">Dot Style</Label>
                    <StyleOptionGrid
                      options={DOT_STYLE_OPTIONS}
                      value={settings.dotStyle}
                      kind="dots"
                      swatchColor={dotSwatchColor}
                      swatchBackground={swatchBackground}
                      onChange={(value) => onChange({ ...settings, dotStyle: value })}
                    />
                    </div>

                    <div className="flex flex-col space-y-1">
                    <Label htmlFor="dot-color">Dot Color</Label>
                    
                    <ColorPicker 
                        id="color-picker"
                        color={dotValue} 
                        onChange={(e) => {
                          const { colorType, colors, gradientType, rotation } = parseColorValue(
                            e.target.value,
                            {
                              gradientType: settings.dotGradientType,
                              rotation: settings.dotRotation,
                              colors: settings.dotColors,
                            }
                          );
                          onChange({
                            ...settings,
                            dotColorType: colorType,
                            dotColors: colors,
                            dotGradientType: gradientType,
                            dotRotation: rotation,
                          });
                        }}
                    />
                    </div>
                </div>
                </div>
    
                {/* Eye Color */}

              {/* Eye Settings */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold">Eyes</h4>

                {/* Eye Shape */}
                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="flex min-w-0 flex-col space-y-1">
                    <Label htmlFor="eye-style">Eye Shape</Label>
                    <StyleOptionGrid
                      options={EYE_STYLE_OPTIONS}
                      value={settings.eyeStyle}
                      kind="eyes"
                      swatchColor={eyeSwatchColor}
                      swatchBackground={swatchBackground}
                      onChange={(value) => onChange({ ...settings, eyeStyle: value })}
                    />
                    </div>

                    <div className="flex flex-col space-y-1">
                    <Label htmlFor="eye-color">Eye Color</Label>
                    <ColorPicker
                        id="eye-color"
                        color={eyeValue}
                        onChange={(e) => {
                          const { colorType, colors, gradientType, rotation } = parseColorValue(
                            e.target.value,
                            {
                              gradientType: settings.eyeGradientType,
                              rotation: settings.eyeRotation,
                              colors: settings.eyeColors,
                            }
                          );
                          onChange({
                            ...settings,
                            eyeColorType: colorType,
                            eyeColors: colors,
                            eyeGradientType: gradientType,
                            eyeRotation: rotation,
                          });
                        }}
                    />
                    </div>
                </div>

                {/* Inner Eye Shape */}
                <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                    <div className="flex min-w-0 flex-col space-y-1">
                    <Label htmlFor="inner-eye-style">Inner Eye Shape</Label>
                    <StyleOptionGrid
                      options={INNER_EYE_STYLE_OPTIONS}
                      value={settings.innerEyeStyle}
                      kind="innerEyes"
                      swatchColor={innerEyeSwatchColor}
                      swatchBackground={swatchBackground}
                      onChange={(value) => onChange({ ...settings, innerEyeStyle: value })}
                    />
                    </div>

                    <div className="flex flex-col space-y-1">
                    <Label htmlFor="inner-eye-color">Inner Eye Color</Label>
                    <ColorPicker
                        id="inner-eye-color"
                        color={innerEyeValue}
                        onChange={(e) => {
                          const { colorType, colors, gradientType, rotation } = parseColorValue(
                            e.target.value,
                            {
                              gradientType: settings.innerEyeGradientType,
                              rotation: settings.innerEyeRotation,
                              colors: settings.innerEyeColors,
                            }
                          );
                          onChange({
                            ...settings,
                            innerEyeColorType: colorType,
                            innerEyeColors: colors,
                            innerEyeGradientType: gradientType,
                            innerEyeRotation: rotation,
                          });
                        }}
                    />
                    </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}
