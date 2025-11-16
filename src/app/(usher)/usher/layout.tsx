import "@/styles/globals.css";

import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { UsherNavigation } from "@/components/usher-navigation";

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex-1 overflow-auto pb-16">{children}</div>
      <UsherNavigation />
    </div>
  );
}
