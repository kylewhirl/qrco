import React, { CSSProperties } from "react";

import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { type VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";

export interface ShimmerButtonProps
  extends React.ComponentPropsWithoutRef<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  shimmerColor?: string;
  shimmerSize?: string;
  borderRadius?: string;
  shimmerDuration?: string;
  background?: string;
}

export const ShimmerButton = React.forwardRef<
  HTMLButtonElement,
  ShimmerButtonProps
>(
  (
    {
      variant,
      size,
      asChild = false,
      shimmerColor: customShimmerColor,
      shimmerSize = "0.05em",
      shimmerDuration = "3s",
      borderRadius = "100px",
      background: customBackground,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    const variantShimmerStyles: Record<string, { background: string; shimmerColor: string }> = {
      default:        { background: 'var(--primary)',          shimmerColor: 'var(--primary-foreground)' },
      destructive:    { background: 'var(--destructive)',      shimmerColor: 'white' },
      outline:        { background: 'var(--background)',       shimmerColor: 'var(--foreground)' },
      secondary:      { background: 'var(--secondary)',        shimmerColor: 'var(--secondary-foreground)' },
      ghost:          { background: 'transparent',             shimmerColor: 'var(--accent)' },
      link:           { background: 'transparent',             shimmerColor: 'var(--primary)' },
    };
    const mapped = variantShimmerStyles[variant ?? 'default'];
    const finalBackground    = customBackground    ?? mapped.background;
    const finalShimmerColor  = customShimmerColor  ?? mapped.shimmerColor;
    return (
      <Comp
        style={
          {
            "--spread": "90deg",
            "--shimmer-color": finalShimmerColor,
            "--radius": borderRadius,
            "--speed": shimmerDuration,
            "--cut": shimmerSize,
            "--bg": finalBackground,
          } as CSSProperties
        }
        className={cn(
          buttonVariants({ variant, size }),
          "group relative z-0 flex cursor-pointer items-center justify-center overflow-hidden whitespace-nowrap border border-white/10 [background:var(--bg)] [border-radius:var(--radius)]",
          "transform-gpu transition-transform duration-300 ease-in-out active:translate-y-px",
          className,
        )}
        ref={ref}
        {...props}
      >
        {/* spark container */}
        <div
          className={cn(
            "-z-30 blur-[2px]",
            "absolute inset-0 overflow-visible [container-type:size]",
          )}
        >
          {/* spark */}
          <div className="absolute inset-0 h-[100cqh] animate-shimmer-slide [aspect-ratio:1] [border-radius:0] [mask:none]">
            {/* spark before */}
            <div className="absolute -inset-full w-auto rotate-0 animate-spin-around [background:conic-gradient(from_calc(270deg-(var(--spread)*0.5)),transparent_0,var(--shimmer-color)_var(--spread),transparent_var(--spread))] [translate:0_0]" />
          </div>
        </div>
        {children}

        {/* Highlight */}
        <div
          className={cn(
            "insert-0 absolute size-full",

            "rounded-2xl px-4 py-1.5 text-sm font-medium shadow-[inset_0_-8px_10px_#ffffff1f]",

            // transition
            "transform-gpu transition-all duration-300 ease-in-out",

            // on hover
            "group-hover:shadow-[inset_0_-6px_10px_#ffffff3f]",

            // on click
            "group-active:shadow-[inset_0_-10px_10px_#ffffff3f]",
          )}
        />

        {/* backdrop */}
        <div
          className={cn(
            "absolute -z-20 [background:var(--bg)] [border-radius:var(--radius)] [inset:var(--cut)]",
          )}
        />
      </Comp>
    );
  },
);

ShimmerButton.displayName = "ShimmerButton";
