"use client";

import React from "react";
import { Dispatch, SetStateAction } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export interface ShapeSettingsProps {
  settings: {
    dotStyle: "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded";
    dotColor: string;
  };
  onChange: Dispatch<SetStateAction<ShapeSettingsProps["settings"]>>;
}

export default function ShapeSettings({ settings, onChange }: ShapeSettingsProps) {
  return (
    <Card className="p-4 space-y-4">
      <h3 className="text-lg font-medium">Shape Settings</h3>

      {/* Dot Style */}
      <div className="flex flex-col space-y-1">
        <Label htmlFor="dot-style">Dot Style</Label>
        <Select
          value={settings.dotStyle}
          onValueChange={(value) => onChange({ ...settings, dotStyle: value as "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded" })}
        >
          <SelectTrigger id="dot-style">
            <SelectValue placeholder="Select dot style" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="square">Square</SelectItem>
            <SelectItem value="dots">Dots</SelectItem>
            <SelectItem value="rounded">Rounded</SelectItem>
            <SelectItem value="extra-rounded">Extra Rounded</SelectItem>
            <SelectItem value="classy">Classy</SelectItem>
            <SelectItem value="classy-rounded">Classy Rounded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col space-y-1">
        <Label htmlFor="dot-color">Dot Color</Label>
        <Input
          id="dot-color"
          type="color"
          value={settings.dotColor}
          onChange={(e) =>
            onChange({ ...settings, dotColor: e.target.value })
          }
          className="h-10 w-16 p-0"
        />
      </div>
    </Card>
  );
}
