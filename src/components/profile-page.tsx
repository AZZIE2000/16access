"use client";

import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Download, LogOut, User, Mail, Shield, Calendar } from "lucide-react";
import { format } from "date-fns";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface ProfilePageProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string;
    createdAt?: Date;
  };
  variant?: "dashboard" | "usher";
}

export function ProfilePage({ user, variant = "dashboard" }: ProfilePageProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);
  const [canInstallPWA, setCanInstallPWA] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isInstalled = window.matchMedia("(display-mode: standalone)").matches ||
                       (window.navigator as any).standalone === true;
    setIsPWAInstalled(isInstalled);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstallPWA(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setCanInstallPWA(false);
      setDeferredPrompt(null);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/login" });
  };

  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role?.toLowerCase()) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "usher":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "vendor":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  const isMobile = variant === "usher";

  return (
    <div className={isMobile ? "p-4 pb-20" : "container mx-auto p-6"}>
      <div className="mx-auto max-w-2xl space-y-6">
        {/* Header */}
        <div>
          <h1 className={isMobile ? "text-2xl font-bold" : "text-3xl font-bold"}>Profile</h1>
          <p className={`text-muted-foreground ${isMobile ? "text-sm" : ""}`}>
            Manage your account settings
          </p>
        </div>

        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className={isMobile ? "text-lg" : ""}>Account Information</CardTitle>
            <CardDescription className={isMobile ? "text-xs" : ""}>
              Your personal details and role
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Avatar and Name */}
            <div className="flex items-center gap-4">
              <Avatar className={isMobile ? "h-16 w-16" : "h-20 w-20"}>
                <AvatarImage src="" alt={user.name ?? "User"} />
                <AvatarFallback className={isMobile ? "text-xl" : "text-2xl"}>
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className={`font-semibold ${isMobile ? "text-lg" : "text-xl"}`}>
                  {user.name ?? "User"}
                </h2>
                <div className="mt-1">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-medium ${isMobile ? "text-xs" : "text-sm"} ${getRoleBadgeColor(user.role)}`}
                  >
                    {user.role ?? "User"}
                  </span>
                </div>
              </div>
            </div>

            {/* User Details */}
            <div className="space-y-3">
              {user.email && (
                <div className="flex items-center gap-3">
                  <Mail className={`text-muted-foreground ${isMobile ? "h-4 w-4" : "h-5 w-5"}`} />
                  <div>
                    <p className={`text-muted-foreground ${isMobile ? "text-xs" : "text-sm"}`}>
                      Email
                    </p>
                    <p className={`font-medium ${isMobile ? "text-sm" : ""}`}>{user.email}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3">
                <User className={`text-muted-foreground ${isMobile ? "h-4 w-4" : "h-5 w-5"}`} />
                <div>
                  <p className={`text-muted-foreground ${isMobile ? "text-xs" : "text-sm"}`}>
                    User ID
                  </p>
                  <p className={`font-mono ${isMobile ? "text-xs" : "text-sm"}`}>{user.id}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Shield className={`text-muted-foreground ${isMobile ? "h-4 w-4" : "h-5 w-5"}`} />
                <div>
                  <p className={`text-muted-foreground ${isMobile ? "text-xs" : "text-sm"}`}>
                    Role
                  </p>
                  <p className={`font-medium ${isMobile ? "text-sm" : ""}`}>
                    {user.role ?? "User"}
                  </p>
                </div>
              </div>

              {user.createdAt && (
                <div className="flex items-center gap-3">
                  <Calendar className={`text-muted-foreground ${isMobile ? "h-4 w-4" : "h-5 w-5"}`} />
                  <div>
                    <p className={`text-muted-foreground ${isMobile ? "text-xs" : "text-sm"}`}>
                      Member Since
                    </p>
                    <p className={`font-medium ${isMobile ? "text-sm" : ""}`}>
                      {format(new Date(user.createdAt), "MMMM d, yyyy")}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* PWA Install Card */}
        {!isPWAInstalled && canInstallPWA && (
          <Card>
            <CardHeader>
              <CardTitle className={isMobile ? "text-lg" : ""}>Install App</CardTitle>
              <CardDescription className={isMobile ? "text-xs" : ""}>
                Install this app on your device for a better experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleInstallPWA}
                className="w-full"
                size={isMobile ? "sm" : "default"}
              >
                <Download className={`mr-2 ${isMobile ? "h-4 w-4" : "h-5 w-5"}`} />
                Install App
              </Button>
            </CardContent>
          </Card>
        )}

        {isPWAInstalled && (
          <Card>
            <CardHeader>
              <CardTitle className={isMobile ? "text-lg" : ""}>App Status</CardTitle>
              <CardDescription className={isMobile ? "text-xs" : ""}>
                This app is installed on your device
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 text-green-600">
                <Download className={isMobile ? "h-4 w-4" : "h-5 w-5"} />
                <span className={`font-medium ${isMobile ? "text-sm" : ""}`}>
                  App Installed ✓
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle className={isMobile ? "text-lg" : ""}>Actions</CardTitle>
            <CardDescription className={isMobile ? "text-xs" : ""}>
              Manage your session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full"
              size={isMobile ? "sm" : "default"}
            >
              <LogOut className={`mr-2 ${isMobile ? "h-4 w-4" : "h-5 w-5"}`} />
              Logout
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

