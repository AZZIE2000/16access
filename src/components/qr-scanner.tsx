"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Html5Qrcode } from "html5-qrcode";

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: Error) => void;
  autoStart?: boolean; // Auto-start camera when component mounts
}

export function QRScanner({
  onScan,
  onError,
  autoStart = false,
}: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const scannedCodesRef = useRef<Set<string>>(new Set());
  const lastScanTimeRef = useRef<number>(0);

  // Auto-start camera if autoStart is true
  useEffect(() => {
    if (autoStart && !isScanning && !isLoading) {
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        void startScanning();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [autoStart]);

  const startScanning = async () => {
    // Prevent multiple simultaneous starts
    if (isLoading || isScanning) {
      return;
    }

    setIsLoading(true);

    try {
      // Initialize scanner
      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      // Start scanning with back camera
      await scanner.start(
        { facingMode: "environment" }, // Use back camera on mobile
        {
          fps: 10, // Frames per second to scan
          qrbox: { width: 250, height: 250 }, // Scanning box size
          aspectRatio: 1.0,
        },
        (decodedText) => {
          // Success callback - called when QR code is detected
          const now = Date.now();

          // Debounce: only process if 1 second has passed since last scan
          if (now - lastScanTimeRef.current > 1000) {
            lastScanTimeRef.current = now;
            onScan(decodedText);
          }
        },
        (errorMessage) => {
          // Error callback - called when no QR code is detected (can be ignored)
          // This fires very frequently, so we don't log it
        },
      );

      setIsScanning(true);
      setIsLoading(false);
    } catch (err) {
      console.error("Error starting scanner:", err);
      toast.error("Failed to start camera. Please grant camera permissions.");
      setIsLoading(false);
      if (onError && err instanceof Error) {
        onError(err);
      }
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current && isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }

    setIsScanning(false);
    setIsLoading(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      void stopScanning();
    };
  }, []);

  return (
    <Card className="overflow-hidden">
      <div className="relative w-full bg-black" style={{ height: "300px" }}>
        {/* QR Reader container - html5-qrcode will render the video here */}
        <div
          id="qr-reader"
          className="h-full w-full"
          style={{ display: isScanning ? "block" : "none" }}
        />

        {!isScanning && !isLoading && (
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-center">
              <Camera className="text-muted-foreground mx-auto mb-4 h-16 w-16" />
              <p className="text-muted-foreground text-sm">
                Camera is not active
              </p>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}
      </div>

      <div className="p-3">
        <p className="text-muted-foreground text-center text-xs">
          Position the QR code within the frame to scan
        </p>
      </div>
    </Card>
  );
}
