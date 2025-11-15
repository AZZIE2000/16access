"use client";

import { ClipboardClock, LayoutDashboard, QrCode, User } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AdminNavigation() {
  const pathname = usePathname();

  const navItems = [
    {
      href: "/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
    },
    {
      href: "/dashboard/scan",
      icon: QrCode,
      label: "Scan",
    },
    {
      href: "/dashboard/history",
      icon: ClipboardClock,
      label: "History",
    },
    {
      href: "/dashboard/profile",
      icon: User,
      label: "Profile",
    },
  ];

  // Get all defined routes (excluding the base dashboard)
  const definedRoutes = navItems
    .filter((item) => item.href !== "/dashboard")
    .map((item) => item.href);

  // Check if current path matches any defined route
  const matchesDefinedRoute = definedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/"),
  );

  return (
    <div className="sticky bottom-0 grid grid-cols-4 border border-t bg-white md:hidden">
      {navItems.map((item) => {
        const Icon = item.icon;

        let isActive = false;

        if (item.href === "/dashboard") {
          // Dashboard is active if:
          // 1. We're exactly on /dashboard, OR
          // 2. We're on a /dashboard/* route that doesn't match any defined route
          isActive =
            pathname === "/dashboard" ||
            (pathname.startsWith("/dashboard") && !matchesDefinedRoute);
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
    </div>
  );
}
