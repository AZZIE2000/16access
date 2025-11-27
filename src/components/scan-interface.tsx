"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { QRScanner } from "@/components/qr-scanner";
import { EmployeeScanResult } from "@/components/employee-scan-result";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";

interface ScanInterfaceProps {
  denialReason: string; // e.g., "Denied by usher" or "Denied by admin"
  gateSelectionTitle?: string;
  gateSelectionDescription?: string;
  isAdmin?: boolean;
}

export function ScanInterface({
  denialReason,
  gateSelectionTitle = "Select Your Gate",
  gateSelectionDescription = "Please select the gate you are currently stationed at before starting to scan employee QR codes.",
  isAdmin = false,
}: ScanInterfaceProps) {
  const [selectedGateId, setSelectedGateId] = useState<string>("");
  const [scannedEmployee, setScannedEmployee] = useState<any>(null);
  const [shouldShowScanner, setShouldShowScanner] = useState(true);

  // Fetch gates
  const { data: gates, isLoading: gatesLoading } = api.gate.getAll.useQuery();

  // Get employee by QR code
  const getEmployeeMutation = api.activity.getEmployeeByQRCode.useMutation({
    onSuccess: (data) => {
      setScannedEmployee(data);
      // Hide scanner when employee is scanned to prevent camera from running in background
      setShouldShowScanner(false);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Record activity
  const recordActivityMutation = api.activity.recordActivity.useMutation({
    onSuccess: () => {
      toast.success("Activity recorded successfully!");
      // Reset employee and show scanner again
      setScannedEmployee(null);
      // Small delay before showing scanner to prevent immediate camera restart on mobile
      setTimeout(() => {
        setShouldShowScanner(true);
      }, 300);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleScan = (identifier: string) => {
    if (!selectedGateId) {
      toast.error("Please select a gate first");
      return;
    }

    // Prevent duplicate scans
    if (getEmployeeMutation.isPending) {
      return;
    }

    getEmployeeMutation.mutate({ identifier });
  };

  const handleGrantAccess = () => {
    if (!scannedEmployee || !selectedGateId) return;

    recordActivityMutation.mutate({
      employeeId: scannedEmployee.id,
      gateId: selectedGateId,
      type: "ENTRY",
      status: "GRANTED",
    });
  };

  const handleDenyAccess = () => {
    if (!scannedEmployee || !selectedGateId) return;

    recordActivityMutation.mutate({
      employeeId: scannedEmployee.id,
      gateId: selectedGateId,
      type: "DENIED",
      status: "DENIED",
      denialReason,
    });
  };

  if (gatesLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-3 p-3">
      {/* Header */}
      <div className="container mx-auto max-w-2xl space-y-4 p-3">
        <Item variant="outline">
          <ItemContent>
            <ItemTitle>{gateSelectionTitle}</ItemTitle>
            <ItemDescription>{gateSelectionDescription}</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Select value={selectedGateId} onValueChange={setSelectedGateId}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select a gate" />
              </SelectTrigger>
              <SelectContent>
                {gates?.map((gate) => (
                  <SelectItem key={gate.id} value={gate.id}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{gate.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </ItemActions>
        </Item>
      </div>

      {/* QR Scanner - Auto-start when gate is selected and no employee is scanned */}
      {!scannedEmployee && selectedGateId && shouldShowScanner && (
        <div>
          <QRScanner onScan={handleScan} autoStart={true} />
        </div>
      )}

      {/* Employee Info & Actions */}
      {scannedEmployee && selectedGateId && (
        <div className="space-y-2">
          <EmployeeScanResult
            employee={scannedEmployee}
            currentGateId={selectedGateId}
            onGrantAccess={handleGrantAccess}
            onDenyAccess={handleDenyAccess}
            isProcessing={recordActivityMutation.isPending}
            isAdmin={isAdmin}
          />
        </div>
      )}
    </div>
  );
}
