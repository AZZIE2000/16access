import { ScanInterface } from "@/components/scan-interface";
import { auth } from "@/server/auth";

export default async function ScanPage() {
  const session = await auth();
  const isAdmin = session?.user?.role === "admin";

  return (
    <ScanInterface
      denialReason="Denied by admin"
      gateSelectionTitle="Select Gate for Scanning"
      gateSelectionDescription="Please select the gate where you want to scan employee QR codes."
      isAdmin={isAdmin}
    />
  );
}
