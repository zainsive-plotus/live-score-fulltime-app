// src/components/LottiePreloader.tsx
"use client";

import Lottie from "lottie-react";
// Import the animation data directly from the public folder
import animationData from "../../public/fanskor-preloader.json";

export default function LottiePreloader() {
  const style = {
    height: 250, // Adjust size as needed
    width: 250,
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <Lottie animationData={animationData} style={style} loop={true} />
    </div>
  );
}
