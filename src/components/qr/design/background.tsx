"use client";

import React from "react";
import { Dispatch, SetStateAction } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ColorPicker } from "@/components/ui/color-picker";
import { parseColorValue } from "@/lib/utils";

export interface BackgroundSettingsProps {
  settings: {
    colorType: "solid" | "gradient";
    colors: string[];
    gradientType: "linear" | "radial";
    rotation: number;
  };
  onChange: Dispatch<SetStateAction<BackgroundSettingsProps["settings"]>>;
}

export default function BackgroundSettings({
  settings,
  onChange,
}: BackgroundSettingsProps) {
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
      <h3 className="text-lg font-medium">Background Settings</h3>
      <div className="flex flex-col space-y-1">
        <Label htmlFor="background-color">Background Color</Label>
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
              colorType,
              colors,
              gradientType,
              rotation,
            });
          }}
        />
      </div>
    </Card>
  );
}