import React, { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  Brush,
  Download,
  Edit,
  Frame,
  ImagePlus,
  ImageIcon,
  Loader2,
  PaintbrushVertical,
  Plus,
  QrCode as QrCodeIcon,
  ShieldAlert,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import QRCodeStyling, { type Options } from "qr-code-styling";
import {
  useAnalyticsSummary,
  useBrand,
  useCreateQRCode,
  useDeleteQRCode,
  useDomains,
  useQRCodes,
  useStylePresets,
  useTqrcoClient,
  useUpdateQRCode,
} from "./react";
import { serializeQrData } from "./qr";
import { Scanability } from "./designer/scanability";
import BorderSettings, { type BorderSettingsProps } from "./designer/border";
import ErrorLevelSettings from "./designer/error-level";
import LogoSettings from "./designer/logo";
import StyleSettings, { type StyleSettingsProps } from "./designer/style";
import { Button as DesignButton } from "./designer/ui/button";
import { Card as DesignCard } from "./designer/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./designer/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./designer/ui/tabs";
import { averageColors } from "./designer/utils";
import type { BrandProfile, ContactData, QR, QRData, QrBorderSettings, QrRenderConfig, QrStyleSettings, StylePreset } from "./shared/contracts";

const DEFAULT_STYLE_SETTINGS: Required<QrStyleSettings> = {
  dotStyle: "square",
  dotColorType: "solid",
  dotColors: ["#111827", "#111827"],
  dotGradientType: "linear",
  dotRotation: 0,
  eyeStyle: "square",
  eyeColorType: "solid",
  eyeColors: ["#111827", "#111827"],
  eyeGradientType: "linear",
  eyeRotation: 0,
  innerEyeStyle: "square",
  innerEyeColorType: "solid",
  innerEyeColors: ["#111827", "#111827"],
  innerEyeGradientType: "linear",
  innerEyeRotation: 0,
  bgColorType: "solid",
  bgColors: ["#ffffff", "#ffffff"],
  bgGradientType: "linear",
  bgRotation: 0,
};

const DEFAULT_QR_HOST = "tqrco.de";

const OVERLAY_Z_INDEX = 70;
const BRAND_STYLE_ID = "__brand_default__";

type ContactFieldsDraft = {
  firstName: string;
  lastName: string;
  organization: string;
  title: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  note: string;
};

const EMPTY_CONTACT_FIELDS: ContactFieldsDraft = {
  firstName: "",
  lastName: "",
  organization: "",
  title: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  note: "",
};

function cx(...classes: Array<string | null | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

function buildGradient(
  colorType: "solid" | "gradient" | undefined,
  colors: string[] | undefined,
  type: "linear" | "radial" | undefined,
  rotation = 0,
) {
  const color0 = colors?.[0] ?? "#111827";
  const color1 = colors?.[1] ?? color0;

  if (colorType !== "gradient") {
    return { color: color0 };
  }

  return {
    color: color0,
    gradient: {
      type: type ?? "linear",
      rotation,
      colorStops: [
        { offset: 0, color: color0 },
        { offset: 1, color: color1 },
      ],
    },
  };
}

function applyBorderFrame(svg: SVGElement, width: number, height: number, settings: QrBorderSettings) {
  const ns = "http://www.w3.org/2000/svg";
  const size = Math.min(width, height);
  const stroke = settings.colors[0] ?? "#111827";
  const createText = () => {
    if (!settings.text) {
      return;
    }
    const textEl = document.createElementNS(ns, "text");
    textEl.setAttribute("x", `${width / 2}`);
    textEl.setAttribute("y", `${height - 20}`);
    textEl.setAttribute("fill", stroke);
    textEl.setAttribute("font-size", "16");
    textEl.setAttribute("text-anchor", "middle");
    textEl.textContent = settings.text;
    svg.appendChild(textEl);
  };

  if (settings.preset === "double") {
    [4, 12].forEach((offset) => {
      const border = document.createElementNS(ns, "rect");
      border.setAttribute("fill", "none");
      border.setAttribute("stroke", stroke);
      border.setAttribute("x", `${(width - size) / 2 + offset}`);
      border.setAttribute("y", `${(height - size) / 2 + offset}`);
      border.setAttribute("width", `${size - offset * 2}`);
      border.setAttribute("height", `${size - offset * 2}`);
      border.setAttribute("stroke-width", "4");
      svg.appendChild(border);
    });
    createText();
    return;
  }

  const border = document.createElementNS(ns, "rect");
  border.setAttribute("fill", "none");
  border.setAttribute("stroke", stroke);

  switch (settings.preset) {
    case "rounded":
      border.setAttribute("x", `${(width - size + 40) / 2}`);
      border.setAttribute("y", `${(height - size + 40) / 2}`);
      border.setAttribute("width", `${size - 40}`);
      border.setAttribute("height", `${size - 40}`);
      border.setAttribute("stroke-width", "20");
      border.setAttribute("rx", "20");
      break;
    case "dashed":
      border.setAttribute("x", `${(width - size) / 2}`);
      border.setAttribute("y", `${(height - size) / 2}`);
      border.setAttribute("width", `${size}`);
      border.setAttribute("height", `${size}`);
      border.setAttribute("stroke-width", "4");
      border.setAttribute("stroke-dasharray", "8,4");
      border.setAttribute("rx", "8");
      break;
    default:
      border.setAttribute("x", `${(width - size) / 2}`);
      border.setAttribute("y", `${(height - size) / 2}`);
      border.setAttribute("width", `${size}`);
      border.setAttribute("height", `${size}`);
      border.setAttribute("stroke-width", "10");
      border.setAttribute("rx", settings.shape === "circle" ? `${size / 2}` : "0");
      break;
  }

  svg.appendChild(border);
  createText();
}

function buildOptions(data: string, config: QrRenderConfig): Options {
  const styleSettings: Required<QrStyleSettings> = {
    ...DEFAULT_STYLE_SETTINGS,
    ...(config.styleSettings ?? {}),
  };
  const logoSettings = config.logoSettings ?? null;

  return {
    width: config.width ?? 256,
    height: config.height ?? 256,
    margin: config.margin ?? 4,
    type: "svg",
    data,
    image: logoSettings?.src,
    shape: config.borderSettings?.shape ?? "square",
    qrOptions: {
      errorCorrectionLevel: config.errorLevel ?? "M",
    },
    dotsOptions: {
      type: styleSettings.dotStyle,
      ...buildGradient(styleSettings.dotColorType, styleSettings.dotColors, styleSettings.dotGradientType, styleSettings.dotRotation),
    },
    cornersSquareOptions: {
      type: styleSettings.eyeStyle,
      ...buildGradient(styleSettings.eyeColorType, styleSettings.eyeColors, styleSettings.eyeGradientType, styleSettings.eyeRotation),
    },
    ...(styleSettings.innerEyeStyle !== "none"
      ? {
          cornersDotOptions: {
            type: styleSettings.innerEyeStyle,
            ...buildGradient(
              styleSettings.innerEyeColorType,
              styleSettings.innerEyeColors,
              styleSettings.innerEyeGradientType,
              styleSettings.innerEyeRotation,
            ),
          },
        }
      : {}),
    backgroundOptions: buildGradient(
      styleSettings.bgColorType,
      styleSettings.bgColors,
      styleSettings.bgGradientType,
      styleSettings.bgRotation,
    ),
    imageOptions: {
      hideBackgroundDots: logoSettings?.hideBackgroundDots ?? true,
      saveAsBlob: true,
      imageSize: logoSettings?.size ?? 0.4,
      margin: logoSettings?.margin ?? 4,
      crossOrigin: "anonymous",
    },
  };
}

function contrastRatio(foreground: string, background: string) {
  function toRgb(color: string): [number, number, number] {
    const normalized = color.trim().toLowerCase();

    if (normalized.startsWith("#")) {
      let hex = normalized.slice(1);
      if (hex.length === 3) {
        hex = [...hex].map((segment) => segment + segment).join("");
      }
      if (hex.length >= 6) {
        return [
          parseInt(hex.slice(0, 2), 16),
          parseInt(hex.slice(2, 4), 16),
          parseInt(hex.slice(4, 6), 16),
        ];
      }
    }

    const rgbaMatch = normalized.match(/^rgba?\(([^)]+)\)$/);
    if (rgbaMatch) {
      const parts = rgbaMatch[1].split(",").map((part) => Number.parseFloat(part.trim()));
      return [parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0];
    }

    return [0, 0, 0];
  }

  function luminance(channel: number) {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  }

  const [fr, fg, fb] = toRgb(foreground);
  const [br, bg, bb] = toRgb(background);
  const light = 0.2126 * luminance(fr) + 0.7152 * luminance(fg) + 0.0722 * luminance(fb);
  const dark = 0.2126 * luminance(br) + 0.7152 * luminance(bg) + 0.0722 * luminance(bb);
  const lighter = Math.max(light, dark);
  const darker = Math.min(light, dark);

  return (lighter + 0.05) / (darker + 0.05);
}

function calculateScanability(
  styleSettings: Required<QrStyleSettings>,
  errorLevel: QrRenderConfig["errorLevel"],
  logoSettings?: QrRenderConfig["logoSettings"] | null,
) {
  if (errorLevel !== "L" && logoSettings?.hideBackgroundDots) {
    const size = logoSettings.size ?? 0;
    const zeroThreshold = 0.7;
    if (size >= zeroThreshold) {
      return 0;
    }
    if (size >= 0.5 && size < zeroThreshold) {
      return 0.1;
    }
  }

  const background = styleSettings.bgColors[0] || "#ffffff";
  const dotColor = averageColors(styleSettings.dotColors) || "#000000";
  const eyeColor = averageColors(styleSettings.eyeColors) || "#000000";
  const innerColor = averageColors(styleSettings.innerEyeColors) || "#000000";
  const raw = Math.min(
    contrastRatio(dotColor, background),
    contrastRatio(eyeColor, background),
    contrastRatio(innerColor, background),
  );

  return Math.max(0, Math.min(1, (raw - 1) / 20));
}

function formatDate(date: Date | string | null): string {
  if (!date) {
    return "Never";
  }

  const value = new Date(date);
  if (Number.isNaN(value.getTime())) {
    return "Never";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3)}...`;
}

function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string): boolean {
  return /^\+?[0-9()\-\s]{7,}$/.test(phone.trim());
}

function normalizeHostname(hostname: string | null | undefined): string {
  if (!hostname) {
    return "";
  }

  const trimmed = hostname.trim().toLowerCase();
  const withoutProtocol = trimmed.replace(/^https?:\/\//, "");
  const withoutPath = withoutProtocol.split("/")[0] || "";
  return withoutPath.replace(/\.$/, "").split(":")[0] || "";
}

function buildPublicQrUrl(code: string, customHostname?: string | null): string {
  const hostname = normalizeHostname(customHostname) || DEFAULT_QR_HOST;
  return `https://${hostname}/${code}`;
}

