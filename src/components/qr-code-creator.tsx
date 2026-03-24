"use client";

import { useEffect, useRef, useState } from "react";
import type { ComponentType } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, serialize } from "@/lib/utils";
import Link from "next/link";
import {
  Brush,
  FileIcon,
  Frame,
  GlobeIcon,
  Download,
  ImageIcon,
  Info,
  Loader2Icon,
  MailIcon,
  MessageSquareIcon,
  PhoneIcon,
  ShieldAlert,
  TypeIcon,
  UserIcon,
  WifiIcon,
} from "lucide-react";
import { useUser } from "@stackframe/stack";

import QrPreview from "./qr-preview";
import WebsiteInput from "./qr/inputs/website";
import TextInput from "./qr/inputs/text";
import EmailInput from "./qr/inputs/email";
import ContactInput from "./qr/inputs/contact";
import PhoneInput from "./qr/inputs/phone";
import SmsInput from "./qr/inputs/sms";
import WifiInput from "./qr/inputs/wifi";
import FileInput from "./qr/inputs/file";
import StyleSettings from "./qr/design/style";
import BorderSettings from "./qr/design/border";
import LogoSettings from "./qr/design/logo";
import ErrorLevelSettings from "./qr/design/error-level";
import DetailsSettings from "./qr/design/details";
import Scanability from "@/components/ui/scanability";

import { flattenAndDownloadSvg, prepareSvgForExport } from "@/lib/flatten-svg";
import { buildPublicQrUrl } from "@/lib/qr-url";
import { QRData } from "@/lib/types";
import type { ContactData, EmailData, PhoneData, SMSData, URLData, WiFiData } from "@/lib/types";

type ContentTab = "website" | "text" | "email" | "contact" | "phone" | "sms" | "wifi" | "file";
type DesignTab = "style" | "border" | "logo" | "error-level" | "details";

type QrCodeCreatorProps = {
  variant?: "default" | "hero";
};

const CONTENT_OPTIONS: {
  value: ContentTab;
  label: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { value: "website", label: "Website", icon: GlobeIcon },
  { value: "text", label: "Text", icon: TypeIcon },
  { value: "email", label: "Email", icon: MailIcon },
  { value: "contact", label: "Contact", icon: UserIcon },
  { value: "phone", label: "Phone", icon: PhoneIcon },
  { value: "sms", label: "SMS", icon: MessageSquareIcon },
  { value: "wifi", label: "WiFi", icon: WifiIcon },
  { value: "file", label: "File", icon: FileIcon },
];

const DESIGN_OPTIONS: {
  value: DesignTab;
  label: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { value: "style", label: "Style", icon: Brush },
  { value: "border", label: "Frame", icon: Frame },
  { value: "logo", label: "Logo", icon: ImageIcon },
  { value: "error-level", label: "Error", icon: ShieldAlert },
  { value: "details", label: "Details", icon: Info },
];

function createDefaultContentData(tab: ContentTab): QRData {
  switch (tab) {
    case "website":
      return { type: "url", url: "https://example.com" };
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
      return { type: "wifi", ssid: "", authenticationType: "WPA", password: "", hidden: false };
    case "file":
      return { type: "file", key: "" };
  }
}

function tabMatchesData(tab: ContentTab, data: QRData): boolean {
  return (
    (tab === "website" && data.type === "url") ||
    (tab === "text" && data.type === "text") ||
    (tab === "email" && data.type === "email") ||
    (tab === "contact" && data.type === "contact") ||
    (tab === "phone" && data.type === "phone") ||
    (tab === "sms" && data.type === "sms") ||
    (tab === "wifi" && data.type === "wifi") ||
    (tab === "file" && data.type === "file")
  );
}

