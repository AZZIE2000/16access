"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const pathname = usePathname();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  // Check if we're on vendor portal
  const isVendorPortal = pathname?.startsWith("/vendor/");

  useEffect(() => {
    // Don't show on vendor portal
    if (isVendorPortal) {
      return;
    }

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      return;
    }

    // Check if user dismissed before
    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed === "true") {
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, [isVendorPortal]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  // Don't render on vendor portal or if not showing
  if (isVendorPortal || !showPrompt || !deferredPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 p-3 md:bottom-4 md:left-auto md:right-4 md:max-w-sm">
      <Card className="border-primary shadow-lg">
        <CardContent className="p-3">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 rounded-full p-2">
              <Download className="text-primary h-5 w-5" />
            </div>
            <div className="flex-1 space-y-2">
              <div>
                <h3 className="text-sm font-semibold">Install App</h3>
                <p className="text-muted-foreground text-xs">
                  Install 16Access for quick access and offline support
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleInstall}
                  className="h-7 text-xs"
                >
                  Install
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="h-7 text-xs"
                >
                  Not now
                </Button>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDismiss}
              className="h-6 w-6 shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

