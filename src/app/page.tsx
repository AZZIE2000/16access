import Link from "next/link";

import { auth } from "@/server/auth";
import { api, HydrateClient } from "@/trpc/server";
import Image from "next/image";
import { redirect } from "next/navigation";

export default async function Home() {
  // const hello = await api.post.hello({ text: "from tRPC" });
  const session = await auth();

  if (!session?.user) {
    redirect("/login", "replace" as any);
  } else {
    if (session?.user.role === "admin") {
      redirect("/dashboard", "replace" as any);
    } else if (session?.user.role === "usher") {
      redirect("/usher/scan", "replace" as any);
    }
  }

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-linear-to-b from-[#2e026d] to-[#15162c] text-white">
        <Image
          src={"/background.png"}
          alt="Christmas Market"
          // width={10}
          className="h-full w-full"
          fill
          // height={10}
        />
      </main>
    </HydrateClient>
  );
}
