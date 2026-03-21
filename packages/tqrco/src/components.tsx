import React, { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, Loader2, QrCode as QrCodeIcon } from "lucide-react";
import QRCodeStyling, { type Options } from "qr-code-styling";
import { useOptionalTqrcoClient, useTqrcoClient } from "./react";
import { serializeQrData } from "./qr";
import type { QR, QRData, QrBorderSettings, QrRenderConfig, QrStyleSettings } from "./shared/contracts";

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

export interface UseQrRenderDataResult {
  qr: QR | null;
  data: string | null;
  isLoading: boolean;
  error: Error | null;
}

export function useQrRenderData({
  qrId,
  data,
}: {
  qrId?: string | null;
  data?: QRData | string;
}): UseQrRenderDataResult {
  const client = useOptionalTqrcoClient();
  const [qr, setQr] = useState<QR | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(qrId));

  useEffect(() => {
    let cancelled = false;

    if (!qrId) {
      setQr(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (!client) {
      setQr(null);
      setError(new Error("A TqrcoProvider is required when using qrId-based rendering."));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    void client.qr
      .get(qrId)
      .then((result) => {
        if (!cancelled) {
          setQr(result);
          setError(null);
        }
      })
      .catch((nextError) => {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError : new Error("Failed to load QR code"));
          setQr(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [client, qrId]);

  const serialized = useMemo(() => {
    if (typeof data === "string") {
      return data;
    }
    if (data) {
      return serializeQrData(data);
    }
    if (qr) {
      return serializeQrData(qr.data);
    }
    return null;
  }, [data, qr]);

  return {
    qr,
    data: serialized,
    isLoading,
    error,
  };
}

export interface QRCodeProps {
  qrId?: string;
  data?: QRData | string;
  config?: Partial<QrRenderConfig>;
  className?: string;
  loadingFallback?: React.ReactNode;
  errorFallback?: React.ReactNode;
}

const DEFAULT_CONFIG: QrRenderConfig = {
  errorLevel: "M",
  width: 256,
  height: 256,
  margin: 4,
  styleSettings: DEFAULT_STYLE_SETTINGS,
  logoSettings: null,
  borderSettings: null,
};

export function QRCode(props: QRCodeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { data, isLoading, error } = useQrRenderData({ qrId: props.qrId, data: props.data });
  const mergedConfig = useMemo<QrRenderConfig>(
    () => ({
      ...DEFAULT_CONFIG,
      ...props.config,
      styleSettings: {
        ...DEFAULT_STYLE_SETTINGS,
        ...(props.config?.styleSettings ?? {}),
      },
    }),
    [props.config],
  );

  useEffect(() => {
    if (!containerRef.current || !data) {
      return;
    }

    const container = containerRef.current;
    container.innerHTML = "";
    const instance = new QRCodeStyling(buildOptions(data, mergedConfig));
    instance.append(container);

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
  }, [data, mergedConfig]);

  if (isLoading) {
    return <>{props.loadingFallback ?? null}</>;
  }

  if (error) {
    return <>{props.errorFallback ?? null}</>;
  }

  if (!data) {
    return null;
  }

  return <div ref={containerRef} className={props.className} />;
}

function cx(...classes: Array<string | undefined | false | null>) {
  return classes.filter(Boolean).join(" ");
}

export interface QRImageSquareProps {
  qr: Pick<QR, "id" | "code" | "data" | "imageUrl">;
  className?: string;
  editable?: boolean;
  onUploaded?: (qr: QR) => void;
  onError?: (error: Error) => void;
}

export function QRImageSquare({
  qr,
  className,
  editable = false,
  onUploaded,
  onError,
}: QRImageSquareProps) {
  const client = useTqrcoClient();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState<Error | null>(null);

  useEffect(() => {
    let revokedUrl: string | null = null;
    let cancelled = false;

    if (!qr.imageUrl) {
      setImageSrc(null);
      setImageLoadError(null);
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
        setImageLoadError(null);
      })
      .catch((error) => {
        if (controller.signal.aborted || cancelled) {
          return;
        }
        const errorValue = error instanceof Error ? error : new Error("Failed to load image.");
        setImageSrc(null);
        setImageLoadError(errorValue);
      });

    return () => {
      cancelled = true;
      controller.abort();
      if (revokedUrl) {
        URL.revokeObjectURL(revokedUrl);
      }
    };
  }, [client.baseUrl, client.token, qr.id, qr.imageUrl]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      const error = new Error("Please choose an image file.");
      onError?.(error);
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
          "relative aspect-square overflow-hidden rounded-2xl border border-border/70 bg-muted/30 shadow-sm",
          className,
        )}
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={`${label} image`}
            className="h-full w-full object-cover"
          />
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
        "group relative aspect-square overflow-hidden rounded-2xl border border-border/70 bg-muted/30 shadow-sm transition hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-progress",
        className,
      )}
      onClick={() => inputRef.current?.click()}
      disabled={isUploading}
      aria-label={qr.imageUrl ? `Update image for ${label}` : `Upload image for ${label}`}
    >
      {imageSrc ? (
        <img
          src={imageSrc}
          alt={`${label} image`}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[radial-gradient(circle_at_top,rgba(15,23,42,0.08),transparent_58%),linear-gradient(180deg,rgba(248,250,252,0.96),rgba(226,232,240,0.92))] text-slate-500">
          <QrCodeIcon className="h-5 w-5" />
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-slate-950/45 text-white opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
        {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImagePlus className="h-5 w-5" />}
      </div>
      {imageLoadError ? <span className="sr-only">{imageLoadError.message}</span> : null}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
      />
    </button>
  );
}