function getPublicUrl(qr: QR) {
  return qr.publicUrl || buildPublicQrUrl(qr.code, qr.customHostname ?? null);
}

function getQrTypeLabel(type: QRData["type"]) {
  if (type === "url") {
    return "Website";
  }
  if (type === "sms") {
    return "SMS";
  }
  if (type === "wifi") {
    return "WiFi";
  }
  return type.charAt(0).toUpperCase() + type.slice(1);
}

function toOptionalValue(value: string): string | undefined {
  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function toContactFieldsDraft(value?: ContactData): ContactFieldsDraft {
  if (!value || value.source !== "fields") {
    return EMPTY_CONTACT_FIELDS;
  }

  return {
    firstName: value.firstName ?? "",
    lastName: value.lastName ?? "",
    organization: value.organization ?? "",
    title: value.title ?? "",
    phone: value.phone ?? "",
    email: value.email ?? "",
    website: value.website ?? "",
    address: value.address ?? "",
    note: value.note ?? "",
  };
}

function toContactFieldsData(draft: ContactFieldsDraft): ContactData {
  return {
    type: "contact",
    source: "fields",
    firstName: toOptionalValue(draft.firstName),
    lastName: toOptionalValue(draft.lastName),
    organization: toOptionalValue(draft.organization),
    title: toOptionalValue(draft.title),
    phone: toOptionalValue(draft.phone),
    email: toOptionalValue(draft.email),
    website: toOptionalValue(draft.website),
    address: toOptionalValue(draft.address),
    note: toOptionalValue(draft.note),
  };
}

function createEmptyData(type: QRData["type"]): QRData {
  switch (type) {
    case "url":
      return { type: "url", url: "" };
    case "text":
      return { type: "text", text: "" };
    case "email":
      return { type: "email", to: "", subject: "", body: "" };
    case "contact":
      return { type: "contact", source: "fields" };
    case "phone":
      return { type: "phone", number: "" };
    case "sms":
      return { type: "sms", number: "", message: "" };
    case "wifi":
      return { type: "wifi", ssid: "", authenticationType: "WPA", password: "" };
    case "file":
      return { type: "file", key: "" };
  }
}

function mergeQrMeta(previous: QRData | null, next: QRData): QRData {
  return {
    ...next,
    name: next.name ?? previous?.name,
    description: next.description ?? previous?.description,
    errorLevel: next.errorLevel ?? previous?.errorLevel,
    styleSettings: next.styleSettings ?? previous?.styleSettings,
    logoSettings: next.logoSettings ?? previous?.logoSettings,
    borderSettings: next.borderSettings ?? previous?.borderSettings,
  };
}

function getQrConfig(data: QRData | null | undefined): Partial<QrRenderConfig> {
  return {
    errorLevel: data?.errorLevel ?? "M",
    styleSettings: data?.styleSettings ?? undefined,
    logoSettings: data?.logoSettings ?? undefined,
    borderSettings: data?.borderSettings ?? undefined,
  };
}

function mergeRenderConfig(base: QrRenderConfig, override?: Partial<QrRenderConfig> | null): QrRenderConfig {
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

function ensureBorderSettings(data: QRData): QrBorderSettings {
  return {
    shape: data.borderSettings?.shape ?? "square",
    colorType: data.borderSettings?.colorType ?? "solid",
    colors: data.borderSettings?.colors?.length ? data.borderSettings.colors : ["#111827", "#111827"],
    gradientType: data.borderSettings?.gradientType ?? "linear",
    rotation: data.borderSettings?.rotation ?? 0,
    preset: data.borderSettings?.preset ?? "default",
    text: data.borderSettings?.text ?? "",
    textStyle: data.borderSettings?.textStyle,
  };
}

function setStyleColor(data: QRData, key: "dotColors" | "eyeColors" | "bgColors", color: string): QRData {
  const nextStyle = {
    ...(data.styleSettings ?? {}),
    [key]: [color, color],
  };
  if (key === "dotColors") {
    nextStyle.dotColorType = "solid";
  }
  if (key === "eyeColors") {
    nextStyle.eyeColorType = "solid";
  }
  if (key === "bgColors") {
    nextStyle.bgColorType = "solid";
  }
  return {
    ...data,
    styleSettings: nextStyle,
  };
}

function serializeSvg(svg: SVGElement) {
  if (!svg.getAttribute("xmlns")) {
    svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  }
  return new XMLSerializer().serializeToString(svg);
}

async function downloadSvgFromPreview(container: HTMLElement, filename: string) {
  const svg = container.querySelector("svg");
  if (!svg) {
    throw new Error("Preview is not ready yet.");
  }

  const svgSource = serializeSvg(svg);
  const blob = new Blob([svgSource], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

async function downloadPngFromPreview(container: HTMLElement, filename: string) {
  const svg = container.querySelector("svg");
  if (!svg) {
    throw new Error("Preview is not ready yet.");
  }

  const svgSource = serializeSvg(svg);
  const svgBlob = new Blob([svgSource], { type: "image/svg+xml;charset=utf-8" });
  const objectUrl = URL.createObjectURL(svgBlob);

  await new Promise<void>((resolve, reject) => {
    const image = new window.Image();

    image.onload = () => {
      const width = svg.viewBox.baseVal.width || Number(svg.getAttribute("width")) || 512;
      const height = svg.viewBox.baseVal.height || Number(svg.getAttribute("height")) || 512;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Canvas is not available."));
        return;
      }

      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(objectUrl);
        if (!blob) {
          reject(new Error("Failed to export PNG."));
          return;
        }

        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
        resolve();
      }, "image/png");
    };

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Failed to export PNG."));
    };

    image.src = objectUrl;
  });
}

