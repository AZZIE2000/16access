import { ScanInterface } from "@/components/scan-interface";

export default function ScanPage() {
  return (
    <ScanInterface
      denialReason="Denied by usher"
      gateSelectionTitle="Select Your Gate"
      gateSelectionDescription="Where are you now?"
    />
  );
}
