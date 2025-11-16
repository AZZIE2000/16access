"use client";

import { ClipboardClock, QrCode, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function UsherNavigation() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/usher/scan",
      icon: QrCode,
      label: "Scan",
    },
    {
      href: "/usher/history",
      icon: ClipboardClock,
      label: "History",
    },
    {
      href: "/usher/profile",
      icon: User,
      label: "Profile",
    },
  ];

  // Get all defined routes (excluding the base usher)
  const definedRoutes = navItems
    .filter((item) => item.href !== "/usher")
    .map((item) => item.href);

  // Check if current path matches any defined route
  const matchesDefinedRoute = definedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  return (
    <nav className="fixed right-0 bottom-0 left-0 z-50 grid grid-cols-3 border-t bg-white shadow-lg">
      {navItems.map((item) => {
        const Icon = item.icon;

        let isActive = false;

        if (item.href === "/usher") {
          // Usher/Scan is active if:
          // 1. We're exactly on /usher, OR
          // 2. We're on a /usher/* route that doesn't match any defined route
          isActive =
            pathname === "/usher" ||
            (pathname.startsWith("/usher") && !matchesDefinedRoute);
        } else {
          // Other items are active if pathname matches exactly or starts with their route
          isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center justify-center rounded-lg p-3 text-xs transition-all duration-300 ease-in-out active:scale-95 active:bg-gray-300 ${isActive ? "text-lime-900" : "text-red-800"}`}
          >
            <Icon size={20} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
