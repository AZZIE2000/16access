import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

import { TRPCReactProvider } from "@/trpc/react";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { PWASplashScreen } from "@/components/pwa-splash-screen";

export const metadata: Metadata = {
  title: "Christmas Market Access",
  description: "Christmas Market Access Management System",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  manifest: "/manifest.json",
  themeColor: "#000000",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Christmas Market",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  return (
    <html lang="en" className={`${geist.variable}`}>
      <head>
        {/* Apple Touch Icons - Multiple sizes for better iOS support */}
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icon-192x192.png" />

        {/* iOS Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        />
        <meta name="apple-mobile-web-app-title" content="Christmas Market" />

        {/* iOS Splash Screens */}
        <link rel="apple-touch-startup-image" href="/icon-512x512.png" />
      </head>
      <body className="">
        <TRPCReactProvider>
          <PWASplashScreen />
          {children}
          <PWAInstallPrompt />
        </TRPCReactProvider>
      </body>
    </html>
  );
}
