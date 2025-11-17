import { ScanInterface } from "@/components/scan-interface";
import { auth } from "@/server/auth";

export default async function ScanPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  return (
    <ScanInterface
      denialReason="Denied by usher"
      gateSelectionTitle="Select Your Gate"
      gateSelectionDescription="Where are you now?"
      isAdmin={isAdmin}
    />
  );
}
