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
import {
  IconExternalLink,
  IconPencil,
  IconQrcode,
  IconSparkles,
} from "@tabler/icons-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis } from "recharts";
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

type CreatorUser = ReturnType<typeof useUser>;

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

function QrCodeCreatorContent({ variant = "default", user }: QrCodeCreatorProps & { user: CreatorUser }) {
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
    <Tabs value={designTab} onValueChange={(value) => setDesignTab(value as DesignTab)} className="min-h-0 w-full min-w-0 overflow-hidden">
      <div className="w-full min-w-0 overflow-hidden">
        <TabsList className={tabListClassName}>
          {DESIGN_OPTIONS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value} className={tabTriggerClassName}>
              <tab.icon className="size-3.5 shrink-0" />
              <span>{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      <TabsContent value="style" className="min-w-0 overflow-hidden">
        <StyleSettings settings={styleSettings} onChange={setStyleSettings} />
      </TabsContent>
      <TabsContent value="border" className="min-w-0 overflow-hidden">
        <BorderSettings settings={borderSettings} onChange={setBorderSettings} />
      </TabsContent>
      <TabsContent value="logo" className="min-w-0 overflow-hidden">
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
      <TabsContent value="error-level" className="min-w-0 overflow-hidden">
        <ErrorLevelSettings value={errorLevel} onChange={setErrorLevel} />
      </TabsContent>
      <TabsContent value="details" className="min-w-0 overflow-hidden">
        <DetailsSettings />
      </TabsContent>
    </Tabs>
  );

  if (variant === "hero") {
    const chartData = [
      { day: "M", scans: 420 },
      { day: "T", scans: 860 },
      { day: "W", scans: 1420 },
      { day: "T", scans: 930 },
      { day: "F", scans: 1860 },
      { day: "S", scans: 1410 },
      { day: "S", scans: 2412 },
    ];

    return (
      <div className="w-full overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_32px_90px_-52px_color-mix(in_srgb,var(--brand-shadow)_52%,transparent)]">
        <div className="grid lg:grid-cols-[minmax(280px,0.9fr)_minmax(350px,1.35fr)_minmax(280px,0.9fr)]">
          <section className="min-w-0 border-b border-border lg:border-r lg:border-b-0">
            <div className="grid h-full grid-cols-[58px_minmax(0,1fr)]">
              <nav className="flex flex-col items-center gap-2 border-r border-border bg-[color-mix(in_srgb,var(--brand-blue)_7%,var(--card))] px-2 py-4" aria-label="QR content types">
                {CONTENT_OPTIONS.map((option) => {
                  const Icon = option.icon;
                  const active = contentTab === option.value;
                  return (
                    <button key={option.value} type="button" title={option.label} aria-label={option.label} disabled={option.value === "file" && !user} onClick={() => setContentTab(option.value)} className={cn("flex size-10 items-center justify-center rounded-xl border border-transparent text-muted-foreground transition", active ? "border-[color-mix(in_srgb,var(--brand-blue)_20%,var(--border))] bg-[var(--brand-action)] text-white shadow-[0_8px_20px_-12px_var(--brand-action)]" : "hover:border-border hover:bg-card hover:text-foreground", option.value === "file" && !user && "cursor-not-allowed opacity-40")}>
                      <Icon className="size-[18px]" />
                    </button>
                  );
                })}
              </nav>

              <div className="min-w-0">
                <div className="border-b border-border p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Campaign</p>
                  <div className="mt-1 flex items-center gap-2 text-lg font-bold tracking-[-0.025em]"><span>Summer launch</span><IconPencil className="size-4 text-muted-foreground" /></div>
                </div>
                <div className="border-b border-border p-5">
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Destination URL</p>
                  {renderContentInput()}
                </div>
                <div className="p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Style</p>
                    <IconSparkles className="size-4 text-[var(--brand-blue)]" />
                  </div>
                  <div className="min-w-0 overflow-x-clip overflow-y-visible">
                    {renderDesignTabs(
                      "grid h-auto w-full grid-cols-3 gap-1 bg-transparent p-0",
                      "min-h-9 rounded-lg border border-border px-2 text-[10px] font-bold data-[state=active]:border-[color-mix(in_srgb,var(--brand-blue)_25%,var(--border))] data-[state=active]:bg-[color-mix(in_srgb,var(--brand-blue)_10%,var(--card))] data-[state=active]:text-[var(--brand-blue)] data-[state=active]:shadow-none"
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="qr-canvas-grid relative flex min-h-[420px] items-start justify-center overflow-hidden border-b border-border px-5 pb-12 pt-16 sm:min-h-[480px] sm:px-8 sm:pb-16 lg:min-h-[520px] lg:border-r lg:border-b-0">
            <Scanability score={scanability} showScore className="absolute right-4 top-4 z-10" />
            <div className="relative aspect-square w-full max-w-[340px]">
              <span className="pointer-events-none absolute -left-3 -top-3 size-5 rounded-tl-md border-l-2 border-t-2 border-[var(--brand-blue)]" aria-hidden="true" />
              <span className="pointer-events-none absolute -right-3 -top-3 size-5 rounded-tr-md border-r-2 border-t-2 border-[var(--brand-blue)]" aria-hidden="true" />
              <span className="pointer-events-none absolute -bottom-3 -left-3 size-5 rounded-bl-md border-b-2 border-l-2 border-[var(--brand-blue)]" aria-hidden="true" />
              <span className="pointer-events-none absolute -bottom-3 -right-3 size-5 rounded-br-md border-r-2 border-b-2 border-[var(--brand-blue)]" aria-hidden="true" />
              <div data-qr-preview className="relative flex size-full min-h-0 min-w-0 items-center justify-center overflow-hidden rounded-3xl border border-border bg-white p-4 shadow-[0_24px_50px_-30px_color-mix(in_srgb,var(--brand-blue)_55%,transparent)] sm:p-6" ref={previewRef}>
                <QrPreview data={qrString} errorLevel={errorLevel} size={270} styleSettings={styleSettings} borderSettings={borderSettings} logoSettings={logoSettings} onScanabilityChange={setScanability} />
                {isLoading && <div className="absolute inset-0 flex items-center justify-center bg-white/85"><Loader2Icon className="size-6 animate-spin text-[var(--brand-blue)]" /></div>}
              </div>
            </div>
          </section>

          <aside className="min-w-0">
            <div className="flex items-center justify-between gap-8 border-b border-border px-5 py-4">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Status</p><span className="mt-1 inline-flex rounded-full bg-[color-mix(in_srgb,var(--brand-lime)_65%,var(--card))] px-2.5 py-1 text-xs font-bold text-[#314a00]">● Live</span></div>
              <div className="text-right"><strong className="font-display text-3xl leading-none tracking-[-0.04em]">12,846</strong><p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Scans</p></div>
            </div>
            <div className="border-b border-border p-5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Scans over time</p>
                <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-bold text-muted-foreground">Demo · 7 days</span>
              </div>
              <div className="mt-4 h-[190px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 12, right: 8, left: -28, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 4" />
                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "var(--muted-foreground)", fontWeight: 700 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} />
                    <ChartTooltip contentStyle={{ border: "1px solid var(--border)", borderRadius: 12, background: "var(--popover)", color: "var(--popover-foreground)", fontSize: 11, fontWeight: 700, boxShadow: "0 12px 30px -18px rgba(0,0,0,.35)" }} />
                    <Line type="monotone" dataKey="scans" stroke="var(--brand-blue)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--card)", stroke: "var(--brand-blue)", strokeWidth: 2 }} activeDot={{ r: 5, fill: "var(--brand-lime)", stroke: "var(--brand-blue)" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="p-5">
              <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Top locations</p>
              <div className="divide-y divide-border text-xs font-bold">
                {[["US", "United States", "56.3%"], ["GB", "United Kingdom", "22.7%"], ["CA", "Canada", "8.9%"]].map(([code, country, percent]) => (
                  <div key={code} className="grid grid-cols-[32px_1fr_auto] items-center gap-3 py-3"><span className="rounded-md bg-[color-mix(in_srgb,var(--brand-blue)_11%,var(--card))] py-1 text-center text-[9px] font-extrabold text-[var(--brand-blue)]">{code}</span><span>{country}</span><span>{percent}</span></div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <div><p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-foreground/55">Scan quality</p><Scanability score={scanability} className="mt-1" /></div>
                <div className="flex items-center gap-3">
                  <Tooltip><TooltipTrigger asChild><Label htmlFor="scan-tracking-hero" className="cursor-pointer text-xs font-bold">Tracking</Label></TooltipTrigger><TooltipContent><p>Track scans and update the destination anytime.</p></TooltipContent></Tooltip>
                  <Switch id="scan-tracking-hero" checked={scanTracking} disabled={!user} onCheckedChange={handleTrackingChange} />
                </div>
              </div>
            </div>
          </aside>
        </div>

        <div className="flex flex-col items-stretch justify-between gap-3 border-t border-border bg-[color-mix(in_srgb,var(--muted)_32%,var(--card))] p-4 sm:flex-row sm:items-center">
          <p className="flex items-center gap-2 text-xs font-bold text-foreground/60"><IconQrcode className="size-4 text-[var(--brand-blue)]" />Your code updates as you design</p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-11 rounded-xl border border-border bg-card px-5 font-bold" asChild><Link href="/dashboard">Preview <IconExternalLink className="size-4" /></Link></Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button className="h-11 rounded-xl border border-[var(--brand-action)] bg-[var(--brand-action)] px-6 font-bold text-white shadow-[0_10px_24px_-16px_var(--brand-action)] hover:bg-[var(--brand-action)]/90"><Download className="size-4" />Download QR</Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end"><DropdownMenuItem onClick={handleDownloadSvg}>Download SVG</DropdownMenuItem><DropdownMenuItem onClick={handleDownloadPng}>Download PNG</DropdownMenuItem></DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-8">
      <Card className="flex flex-col gap-4 p-4 sm:p-6 lg:p-8">
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

      <div className="order-first flex w-full flex-col items-start space-y-4 lg:order-last">
        <Card className="flex w-full flex-col items-center p-4 lg:sticky lg:top-4">
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
          <div className="relative flex aspect-square w-full max-w-64 items-center justify-center" ref={previewRef}>
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
          <div className="grid w-full gap-2 sm:grid-cols-2">
            <Button onClick={handleDownloadSvg}>Download SVG</Button>
            <Button onClick={handleDownloadPng}>Download PNG</Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function HydratedQrCodeCreator(props: QrCodeCreatorProps) {
  const user = useUser({ or: "return-null" });

  return <QrCodeCreatorContent {...props} user={user} />;
}

export default function QrCodeCreator(props: QrCodeCreatorProps) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return <QrCodeCreatorContent {...props} user={null} />;
  }

  return <HydratedQrCodeCreator {...props} />;
}
