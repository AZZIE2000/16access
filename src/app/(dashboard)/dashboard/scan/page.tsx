import { ScanInterface } from "@/components/scan-interface";

export default function ScanPage() {
  return (
    <ScanInterface
      denialReason="Denied by admin"
      gateSelectionTitle="Select Gate for Scanning"
      gateSelectionDescription="Please select the gate where you want to scan employee QR codes."
    />
  );
}
