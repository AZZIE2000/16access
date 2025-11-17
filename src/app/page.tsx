import { auth } from "@/server/auth";
import { HydrateClient } from "@/trpc/server";
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
      <div></div>
    </HydrateClient>
  );
}
