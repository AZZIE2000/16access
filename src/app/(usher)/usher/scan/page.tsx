import { ScanInterface } from "@/components/scan-interface";

export default function ScanPage() {
  return (
    <ScanInterface
      denialReason="Denied by usher"
      gateSelectionTitle="Select Your Gate"
      gateSelectionDescription="Please select the gate you are currently stationed at before starting to scan employee QR codes."
    />
  );
}
