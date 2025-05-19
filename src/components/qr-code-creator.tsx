"use client";

import { useState, useEffect } from "react";
import { useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import QrPreview from "./qr-preview";

// Content‐type inputs
import WebsiteInput from "./qr/inputs/website";
import TextInput    from "./qr/inputs/text";
import EmailInput   from "./qr/inputs/email";
import ContactInput from "./qr/inputs/contact";
import PhoneInput   from "./qr/inputs/phone";
import SmsInput     from "./qr/inputs/sms";
import WifiInput    from "./qr/inputs/wifi";
import FileInput    from "./qr/inputs/file";

// Design‐type panels
import StyleSettings from "./qr/design/style";
import BorderSettings      from "./qr/design/border";
import LogoSettings       from "./qr/design/logo";
import ErrorLevelSettings from "./qr/design/error-level";
import DetailsSettings    from "./qr/design/details";

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { GlobeIcon, TypeIcon, MailIcon, UserIcon, PhoneIcon, MessageSquareIcon, WifiIcon, FileIcon, } from "lucide-react";
import Scanability from "@/components/ui/scanability";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import Link from "next/link";

import { flattenAndDownloadSvg } from "@/lib/flatten-svg";
import { serialize } from "@/lib/utils";
import { QRData } from "@/lib/types";
import type { WiFiData } from "@/lib/types";
import type { URLData } from "@/lib/types";
import type { EmailData } from "@/lib/types";
import type { PhoneData, SMSData } from "@/lib/types";
import { useUser } from "@stackframe/stack";


export default function QrCodeCreator() {
  const user = useUser();
  const [contentTab, setContentTab] = useState<"website"|"text"|"email"|"contact"|"phone"|"sms"|"wifi"|"file">("website");
  const [designTab,  setDesignTab]  = useState<"style"|"background"|"logo"|"error-level"|"details">("style");

  // Core QR payload and its serialized string
  const [contentData, setContentData] = useState<QRData>({ type: "url", url: "https://example.com" });
  const [qrString, setQrString] = useState<string>(serialize(contentData));
  // add this line for the file
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scanTracking, setScanTracking] = useState<boolean>(false);
  const [originalData, setOriginalData] = useState<QRData>(contentData);
  const [errorLevel, setErrorLevel] = useState<"L"|"M"|"Q"|"H">("M");
  const [styleSettings, setStyleSettings] = useState<import("./qr/design/style").StyleSettingsProps["settings"]>({
    dotStyle:      "square",
    dotColorType:  "solid",
    dotColors:     ["#000000"],
    dotGradientType: undefined,
    dotRotation:   0,

    eyeStyle:      "square",
    eyeColorType:  "solid",
    eyeColors:     ["#000000"],
    eyeGradientType: undefined,
    eyeRotation:   0,

    innerEyeStyle:      "square",
    innerEyeColorType:  "solid",
    innerEyeColors:     ["#000000"],
    innerEyeGradientType: undefined,
    innerEyeRotation:   0,

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

  useEffect(() => {
    console.log("Updated logoSettings:", logoSettings);
  }, [logoSettings]);

  const previewRef = useRef<HTMLDivElement>(null);

const handleDownloadSvg = async () => {
  if (!previewRef.current) return;
  // Get the SVG markup from the preview container
  const svgContainer = previewRef.current.innerHTML;
  // Parse it into a new SVG document
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContainer, "image/svg+xml");
  const svgEl = doc.querySelector("svg");
  if (!svgEl) return;
  // Use flattenAndDownloadSvg on the parsed SVG element
  await flattenAndDownloadSvg(svgEl);
};

  const handleDownloadPng = async () => {
    if (!previewRef.current) return;
    const svg = previewRef.current.querySelector("svg");
    if (!svg) return;

    // Create a canvas and draw the SVG onto it
    const svgData = new XMLSerializer().serializeToString(svg);
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
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left: Content + Design Tabs */}
      <Card className="p-8 flex flex-col gap-4">
        {/* Content‐type Select */}
        <h2 className="text-2xl font-bold">Settings</h2>
        <div className="mt-4 space-y-4">
          <div className="space-y-1">
            <Label htmlFor="content-type" className="">Content Type</Label>
            <Select value={contentTab} onValueChange={value => setContentTab(value as typeof contentTab)}>
              <SelectTrigger id="content-type" className="w-full">
                <SelectValue placeholder="Select content type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="website">
                  <div className="flex items-center">
                    <GlobeIcon className="mr-2 h-4 w-4" />
                    Website
                  </div>
                </SelectItem>
                <SelectItem value="text">
                  <div className="flex items-center">
                    <TypeIcon className="mr-2 h-4 w-4" />
                    Text
                  </div>
                </SelectItem>
                <SelectItem value="email">
                  <div className="flex items-center">
                    <MailIcon className="mr-2 h-4 w-4" />
                    Email
                  </div>
                </SelectItem>
                <SelectItem value="contact">
                  <div className="flex items-center">
                    <UserIcon className="mr-2 h-4 w-4" />
                    Contact
                  </div>
                </SelectItem>
                <SelectItem value="phone">
                  <div className="flex items-center">
                    <PhoneIcon className="mr-2 h-4 w-4" />
                    Phone
                  </div>
                </SelectItem>
                <SelectItem value="sms">
                  <div className="flex items-center">
                    <MessageSquareIcon className="mr-2 h-4 w-4" />
                    SMS
                  </div>
                </SelectItem>
                <SelectItem value="wifi">
                  <div className="flex items-center">
                    <WifiIcon className="mr-2 h-4 w-4" />
                    WiFi
                  </div>
                </SelectItem>
                <SelectItem value="file" disabled={!user}>
                  <div className="flex items-center">
                  <FileIcon className="mr-2 h-4 w-4" />
                    File
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          

          {/* Content‐type Inputs */}
          {contentTab === "website" && (
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
          )}
          {contentTab === "text" && (
            <TextInput
              value={scanTracking ? serialize(originalData) : qrString}
              onChange={(text: string) => {
                const updated = { ...contentData, text };
                setOriginalData(updated);
                if (!scanTracking) {
                  setContentData(updated);
                  setQrString(serialize(updated));
                }
              }}
            />
          )}
          {contentTab === "email" && (
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
          )}
          {contentTab === "contact" && (
            <ContactInput
              value={scanTracking ? serialize(originalData) : qrString}
              onChange={(contact: string) => {
                const updated = { ...contentData, contact };
                setOriginalData(updated);
                if (!scanTracking) {
                  setContentData(updated);
                  setQrString(serialize(updated));
                }
              }}
            />
          )}
          {contentTab === "phone" && (
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
          )}
          {contentTab === "sms" && (
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
          )}
          {contentTab === "wifi" && (
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
          )}
          {contentTab === "file" && (
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
                  // cleared selection
                  setOriginalData({ type: "file", key: "" });
                  if (!scanTracking) {
                    setContentData({ type: "file", key: "" });
                    setQrString(serialize({ type: "file", key: "" }));
                  }
                }
              }}
            />
          )}
        </div>

        {/* Design‐type Tabs */}
        <Tabs value={designTab} onValueChange={value => setDesignTab(value as typeof designTab)}>
          <div className="relative w-full flex overflow-x-auto w-full">
            <TabsList>
              {["style","border","logo","error-level","details"].map(tab => (
                <TabsTrigger key={tab} value={tab} className="capitalize">
                  {tab.replace("-", " ")}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          <TabsContent value="style">      <StyleSettings settings={styleSettings} onChange={setStyleSettings} /></TabsContent>
          <TabsContent value="border">
            <BorderSettings
              settings={borderSettings}
              onChange={(newSettings) => {
                console.log("BackgroundSettings changed:", newSettings);
                setBorderSettings(newSettings);
              }}
            />
          </TabsContent>
          <TabsContent value="logo">
            <LogoSettings
              settings={logoSettings}
              onChange={(logo) => {
                if (!logo) {
                  setLogoSettings(undefined);
                } else {
                  setLogoSettings({
                    src: logo.src || "",
                    size: logo.size,
                    margin: logo.margin,
                    hideBackgroundDots: logo.hideBackgroundDots,
                  });
                }
              }}
            />
          </TabsContent>
          <TabsContent value="error-level"><ErrorLevelSettings value={errorLevel} onChange={setErrorLevel} /></TabsContent>
          <TabsContent value="details">    <DetailsSettings    /></TabsContent>
        </Tabs>
      </Card>

      {/* Right: Live Preview + Download */}
      <div className="flex flex-col items-start space-y-4 md:w-auto w-full order-first lg:order-last">
        <Card className="sticky top-0 z-10 relative flex flex-col items-center p-4 md:w-auto w-full">
          <h2 className="text-2xl font-bold">Live Preview</h2>
            <div className="flex items-center space-x-2">
            <Switch
              id="scan-tracking"
              checked={scanTracking}
              disabled={!user}
              onCheckedChange={async (checked) => {
                setScanTracking(checked);
                if (checked) {
                  try {
                    const res = await fetch('/api/qr', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(contentData),
                    });
                    if (!res.ok) {
                      throw new Error(`HTTP ${res.status}`);
                    }
                    const { code } = await res.json();
                    setQrString(`https://tqrco.de/${code}`);
                    // Upload file if present
                    if (selectedFile) {
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
                    console.error('Failed to generate QR ID', err);
                  }
                } else {
                  setQrString(serialize(originalData));
                }
              }}
            />
            <Tooltip>
              <TooltipTrigger asChild>
              <Label htmlFor="scan-tracking" className="underline decoration-dotted">Scan Tracking</Label>
              </TooltipTrigger>
              <TooltipContent>
              <p>Track scans, update the destination anytime, free and unlimited. <Link href="/pricing" className="text-muted underline"> More Info</Link></p>
              </TooltipContent>
            </Tooltip>
            </div>
          <div className="w-64 h-64 flex items-center justify-center " ref={previewRef}>
            <QrPreview
              data={qrString}
              errorLevel={errorLevel}
              styleSettings={styleSettings}
              borderSettings={borderSettings}
              logoSettings={logoSettings}
              className=""
              onScanabilityChange={setScanability}
            />
          </div>
            <Scanability score={scanability} className="absolute top-5 right-5"/>
          <div className="flex space-x-4">
            <Button onClick={handleDownloadSvg}>Download SVG</Button>
            <Button onClick={handleDownloadPng}>Download PNG</Button>
          </div>
       </Card>
      </div>
    </div>
  );
}