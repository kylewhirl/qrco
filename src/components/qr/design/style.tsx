"use client";

import React, { Dispatch, SetStateAction } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { ColorPicker } from "@/components/ui/color-picker";
import { parseColorValue } from "@/lib/utils";

export interface StyleSettingsProps {
  settings: {
    // Shape
    dotStyle: "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded";
    eyeStyle: "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded" | "dot";
    innerEyeStyle: "none" | "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded" | "dot";
    // Color & Gradient
    dotColorType: "solid" | "gradient";
    dotColors: string[];
    dotGradientType?: "linear" | "radial";
    dotRotation?: number;
    eyeColorType: "solid" | "gradient";
    eyeColors: string[];
    eyeGradientType?: "linear" | "radial";
    eyeRotation?: number;
    innerEyeColorType: "solid" | "gradient";
    innerEyeColors: string[];
    innerEyeGradientType?: "linear" | "radial";
    innerEyeRotation?: number;
    bgColorType: "solid" | "gradient";
    bgColors: string[];
    bgGradientType?: "linear" | "radial";
    bgRotation?: number;
  };
  onChange: Dispatch<SetStateAction<StyleSettingsProps["settings"]>>;
}

export default function StyleSettings({ settings, onChange }: StyleSettingsProps) {
  const [advancedOpen, setAdvancedOpen] = React.useState(false);

  // Compute display value for color pickers: solid or CSS gradient
  const getPickerValue = (
    colorType: "solid" | "gradient",
    colors: string[] = [],
    gradientType?: "linear" | "radial",
    rotation?: number
  ): string => {
    if (colorType === "gradient" && colors.length >= 2 && gradientType) {
      // Percentage stops mapping
      const stops = colors
        .map((c, i) => `${c} ${i === 0 ? 0 : 100}%`)
        .join(", ");
      if (gradientType === "linear") {
        return `linear-gradient(${rotation ?? 0}deg, ${stops})`;
      }
      // radial
      return `radial-gradient(circle, ${stops})`;
    }
    return colors[0] || "";
  };

  const unifiedValue = getPickerValue(
    settings.dotColorType,
    settings.dotColors,
    settings.dotGradientType,
    settings.dotRotation
  );
  const dotValue = getPickerValue(
    settings.dotColorType,
    settings.dotColors,
    settings.dotGradientType,
    settings.dotRotation
  );
  const eyeValue = getPickerValue(
    settings.eyeColorType,
    settings.eyeColors,
    settings.eyeGradientType,
    settings.eyeRotation
  );
  const innerEyeValue = getPickerValue(
    settings.innerEyeColorType,
    settings.innerEyeColors,
    settings.innerEyeGradientType,
    settings.innerEyeRotation
  );
  const bgValue = getPickerValue(
      settings.bgColorType,
      settings.bgColors,
      settings.bgGradientType,
      settings.bgRotation
  );

  return (
    <Card className="p-4">
      <h3 className="text-lg font-medium">Style Settings</h3>

      
      <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 w-full">
        <div className="flex flex-row space-x-6 w-full items-center">
            <div className="flex flex-col space-y-1">
            <Label htmlFor="all-style">Style</Label>
            <Select
            value={settings.dotStyle}
            onValueChange={(value) =>
                onChange({
                ...settings,
                dotStyle: value as StyleSettingsProps["settings"]["dotStyle"],
                eyeStyle: value as StyleSettingsProps["settings"]["eyeStyle"],
                innerEyeStyle: "none",
                })
            }
            disabled={advancedOpen}
            >
            <SelectTrigger
                id="all-style"
                className={advancedOpen ? "opacity-50 cursor-not-allowed" : ""}
            >
                <SelectValue placeholder="Select style" />
            </SelectTrigger>
            <SelectContent>
                {["square", "dots", "rounded", "extra-rounded", "classy", "classy-rounded"].map((opt) => (
                <SelectItem key={opt} value={opt}>
                    {opt.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}
                </SelectItem>
                ))}
            </SelectContent>
            </Select>

            </div>
            <div className="flex flex-col space-y-1">
            <Label htmlFor="all-color">Color</Label>
            <ColorPicker
                id="all-color"
                color={unifiedValue}
                onChange={(e) => {
                const { colorType, colors, gradientType, rotation } = parseColorValue(
                    e.target.value,
                    {
                    gradientType: settings.dotGradientType,
                    rotation: settings.dotRotation,
                    colors: settings.dotColors,
                    }
                );
                onChange({
                    ...settings,
                    // dots
                    dotColorType: colorType,
                    dotColors: colors,
                    dotGradientType: gradientType,
                    dotRotation: rotation,
                    // eyes
                    eyeColorType: colorType,
                    eyeColors: colors,
                    eyeGradientType: gradientType,
                    eyeRotation: rotation,
                    // inner eyes
                    innerEyeColorType: colorType,
                    innerEyeColors: colors,
                    innerEyeGradientType: gradientType,
                    innerEyeRotation: rotation,
                });
                }}
                disabled={advancedOpen}
            />
            </div>
        </div>
        <div className="flex flex-row space-x-6 items-end">
            <div className="flex flex-col space-y-1">
                <div className="flex flex-col items-start space-y-1">
                    <Label htmlFor="background-color">Background Color</Label>
                    <ColorPicker
                    id="background-color"
                    color={
                        settings.bgColorType !== "gradient"
                        ? settings.bgColors[0]
                        : settings.bgGradientType === "linear"
                        ? bgValue
                        : bgValue
                    }
                    onChange={(e) => {
                        const { colorType, colors, gradientType, rotation } = parseColorValue(
                        e.target.value,
                        {
                            gradientType: settings.bgGradientType,
                            rotation: settings.bgRotation,
                            colors: settings.bgColors,
                        }
                        );
                        onChange({
                            ...settings,
                            bgColorType: colorType,
                            bgColors: colors,
                            bgGradientType: gradientType,
                            bgRotation: rotation,
                        });
                    }}
                    />
                </div>
            </div>
        </div>
      </div>
      

      <Accordion
        type="single"
        collapsible
        defaultValue=""
        onValueChange={val => setAdvancedOpen(!!val)}
      >
        <AccordionItem value="advanced">
          <AccordionTrigger>Advanced</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 w-full">
              {/* Shape Settings */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold">Shape</h4>
            
                <div className="flex flex-row space-x-6 items-center">
                    <div className="flex flex-col space-y-1">
                    <Label htmlFor="dot-style">Dot Style</Label>
                    <Select
                        value={settings.dotStyle}
                        onValueChange={(value) =>
                        onChange({ ...settings, dotStyle: value as StyleSettingsProps["settings"]["dotStyle"] })
                        }
                    >
                        <SelectTrigger id="dot-style">
                        <SelectValue placeholder="Select dot style" />
                        </SelectTrigger>
                        <SelectContent>
                        {["square", "dots", "rounded", "extra-rounded", "classy", "classy-rounded"].map((opt) => (
                            <SelectItem key={opt} value={opt}>
                            {opt.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    </div>

                    <div className="flex flex-col space-y-1">
                    <Label htmlFor="dot-color">Dot Color</Label>
                    
                    <ColorPicker 
                        id="color-picker"
                        color={dotValue} 
                        onChange={(e) => {
                          const { colorType, colors, gradientType, rotation } = parseColorValue(
                            e.target.value,
                            {
                              gradientType: settings.dotGradientType,
                              rotation: settings.dotRotation,
                              colors: settings.dotColors,
                            }
                          );
                          onChange({
                            ...settings,
                            dotColorType: colorType,
                            dotColors: colors,
                            dotGradientType: gradientType,
                            dotRotation: rotation,
                          });
                        }}
                    />
                    </div>
                </div>
                </div>
    
                {/* Eye Color */}

              {/* Eye Settings */}
              <div className="space-y-4">
                <h4 className="text-md font-semibold">Eyes</h4>

                {/* Eye Shape */}
                <div className="flex flex-row space-x-6 items-center">
                    <div className="flex flex-col space-y-1">
                    <Label htmlFor="eye-style">Eye Shape</Label>
                    <Select
                        value={settings.eyeStyle}
                        onValueChange={(value) =>
                        onChange({ ...settings, eyeStyle: value as StyleSettingsProps["settings"]["eyeStyle"] })
                        }
                    >
                        <SelectTrigger id="eye-style">
                        <SelectValue placeholder="Select eye style" />
                        </SelectTrigger>
                        <SelectContent>
                        {[
                            "square",
                            "extra-rounded",
                            "dot",
                            "rounded",
                            "classy",
                            "classy-rounded",
                            "dots",
                        ].map((opt) => (
                            <SelectItem key={opt} value={opt}>
                            {opt.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    </div>

                    <div className="flex flex-col space-y-1">
                    <Label htmlFor="eye-color">Eye Color</Label>
                    <ColorPicker
                        id="eye-color"
                        color={eyeValue}
                        onChange={(e) => {
                          const { colorType, colors, gradientType, rotation } = parseColorValue(
                            e.target.value,
                            {
                              gradientType: settings.eyeGradientType,
                              rotation: settings.eyeRotation,
                              colors: settings.eyeColors,
                            }
                          );
                          onChange({
                            ...settings,
                            eyeColorType: colorType,
                            eyeColors: colors,
                            eyeGradientType: gradientType,
                            eyeRotation: rotation,
                          });
                        }}
                    />
                    </div>
                </div>

                {/* Inner Eye Shape */}
                <div className="flex flex-row space-x-6 items-center">
                    <div className="flex flex-col space-y-1">
                    <Label htmlFor="inner-eye-style">Inner Eye Shape</Label>
                    <Select
                        value={settings.innerEyeStyle}
                        onValueChange={(value) =>
                        onChange({ ...settings, innerEyeStyle: value as StyleSettingsProps["settings"]["innerEyeStyle"] })
                        }
                    >
                        <SelectTrigger id="inner-eye-style">
                        <SelectValue placeholder="Select inner eye style" />
                        </SelectTrigger>
                        <SelectContent>
                        {["none", "square", "dot", "rounded", "extra-rounded", "classy", "classy-rounded", "dots"].map((opt) => (
                            <SelectItem key={opt} value={opt}>
                            {opt.replace("-", " ").replace(/\b\w/g, c => c.toUpperCase())}
                            </SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                    </div>

                    <div className="flex flex-col space-y-1">
                    <Label htmlFor="inner-eye-color">Inner Eye Color</Label>
                    <ColorPicker
                        id="inner-eye-color"
                        color={innerEyeValue}
                        onChange={(e) => {
                          const { colorType, colors, gradientType, rotation } = parseColorValue(
                            e.target.value,
                            {
                              gradientType: settings.innerEyeGradientType,
                              rotation: settings.innerEyeRotation,
                              colors: settings.innerEyeColors,
                            }
                          );
                          onChange({
                            ...settings,
                            innerEyeColorType: colorType,
                            innerEyeColors: colors,
                            innerEyeGradientType: gradientType,
                            innerEyeRotation: rotation,
                          });
                        }}
                    />
                    </div>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}