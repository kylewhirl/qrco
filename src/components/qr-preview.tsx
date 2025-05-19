"use client";

import { composeFramedSvg } from "@/lib/svg-compose";

import React, { useEffect, useRef } from "react";
import { getFrameExtension } from "@/components/qr/design/framePresets";
import QRCodeStyling, { Options } from "qr-code-styling";
import { averageColors, contrastRatio } from "@/lib/utils";

/**
 * Style options for dots, eyes, background, etc.
 * All properties are optional because we merge with defaults at runtime.
 */
export interface StyleSettings {
  dotStyle?: "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded";
  dotColorType?: "solid" | "gradient";
  dotColors?: string[];
  dotGradientType?: "linear" | "radial";
  dotRotation?: number;
  eyeStyle?: "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded" | "dot";
  eyeColorType?: "solid" | "gradient";
  eyeColors?: string[];
  eyeGradientType?: "linear" | "radial";
  eyeRotation?: number;
  innerEyeStyle?: "none" | "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded" | "dot";
  innerEyeColorType?: "solid" | "gradient";
  innerEyeColors?: string[];
  innerEyeGradientType?: "linear" | "radial";
  innerEyeRotation?: number;
  bgColorType?: "solid" | "gradient";
  bgColors?: string[];
  bgGradientType?: "linear" | "radial";
  bgRotation?: number;
}

const DEFAULT_STYLE_SETTINGS: Required<StyleSettings> = {
  dotStyle: "square",
  dotColorType: "solid",
  dotColors: ["#000000", "#000000"],
  dotGradientType: "linear",
  dotRotation: 0,
  eyeStyle: "square",
  eyeColorType: "solid",
  eyeColors: ["#000000", "#000000"],
  eyeGradientType: "linear",
  eyeRotation: 0,
  innerEyeStyle: "none",
  innerEyeColorType: "solid",
  innerEyeColors: ["#000000", "#000000"],
  innerEyeGradientType: "linear",
  innerEyeRotation: 0,
  bgColorType: "solid",
  bgColors: ["#ffffff", "#ffffff"],
  bgGradientType: "linear",
  bgRotation: 0,
};

export interface QrPreviewProps {
  data: string;
  errorLevel: "L" | "M" | "Q" | "H";
  margin?: number;
  styleSettings?: StyleSettings | null;
  logoSettings?: {
    src: string;
    size: number;
    margin?: number;
    hideBackgroundDots?: boolean;
  };
  borderSettings?: {
    shape: "square" | "circle";
    colorType: "solid" | "gradient";
    colors: string[];
    gradientType: "linear" | "radial";
    rotation: number;
    preset: string;
    text: string;
    textStyle?: string;
  };
  className?: string;
  onScanabilityChange?: (scanability: number) => void;
}

/**
 * Calculates scanability as the minimum contrast ratio between
 * the background color and each of the dot, eye, and inner eye colors.
 */
export function calculateScanability(
  styleSettings: Required<StyleSettings>,
  errorLevel: QrPreviewProps["errorLevel"],
  logoSettings?: QrPreviewProps["logoSettings"],
) {
  // `styleSettings` is already fully populated.
  // If using medium, quartile, or high error correction, adjust based on logo size
  if (errorLevel !== "L" && logoSettings && logoSettings.hideBackgroundDots) {
    const size = logoSettings.size;
    const zeroThreshold = errorLevel === "H" ? 0.7 : 0.7;
    if (size >= zeroThreshold) return 0;
    if (size >= 0.5 && size < zeroThreshold) return 0.1;
  }
  const bg = styleSettings.bgColors[0] || "#ffffff";
  const dotColor   = averageColors(styleSettings.dotColors)   || "#000000";
  const eyeColor   = averageColors(styleSettings.eyeColors)   || "#000000";
  const innerColor = averageColors(styleSettings.innerEyeColors) || "#000000";
  const dotContrast   = contrastRatio(dotColor, bg);
  const eyeContrast   = contrastRatio(eyeColor, bg);
  const innerContrast = contrastRatio(innerColor, bg);
  const raw = Math.min(dotContrast, eyeContrast, innerContrast);
  return Math.max(0, Math.min(1, (raw - 1) / 20));
}

