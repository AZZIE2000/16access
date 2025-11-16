"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { QRScanner } from "@/components/qr-scanner";
import { EmployeeScanResult } from "@/components/employee-scan-result";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { DoorOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ScanInterfaceProps {
  denialReason: string; // e.g., "Denied by usher" or "Denied by admin"
  gateSelectionTitle?: string;
  gateSelectionDescription?: string;
}

export function ScanInterface({
  denialReason,
  gateSelectionTitle = "Select Your Gate",
  gateSelectionDescription = "Please select the gate you are currently stationed at before starting to scan employee QR codes.",
}: ScanInterfaceProps) {
  const [selectedGateId, setSelectedGateId] = useState<string>("");
  const [scannedEmployee, setScannedEmployee] = useState<any>(null);

  // Fetch gates
  const { data: gates, isLoading: gatesLoading } = api.gate.getAll.useQuery();

  // Get employee by QR code
  const getEmployeeMutation = api.activity.getEmployeeByQRCode.useMutation({
    onSuccess: (data) => {
      setScannedEmployee(data);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Record activity
  const recordActivityMutation = api.activity.recordActivity.useMutation({
    onSuccess: () => {
      toast.success("Activity recorded successfully!");
      setScannedEmployee(null);
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

  const handleGrantExit = () => {
    if (!scannedEmployee || !selectedGateId) return;

    recordActivityMutation.mutate({
      employeeId: scannedEmployee.id,
      gateId: selectedGateId,
      type: "EXIT",
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

  // Step 1: Select gate
  if (!selectedGateId) {
    return (
      <div className="container mx-auto max-w-2xl space-y-4 p-3">
        <Card>
          <CardHeader className="p-4 pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DoorOpen className="h-5 w-5" />
              {gateSelectionTitle}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            <p className="text-muted-foreground text-xs">
              {gateSelectionDescription}
            </p>

            <div className="space-y-2">
              <label className="text-xs font-medium">Gate</label>
              <Select value={selectedGateId} onValueChange={setSelectedGateId}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select a gate" />
                </SelectTrigger>
                <SelectContent>
                  {gates?.map((gate) => (
                    <SelectItem key={gate.id} value={gate.id}>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{gate.name}</span>
                        {gate.description && (
                          <span className="text-muted-foreground text-xs">
                            - {gate.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {gates && gates.length === 0 && (
              <p className="text-muted-foreground text-center text-xs">
                No gates available. Please contact an administrator.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Step 2: Scan QR codes
  const selectedGate = gates?.find((g) => g.id === selectedGateId);

  return (
    <div className="container mx-auto max-w-4xl space-y-3 p-3">
      {/* Header */}
      <Card>
        <CardContent className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <DoorOpen className="h-4 w-4" />
            <div>
              <p className="text-xs font-medium">Current Gate</p>
              <p className="text-muted-foreground text-[10px]">
                {selectedGate?.name}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              setSelectedGateId("");
              setScannedEmployee(null);
            }}
          >
            Change
          </Button>
        </CardContent>
      </Card>

      {/* QR Scanner */}
      {!scannedEmployee && (
        <div>
          <QRScanner onScan={handleScan} />
        </div>
      )}

      {/* Employee Info & Actions */}
      {scannedEmployee && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Scanned Employee</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => setScannedEmployee(null)}
            >
              Scan Another
            </Button>
          </div>
          <EmployeeScanResult
            employee={scannedEmployee}
            currentGateId={selectedGateId}
            onGrantAccess={handleGrantAccess}
            onGrantExit={handleGrantExit}
            onDenyAccess={handleDenyAccess}
            isProcessing={recordActivityMutation.isPending}
          />
        </div>
      )}
    </div>
  );
}

