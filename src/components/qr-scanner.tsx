"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, CameraOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: Error) => void;
}

// Extend Navigator interface for BarcodeDetector
declare global {
  interface Window {
    BarcodeDetector?: {
      new (options?: { formats: string[] }): BarcodeDetector;
      getSupportedFormats(): Promise<string[]>;
    };
  }

  interface BarcodeDetector {
    detect(image: ImageBitmapSource): Promise<DetectedBarcode[]>;
  }

  interface DetectedBarcode {
    rawValue: string;
    format: string;
    boundingBox: DOMRectReadOnly;
    cornerPoints: { x: number; y: number }[];
  }
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [supportsNativeScanner, setSupportsNativeScanner] = useState(false);

  // Check for native barcode detector support
  useEffect(() => {
    const checkSupport = async () => {
      if ("BarcodeDetector" in window) {
        try {
          const formats = await window.BarcodeDetector!.getSupportedFormats();
          setSupportsNativeScanner(formats.includes("qr_code"));
        } catch (err) {
          console.error("BarcodeDetector check failed:", err);
          setSupportsNativeScanner(false);
        }
      } else {
        setSupportsNativeScanner(false);
      }
    };

    void checkSupport();
  }, []);

  const startScanning = async () => {
    if (!videoRef.current) {
      toast.error("Camera not available");
      return;
    }

    setIsLoading(true);

    try {
      // Request camera with environment facing (back camera on mobile)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      setIsScanning(true);
      setIsLoading(false);

      // Start scanning
      if (supportsNativeScanner) {
        startNativeScanning();
      } else {
        // Fallback: just show camera, user can manually enter code
        toast.info(
          "Native QR scanning not supported. Please use a QR code reader app.",
        );
      }
    } catch (err) {
      console.error("Error starting scanner:", err);
      toast.error("Failed to start camera. Please grant camera permissions.");
      setIsLoading(false);
      if (onError && err instanceof Error) {
        onError(err);
      }
    }
  };

  const startNativeScanning = async () => {
    if (!videoRef.current || !window.BarcodeDetector) return;

    const barcodeDetector = new window.BarcodeDetector({
      formats: ["qr_code"],
    });

    const detectQRCode = async () => {
      if (!videoRef.current || !streamRef.current) return;

      try {
        const barcodes = await barcodeDetector.detect(videoRef.current);

        if (barcodes.length > 0) {
          const qrCode = barcodes[0];
          if (qrCode?.rawValue) {
            onScan(qrCode.rawValue);
            // Continue scanning for more codes
          }
        }
      } catch (err) {
        console.error("QR detection error:", err);
      }

      // Continue scanning if stream is still active
      if (streamRef.current) {
        animationFrameRef.current = requestAnimationFrame(detectQRCode);
      }
    };

    detectQRCode();
  };

  const stopScanning = () => {
    // Stop animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop video stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Clear video
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video w-full bg-black">
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          style={{ display: isScanning ? "block" : "none" }}
        />

        {!isScanning && (
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

        {/* Scanning overlay */}
        {isScanning && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-64 w-64">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 h-16 w-16 border-t-4 border-l-4 border-green-500" />
              <div className="absolute top-0 right-0 h-16 w-16 border-t-4 border-r-4 border-green-500" />
              <div className="absolute bottom-0 left-0 h-16 w-16 border-b-4 border-l-4 border-green-500" />
              <div className="absolute right-0 bottom-0 h-16 w-16 border-r-4 border-b-4 border-green-500" />

              {/* Scanning line animation */}
              <div className="animate-scan absolute top-0 right-0 left-0 h-1 bg-green-500" />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 p-4">
        {/* Control buttons */}
        <div className="flex gap-2">
          {!isScanning ? (
            <Button
              onClick={startScanning}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Camera className="mr-2 h-4 w-4" />
                  Start Scanning
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={stopScanning}
              variant="destructive"
              className="flex-1"
            >
              <CameraOff className="mr-2 h-4 w-4" />
              Stop Scanning
            </Button>
          )}
        </div>

        <p className="text-muted-foreground text-center text-xs">
          Position the QR code within the frame to scan
        </p>
      </div>

      <style jsx>{`
        @keyframes scan {
          0% {
            top: 0;
          }
          50% {
            top: 100%;
          }
          100% {
            top: 0;
          }
        }

        .animate-scan {
          animation: scan 2s linear infinite;
        }
      `}</style>
    </Card>
  );
}
