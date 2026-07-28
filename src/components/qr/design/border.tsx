"use client";

import React from "react";
import { Dispatch, SetStateAction } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ColorPicker } from "@/components/ui/color-picker";
import { parseColorValue } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select";
import Image from "next/image";

export interface BorderSettingsProps {
  settings: {
    shape: "square" | "circle";
    colorType: "solid" | "gradient";
    colors: string[];
    gradientType: "linear" | "radial";
    rotation: number;
    preset: string;
    text: string;
    textStyle?: string;
  };
  onChange: Dispatch<SetStateAction<BorderSettingsProps["settings"]>>;
  className?: string;
}

export default function BorderSettings({
  settings,
  onChange,
  className,
}: BorderSettingsProps) {
  const presets = [
    {
      id: "custom-svg",
      label: "Classic",
      render: () => (
        <Image
          src="/frame-2.svg"
          width={16}
          height={16}
          alt="Frame 1 Preview"
          className="w-16 h-16 object-fit cursor-pointer"
        />
      ),
    },
    // ... existing presets
    {
      id: "frame-1",
      label: "Frame 1",
      render: () => (
        <Image
          src="/frame-1.svg"
          width={16}
          height={16}
          alt="Frame 1 Preview"
          className="w-16 h-16 object-fit cursor-pointer"
        />
      ),
    },
  ];
  const gradientValue =
    settings.gradientType === "linear"
      ? `linear-gradient(${settings.rotation}deg, ${settings.colors
          .map((c, i) => `${c} ${i === 0 ? 0 : 100}%`)
          .join(", ")})`
      : `radial-gradient(circle, ${settings.colors
          .map((c, i) => `${c} ${i === 0 ? 0 : 100}%`)
          .join(", ")})`;

  return (
    <Card className={`w-full min-w-0 gap-4 rounded-2xl border-0 bg-transparent p-0 shadow-none ${className ?? ""}`}>
      <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Frame</h3>
      <div className="grid grid-cols-2 gap-2">
        {presets.map(({ id, render }) => (
          <button
            type="button"
            key={id}
            onClick={() => onChange({ ...settings, preset: id })}
            className={`flex min-w-0 items-center justify-center rounded-xl border p-2 transition ${settings.preset === id ? "border-[var(--brand-blue)] bg-[color-mix(in_srgb,var(--brand-blue)_9%,var(--card))] shadow-[0_8px_18px_-14px_var(--brand-blue)]" : "border-border bg-background hover:border-[var(--brand-blue)]"}`}
          >
            {render()}
          </button>
        ))}
      </div>
      <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
        <div className="flex min-w-0 flex-col space-y-1">
            <Label htmlFor="shape">Shape</Label>
            <Select
                value={settings.shape}
                onValueChange={(value) =>
                    onChange({ ...settings, shape: value as "square" | "circle" })
                }
                >
                <SelectTrigger id="shape" className="w-full rounded-xl border-border">
                    <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                    {["square", "circle"].map((opt) => (
                    <SelectItem key={opt} value={opt}>
                        {opt.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}
                    </SelectItem>
                    ))}
                </SelectContent>
                </Select>
        </div>
        <div className="flex flex-col space-y-1">
            <Label htmlFor="background-color">Border Color</Label>
            <ColorPicker
            id="background-color"
            color={
                settings.colorType !== "gradient"
                ? settings.colors[0]
                : settings.gradientType === "linear"
                ? gradientValue
                : gradientValue
            }
            onChange={(e) => {
                const { colorType, colors, gradientType, rotation } = parseColorValue(
                e.target.value,
                {
                    gradientType: settings.gradientType,
                    rotation: settings.rotation,
                    colors: settings.colors,
                }
                );
                onChange({
                shape: settings.shape,
                colorType,
                colors,
                gradientType,
                rotation,
                text: settings.text,
                textStyle: settings.textStyle,
                preset: settings.preset,
                });
            }}
            />
        </div>
      </div>
      
      <div className="flex flex-col space-y-1">
        <Label htmlFor="border-text">Text</Label>
        <Input
          id="border-text"
          type="text"
          value={settings.text}
          onChange={(e) =>
            onChange({ ...settings, text: e.target.value })
          }
          className="w-full min-w-0 rounded-xl border-border px-3 py-1"
        />
      </div>
    </Card>
  );
}
