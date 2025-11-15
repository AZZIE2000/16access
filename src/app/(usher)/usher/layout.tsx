import { auth } from "@/server/auth";
import "@/styles/globals.css";
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
    <div className="h-full">
      {children}
      <UsherNavigation />
    </div>
  );
}
