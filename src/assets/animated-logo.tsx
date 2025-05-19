"use client";

import React from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import type { LottieRefCurrentProps } from "lottie-react";

const Lottie = dynamic(() => import("lottie-react"), { ssr: false });
import animationData from "./lottie.json";

type LottieAnimationData = { op: number; fr: number };


interface AnimatedLogoProps {
  className?: string;
  color?: string;
  segment?: [number, number];
  startTimeSec?: number;
}

const AnimatedLogo: React.FC<AnimatedLogoProps> = ({ className, color, segment, startTimeSec }) => {
  const lottieRef = React.useRef<LottieRefCurrentProps>(null);

  React.useEffect(() => {
    if (lottieRef.current) {
      // If a frame segment is provided, play that segment; wrap if end < start
      if (segment) {
        const [start, end] = segment;
        const totalFrames = (animationData as LottieAnimationData).op;
        const segEnd = end === undefined ? totalFrames : end;
        const segments =
          segEnd < start
            ? [
                [start, totalFrames] as [number, number],
                [0, segEnd] as [number, number],
              ]
            : [[start, segEnd] as [number, number]];
        lottieRef.current.playSegments(segments, true);
      } else if (startTimeSec !== undefined) {
        const fps = (animationData as LottieAnimationData).fr;
        const startFrame = Math.round(startTimeSec * fps);
        // Play from the specified frame and then loop full animation
        lottieRef.current.goToAndPlay(startFrame, true);
      } else {
        // Default play full animation
        lottieRef.current.play();
      }
    }
  }, [segment, startTimeSec]);

  return (
    <motion.div
      className={`animated-logo${className ? ` ${className}` : ""}`}
      style={{ color }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={animationData}
        loop={true}
        rendererSettings={{ preserveAspectRatio: "xMidYMid meet" }}
      />
    </motion.div>
  );
};

export default AnimatedLogo;