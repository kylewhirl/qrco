import React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Pipette } from "lucide-react"
import { averageColors, getContrastColor } from "@/lib/utils";
import { parseColorValue } from "@/lib/utils";
import GradientColorPicker from "react-best-gradient-color-picker";
import { useDebouncedCallback } from "use-debounce";
import { useTheme } from "next-themes";


export interface ColorPickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  color: string;
  disabled?: boolean;
  disableGradient?: boolean;
  disableMobilePicker?: boolean;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, className, disabled = false, disableGradient = false, disableMobilePicker = false, ...props }) => {
  
  const { resolvedTheme } = useTheme();
  console.log(resolvedTheme);
  // Determine if the current color string is a gradient
  const isGradient = !disableGradient && (color.startsWith("linear-gradient") || color.startsWith("radial-gradient"));
  // Compute button background style
  const buttonStyle: React.CSSProperties = disabled
    ? {}
    : isGradient
    ? { background: color }
    : { backgroundColor: color };
  // Determine contrast base color by averaging all stops (solid or gradient)
  const colorStops = isGradient ? parseColorValue(color).colors : [color];
  const avgColor = averageColors(colorStops);
  const iconContrastColor = getContrastColor(avgColor);

  // Debounced handler to prevent rapid updates from gradient picker
  const debouncedChange = useDebouncedCallback((newColor: string) => {
    if (props.onChange) {
      const syntheticEvent = {
        target: { value: newColor }
      } as React.ChangeEvent<HTMLInputElement>;
      props.onChange(syntheticEvent);
    }
  }, 10);

  return (
    <Popover>
      <div className="relative inline-block">
        <PopoverTrigger asChild className="flex items-center">
          <Button
            size="icon"
            variant="outline"
            className={className}
            disabled={disabled}
            style={buttonStyle}
          >
            <Pipette color={iconContrastColor} className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        {!disabled && (
          <input
            type="color"
            value={color}
            onClick={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
            onChange={e => {
              const newColor = e.target.value;
              if (props.onChange) {
                const syntheticEvent = {
                  target: { value: newColor }
                } as React.ChangeEvent<HTMLInputElement>;
                props.onChange(syntheticEvent);
              }
            }}
            className={`absolute inset-0 w-full h-full opacity-0 ${disableMobilePicker ? "" : "hidden"} sm:hidden cursor-pointer`}
          />
        )}
      </div>
      <PopoverContent className="w-auto p-4">
            <GradientColorPicker
                value={color}
                onChange={newColor => {
                  if (props.onChange) {
                    if (!disableGradient) {
                      debouncedChange(newColor);
                    } else {
                      const syntheticEvent = {
                        target: { value: newColor }
                      } as React.ChangeEvent<HTMLInputElement>;
                      props.onChange(syntheticEvent);
                    }
                  }
                }}
                disableDarkMode={resolvedTheme === "light"}
                disableLightMode={resolvedTheme === "dark"}
                {...(disableGradient ? {
                  hideColorTypeBtns: true,
                  hideGradientControls: true,
                  hideGradientType: true,
                  hideGradientAngle: true,
                  hideGradientStop: true,
                } : {})}
            />
      </PopoverContent>
    </Popover>
  );
};