const QrPreview: React.FC<QrPreviewProps> = ({
  data,
  errorLevel,
  styleSettings: rawStyleSettings,
  logoSettings,
  borderSettings,
  className,
  onScanabilityChange,
}) => {
  // Merge defaults only once; thereafter we refer to `styleSettings` everywhere
  const styleSettings: Required<StyleSettings> = React.useMemo(
    () => ({ ...DEFAULT_STYLE_SETTINGS, ...(rawStyleSettings ?? {}) }),
    [rawStyleSettings]
  );

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Ensure at least two colors
    const [c0, c1] = styleSettings.bgColors;
    const colors: [string, string] = [c0, c1 ?? c0];

    // Build a safe backgroundOptions
    const backgroundOptions = styleSettings.bgColorType === "gradient" && styleSettings.bgGradientType
      ? {
          color: colors[0],
          gradient: {
            type: styleSettings.bgGradientType,
            rotation: styleSettings.bgRotation ?? 0,
            colorStops: [
              { offset: 0, color: colors[0] },
              { offset: 1, color: colors[1] },
            ],
          },
          hideBackgroundDots: true,
        }
      : { color: colors[0],
        hideBackgroundDots: false,
       };

    // Dots background (solid or gradient)
    const dotArr = styleSettings.dotColors ?? [];
    const dot0   = dotArr[0] ?? "#000000";
    const dot1   = dotArr[1] ?? dot0;
    const dotsOptionsBackground = styleSettings.dotColorType === "gradient" && styleSettings.dotGradientType
      ? {
          color: dot0,
          gradient: {
            type: styleSettings.dotGradientType,
            rotation: styleSettings.dotRotation ?? 0,
            colorStops: [
              { offset: 0, color: dot0 },
              { offset: 1, color: dot1 ?? dot0 },
            ],
          },
        }
      : { color: dot0 };

    // Corner squares background (eyes)
    const eyeArr = styleSettings.eyeColors ?? [];
    const eye0   = eyeArr[0] ?? "#000000";
    const eye1   = eyeArr[1] ?? eye0;
    const cornersSquareBackground = styleSettings.eyeColorType === "gradient" && styleSettings.eyeGradientType
      ? {
          color: eye0,
          gradient: {
            type: styleSettings.eyeGradientType,
            rotation: styleSettings.eyeRotation ?? 0,
            colorStops: [
              { offset: 0, color: eye0 },
              { offset: 1, color: eye1 ?? eye0 },
            ],
          },
        }
      : { color: eye0 };

    // Corner dots background (inner eyes)
    const innerArr = styleSettings.innerEyeColors ?? [];
    const inner0   = innerArr[0] ?? "#000000";
    const inner1   = innerArr[1] ?? inner0;
    const cornersDotBackground = styleSettings.innerEyeColorType === "gradient" && styleSettings.innerEyeGradientType
      ? {
          color: inner0,
          gradient: {
            type: styleSettings.innerEyeGradientType,
            rotation: styleSettings.innerEyeRotation ?? 0,
            colorStops: [
              { offset: 0, color: inner0 },
              { offset: 1, color: inner1 ?? inner0 },
            ],
          },
        }
      : { color: inner0 };

    const options: Options = {
      width: 256,
      height: 256,
      data,
      margin: 4,
      type: "svg",
      image: logoSettings?.src,
      shape: borderSettings?.shape,
      qrOptions: {
        errorCorrectionLevel: errorLevel,
      },
      dotsOptions: {
        type: styleSettings.dotStyle,
        ...dotsOptionsBackground,
      },
      cornersSquareOptions: {
        type: styleSettings.eyeStyle,
        ...cornersSquareBackground,
      },
      ...(styleSettings.innerEyeStyle !== "none"
        ? {
            cornersDotOptions: {
              type: styleSettings.innerEyeStyle,
              ...cornersDotBackground,
            },
          }
        : {}),
      backgroundOptions,
      imageOptions: {
        hideBackgroundDots: logoSettings?.hideBackgroundDots ?? false,
        saveAsBlob: true,
        ...(logoSettings
          ? {
              crossOrigin: "anonymous",
              margin: logoSettings.margin ?? 10,
              imageSize: logoSettings.size,
            }
          : {}),
      },
    };
    // Optionally compute scanability for debugging
    const scanability = calculateScanability(styleSettings, errorLevel, logoSettings);
    console.log("options:", options);
    console.log("QR scanability:", scanability);
    if (onScanabilityChange) {
      onScanabilityChange(scanability);
    }

    (async () => {
      const svgInstance = new QRCodeStyling({ ...options, type: "svg" });
      const raw = await svgInstance.getRawData("svg");
      const qrSvgText =
        typeof raw === "string" ? raw :
        raw instanceof Blob ? await raw.text() :
        (raw?.toString() ?? "");

      let finalSvg = qrSvgText;

      if (borderSettings?.preset === "custom-svg") {
        // Ensure the latest QR (with updated logo) is rendered
        const freshRaw = await svgInstance.getRawData("svg");
        const freshQrSvgText =
          typeof freshRaw === "string" ? freshRaw :
          freshRaw instanceof Blob ? await freshRaw.text() :
          freshRaw?.toString() ?? "";

        // Fetch the frame SVG
        const frameRaw = await fetch("/frame-2.svg").then(r => r.text());

        // Compose using the fresh QR SVG
        finalSvg = composeFramedSvg(freshQrSvgText, frameRaw, {
          qrSize: options.width ?? 256,
          text: borderSettings.text,
          borderSettings: {
            colorType: borderSettings.colorType,
            colors: borderSettings.colors,
            gradientType: borderSettings.gradientType,
            rotation: borderSettings.rotation,
          },
        });
      } else if (borderSettings) {
        // Fallback to built-in frame presets
        svgInstance.applyExtension(
          getFrameExtension({
            preset: borderSettings.preset,
            color: borderSettings.colors[0],
            text: borderSettings.text || "",
          })
        );
        // regenerate SVG after extension
        const extRaw = await svgInstance.getRawData("svg");
        finalSvg =
          typeof extRaw === "string" ? extRaw :
          extRaw instanceof Blob ? await extRaw.text() :
          (extRaw?.toString() ?? "");
      }

      if (ref.current) {
        ref.current.innerHTML = finalSvg;
      }
    })();
  }, [
    data,
    errorLevel,
    rawStyleSettings,
    styleSettings,
    borderSettings,
    logoSettings,
    onScanabilityChange,
  ]);

  return (
    <div style={{ position: "relative", width: 256, height: 256 }} className={className}>
      <div
        ref={ref}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "256px",
          height: "256px",
        }}
      />
    </div>
  );
};

export default QrPreview;