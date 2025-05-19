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
}

export default function BorderSettings({
  settings,
  onChange,
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
    <Card className="p-4 space-y-4">
      <h3 className="text-lg font-medium">Border Settings</h3>
      <div className="flex flex-wrap gap-2">
        {presets.map(({ id, render }) => (
          <div
            key={id}
            onClick={() => onChange({ ...settings, preset: id })}
            className={`p-1 rounded ${settings.preset === id ? "ring-2 ring-blue-500" : ""}`}
          >
            {render()}
          </div>
        ))}
      </div>
      <div className ="flex flex-row space-x-6">
        <div className="flex flex-col space-y-1">
            <Label htmlFor="shape">Shape</Label>
            <Select
                value={settings.shape}
                onValueChange={(value) =>
                    onChange({ ...settings, shape: value as "square" | "circle" })
                }
                >
                <SelectTrigger
                    id="shape"
                >
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
          className="rounded-md border px-2 py-1"
        />
      </div>
    </Card>
  );
}