"use client";

import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Camera, CameraOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface QRScannerProps {
  onScan: (data: string) => void;
  onError?: (error: Error) => void;
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);

  // Initialize code reader
  useEffect(() => {
    codeReaderRef.current = new BrowserMultiFormatReader();

    return () => {
      if (codeReaderRef.current) {
        codeReaderRef.current.reset();
      }
    };
  }, []);

  // Get available cameras
  useEffect(() => {
    const getDevices = async () => {
      try {
        const videoDevices =
          await codeReaderRef.current?.listVideoInputDevices();
        if (videoDevices && videoDevices.length > 0) {
          setDevices(videoDevices);
          // Prefer back camera on mobile
          const backCamera = videoDevices.find((device) =>
            device.label.toLowerCase().includes("back"),
          );
          setSelectedDeviceId(
            backCamera?.deviceId ?? videoDevices[0]?.deviceId ?? "",
          );
        }
      } catch (err) {
        console.error("Error getting video devices:", err);
        toast.error("Failed to access camera devices");
      }
    };

    void getDevices();
  }, []);

  const startScanning = async () => {
    if (!codeReaderRef.current || !videoRef.current || !selectedDeviceId) {
      toast.error("Camera not available");
      return;
    }

    setIsLoading(true);

    try {
      await codeReaderRef.current.decodeFromVideoDevice(
        selectedDeviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            const text = result.getText();
            if (text) {
              onScan(text);
              // Optionally stop scanning after successful scan
              // stopScanning();
            }
          }

          if (error && !(error instanceof NotFoundException)) {
            console.error("Scan error:", error);
            if (onError) {
              onError(error as Error);
            }
          }
        },
      );

      setIsScanning(true);
      setIsLoading(false);
    } catch (err) {
      console.error("Error starting scanner:", err);
      toast.error("Failed to start camera");
      setIsLoading(false);
      if (onError && err instanceof Error) {
        onError(err);
      }
    }
  };

  const stopScanning = () => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    setIsScanning(false);
  };

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
              <div className="absolute left-0 top-0 h-16 w-16 border-l-4 border-t-4 border-green-500" />
              <div className="absolute right-0 top-0 h-16 w-16 border-r-4 border-t-4 border-green-500" />
              <div className="absolute bottom-0 left-0 h-16 w-16 border-b-4 border-l-4 border-green-500" />
              <div className="absolute bottom-0 right-0 h-16 w-16 border-b-4 border-r-4 border-green-500" />

              {/* Scanning line animation */}
              <div className="absolute left-0 right-0 top-0 h-1 animate-scan bg-green-500" />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4 p-4">
        {/* Camera selection */}
        {devices.length > 1 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Camera</label>
            <select
              value={selectedDeviceId}
              onChange={(e) => setSelectedDeviceId(e.target.value)}
              disabled={isScanning}
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {devices.map((device) => (
                <option key={device.deviceId} value={device.deviceId}>
                  {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Control buttons */}
        <div className="flex gap-2">
          {!isScanning ? (
            <Button
              onClick={startScanning}
              disabled={isLoading || !selectedDeviceId}
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