function Surface({
  className,
  children,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cx("rounded-3xl border border-slate-200/80 bg-white/95 shadow-sm", className)}>
      {children}
    </div>
  );
}

function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "icon";
}) {
  return (
    <button
      {...props}
      className={cx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-not-allowed disabled:opacity-60",
        size === "sm" && "h-9 px-3 text-sm",
        size === "md" && "h-10 px-4 text-sm",
        size === "icon" && "h-10 w-10",
        variant === "primary" && "bg-slate-900 text-white hover:bg-slate-800",
        variant === "secondary" && "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
        variant === "ghost" && "text-slate-600 hover:bg-slate-100",
        variant === "destructive" && "bg-red-600 text-white hover:bg-red-500",
        className,
      )}
    />
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cx(
        "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-300",
        props.className,
      )}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cx(
        "min-h-[96px] w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-slate-300",
        props.className,
      )}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cx(
        "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-300",
        props.className,
      )}
    />
  );
}

function Field({
  label,
  htmlFor,
  children,
}: React.PropsWithChildren<{ label: string; htmlFor?: string }>) {
  return (
    <label className="space-y-1.5" htmlFor={htmlFor}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </label>
  );
}

function MetricCard({ title, value, detail }: { title: string; value: string | number; detail: string }) {
  return (
    <Surface className="p-5">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{value}</div>
      <div className="mt-2 text-sm text-slate-500">{detail}</div>
    </Surface>
  );
}

