import React from "react";
import QRPreview from "@/components/qr-preview";

const FramePage = () => {
    const qrValue = "https://example.com";

    return (
        <main style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 40 }}>
            <h1>QR Code Preview</h1>
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
        </main>
    );
};

export default FramePage;