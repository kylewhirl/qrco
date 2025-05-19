import type { QrPreviewProps } from "@/components/qr-preview";
import type { StyleSettings } from "@/components/qr/settings/types";

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

export interface MistralQrResponse {
  data: string;
  background: { type: "solid" | "gradient"; colors: string[]; gradientType?: "linear" | "radial"; rotation?: number };
  dots: { type: "solid" | "gradient"; colors: string[]; gradientType?: "linear" | "radial"; rotation?: number };
  style: "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded";
  logo: string;
}

export function mapApiResponseToQrPreviewProps(resp: MistralQrResponse): QrPreviewProps {
  const styleSettings: Required<StyleSettings> = {
    ...DEFAULT_STYLE_SETTINGS,
    dotStyle: resp.style,
    eyeStyle: resp.style,
    innerEyeStyle: "none",
    dotColorType: resp.dots.type,
    dotColors: resp.dots.colors,
    dotGradientType: resp.dots.gradientType ?? DEFAULT_STYLE_SETTINGS.dotGradientType,
    dotRotation: resp.dots.rotation ?? DEFAULT_STYLE_SETTINGS.dotRotation,
    eyeColorType: resp.dots.type,
    eyeColors: resp.dots.colors,
    eyeGradientType: resp.dots.gradientType ?? DEFAULT_STYLE_SETTINGS.eyeGradientType,
    eyeRotation: resp.dots.rotation ?? DEFAULT_STYLE_SETTINGS.eyeRotation,
    innerEyeColorType: DEFAULT_STYLE_SETTINGS.innerEyeColorType,
    innerEyeColors: DEFAULT_STYLE_SETTINGS.innerEyeColors,
    innerEyeGradientType: DEFAULT_STYLE_SETTINGS.innerEyeGradientType,
    innerEyeRotation: DEFAULT_STYLE_SETTINGS.innerEyeRotation,
    bgColorType: resp.background.type,
    bgColors: resp.background.colors,
    bgGradientType: resp.background.gradientType ?? DEFAULT_STYLE_SETTINGS.bgGradientType,
    bgRotation: resp.background.rotation ?? DEFAULT_STYLE_SETTINGS.bgRotation,
  };

  return {
    data: resp.data,
    errorLevel: "M",
    margin: 0,
    styleSettings,
    logoSettings: {
      src: resp.logo,
      size: 32,
      margin: 0,
      hideBackgroundDots: false,
    },
  };
}
