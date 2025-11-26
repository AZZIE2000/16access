import { auth } from "@/server/auth";
import "@/styles/globals.css";
import { redirect } from "next/navigation";
import { AdminNavigation } from "@/components/admin-navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { ChartAreaInteractive } from "@/components/chart-area-interactive";
import { DataTable } from "@/components/data-table";
import { SectionCards } from "@/components/section-cards";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

import data from "./data.json";
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="h-svh overflow-hidden">
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset className="h-full overflow-hidden flex flex-col">
          <SiteHeader />
          <div className="flex-1 overflow-hidden">
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
      <AdminNavigation />
    </div>
  );
}
