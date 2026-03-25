import React from "react";
import { Popover, PopoverTrigger, PopoverContent } from "./popover";
import { Button } from "./button";
import { Pipette } from "lucide-react"
import { averageColors, getContrastColor } from "../utils";
import { parseColorValue } from "../utils";
import GradientColorPicker from "react-best-gradient-color-picker";
import { useDebouncedCallback } from "use-debounce";


export interface ColorPickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  color: string;
  disabled?: boolean;
  disableGradient?: boolean;
  disableMobilePicker?: boolean;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({ color, className, disabled = false, disableGradient = false, disableMobilePicker = false, ...props }) => {
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">("light");

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const getResolvedTheme = () => {
      if (document.documentElement.classList.contains("dark")) {
        return "dark" as const;
      }
      if (document.documentElement.classList.contains("light")) {
        return "light" as const;
      }
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    };

    const updateTheme = () => {
      setResolvedTheme(getResolvedTheme());
    };

    updateTheme();

    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = () => updateTheme();

    mediaQuery.addEventListener?.("change", handleMediaChange);

    return () => {
      observer.disconnect();
      mediaQuery.removeEventListener?.("change", handleMediaChange);
    };
  }, []);

  const isGradient = !disableGradient && (color.startsWith("linear-gradient") || color.startsWith("radial-gradient"));
  const buttonStyle: React.CSSProperties = disabled
    ? {}
    : isGradient
    ? { background: color }
    : { backgroundColor: color };
  const colorStops = isGradient ? parseColorValue(color).colors : [color];
  const avgColor = averageColors(colorStops);
  const iconContrastColor = getContrastColor(avgColor);

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
                {...(disableGradient ? {
                  hideColorTypeBtns: true,
                  hideGradientControls: true,
                  hideGradientType: true,
                  hideGradientAngle: true,
                  hideGradientStop: true,
                } : {})}
                disableDarkMode={resolvedTheme === "light"}
                disableLightMode={resolvedTheme === "dark"}
            />
      </PopoverContent>
    </Popover>
  );
};
