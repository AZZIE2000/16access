"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function PWASplashScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // Check if running as PWA
    const isPWAMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    setIsPWA(isPWAMode);

    // Hide splash after a short delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000); // Show for 2 seconds

    return () => clearTimeout(timer);
  }, []);

  // Only show splash screen when running as PWA and still loading
  if (!isPWA || !isLoading) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        backgroundImage: "url(/background.png)",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="flex flex-col items-center gap-8 px-8">
        {/* Logos Container */}
        <div className="flex items-center justify-center gap-6">
          {/* Amman Christmas Market Logo */}
          <div className="relative h-24 w-24 md:h-32 md:w-32">
            <Image
              src="/amman-christmas-market.png"
              alt="Amman Christmas Market"
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* 16th of May Logo */}
          <div className="relative h-24 w-24 md:h-32 md:w-32">
            <Image
              src="/16thofmay.png"
              alt="16th of May"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Loading Indicator */}
        <div className="flex flex-col items-center gap-3">
          <div className="h-1 w-32 overflow-hidden rounded-full bg-white/30">
            <div className="h-full w-full animate-pulse bg-white"></div>
          </div>
          <p className="text-sm font-medium text-white">Loading...</p>
        </div>
      </div>
    </div>
  );
}

