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
    <Card className={`w-full min-w-0 gap-4 rounded-2xl border-0 bg-transparent p-0 shadow-none ${className ?? ""}`}>
      <h3 className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Error correction</h3>
      <div className="flex flex-col space-y-1">
        <Label htmlFor="error-level-select">Select Level</Label>
        <Select value={value} onValueChange={(v) => onChange(v as "L" | "M" | "Q" | "H")}>
          <SelectTrigger id="error-level-select" className="w-full rounded-xl border-border">
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