function OverlayDialog({
  open,
  title,
  description,
  size = "md",
  onClose,
  footer,
  children,
}: React.PropsWithChildren<{
  open: boolean;
  title: string;
  description?: string;
  size?: "md" | "xl";
  onClose: () => void;
  footer?: React.ReactNode;
}>) {
  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm"
      style={{ zIndex: OVERLAY_Z_INDEX }}
      onClick={onClose}
    >
      <div
        className={cx(
          "max-h-[92vh] w-full overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50 shadow-2xl",
          size === "md" ? "max-w-2xl" : "max-w-6xl",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 bg-white px-6 py-5">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
            {description ? <p className="text-sm text-slate-500">{description}</p> : null}
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close dialog">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="max-h-[calc(92vh-150px)] overflow-y-auto px-6 py-5">{children}</div>
        {footer ? <div className="border-t border-slate-200 bg-white px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

function RenderedQRCode({
  data,
  config,
  className,
  onScanabilityChange,
}: {
  data: string;
  config?: Partial<QrRenderConfig>;
  className?: string;
  onScanabilityChange?: (scanability: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mergedConfig = useMemo<QrRenderConfig>(
    () => ({
      errorLevel: config?.errorLevel ?? "M",
      width: config?.width ?? 256,
      height: config?.height ?? 256,
      margin: config?.margin ?? 4,
      styleSettings: {
        ...DEFAULT_STYLE_SETTINGS,
        ...(config?.styleSettings ?? {}),
      },
      logoSettings: config?.logoSettings ?? null,
      borderSettings: config?.borderSettings ?? null,
    }),
    [config],
  );

  useEffect(() => {
    if (!containerRef.current || !data) {
      return;
    }

    const container = containerRef.current;
    container.innerHTML = "";
    const instance = new QRCodeStyling(buildOptions(data, mergedConfig));
    instance.append(container);

    onScanabilityChange?.(
      calculateScanability(
        mergedConfig.styleSettings as Required<QrStyleSettings>,
        mergedConfig.errorLevel,
        mergedConfig.logoSettings,
      ),
    );

    const borderSettings = mergedConfig.borderSettings;
    if (!borderSettings) {
      return;
    }

    void instance.getRawData("svg").then(async (raw) => {
      const text = typeof raw === "string" ? raw : raw instanceof Blob ? await raw.text() : String(raw ?? "");
      const doc = new DOMParser().parseFromString(text, "image/svg+xml");
      const svg = doc.querySelector("svg");
      if (!svg) {
        return;
      }

      applyBorderFrame(svg, mergedConfig.width ?? 256, mergedConfig.height ?? 256, borderSettings);
      container.innerHTML = "";
      container.appendChild(svg);
    });
  }, [data, mergedConfig, onScanabilityChange]);

  return <div ref={containerRef} className={className} />;
}

function DashboardImageSquare({
  qr,
  className,
  editable = false,
  onUploaded,
  onError,
}: {
  qr: Pick<QR, "id" | "code" | "data" | "imageUrl">;
  className?: string;
  editable?: boolean;
  onUploaded?: (qr: QR) => void;
  onError?: (error: Error) => void;
}) {
  const client = useTqrcoClient();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  useEffect(() => {
    let revokedUrl: string | null = null;
    let cancelled = false;

    if (!qr.imageUrl) {
      setImageSrc(null);
      return;
    }

    const controller = new AbortController();
    const endpoint = `${client.baseUrl}/api/v1/qr-codes/${qr.id}/image`;

    void fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${client.token}`,
      },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load image (${response.status})`);
        }
        return response.blob();
      })
      .then((blob) => {
        if (cancelled) {
          return;
        }
        revokedUrl = URL.createObjectURL(blob);
        setImageSrc(revokedUrl);
      })
      .catch((error) => {
        if (controller.signal.aborted || cancelled) {
          return;
        }
        const errorValue = error instanceof Error ? error : new Error("Failed to load image.");
        onError?.(errorValue);
        setImageSrc(null);
      });

    return () => {
      cancelled = true;
      controller.abort();
      if (revokedUrl) {
        URL.revokeObjectURL(revokedUrl);
      }
    };
  }, [client.baseUrl, client.token, onError, qr.id, qr.imageUrl]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      onError?.(new Error("Please choose an image file."));
      return;
    }

    try {
      setIsUploading(true);
      const updatedQr = await client.qr.uploadImage(qr.id, file);
      onUploaded?.(updatedQr);
    } catch (error) {
      const errorValue = error instanceof Error ? error : new Error("Failed to upload image.");
      onError?.(errorValue);
    } finally {
      setIsUploading(false);
    }
  }

  const label = qr.data.name?.trim() || qr.code;

  if (!editable) {
    return (
      <div
        className={cx(
          "relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100/70 shadow-sm",
          className,
        )}
      >
        {imageSrc ? (
          <img src={imageSrc} alt={`${label} image`} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.08),transparent_58%),linear-gradient(180deg,rgba(248,250,252,0.96),rgba(226,232,240,0.92))] text-slate-500">
            <QrCodeIcon className="h-5 w-5" />
          </div>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      className={cx(
        "group relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-100/70 shadow-sm transition hover:border-slate-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 disabled:cursor-progress",
        className,
      )}
      onClick={() => inputRef.current?.click()}
      disabled={isUploading}
      aria-label={qr.imageUrl ? `Update image for ${label}` : `Upload image for ${label}`}
    >
      {imageSrc ? (
        <img src={imageSrc} alt={`${label} image`} className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.08),transparent_58%),linear-gradient(180deg,rgba(248,250,252,0.96),rgba(226,232,240,0.92))] text-slate-500">
          <QrCodeIcon className="h-5 w-5" />
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/45 text-white opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
        {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
    </button>
  );
}

function QRDataFields({
  data,
  onChange,
}: {
  data: QRData | null;
  onChange: (data: QRData) => void;
}) {
  const [contactMode, setContactMode] = useState<ContactData["source"]>(data?.type === "contact" ? data.source : "fields");
  const [contactFields, setContactFields] = useState<ContactFieldsDraft>(
    data?.type === "contact" ? toContactFieldsDraft(data) : EMPTY_CONTACT_FIELDS,
  );
  const [vcardValue, setVcardValue] = useState(data?.type === "contact" && data.source === "vcard" ? data.vcard : "");

  useEffect(() => {
    if (data?.type !== "contact") {
      setContactMode("fields");
      setContactFields(EMPTY_CONTACT_FIELDS);
      setVcardValue("");
      return;
    }

    setContactMode(data.source);
    setContactFields(toContactFieldsDraft(data));
    setVcardValue(data.source === "vcard" ? data.vcard : "");
  }, [data]);

  if (!data) {
    return null;
  }

  if (data.type === "url") {
    return (
      <Field label="Website URL" htmlFor="qr-url">
        <Input
          id="qr-url"
          type="url"
          placeholder="https://example.com"
          value={data.url}
          onChange={(event) => onChange({ ...data, url: event.target.value })}
        />
      </Field>
    );
  }

  if (data.type === "text") {
    return (
      <Field label="Text" htmlFor="qr-text">
        <Textarea
          id="qr-text"
          placeholder="Your text here"
          value={data.text}
          onChange={(event) => onChange({ ...data, text: event.target.value })}
          rows={4}
        />
      </Field>
    );
  }

  if (data.type === "email") {
    return (
      <div className="grid gap-4">
        <Field label="Recipient Email" htmlFor="qr-email">
          <Input
            id="qr-email"
            type="email"
            placeholder="you@example.com"
            value={data.to}
            onChange={(event) => onChange({ ...data, to: event.target.value })}
          />
        </Field>
        <Field label="Subject" htmlFor="qr-subject">
          <Input
            id="qr-subject"
            type="text"
            placeholder="Email subject"
            value={data.subject}
            onChange={(event) => onChange({ ...data, subject: event.target.value })}
          />
        </Field>
        <Field label="Body" htmlFor="qr-body">
          <Textarea
            id="qr-body"
            placeholder="Email body"
            rows={4}
            value={data.body}
            onChange={(event) => onChange({ ...data, body: event.target.value })}
          />
        </Field>
      </div>
    );
  }

  if (data.type === "contact") {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-medium text-slate-700">Contact Source</div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant={contactMode === "fields" ? "primary" : "secondary"}
              size="sm"
              onClick={() => {
                setContactMode("fields");
                onChange({ ...toContactFieldsData(contactFields), name: data.name, description: data.description });
              }}
            >
              Enter details
            </Button>
            <Button
              type="button"
              variant={contactMode === "vcard" ? "primary" : "secondary"}
              size="sm"
              onClick={() => {
                setContactMode("vcard");
                onChange({
                  type: "contact",
                  source: "vcard",
                  vcard: vcardValue,
                  name: data.name,
                  description: data.description,
                });
              }}
            >
              Paste .vcf
            </Button>
          </div>
        </div>

        {contactMode === "fields" ? (
          <div className="grid gap-4 md:grid-cols-2">
            {([
              ["First name", "firstName"],
              ["Last name", "lastName"],
              ["Company", "organization"],
              ["Job title", "title"],
              ["Phone number", "phone"],
              ["Email", "email"],
              ["Website", "website"],
            ] as const).map(([label, key]) => (
              <Field key={key} label={label} htmlFor={`contact-${key}`}>
                <Input
                  id={`contact-${key}`}
                  value={contactFields[key]}
                  onChange={(event) => {
                    const next = { ...contactFields, [key]: event.target.value };
                    setContactFields(next);
                    onChange({ ...toContactFieldsData(next), name: data.name, description: data.description });
                  }}
                />
              </Field>
            ))}
            <div className="md:col-span-2">
              <Field label="Address" htmlFor="contact-address">
                <Textarea
                  id="contact-address"
                  value={contactFields.address}
                  onChange={(event) => {
                    const next = { ...contactFields, address: event.target.value };
                    setContactFields(next);
                    onChange({ ...toContactFieldsData(next), name: data.name, description: data.description });
                  }}
                />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Note" htmlFor="contact-note">
                <Textarea
                  id="contact-note"
                  value={contactFields.note}
                  onChange={(event) => {
                    const next = { ...contactFields, note: event.target.value };
                    setContactFields(next);
                    onChange({ ...toContactFieldsData(next), name: data.name, description: data.description });
                  }}
                />
              </Field>
            </div>
          </div>
        ) : (
          <Field label="VCARD payload" htmlFor="contact-vcard">
            <Textarea
              id="contact-vcard"
              rows={10}
              placeholder="BEGIN:VCARD..."
              value={vcardValue}
              onChange={(event) => {
                setVcardValue(event.target.value);
                onChange({
                  type: "contact",
                  source: "vcard",
                  vcard: event.target.value,
                  name: data.name,
                  description: data.description,
                });
              }}
            />
          </Field>
        )}
      </div>
    );
  }

  if (data.type === "phone") {
    return (
      <Field label="Phone Number" htmlFor="phone-input">
        <Input
          id="phone-input"
          placeholder="Enter a phone number"
          value={data.number}
          onChange={(event) => onChange({ ...data, number: event.target.value })}
        />
      </Field>
    );
  }

  if (data.type === "sms") {
    return (
      <div className="grid gap-4">
        <Field label="Phone Number" htmlFor="sms-phone-input">
          <Input
            id="sms-phone-input"
            placeholder="Enter a phone number"
            value={data.number}
            onChange={(event) => onChange({ ...data, number: event.target.value })}
          />
        </Field>
        <Field label="Message" htmlFor="sms-text">
          <Input
            id="sms-text"
            placeholder="Your text here"
            value={data.message}
            onChange={(event) => onChange({ ...data, message: event.target.value })}
          />
        </Field>
      </div>
    );
  }

  if (data.type === "wifi") {
    return (
      <div className="grid gap-4">
        <Field label="SSID" htmlFor="wifi-ssid">
          <Input
            id="wifi-ssid"
            type="text"
            placeholder="Network name"
            value={data.ssid}
            onChange={(event) => onChange({ ...data, ssid: event.target.value })}
          />
        </Field>
        <Field label="Encryption" htmlFor="wifi-encryption">
          <Select
            id="wifi-encryption"
            value={data.authenticationType}
            onChange={(event) => onChange({ ...data, authenticationType: event.target.value })}
          >
            <option value="WPA">WPA/WPA2</option>
            <option value="WEP">WEP</option>
            <option value="nopass">None</option>
          </Select>
        </Field>
        {data.authenticationType !== "nopass" ? (
          <Field label="Password" htmlFor="wifi-password">
            <Input
              id="wifi-password"
              type="password"
              placeholder="Network password"
              value={data.password ?? ""}
              onChange={(event) => onChange({ ...data, password: event.target.value })}
            />
          </Field>
        ) : null}
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            id="wifi-hidden"
            type="checkbox"
            checked={Boolean(data.hidden)}
            onChange={(event) => onChange({ ...data, hidden: event.target.checked })}
          />
          Hidden network
        </label>
      </div>
    );
  }

  return (
    <Field label="File" htmlFor="file-key">
      <Input
        id="file-key"
        placeholder="uploads/menu.pdf"
        value={data.key}
        onChange={(event) => onChange({ ...data, key: event.target.value })}
      />
    </Field>
  );
}

