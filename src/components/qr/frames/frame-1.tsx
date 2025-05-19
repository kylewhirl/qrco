"use client";

import React from "react";

export interface Frame1Props {
  colorType: "solid" | "gradient";
  colors: string[];
  gradientType: "linear" | "radial";
  rotation: number;
  text: string;
  textStyle?: string;
  style?: React.CSSProperties;
}

export default function Frame1({
  colorType,
  colors,
  gradientType,
  rotation,
  text,
  textStyle,
  style,
}: Frame1Props) {
  // Build a CSS fill or gradient string for SVG if needed
  const fillValue =
    colorType === "solid"
      ? colors[0]
      : `${gradientType}-gradient(${rotation}deg, ${colors
          .map((c, i) => `${c} ${i === 0 ? 0 : 100}%`)
          .join(", ")})`;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        ...style,
      }}
    >
      {/* Frame background SVG */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/frame-1.svg"
        alt="QR Frame"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          color: fillValue,
        }}
      />

      {/* Overlay text */}
      {text && (
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            width: "100%",
            textAlign: "center",
            pointerEvents: "none",
            fontStyle: textStyle,
            color: colors[0],
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
}
