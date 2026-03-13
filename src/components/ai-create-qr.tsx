"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import QrPreview from "@/components/qr-preview";
import type { QrPreviewProps } from "@/components/qr-preview";
import { Icon } from "@/components/ui/icon-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { mapApiResponseToQrPreviewProps, MistralQrResponse } from "@/lib/ai-map";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  Download,
  LoaderCircle,
  Sparkles,
  WandSparkles,
} from "lucide-react";

const EXAMPLE_PROMPTS = [
  "Generate a QR for https://google.com with an ocean-inspired gradient background, dark dots, and a modern look.",
  "Generate a QR code to text 'SAVE40' to 7755557134 without a logo.",
  'Generate a QR for "https://example.com" with a dark-to-light green gradient background, solid white dots, classy-rounded style, and infer the icon.',
  "Make a QR code of my contact: John Doe, 775-555-0842, john@doe.com, with a clean white background and navy dots.",
  "Create a QR for the Wi-Fi network 'VineGuest' password 'SipSip2025', with a dark mode theme and futuristic dots.",
] as const;

export async function generateQRCodeWithAI(text: string): Promise<QrPreviewProps> {
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

  return (await response.json()) as QrPreviewProps;
}

export default function AICreateQr() {
  const svgCaptureRef = useRef<HTMLDivElement>(null);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  const [selectedIconName, setSelectedIconName] = useState<string | undefined>(undefined);
  const [selectedIconSize, setSelectedIconSize] = useState<number>(32);
  const [selectedIconColor, setSelectedIconColor] = useState<string | undefined>(undefined);
  const [inputText, setInputText] = useState("");
  const [previewProps, setPreviewProps] = useState<QrPreviewProps | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % EXAMPLE_PROMPTS.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  function handleSave() {
    if (!qrContainerRef.current) {
      return;
    }

    const svg = qrContainerRef.current.querySelector("svg");
    if (!svg) {
      return;
    }

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

  function handleReset() {
    setPreviewProps(null);
    setInputText("");
    setError(null);
  }

  async function handleGenerate(promptText?: string) {
    const requestText = (promptText ?? inputText).trim();
    if (!requestText) {
      return;
    }

    setInputText(requestText);
    setLoading(true);
    setError(null);

    try {
      const apiResponse = await generateQRCodeWithAI(requestText);
      const mappedPreview = mapApiResponseToQrPreviewProps(
        apiResponse as unknown as MistralQrResponse
      );
      const logoName = mappedPreview.logoSettings?.src;
      const logoSize = 40;
      const logoColor = mappedPreview.styleSettings?.dotColors?.[0] ?? "#000000";

      setSelectedIconName(logoName);
      setSelectedIconSize(logoSize);
      setSelectedIconColor(logoColor);

      setTimeout(() => {
        const svgEl = svgCaptureRef.current?.querySelector("svg");
        if (!svgEl) {
          setPreviewProps(mappedPreview);
          return;
        }

        svgEl.style.color = mappedPreview.styleSettings?.dotColors?.[0] ?? "#000000";

        if ((logoName as string | undefined)?.startsWith("Si")) {
          const computedColor =
            window.getComputedStyle(svgEl).color ??
            (mappedPreview.styleSettings?.dotColors?.[0] ?? "#000000");
          svgEl.setAttribute("fill", computedColor);
          svgEl.querySelectorAll("path, circle, rect, polygon").forEach((el) => {
            el.setAttribute("fill", computedColor);
          });
        } else {
          svgEl.setAttribute("stroke-width", "3");
          svgEl.setAttribute("stroke", mappedPreview.styleSettings?.dotColors?.[0] ?? "#000000");
        }

        svgEl.setAttribute("width", `${logoSize}px`);
        svgEl.setAttribute("height", `${logoSize}px`);

        const svgString = svgEl.outerHTML.trim();
        const dataUri = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgString)}`;
        const previewWithLogo: QrPreviewProps = {
          ...mappedPreview,
          logoSettings: {
            src: dataUri,
            size: 0.4,
            hideBackgroundDots: true,
            margin: 3,
          },
        };

        setPreviewProps(previewWithLogo);
      }, 200);
    } catch (generationError) {
      console.error("QR generation failed", generationError);
      setError("The AI could not turn that prompt into a QR code. Try being more specific.");
      setPreviewProps(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full">
      <div className="overflow-hidden rounded-[28px] border border-border/60 bg-background shadow-[0_24px_80px_-32px_rgba(15,23,42,0.5)]">
        <div className="grid min-h-[620px] lg:grid-cols-[1.15fr_0.85fr]">
          <section className="flex min-h-0 flex-col border-b border-border/60 bg-background lg:border-r lg:border-b-0">
            <div className="border-b border-border/60 bg-linear-to-b from-muted/50 to-background px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-2xl bg-foreground text-background shadow-sm">
                  <WandSparkles className="size-4" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold tracking-tight">AI Create</h2>
                  <p className="text-sm text-muted-foreground">Describe the code you want.</p>
                </div>
              </div>
            </div>

            <div className="border-b border-border/60 px-6 py-5">
              <div className="rounded-[24px] border border-border/70 bg-muted/25 p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <p className="text-sm font-medium">Prompt</p>
                  <p className="text-xs text-muted-foreground">Cmd/Ctrl + Enter</p>
                </div>
                <Textarea
                  value={inputText}
                  onChange={(event) => setInputText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                      event.preventDefault();
                      void handleGenerate();
                    }
                  }}
                  placeholder={EXAMPLE_PROMPTS[placeholderIndex]}
                  className="min-h-[164px] resize-none border-0 bg-transparent px-0 text-[15px] leading-6 shadow-none focus-visible:ring-0"
                />
                <div className="mt-4 flex justify-end">
                  <Button
                    onClick={() => void handleGenerate()}
                    disabled={loading || !inputText.trim()}
                    className="rounded-xl px-5"
                  >
                    {loading ? <LoaderCircle className="animate-spin" /> : <Sparkles />}
                    {loading ? "Generating" : "Generate QR"}
                  </Button>
                </div>
              </div>
            </div>

            <Command className="min-h-0 flex-1 rounded-none border-0 bg-transparent">
              <CommandList className="max-h-none">
                <CommandGroup heading="Examples" className="px-4 py-4">
                  {EXAMPLE_PROMPTS.map((prompt) => (
                    <CommandItem
                      key={prompt}
                      value={prompt}
                      onSelect={() => setInputText(prompt)}
                      className="group rounded-2xl border border-transparent px-4 py-3 transition-colors data-[selected=true]:border-border data-[selected=true]:bg-muted/70"
                    >
                      <div className="flex w-full items-start gap-3">
                        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-muted/80 text-muted-foreground transition-colors group-data-[selected=true]:bg-background group-data-[selected=true]:text-foreground">
                          <Sparkles className="size-3.5" />
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm leading-5">{prompt}</p>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </section>

          <aside className="flex min-h-0 flex-col bg-muted/20">
            <div className="border-b border-border/60 px-6 py-5">
              <p className="text-sm font-medium">Preview</p>
            </div>

            <div className="flex flex-1 flex-col justify-between gap-5 px-6 py-6">
              <div
                className={cn(
                  "relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-[28px] border border-border/70 bg-background p-6 shadow-sm",
                  !previewProps && !loading && "bg-[radial-gradient(circle_at_top,#f5f8ff,transparent_55%),linear-gradient(to_bottom,#ffffff,#fafafa)]"
                )}
              >
                <div
                  ref={svgCaptureRef}
                  style={{ position: "absolute", visibility: "hidden", pointerEvents: "none" }}
                >
                  {selectedIconName ? (
                    <Icon
                      name={selectedIconName}
                      size={selectedIconSize}
                      color={selectedIconColor}
                    />
                  ) : null}
                </div>

                {loading ? (
                  <div className="w-full space-y-4">
                    <Skeleton className="mx-auto h-64 w-64 rounded-[24px]" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ) : previewProps ? (
                  <div className="w-full space-y-5">
                    <div ref={qrContainerRef} className="mx-auto flex w-full max-w-[288px] justify-center">
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
                        className="h-72 w-72"
                      />
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-3">
                      <p className="line-clamp-2 text-sm leading-6 break-all text-foreground/90">
                        {previewProps.data}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-sm text-center">
                    <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-[22px] bg-foreground text-background shadow-sm">
                      <Sparkles className="size-7" />
                    </div>
                    <h3 className="text-xl font-semibold tracking-tight">Your QR will appear here.</h3>
                  </div>
                )}
              </div>

              <div className="space-y-4 rounded-[24px] border border-border/70 bg-background px-5 py-4 shadow-sm">
                {error ? (
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={loading && !previewProps}
                    className="rounded-xl"
                  >
                    Reset
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={!previewProps || loading}
                    className="rounded-xl"
                  >
                    <Download />
                    Download SVG
                  </Button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
