import QrPreview from "@/components/qr-preview";
import type { QrPreviewProps } from "@/components/qr-preview";
import { Icon } from "@/components/ui/icon-picker";
import { Skeleton } from "@/components/ui/skeleton";

import React, { useState, useRef, useEffect } from "react";
import { mapApiResponseToQrPreviewProps, MistralQrResponse } from "@/lib/ai-map";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Download, Edit } from "lucide-react";

export async function generateQRCodeWithAI(text: string): Promise<QrPreviewProps> {
    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });
      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }
      console.log("ok");
      const data = await response.json() as QrPreviewProps;
      console.log(data);
      return data;
    } catch (error) {
      console.error("Error generating QR code via AI:", error);
      throw error;
    }
  }

export default function AICreateQr() {
  const svgCaptureRef = useRef<HTMLDivElement>(null);
  const [selectedIconName, setSelectedIconName] = useState<string | undefined>(undefined);
  const [selectedIconSize, setSelectedIconSize] = useState<number>(32);
  const [selectedIconColor, setSelectedIconColor] = useState<string | undefined>(undefined);

  const [inputText, setInputText] = useState("");
  const [previewProps, setPreviewProps] = useState<QrPreviewProps | null>(null);
  const [loading, setLoading] = useState(false);

  const qrContainerRef = useRef<HTMLDivElement>(null);

  const examplePrompts = [
    "Generate a QR for https://google.com with an ocean-inspired gradient background, dark dots, and a modern look.",
    "Generate a QR code to text 'SAVE40' to 7755557134 without a logo",
    "Generate a QR for \"https://example.com\" with a dark-to-light green gradient background, solid white dots, classy-rounded style, and infer the icon.",
    "Make a QR code of my contact: John Doe, 775-555-0842, john@doe.com, with a clean white background and navy dots.",
    "Create a QR for the Wi-Fi network 'VineGuest' password 'SipSip2025', with a dark mode theme and futuristic dots."
  ];
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % examplePrompts.length);
    }, 5000); // Change every 5 seconds
    return () => clearInterval(interval);
  }, [examplePrompts.length]);

  function handleSave() {
    if (!qrContainerRef.current) return;
    const svg = qrContainerRef.current.querySelector("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=UTF-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "qr-code.svg";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleGenerateAnother() {
    setPreviewProps(null);
    setInputText("");
  }

  async function handleGenerate() {
    setLoading(true);
    try {
      const apiResponse = await generateQRCodeWithAI(inputText);
      console.log(apiResponse);
      const mappedPreview = mapApiResponseToQrPreviewProps(apiResponse as unknown as MistralQrResponse);
      console.log("mapped:", mappedPreview)
      const logoName = mappedPreview.logoSettings?.src;
      const logoSize = .4 * 100;
      const logoColor = mappedPreview.styleSettings?.dotColors?.[0] ?? "#000000";
      // Render icon into hidden div
      setSelectedIconName(logoName);
      setSelectedIconSize(logoSize);
      setSelectedIconColor(logoColor);
      // After DOM updates, capture SVG and convert to data URI
      setTimeout(() => {
        const svgEl = svgCaptureRef.current?.querySelector("svg");
        if (!svgEl) return;
        // Force inline color style to resolve currentColor properly
        svgEl.style.color = mappedPreview.styleSettings?.dotColors?.[0] ?? "#000000";
        if ((logoName as string).startsWith("Si")) {
          // Si capture logic (computed fill + dimensions)
          const computedColor = window.getComputedStyle(svgEl).color || (mappedPreview.styleSettings?.dotColors?.[0] ?? "#000000");
          svgEl.setAttribute("fill", computedColor);
          svgEl.querySelectorAll("path, circle, rect, polygon").forEach(el => {
            el.setAttribute("fill", computedColor);
          });
        } else {
          // Lucide capture logic
          svgEl.setAttribute("stroke-width", "3");
          svgEl.setAttribute("stroke", mappedPreview.styleSettings?.dotColors?.[0] ?? "#000000");
        }
        // Force pixel size
        const sizePx = Math.round((0.4) * 100);
        svgEl.setAttribute("width", `${sizePx}px`);
        svgEl.setAttribute("height", `${sizePx}px`);
        // Serialize
        const svgString = svgEl.outerHTML.trim();
        const dataUri = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgString)}`;
        const previewWithLogo: QrPreviewProps = {
          ...mappedPreview,
          logoSettings: {
            src: dataUri,
            size: .4,
            hideBackgroundDots: true,
            margin: 3,
          },
        };
        console.log("preview:", previewWithLogo)
        setPreviewProps(previewWithLogo);
      }, 200);
    } catch (error) {
      console.error("QR generation failed", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-4 w-full">
      {/* Hidden SVG capture div remains unchanged */}
      <div
        ref={svgCaptureRef}
        style={{ position: "absolute", visibility: "hidden", pointerEvents: "none" }}
      >
        {selectedIconName && (
          <Icon
            name={selectedIconName}
            size={selectedIconSize}
            color={selectedIconColor}
          />
        )}
      </div>
      {/* Main display area */}
      <div className="w-64 h-64 mb-4">
        {loading ? (
          <Skeleton className="w-full h-full" />
        ) : previewProps ? (
          <div ref={qrContainerRef} className="w-full h-full">
            <QrPreview
              {...previewProps}
              borderSettings={
                previewProps.borderSettings ?? {
                  shape: "square",
                  colorType: "solid",
                  colors: ["#000000", "#000000"],
                  gradientType: "linear",
                  rotation: 0,
                  preset: "",
                  text: "",
                }
              }
              className="w-full h-full"
            />
          </div>
        ) : (
          <Textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading && inputText) {
                e.preventDefault();
                handleGenerate();
              }
            }}
            placeholder={examplePrompts[placeholderIndex]}
            className="w-full h-full"
          />
        )}
      </div>
      {previewProps ? (
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleGenerateAnother}>Generate Another</Button>
          <Button variant="outline" size="icon"><Edit/></Button>
          <Button onClick={handleSave} size="icon"><Download/></Button>
        </div>
      ) : (
        <Button
          onClick={handleGenerate}
          disabled={loading || !inputText}
          className=""
        >
          Generate
        </Button>
      )}
    </div>
  );
}