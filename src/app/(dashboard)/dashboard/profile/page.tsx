import { auth } from "@/server/auth";
import { ProfilePage } from "@/components/profile-page";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return <ProfilePage user={session.user} variant="dashboard" />;
}
