"use client";

import React from "react";
import { Dispatch, SetStateAction } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export interface EyeSettingsProps {
  settings: {
    eyeStyle: "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded" | "dot";
    eyeColor: string;
    innerEyeStyle: "none" | "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded" | "dot";
    innerEyeColor: string;
  };
  onChange: Dispatch<SetStateAction<EyeSettingsProps["settings"]>>;
}

export default function EyeSettings({ settings, onChange }: EyeSettingsProps) {
  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-lg font-medium">Eye Settings</h3>

      {/* Eye style */}
      <div className="flex flex-col space-y-1">
        <Label htmlFor="eye-style">Eye Shape</Label>
        <Select
          value={settings.eyeStyle}
          onValueChange={(value) => onChange({ ...settings, eyeStyle: value as "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded" | "dot" })}
        >
          <SelectTrigger id="eye-style">
            <SelectValue placeholder="Select eye style" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="square">Square</SelectItem>
            <SelectItem value="extra-rounded">Extra Rounded</SelectItem>
            <SelectItem value="dot">Dot</SelectItem>
            <SelectItem value="rounded">Rounded</SelectItem>
            <SelectItem value="classy">Classy</SelectItem>
            <SelectItem value="classy-rounded">Classy Rounded</SelectItem>
            <SelectItem value="dots">Dots</SelectItem>
            <SelectItem value="none">None</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col space-y-1">
        <Label htmlFor="eye-color">Eye Color</Label>
        <Input
          id="eye-color"
          type="color"
          value={settings.eyeColor}
          onChange={(e) =>
            onChange({ ...settings, eyeColor: e.target.value })
          }
          className="h-10 w-16 p-0"
        />
      </div>

      {/* Inner eye style */}
      {/* Eye style */}
      <div className="flex flex-col space-y-1">
        <Label htmlFor="inner-eye-style">Inner Eye Shape</Label>
        <Select
          value={settings.innerEyeStyle}
          onValueChange={(value) => onChange({ ...settings, innerEyeStyle: value as "none" | "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded" | "dot" })}
        >
          <SelectTrigger id="inner-eye-style">
            <SelectValue placeholder="Select inner eye style" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="square">Square</SelectItem>
            <SelectItem value="none">None</SelectItem>
            <SelectItem value="dot">Dot</SelectItem>
            <SelectItem value="rounded">Rounded</SelectItem>
            <SelectItem value="extra-rounded">Extra Rounded</SelectItem>
            <SelectItem value="classy">Classy</SelectItem>
            <SelectItem value="classy-rounded">Classy Rounded</SelectItem>
            <SelectItem value="dots">Dots</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col space-y-1">
        <Label htmlFor="inner-eye-color">Inner Eye Color</Label>
        <Input
          id="inner-eye-color"
          type="color"
          value={settings.innerEyeColor}
          onChange={(e) =>
            onChange({ ...settings, innerEyeColor: e.target.value })
          }
          className="h-10 w-16 p-0"
        />
      </div>
    </Card>
  );
}
