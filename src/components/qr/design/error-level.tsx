"use client";

import React from "react";
import { Dispatch, SetStateAction } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

export interface ErrorLevelSettingsProps {
  value: "L" | "M" | "Q" | "H";
  onChange: Dispatch<SetStateAction<ErrorLevelSettingsProps["value"]>>;
  className?: string;
}

export default function ErrorLevelSettings({
  value,
  onChange,
  className,
}: ErrorLevelSettingsProps) {
  return (
    <Card className={`p-4${className ? ` ${className}` : ""}`}>
      <h3 className="text-lg font-medium">Error Correction Level</h3>
      <div className="flex flex-col space-y-1">
        <Label htmlFor="error-level-select">Select Level</Label>
        <Select value={value} onValueChange={(v) => onChange(v as "L" | "M" | "Q" | "H")}>
          <SelectTrigger id="error-level-select">
            <SelectValue placeholder="Select level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="L">Low</SelectItem>
            <SelectItem value="M">Medium</SelectItem>
            <SelectItem value="Q">Quartile</SelectItem>
            <SelectItem value="H">High</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </Card>
  );
}