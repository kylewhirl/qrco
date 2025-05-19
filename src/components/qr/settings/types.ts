import { Dispatch, SetStateAction } from "react";

export interface StyleSettings {
    dotStyle?: "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded";
    dotColorType?: "solid" | "gradient";
    dotColors?: string[];
    dotGradientType?: "linear" | "radial";
    dotRotation?: number;
    eyeStyle?: "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded" | "dot";
    eyeColorType?: "solid" | "gradient";
    eyeColors?: string[];
    eyeGradientType?: "linear" | "radial";
    eyeRotation?: number;
    innerEyeStyle?: "none" | "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded" | "dot";
    innerEyeColorType?: "solid" | "gradient";
    innerEyeColors?: string[];
    innerEyeGradientType?: "linear" | "radial";
    innerEyeRotation?: number;
    bgColorType?: "solid" | "gradient";
    bgColors?: string[];
    bgGradientType?: "linear" | "radial";
    bgRotation?: number;
  }

  export interface EyeSettings {
    settings: {
      eyeStyle: "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded" | "dot";
      eyeColor: string;
      innerEyeStyle: "none" | "square" | "dots" | "rounded" | "extra-rounded" | "classy" | "classy-rounded" | "dot";
      innerEyeColor: string;
    };
    onChange: Dispatch<SetStateAction<EyeSettings["settings"]>>;
  }

  export interface ErrorLevelSettings {
    value: "L" | "M" | "Q" | "H";
    onChange: Dispatch<SetStateAction<ErrorLevelSettings["value"]>>;
  }

  export interface BorderSettings {
    settings: {
      shape: "square" | "circle";
      colorType: "solid" | "gradient";
      colors: string[];
      gradientType: "linear" | "radial";
      rotation: number;
      preset: string;
      text: string;
      textStyle?: string;
    };
    onChange: Dispatch<SetStateAction<BorderSettings["settings"]>>;
  }

  