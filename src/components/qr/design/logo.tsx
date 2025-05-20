"use client";

import React, { useRef, useState, } from "react";
import { Icon } from "@/components/ui/icon-picker";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { IconPicker, IconName } from "@/components/ui/icon-picker";
import { ColorPicker } from "@/components/ui/color-picker";
import { Slider } from "@/components/ui/slider";

export default function LogoSettings({
  settings,
  onChange,
  className,
}: {
  settings?: { src: string; size: number; margin?: number; hideBackgroundDots?: boolean; color?: string; strokeWidth?: number };
  onChange?: (logo: { src?: string; size: number; margin?: number; hideBackgroundDots?: boolean; color?: string; strokeWidth?: number } | undefined) => void;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [logoSettings, setLogoSettings] = useState<{
    src?: string;
    size: number;
    margin: number;
    hideBackgroundDots: boolean;
    color: string;
    strokeWidth: number;
  } | undefined>(settings ? {
    src: settings.src,
    size: settings.size,
    margin: settings.margin ?? 2,
    hideBackgroundDots: settings.hideBackgroundDots ?? true,
    color: settings.color ?? "#000000",
    strokeWidth: settings.strokeWidth ?? 2,
  } : undefined);

  const [selectedIconName, setSelectedIconName] = useState<IconName | undefined>(undefined);
  const svgCaptureRef = useRef<HTMLDivElement>(null);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const newSettings = {
        src: result,
        size: 0.4,
        margin: 2,
        hideBackgroundDots: true,
        color: "#000000",
        strokeWidth: 2,
      };
      setLogoSettings(newSettings);
      onChange?.(newSettings);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setLogoSettings(undefined);
    onChange?.(undefined);
  };

  return (
    <Card className={`p-4${className ? ` ${className}` : ""}`}>
      {/* Hidden container to render and capture SVG */}
      <div ref={svgCaptureRef} style={{ position: "absolute", visibility: "hidden", pointerEvents: "none" }}>
        {selectedIconName && (
          <Icon
            name={selectedIconName}
            size={Math.round((logoSettings?.size ?? 0.4) * 100)}
          />
        )}
      </div>
      <h3 className="text-lg font-medium">Logo Settings</h3>
      <input
        type="file"
        accept="image/*"
        ref={inputRef}
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex items-center space-x-4">
        <Button
          size="icon"
          variant="outline"
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="h-4 w-4" />
        </Button>

        {logoSettings && (
          <button
            onClick={removeImage}
            className="relative h-10 w-10 rounded-md overflow-hidden group border border-border"
            aria-label="Remove logo"
          >
            {logoSettings.src ? (
              // Use <img> for SVG data URLs
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoSettings.src} alt="Logo preview" className="h-full w-full object-cover" />
            ) : null}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <X className="h-4 w-4 text-white" />
            </div>
          </button>
        )}
      </div>

      <div className="flex items-center space-x-4">
        <label className="text-sm">Or select an icon</label>
        <IconPicker
          value={undefined}
          onValueChange={(iconName, hex) => {
            setSelectedIconName(iconName as IconName);
            // After DOM updates, capture the SVG
            setTimeout(() => {
              const svgEl = svgCaptureRef.current?.querySelector("svg");
              if (!svgEl) return;
              // Force inline color style to resolve currentColor properly
              svgEl.style.color = hex ?? logoSettings?.color ?? "#000000";
              if ((iconName as string).startsWith("Si")) {
                // Si capture logic (computed fill + dimensions)
                const computedColor = window.getComputedStyle(svgEl).color || (logoSettings?.color ?? "#000000");
                svgEl.setAttribute("fill", computedColor);
                svgEl.querySelectorAll("path, circle, rect, polygon").forEach(el => {
                  el.setAttribute("fill", computedColor);
                });
              } else {
                // Lucide capture logic
                svgEl.setAttribute("stroke-width", (logoSettings?.strokeWidth ?? 2).toString());
                svgEl.setAttribute("stroke", logoSettings?.color ?? "#000000");
              }
              // Force pixel size
              const sizePx = Math.round((logoSettings?.size ?? 0.4) * 100);
              svgEl.setAttribute("width", `${sizePx}px`);
              svgEl.setAttribute("height", `${sizePx}px`);
              // Serialize
              const svgString = svgEl.outerHTML.trim();
              const dataUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgString)}`;
              const updated = {
                src: dataUrl,
                size: logoSettings?.size ?? 0.4,
                margin: logoSettings?.margin ?? 2,
                hideBackgroundDots: logoSettings?.hideBackgroundDots ?? true,
                color: hex ?? logoSettings?.color ?? "#000000",
                strokeWidth: logoSettings?.strokeWidth ?? 2,
              };
              setLogoSettings(updated);
              onChange?.(updated);
            }, 0);
          }}
        />
        {logoSettings && (
          <div className="flex items-center space-x-4">
            <div className="flex flex-col">
              <label className="text-sm">Color</label>
              <ColorPicker
                id="logo-color"
                color={logoSettings.color}
                onChange={(e) => {
                  const newColor = e.target.value;
                  const base = { ...logoSettings, color: newColor };
                  setLogoSettings(base);
                  onChange?.(base);
                  setTimeout(() => {
                    const svgEl = svgCaptureRef.current?.querySelector("svg");
                    if (!svgEl) return;
                    // Inline style color for correct RGB resolution
                    svgEl.style.color = newColor;
                    if ((selectedIconName ?? "").startsWith("Si")) {
                      // Si: inline fill to newColor
                      svgEl.querySelectorAll("path, circle, rect, polygon").forEach(el => {
                        el.setAttribute("fill", newColor);
                      });
                    } else {
                      // Lucide
                      svgEl.setAttribute("stroke", newColor);
                      svgEl.setAttribute("stroke-width", (base.strokeWidth ?? 2).toString());
                    }
                    let svgString = svgEl.outerHTML.trim();
                    const sizePx = Math.round((base.size ?? 0.4) * 100);
                    svgEl.setAttribute("width", `${sizePx}`);
                    svgEl.setAttribute("height", `${sizePx}`);
                    svgString = svgEl.outerHTML.trim();
                    const dataUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgString)}`;
                    const full = { ...base, src: dataUrl };
                    setLogoSettings(full);
                    onChange?.(full);
                  }, 0);
                }}
                className=""
                disableGradient
              />
            </div>
            <div className="flex flex-col">
            <label className="text-sm">Stroke Width</label>
              <Input
                type="number"
                min={0}
                max={10}
                step={0.5}
                value={logoSettings.strokeWidth}
                onChange={(e) => {
                  const newStroke = parseFloat(e.target.value);
                  const base = { ...logoSettings, strokeWidth: newStroke };
                  setLogoSettings(base);
                  onChange?.(base);
                  setTimeout(() => {
                    const svgEl = svgCaptureRef.current?.querySelector("svg");
                    if (!svgEl) return;
                    // Inline style color so fill remains correct
                    svgEl.style.color = base.color ?? "#000000";
                    if ((selectedIconName ?? "").startsWith("Si")) {
                      // Si: no stroke, just ensure fill remains
                      svgEl.querySelectorAll("path, circle, rect, polygon").forEach(el => {
                        el.setAttribute("fill", base.color ?? "#000000");
                      });
                    } else {
                      // Lucide
                      svgEl.setAttribute("stroke-width", newStroke.toString());
                      svgEl.setAttribute("stroke", base.color ?? "#000000");
                    }
                    let svgString = svgEl.outerHTML.trim();
                    const sizePx = Math.round((base.size ?? 0.4) * 100);
                    svgEl.setAttribute("width", `${sizePx}`);
                    svgEl.setAttribute("height", `${sizePx}`);
                    svgString = svgEl.outerHTML.trim();
                    const dataUrl = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgString)}`;
                    const full = { ...base, src: dataUrl };
                    setLogoSettings(full);
                    onChange?.(full);
                  }, 0);
                }}
                className="w-24"
                disabled={(selectedIconName ?? "").startsWith("Si")}
                title={(selectedIconName ?? "").startsWith("Si") 
                  ? "Stroke width not applicable for filled icons" 
                  : undefined}
              />
            </div>
          </div>
        )}
      </div>

      {logoSettings && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm">Hide Background Dots</label>
            <Switch
              checked={logoSettings.hideBackgroundDots}
              onCheckedChange={(checked) => {
                const updated = { ...logoSettings, hideBackgroundDots: checked };
                setLogoSettings(updated);
                onChange?.(updated);
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm">Margin</label>
            <Slider
              defaultValue={[logoSettings.margin]}
              max={30}
              step={1}
              className="w-24"
              onValueChange={(values) => {
                const newMargin = values[0];
                const updated = { ...logoSettings, margin: newMargin };
                setLogoSettings(updated);
                onChange?.(updated);
              }}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm">Size</label>
            <Slider
              defaultValue={[logoSettings.size]}
              min={0.1}
              max={1}
              step={0.1}
              className="w-24"
              onValueChange={(values) => {
                const newSize = values[0];
                const updated = { ...logoSettings, size: newSize };
                setLogoSettings(updated);
                onChange?.(updated);
              }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
