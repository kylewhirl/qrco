import React from "react";
import QRPreview from "@/components/qr-preview";

const FramePage = () => {
    const qrValue = "https://example.com";

    return (
        <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
          <section className="space-y-2">
            <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">Design Preview</p>
            <h1 className="text-3xl tracking-tight md:text-4xl">QR Code Preview</h1>
          </section>
          <div className="flex min-h-[420px] items-center justify-center border-2 border-foreground bg-card p-6">
            <QRPreview
                data={qrValue}
                errorLevel="H"
                margin={4}
                borderSettings={{
                  shape: "square",
                  colorType: "solid",
                  colors: ["#000000", "#000000"],
                  gradientType: "linear",
                  rotation: 0,
                  preset: "frame-1",
                  text: "My QR Frame",
                  textStyle: "italic",
                }}
                styleSettings={{
                  dotStyle: "rounded",
                  dotColorType: "solid",
                  dotColors: ["#000000", "#333333"],
                  eyeStyle: "square",
                  eyeColorType: "solid",
                  eyeColors: ["#000000", "#333333"],
                  innerEyeStyle: "dot",
                  innerEyeColorType: "solid",
                  innerEyeColors: ["#000000", "#333333"],
                  bgColorType: "solid",
                  bgColors: ["#ffffff", "#eeeeee"],
                }}
            />
          </div>
        </div>
    );
};

export default FramePage;