function sanitizeLogoSettings(logo?: {
  src?: string;
  size: number;
  margin?: number;
  hideBackgroundDots?: boolean;
}): QrRenderConfig["logoSettings"] | null {
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

export interface QrDesignEditorProps {
  qrId?: string;
  qrCode: string;
  data: QRData;
  onChange: (data: QRData) => void;
  previewUrl: string;
  brand: BrandProfile | null;
  presets: StylePreset[];
  stylesLoading: boolean;
  stylesHref?: string;
  onSuccess?: (message: string) => void;
  onError?: (error: Error) => void;
}

export function QrDesignEditor({
  qrId,
  qrCode,
  data,
  onChange,
  previewUrl,
  brand,
  presets,
  stylesLoading,
  stylesHref = "https://theqrcode.co/dashboard/styles",
  onSuccess,
  onError,
}: QrDesignEditorProps) {
  const [designTab, setDesignTab] = useState<"style" | "border" | "logo" | "error-level">("style");
  const [lastAppliedStyleId, setLastAppliedStyleId] = useState<string | null>(null);
  const [scanability, setScanability] = useState(0);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDesignTab("style");
    setLastAppliedStyleId(null);
  }, [qrCode, qrId]);

  const resolvedConfig = useMemo(() => {
    const brandConfig = brand?.defaultConfig;
    const typeConfig = brand?.typeDefaults?.[data.type];

    if (!brandConfig) {
      return {
        errorLevel: data.errorLevel ?? "M",
        styleSettings: data.styleSettings ?? undefined,
        logoSettings: data.logoSettings ?? undefined,
        borderSettings: data.borderSettings ?? undefined,
      };
    }

    return mergeRenderConfig(mergeRenderConfig(brandConfig, typeConfig), {
      errorLevel: data.errorLevel ?? brandConfig.errorLevel,
      styleSettings: data.styleSettings,
      logoSettings: data.logoSettings,
      borderSettings: data.borderSettings,
    });
  }, [brand, data]);

  const effectiveErrorLevel = resolvedConfig.errorLevel ?? "M";
  const effectiveStyleSettings = useMemo<StyleSettingsProps["settings"]>(
    () => ({
      ...DEFAULT_STYLE_SETTINGS,
      ...(resolvedConfig.styleSettings ?? {}),
    }),
    [resolvedConfig.styleSettings],
  );
  const effectiveBorderSettings = useMemo<BorderSettingsProps["settings"]>(
    () => ({
      shape: "square" as const,
      colorType: "solid" as const,
      colors: ["#ffffff", "#ffffff"],
      gradientType: "linear" as const,
      rotation: 0,
      text: "",
      textStyle: undefined,
      preset: "default",
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

  async function handleDownload(format: "svg" | "png") {
    if (!previewRef.current) {
      return;
    }

    try {
      if (format === "svg") {
        await downloadSvgFromPreview(previewRef.current, `${qrCode}.svg`);
      } else {
        await downloadPngFromPreview(previewRef.current, `${qrCode}.png`);
      }
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(`Failed to download ${format.toUpperCase()}.`));
    }
  }

  function applyStyleLibraryItem(item: { id: string; name: string; config: Partial<QrRenderConfig> | null }) {
    onChange(applyRenderConfigToData(data, item.config));
    setLastAppliedStyleId(item.id);
    onSuccess?.(`Applied ${item.name}`);
  }

  return (
    <div className="max-h-[92vh] overflow-y-auto rounded-[28px] border bg-card p-3 shadow-xl sm:p-4">
      <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 max-w-full space-y-3">
          <section className="rounded-[22px] border bg-background p-4 sm:p-5">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-1">
                <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Style Library</div>
                <h3 className="text-lg font-semibold">Apply a saved theme</h3>
                <p className="text-sm text-muted-foreground">
                  Use your brand default or any preset from{" "}
                  <a href={stylesHref} target="_blank" rel="noreferrer" className="underline underline-offset-4">
                    the styles library
                  </a>
                  .
                </p>
              </div>

              <DesignButton asChild variant="outline" size="sm">
                <a href={stylesHref} target="_blank" rel="noreferrer">
                  Manage styles
                </a>
              </DesignButton>
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
                    className={cx(
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
            <Tabs value={designTab} onValueChange={(next) => setDesignTab(next as "style" | "border" | "logo" | "error-level")} className="min-h-0">
              <div className="overflow-x-auto">
                <TabsList className="grid h-auto w-full grid-cols-2 gap-2 rounded-2xl bg-transparent p-0 xl:grid-cols-4">
                  {[
                    { value: "style" as const, label: "Style", icon: Brush },
                    { value: "border" as const, label: "Frame", icon: Frame },
                    { value: "logo" as const, label: "Logo", icon: ImageIcon },
                    { value: "error-level" as const, label: "Error", icon: ShieldAlert },
                  ].map((tab) => {
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
                      ...data,
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
                      ...data,
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
                      ...data,
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
                      ...data,
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
          <DesignCard className="rounded-[22px] border bg-muted/35 p-3">
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
                  <DesignButton variant="outline" size="icon" className="size-8 rounded-lg">
                    <Download className="size-4" />
                  </DesignButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => void handleDownload("svg")}>Download SVG</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => void handleDownload("png")}>Download PNG</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="relative flex min-h-[280px] items-center justify-center rounded-[20px] border bg-background p-4">
              <div ref={previewRef} className="flex h-full w-full items-center justify-center">
                <RenderedQRCode
                  data={previewUrl}
                  config={{
                    errorLevel: effectiveErrorLevel,
                    styleSettings: effectiveStyleSettings,
                    borderSettings: previewBorderSettings,
                    logoSettings: effectiveLogoSettings,
                  }}
                  className="flex h-full w-full items-center justify-center"
                  onScanabilityChange={setScanability}
                />
              </div>
            </div>

            <div className="mt-3 space-y-3">
              <div className="rounded-xl border bg-background px-3 py-2">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Public URL</p>
                <p className="mt-1 break-all font-mono text-xs text-foreground">{previewUrl}</p>
              </div>
              <div className="rounded-xl border bg-background px-3 py-2">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Destination</p>
                <p className="mt-1 break-all text-sm text-muted-foreground">{serializeQrData(data)}</p>
              </div>
            </div>
          </DesignCard>
        </aside>
      </div>
    </div>
  );
}

export interface QRCodesManagerProps {
  className?: string;
  onSuccess?: (message: string) => void;
  onError?: (error: Error) => void;
}

export function QRCodesManager({ className, onSuccess, onError }: QRCodesManagerProps) {
  const qrCodes = useQRCodes();
  const analytics = useAnalyticsSummary();
  const domains = useDomains();
  const brand = useBrand();
  const stylePresets = useStylePresets();
  const createQRCode = useCreateQRCode();
  const updateQRCode = useUpdateQRCode();
  const deleteQRCode = useDeleteQRCode();

  const [notice, setNotice] = useState<{ kind: "success" | "error"; message: string } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [designOpen, setDesignOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newCustomDomainId, setNewCustomDomainId] = useState<string | null>(null);
  const [activeQr, setActiveQr] = useState<QR | null>(null);
  const [designData, setDesignData] = useState<QRData | null>(null);
  const [editData, setEditData] = useState<QRData | null>(null);
  const [editCustomDomainId, setEditCustomDomainId] = useState<string | null>(null);
  const viewPreviewRef = useRef<HTMLDivElement>(null);

  const readyDomains = useMemo(() => (domains.data ?? []).filter((domain) => domain.status === "ready"), [domains.data]);

  const requestError = qrCodes.error ?? analytics.error ?? domains.error ?? brand.error ?? stylePresets.error ?? null;

  function pushSuccess(message: string) {
    setNotice({ kind: "success", message });
    onSuccess?.(message);
  }

  function pushError(error: unknown, fallback: string) {
    const errorValue = error instanceof Error ? error : new Error(fallback);
    setNotice({ kind: "error", message: errorValue.message });
    onError?.(errorValue);
  }

  async function refreshAll() {
    await Promise.all([qrCodes.reload(), analytics.reload(), domains.reload()]);
  }

  function resetSelection() {
    setActiveQr(null);
    setDesignData(null);
    setEditData(null);
    setEditCustomDomainId(null);
  }

  function openView(qr: QR) {
    setActiveQr(qr);
    setViewOpen(true);
    setDesignOpen(false);
    setEditOpen(false);
    setDeleteOpen(false);
  }

  function openDesign(qr: QR) {
    setActiveQr(qr);
    setDesignData(qr.data);
    setDesignOpen(true);
    setViewOpen(false);
    setEditOpen(false);
    setDeleteOpen(false);
  }

  function openEdit(qr: QR) {
    setActiveQr(qr);
    setEditData(qr.data);
    setEditCustomDomainId(qr.customDomainId ?? null);
    setEditOpen(true);
    setViewOpen(false);
    setDesignOpen(false);
    setDeleteOpen(false);
  }

  function openDelete(qr: QR) {
    setActiveQr(qr);
    setDeleteOpen(true);
    setViewOpen(false);
    setDesignOpen(false);
    setEditOpen(false);
  }

  async function handleCreate() {
    if (!newUrl.trim()) {
      pushError(new Error("URL is required."), "URL is required.");
      return;
    }
    if (!isValidURL(newUrl)) {
      pushError(new Error("Please enter a valid URL."), "Please enter a valid URL.");
      return;
    }

    try {
      await createQRCode.mutate({
        data: { type: "url", url: newUrl.trim() },
        customDomainId: newCustomDomainId,
      });
      setNewUrl("");
      setNewCustomDomainId(null);
      setCreateOpen(false);
      pushSuccess("QR code created successfully.");
      await refreshAll();
    } catch (error) {
      pushError(error, "Failed to create QR code.");
    }
  }

  function validateData(data: QRData) {
    switch (data.type) {
      case "url":
        if (!data.url || !isValidURL(data.url)) {
          throw new Error("Please enter a valid URL.");
        }
        return;
      case "text":
        if (!data.text) {
          throw new Error("Text content cannot be empty.");
        }
        return;
      case "email":
        if (!data.to || !data.subject || !data.body || !isValidEmail(data.to)) {
          throw new Error("Please fill out a valid email, subject, and body.");
        }
        return;
      case "contact":
        if (
          data.source === "fields" &&
          !data.firstName &&
          !data.lastName &&
          !data.organization &&
          !data.phone &&
          !data.email &&
          !data.website &&
          !data.address &&
          !data.note
        ) {
          throw new Error("Please enter at least one contact field.");
        }
        if (data.source === "vcard" && !data.vcard.trim()) {
          throw new Error("Please paste a valid VCARD payload.");
        }
        return;
      case "phone":
        if (!data.number || !isValidPhone(data.number)) {
          throw new Error("Please enter a valid phone number.");
        }
        return;
      case "sms":
        if (!data.number || !data.message || !isValidPhone(data.number)) {
          throw new Error("Please enter a valid number and non-empty message.");
        }
        return;
      case "wifi":
        if (!data.ssid) {
          throw new Error("SSID cannot be empty.");
        }
        return;
      case "file":
        if (!data.key) {
          throw new Error("File key cannot be empty.");
        }
        return;
    }
  }

  async function handleSaveDesign() {
    if (!activeQr || !designData) {
      return;
    }

    try {
      await updateQRCode.mutate(activeQr.id, {
        data: designData,
        customDomainId: activeQr.customDomainId ?? null,
      });
      setDesignOpen(false);
      resetSelection();
      pushSuccess("QR design saved successfully.");
      await refreshAll();
    } catch (error) {
      pushError(error, "Failed to save QR design.");
    }
  }

  async function handleUpdate() {
    if (!activeQr || !editData) {
      return;
    }

    try {
      validateData(editData);
      await updateQRCode.mutate(activeQr.id, {
        data: editData,
        customDomainId: editCustomDomainId,
      });
      setEditOpen(false);
      resetSelection();
      pushSuccess("QR code updated successfully.");
      await refreshAll();
    } catch (error) {
      pushError(error, "Failed to update QR code.");
    }
  }

  async function handleDelete() {
    if (!activeQr) {
      return;
    }

    try {
      await deleteQRCode.mutate(activeQr.id);
      setDeleteOpen(false);
      resetSelection();
      pushSuccess("QR code deleted successfully.");
      await refreshAll();
    } catch (error) {
      pushError(error, "Failed to delete QR code.");
    }
  }

  async function handleDownload(format: "svg" | "png") {
    if (!activeQr || !viewPreviewRef.current) {
      return;
    }

    try {
      if (format === "svg") {
        await downloadSvgFromPreview(viewPreviewRef.current, `${activeQr.code}.svg`);
      } else {
        await downloadPngFromPreview(viewPreviewRef.current, `${activeQr.code}.png`);
      }
    } catch (error) {
      pushError(error, `Failed to download ${format.toUpperCase()}.`);
    }
  }

  function handleImageUploaded(updatedQr: QR) {
    if (activeQr?.id === updatedQr.id) {
      setActiveQr(updatedQr);
    }
    void qrCodes.reload();
    pushSuccess("QR image updated successfully.");
  }

  const currentPublicUrl =
    activeQr && editOpen
      ? buildPublicQrUrl(activeQr.code, readyDomains.find((domain) => domain.id === editCustomDomainId)?.hostname ?? activeQr.customHostname ?? null)
      : activeQr
        ? getPublicUrl(activeQr)
        : "";

  return (
    <div className={cx("space-y-6", className)}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="QR Codes"
          value={qrCodes.data?.length ?? 0}
          detail="Saved QR codes visible to this token."
        />
        <MetricCard
          title="Scans Last 7 Days"
          value={analytics.data?.metrics.totalScansLast7Days ?? 0}
          detail="Summary analytics returned by the tqrco API."
        />
        <MetricCard
          title="Top Location"
          value={analytics.data?.metrics.topLocation?.location ?? "None"}
          detail={analytics.data?.metrics.topLocation ? `${analytics.data.metrics.topLocation.count} scans` : "No location data yet."}
        />
        <MetricCard
          title="Most Active QR"
          value={analytics.data?.metrics.mostActiveQR?.code ?? "None"}
          detail={analytics.data?.metrics.mostActiveQR ? `${analytics.data.metrics.mostActiveQR.scans} total scans` : "No scan activity yet."}
        />
      </div>

      {notice ? (
        <Surface
          className={cx(
            "px-5 py-4",
            notice.kind === "error" ? "border-red-200 bg-red-50/70" : "border-emerald-200 bg-emerald-50/70",
          )}
        >
          <div className={cx("text-sm", notice.kind === "error" ? "text-red-700" : "text-emerald-700")}>{notice.message}</div>
        </Surface>
      ) : null}

      {requestError ? (
        <Surface className="border-red-200 bg-red-50/70 p-5">
          <div className="text-base font-semibold text-slate-900">tqrco request failed</div>
          <div className="mt-1 text-sm text-slate-500">
            This usually means the token is missing a required scope or the current origin is not allowlisted.
          </div>
          <div className="mt-3 text-sm text-red-700">{requestError.message}</div>
        </Surface>
      ) : null}

      <Surface className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-200 bg-white px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xl font-semibold text-slate-900">QR Codes</div>
            <div className="mt-1 text-sm text-slate-500">Manage QR view, design, and editing flows from the SDK.</div>
          </div>
          <Button
            size="sm"
            onClick={() => {
              resetSelection();
              setCreateOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Quick Create
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-left text-xs uppercase tracking-[0.14em] text-slate-500">
                <th className="px-6 py-3 font-medium">Image</th>
                <th className="px-6 py-3 font-medium">Code</th>
                <th className="px-6 py-3 font-medium">Public URL</th>
                <th className="px-6 py-3 font-medium">Type</th>
                <th className="px-6 py-3 font-medium">Total Scans</th>
                <th className="px-6 py-3 font-medium">Last Scanned</th>
                <th className="px-6 py-3 font-medium">Created</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(qrCodes.data?.length ?? 0) === 0 ? (
                <tr>
                  <td className="px-6 py-12 text-center text-sm text-slate-500" colSpan={8}>
                    {qrCodes.isLoading ? "Loading QR codes..." : "No QR codes found."}
                  </td>
                </tr>
              ) : (
                qrCodes.data?.map((qr) => (
                  <tr key={qr.id} className="border-b border-slate-100 align-middle">
                    <td className="px-6 py-4">
                      <DashboardImageSquare
                        qr={qr}
                        editable
                        className="h-12 w-12"
                        onUploaded={handleImageUploaded}
                        onError={(error) => pushError(error, "Failed to upload image.")}
                      />
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">{qr.data?.name ? qr.data.name : qr.code}</td>
                    <td className="max-w-[280px] px-6 py-4 font-mono text-xs text-slate-500">{truncateText(getPublicUrl(qr), 42)}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{getQrTypeLabel(qr.data.type)}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{qr.totalScans}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{formatDate(qr.lastScanned)}</td>
                    <td className="px-6 py-4 text-sm text-slate-700">{formatDate(qr.createdAt)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openView(qr)} aria-label="View QR code">
                          <QrCodeIcon className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDesign(qr)} aria-label="Design QR code">
                          <PaintbrushVertical className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(qr)} aria-label="Edit QR code">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openDelete(qr)} aria-label="Delete QR code">
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Surface>

      <OverlayDialog
        open={createOpen}
        title="Create QR Code"
        description="Enter the URL for your new QR code."
        onClose={() => {
          setCreateOpen(false);
          setNewUrl("");
          setNewCustomDomainId(null);
        }}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createQRCode.isLoading}>
              {createQRCode.isLoading ? "Creating..." : "Create"}
            </Button>
          </div>
        }
      >
        <div className="grid gap-4 py-1">
          <Field label="URL" htmlFor="create-url">
            <Input
              id="create-url"
              type="url"
              placeholder="https://example.com"
              value={newUrl}
              onChange={(event) => setNewUrl(event.target.value)}
            />
          </Field>
          <Field label="Custom domain" htmlFor="create-domain">
            <Select
              id="create-domain"
              value={newCustomDomainId ?? "default"}
              onChange={(event) => setNewCustomDomainId(event.target.value === "default" ? null : event.target.value)}
              disabled={domains.isLoading}
            >
              <option value="default">Use default domain</option>
              {readyDomains.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.hostname}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </OverlayDialog>

      <OverlayDialog
        open={viewOpen && !!activeQr}
        title="View QR Code"
        description={activeQr ? getPublicUrl(activeQr) : ""}
        onClose={() => {
          setViewOpen(false);
          resetSelection();
        }}
        footer={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="secondary" onClick={() => void handleDownload("svg")}>
              <Download className="h-4 w-4" />
              Download SVG
            </Button>
            <Button variant="secondary" onClick={() => void handleDownload("png")}>
              <Download className="h-4 w-4" />
              Download PNG
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (!activeQr) {
                  return;
                }
                setViewOpen(false);
                openDesign(activeQr);
              }}
            >
              Edit design
            </Button>
            <Button onClick={() => setViewOpen(false)}>Done</Button>
          </div>
        }
      >
        {activeQr ? (
          <div className="flex flex-col items-center gap-4">
            <div ref={viewPreviewRef} className="flex w-full items-center justify-center rounded-[24px] border border-slate-200 bg-white p-6">
              <RenderedQRCode
                data={getPublicUrl(activeQr)}
                config={getQrConfig(activeQr.data)}
                className="flex h-full w-full items-center justify-center"
              />
            </div>
            <span className="text-sm text-slate-500">{getQrTypeLabel(activeQr.data.type)}</span>
          </div>
        ) : null}
      </OverlayDialog>

      <OverlayDialog
        open={designOpen && !!activeQr && !!designData}
        title="Design QR Code"
        description="Customize this QR, preview it live, and save the updated design."
        size="xl"
        onClose={() => {
          setDesignOpen(false);
          resetSelection();
        }}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDesignOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSaveDesign()} disabled={updateQRCode.isLoading}>
              {updateQRCode.isLoading ? "Saving..." : "Save design"}
            </Button>
          </div>
        }
      >
        {activeQr && designData ? (
          <QrDesignEditor
            qrId={activeQr.id}
            qrCode={activeQr.code}
            data={designData}
            onChange={setDesignData}
            previewUrl={getPublicUrl(activeQr)}
            brand={brand.data}
            presets={stylePresets.data ?? []}
            stylesLoading={brand.isLoading || stylePresets.isLoading}
            onSuccess={pushSuccess}
            onError={(error) => pushError(error, "Failed to update design preview.")}
          />
        ) : null}
      </OverlayDialog>

      <OverlayDialog
        open={editOpen && !!activeQr && !!editData}
        title="Edit QR Code"
        description={activeQr ? `Update the data for QR code: ${activeQr.code}` : undefined}
        onClose={() => {
          setEditOpen(false);
          resetSelection();
        }}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleUpdate()} disabled={updateQRCode.isLoading}>
              {updateQRCode.isLoading ? "Updating..." : "Update"}
            </Button>
          </div>
        }
      >
        {activeQr && editData ? (
          <div className="space-y-4">
            <Field label="Public URL" htmlFor="qr-public-url">
              <Input id="qr-public-url" readOnly value={currentPublicUrl} />
            </Field>
            <Field label="Public domain" htmlFor="edit-domain">
              <Select
                id="edit-domain"
                value={editCustomDomainId ?? "default"}
                onChange={(event) => setEditCustomDomainId(event.target.value === "default" ? null : event.target.value)}
                disabled={domains.isLoading}
              >
                <option value="default">Use default domain</option>
                {readyDomains.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.hostname}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Name" htmlFor="qr-name">
              <Input
                id="qr-name"
                value={editData.name ?? ""}
                onChange={(event) => setEditData((prev) => (prev ? { ...prev, name: event.target.value } : prev))}
              />
            </Field>
            <Field label="Description" htmlFor="qr-description">
              <Textarea
                id="qr-description"
                value={editData.description ?? ""}
                onChange={(event) => setEditData((prev) => (prev ? { ...prev, description: event.target.value } : prev))}
              />
            </Field>
            <Field label="Content type" htmlFor="qr-content-type">
              <Select
                id="qr-content-type"
                value={editData.type}
                onChange={(event) => setEditData((prev) => mergeQrMeta(prev, createEmptyData(event.target.value as QRData["type"])))}
              >
                <option value="url">Website</option>
                <option value="text">Text</option>
                <option value="email">Email</option>
                <option value="contact">Contact</option>
                <option value="phone">Phone</option>
                <option value="sms">SMS</option>
                <option value="wifi">WiFi</option>
                <option value="file">File</option>
              </Select>
            </Field>
            <QRDataFields
              data={editData}
              onChange={(value) =>
                setEditData((prev) => {
                  if (!prev) {
                    return value;
                  }
                  return {
                    ...value,
                    name: prev.name,
                    description: prev.description,
                    errorLevel: value.errorLevel ?? prev.errorLevel,
                    styleSettings: value.styleSettings ?? prev.styleSettings,
                    logoSettings: value.logoSettings ?? prev.logoSettings,
                    borderSettings: value.borderSettings ?? prev.borderSettings,
                  };
                })
              }
            />
          </div>
        ) : null}
      </OverlayDialog>

      <OverlayDialog
        open={deleteOpen && !!activeQr}
        title="Delete QR Code"
        description={activeQr ? `Are you sure you want to delete QR code: ${activeQr.code}? This action cannot be undone.` : undefined}
        onClose={() => {
          setDeleteOpen(false);
          resetSelection();
        }}
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setDeleteOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void handleDelete()} disabled={deleteQRCode.isLoading}>
              {deleteQRCode.isLoading ? "Deleting..." : "Delete"}
            </Button>
          </div>
        }
      >
        {activeQr ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="text-sm text-slate-700">
              This will remove <span className="font-medium text-slate-900">{activeQr.data.name ?? activeQr.code}</span> and its saved configuration.
            </div>
          </div>
        ) : null}
      </OverlayDialog>
    </div>
  );
}