export default function QrCodeCreator({ variant = "default" }: QrCodeCreatorProps) {
  const user = useUser();
  const [contentTab, setContentTab] = useState<ContentTab>("website");
  const [designTab, setDesignTab] = useState<DesignTab>("style");
  const [contentData, setContentData] = useState<QRData>(createDefaultContentData("website"));
  const [qrString, setQrString] = useState<string>(serialize(contentData));
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scanTracking, setScanTracking] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const intervalRef = useRef<number | null>(null);
  const [originalData, setOriginalData] = useState<QRData>(contentData);
  const [errorLevel, setErrorLevel] = useState<"L" | "M" | "Q" | "H">("M");
  const [styleSettings, setStyleSettings] = useState<import("./qr/design/style").StyleSettingsProps["settings"]>({
    dotStyle: "square",
    dotColorType: "solid",
    dotColors: ["#000000"],
    dotGradientType: undefined,
    dotRotation: 0,
    eyeStyle: "square",
    eyeColorType: "solid",
    eyeColors: ["#000000"],
    eyeGradientType: undefined,
    eyeRotation: 0,
    innerEyeStyle: "square",
    innerEyeColorType: "solid",
    innerEyeColors: ["#000000"],
    innerEyeGradientType: undefined,
    innerEyeRotation: 0,
    bgColorType: "solid",
    bgColors: ["#ffffff"],
    bgGradientType: undefined,
    bgRotation: 0,
  });
  const [borderSettings, setBorderSettings] = useState<{
    shape: "square" | "circle";
    colorType: "solid" | "gradient";
    colors: string[];
    gradientType: "linear" | "radial";
    rotation: number;
    preset: string;
    text: string;
    textStyle?: string;
  }>({
    shape: "square",
    colorType: "solid",
    colors: ["#ffffff", "#ffffff"],
    gradientType: "linear",
    rotation: 0,
    text: "",
    textStyle: undefined,
    preset: "default",
  });
  const [logoSettings, setLogoSettings] = useState<{
    src: string;
    size: number;
    margin?: number;
    hideBackgroundDots?: boolean;
  } | undefined>(undefined);
  const [scanability, setScanability] = useState<number>(0);

  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tabMatchesData(contentTab, contentData)) {
      return;
    }

    const nextData = createDefaultContentData(contentTab);
    setOriginalData(nextData);
    if (!scanTracking) {
      setContentData(nextData);
      setQrString(serialize(nextData));
    }
  }, [contentTab, contentData, scanTracking]);

  const handleDownloadSvg = async () => {
    if (!previewRef.current) return;
    const svgContainer = previewRef.current.innerHTML;
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgContainer, "image/svg+xml");
    const svgEl = doc.querySelector("svg");
    if (!svgEl) return;
    await flattenAndDownloadSvg(svgEl);
  };

  const handleDownloadPng = async () => {
    if (!previewRef.current) return;
    const svg = previewRef.current.querySelector("svg");
    if (!svg) return;

    const svgData = await prepareSvgForExport(svg);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);

    const img = new window.Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = svg.width.baseVal.value || 512;
      canvas.height = svg.height.baseVal.value || 512;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "qr-code.png";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
          }
          URL.revokeObjectURL(url);
        }, "image/png");
      } else {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleTrackingChange = async (checked: boolean) => {
    setScanTracking(checked);
    setIsLoading(checked);

    if (checked) {
      intervalRef.current = window.setInterval(() => {
        const randomCode = Math.random().toString(36).substr(2, 6);
        setQrString(buildPublicQrUrl(randomCode));
      }, 500);

      try {
        const res = await fetch("/api/qr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(contentData),
        });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const { code } = await res.json();
        setQrString(buildPublicQrUrl(code));

        if (selectedFile && contentData.type === "file") {
          try {
            const uploadForm = new FormData();
            uploadForm.append("file", selectedFile);
            uploadForm.append("code", code);
            const uploadRes = await fetch("/api/upload", {
              method: "POST",
              body: uploadForm,
            });
            if (!uploadRes.ok) {
              console.error("File upload failed:", uploadRes.statusText);
            }
          } catch (err) {
            console.error("Error uploading file:", err);
          }
        }
      } catch (err) {
        console.error("Failed to generate QR ID", err);
      } finally {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        setIsLoading(false);
      }
      return;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsLoading(false);
    setQrString(serialize(originalData));
  };

  const renderContentInput = () => {
    if (contentTab === "website") {
      return (
        <WebsiteInput
          value={scanTracking ? (originalData as URLData) : (contentData as URLData)}
          onChange={(data: URLData) => {
            setOriginalData(data);
            if (!scanTracking) {
              setContentData(data);
              setQrString(serialize(data));
            }
          }}
        />
      );
    }

    if (contentTab === "text") {
      return (
        <TextInput
          value={scanTracking && originalData.type === "text" ? originalData.text : contentData.type === "text" ? contentData.text : ""}
          onChange={(text: string) => {
            const updated: QRData = { type: "text", text };
            setOriginalData(updated);
            if (!scanTracking) {
              setContentData(updated);
              setQrString(serialize(updated));
            }
          }}
        />
      );
    }

    if (contentTab === "email") {
      return (
        <EmailInput
          value={scanTracking ? (originalData as EmailData) : (contentData as EmailData)}
          onChange={(data: EmailData) => {
            setOriginalData(data);
            if (!scanTracking) {
              setContentData(data);
              setQrString(serialize(data));
            }
          }}
        />
      );
    }

    if (contentTab === "contact") {
      return (
        <ContactInput
          value={scanTracking && originalData.type === "contact" ? originalData : contentData.type === "contact" ? contentData : undefined}
          onChange={(contact: ContactData) => {
            const updated: QRData = contact;
            setOriginalData(updated);
            if (!scanTracking) {
              setContentData(updated);
              setQrString(serialize(updated));
            }
          }}
        />
      );
    }

    if (contentTab === "phone") {
      return (
        <PhoneInput
          value={scanTracking ? (originalData as PhoneData) : (contentData as PhoneData)}
          onChange={(data: PhoneData) => {
            setOriginalData(data);
            if (!scanTracking) {
              setContentData(data);
              setQrString(serialize(data));
            }
          }}
        />
      );
    }

    if (contentTab === "sms") {
      return (
        <SmsInput
          value={scanTracking ? (originalData as SMSData) : (contentData as SMSData)}
          onChange={(data: SMSData) => {
            setOriginalData(data);
            if (!scanTracking) {
              setContentData(data);
              setQrString(serialize(data));
            }
          }}
        />
      );
    }

    if (contentTab === "wifi") {
      return (
        <WifiInput
          value={scanTracking ? (originalData as WiFiData) : (contentData as WiFiData)}
          onChange={({ ssid, authenticationType, password }: { ssid: string; authenticationType: string; password?: string }) => {
            const updated = { type: "wifi" as const, ssid, authenticationType, password };
            setOriginalData(updated);
            if (!scanTracking) {
              setContentData(updated);
              setQrString(serialize(updated));
            }
          }}
        />
      );
    }

    return (
      <FileInput
        onChange={(file) => {
          setSelectedFile(file);
          if (file) {
            const updated: QRData = { type: "file", key: file.name };
            setOriginalData(updated);
            if (!scanTracking) {
              setContentData(updated);
              setQrString(serialize(updated));
            }
          } else {
            setOriginalData({ type: "file", key: "" });
            if (!scanTracking) {
              setContentData({ type: "file", key: "" });
              setQrString(serialize({ type: "file", key: "" }));
            }
          }
        }}
      />
    );
  };

  const renderDesignTabs = (tabListClassName?: string, tabTriggerClassName?: string) => (
    <Tabs value={designTab} onValueChange={(value) => setDesignTab(value as DesignTab)} className="min-h-0">
      <div className="overflow-x-auto">
        <TabsList className={tabListClassName}>
          {DESIGN_OPTIONS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className={tabTriggerClassName}>
              <tab.icon className="size-3.5 shrink-0" />
              <span>{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      <TabsContent value="style">
        <StyleSettings settings={styleSettings} onChange={setStyleSettings} />
      </TabsContent>
      <TabsContent value="border">
        <BorderSettings settings={borderSettings} onChange={setBorderSettings} />
      </TabsContent>
      <TabsContent value="logo">
        <LogoSettings
          settings={logoSettings}
          onChange={(logo) => {
            if (!logo) {
              setLogoSettings(undefined);
              return;
            }

            setLogoSettings({
              src: logo.src || "",
              size: logo.size,
              margin: logo.margin,
              hideBackgroundDots: logo.hideBackgroundDots,
            });
          }}
        />
      </TabsContent>
      <TabsContent value="error-level">
        <ErrorLevelSettings value={errorLevel} onChange={setErrorLevel} />
      </TabsContent>
      <TabsContent value="details">
        <DetailsSettings />
      </TabsContent>
    </Tabs>
  );

  if (variant === "hero") {
    return (
      <div className="mx-auto w-full max-w-[1180px] rounded-[28px] border bg-card p-3 shadow-sm sm:p-4">
        <div className="grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="min-w-0 max-w-full space-y-3">
            <section className="rounded-[22px] border bg-background p-4 sm:p-5">
              <div className="space-y-4">
                <div>
                  <div className="flex flex-wrap gap-2">
                    {CONTENT_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      const active = contentTab === option.value;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          disabled={option.value === "file" && !user}
                          onClick={() => setContentTab(option.value)}
                          className={cn(
                            "inline-flex h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-medium whitespace-nowrap transition",
                            active
                              ? "border-foreground/15 bg-muted/60 text-foreground shadow-sm"
                              : "border-border bg-background text-muted-foreground hover:border-foreground/15 hover:bg-muted/35",
                            option.value === "file" && !user && "cursor-not-allowed opacity-45"
                          )}
                        >
                          <Icon className="size-3.5 shrink-0" />
                          <span>{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="border-t pt-4">
                  {renderContentInput()}
                </div>
              </div>
            </section>

            <section className="rounded-[22px] border bg-muted/35 p-3">
              <div className="mb-3 px-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Design</div>
              <div className="min-w-0">
                {renderDesignTabs(
                  "grid h-auto w-full grid-cols-2 gap-2 rounded-2xl bg-transparent p-0 xl:grid-cols-5",
                  "min-h-10 rounded-xl border bg-background px-3 data-[state=active]:border-foreground/15 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
                )}
              </div>
            </section>
          </div>

          <aside className="relative lg:sticky lg:top-4 lg:self-start">
            <div className="rounded-[22px] border bg-muted/35 p-3">
              <div className="mb-3 flex items-center justify-between gap-3 px-1">
                <div className="flex items-center gap-2">
                  <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Preview</div>
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

              <div className="mb-3 flex items-center justify-between rounded-xl border bg-background px-3 py-2">
                <span className="text-sm font-medium text-foreground">Dynamic</span>
                <div className="flex items-center gap-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Label htmlFor="scan-tracking-hero" className="cursor-pointer text-xs text-muted-foreground">
                        Scan tracking
                      </Label>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Track scans and update the destination anytime.
                        <Link href="/pricing" className="ml-1 underline">
                          More info
                        </Link>
                      </p>
                    </TooltipContent>
                  </Tooltip>
                  <Switch
                    id="scan-tracking-hero"
                    checked={scanTracking}
                    disabled={!user}
                    onCheckedChange={handleTrackingChange}
                  />
                </div>
              </div>

              <div className="relative flex min-h-[280px] items-center justify-center rounded-[20px] border bg-background p-4">
                <div className="flex h-full w-full items-center justify-center" ref={previewRef}>
                  <QrPreview
                    data={qrString}
                    errorLevel={errorLevel}
                    size={200}
                    styleSettings={styleSettings}
                    borderSettings={borderSettings}
                    logoSettings={logoSettings}
                    onScanabilityChange={setScanability}
                  />
                </div>
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-[20px] bg-background/80 backdrop-blur-xs">
                    <Loader2Icon className="size-5 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <Card className="flex flex-col gap-4 p-8">
        <h2 className="text-2xl font-bold">Settings</h2>
        <div className="mt-4 space-y-4">
          <div className="space-y-1">
            <Label htmlFor="content-type">Content Type</Label>
            <Select value={contentTab} onValueChange={(value) => setContentTab(value as ContentTab)}>
              <SelectTrigger id="content-type" className="w-full">
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  return (
                    <SelectItem key={option.value} value={option.value} disabled={option.value === "file" && !user}>
                      <div className="flex items-center">
                        <Icon className="mr-2 h-4 w-4" />
                        {option.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          {renderContentInput()}
        </div>

        {renderDesignTabs()}
      </Card>

      <div className="order-first flex w-full flex-col items-start space-y-4 md:w-auto lg:order-last">
        <Card className="sticky top-0 z-10 flex w-full flex-col items-center p-4 md:w-auto">
          <h2 className="text-2xl font-bold">Live Preview</h2>
          <div className="flex items-center space-x-2">
            <Switch
              id="scan-tracking"
              checked={scanTracking}
              disabled={!user}
              onCheckedChange={handleTrackingChange}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Label htmlFor="scan-tracking" className="underline decoration-dotted">
                  Scan Tracking
                </Label>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  Track scans, update the destination anytime, free and unlimited.
                  <Link href="/pricing" className="ml-1 text-muted underline">
                    More Info
                  </Link>
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="relative flex h-64 w-64 items-center justify-center" ref={previewRef}>
            <QrPreview
              data={qrString}
              errorLevel={errorLevel}
              styleSettings={styleSettings}
              borderSettings={borderSettings}
              logoSettings={logoSettings}
              onScanabilityChange={setScanability}
            />
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-xs">
                <Loader2Icon className="animate-spin" />
              </div>
            )}
          </div>
          <Scanability score={scanability} className="absolute top-5 right-5" />
          <div className="flex space-x-4">
            <Button onClick={handleDownloadSvg}>Download SVG</Button>
            <Button onClick={handleDownloadPng}>Download PNG</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
