import "@/styles/globals.css";

import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { UsherNavigation } from "@/components/usher-navigation";
import Image from "next/image";

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex justify-between bg-linear-to-b from-gray-700 to-95% to-transparent">
        <Image
          src="/amman-christmas-market.png"
          alt="Christmas Market"
          width={100}
          height={1}
        />
        <Image
          src="/16thofmay.png"
          alt="Christmas Market"
          width={100}
          height={10}
        />
      </div>
      <div className="flex-1 overflow-auto pb-16">{children}</div>
      <UsherNavigation />
    </div>
  );
}
