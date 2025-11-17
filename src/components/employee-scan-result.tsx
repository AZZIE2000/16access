"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Building2,
  MapPin,
  DoorOpen,
  Briefcase,
  Clock,
  CheckCircle2,
  LogOut,
  XCircle,
  Calendar,
} from "lucide-react";

interface WorkingHours {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

interface Activity {
  id: string;
  type: "ENTRY" | "EXIT" | "DENIED";
  status: "GRANTED" | "DENIED";
  scannedAt: Date;
  denialReason?: string | null;
  scanner?: {
    name: string | null;
  } | null;
  gate?: {
    name: string;
  } | null;
}

interface EmployeeData {
  id: string;
  identifier: string;
  name: string;
  job: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  vendor: {
    name: string;
  };
  gate: {
    name: string;
  } | null;
  zone: {
    name: string;
  } | null;
  workingHours: WorkingHours[];
  activities: Activity[];
  profilePhoto?: string;
}

interface EmployeeScanResultProps {
  employee: EmployeeData;
  currentGateId: string;
  onGrantAccess: () => void;
  onGrantExit: () => void;
  onDenyAccess: () => void;
  isProcessing?: boolean;
}

export function EmployeeScanResult({
  employee,
  currentGateId,
  onGrantAccess,
  onGrantExit,
  onDenyAccess,
  isProcessing = false,
}: EmployeeScanResultProps) {
  return (
    <Card className="border-2">
      <CardHeader className="p-3 pb-2">
        <CardTitle className="text-base">Employee Information</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3 p-3">
        {/* Employee Info */}
        <div className="flex items-start gap-3">
          <Avatar className="h-16 w-16 shrink-0">
            <AvatarImage src={employee.profilePhoto} alt={employee.name} />
            <AvatarFallback className="text-sm">
              {employee.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="text-lg leading-tight font-bold">{employee.name}</h3>
            <div className="flex items-center gap-1.5 text-xs">
              <Briefcase className="h-3 w-3 shrink-0" />
              <span className="truncate">{employee.job}</span>
            </div>
            <Badge
              variant={
                employee.status === "ACTIVE"
                  ? "default"
                  : employee.status === "PENDING"
                    ? "secondary"
                    : "destructive"
              }
              className="text-xs"
            >
              {employee.status}
            </Badge>
          </div>
        </div>

        {/* Permissions */}
        <div className="bg-muted/50 space-y-2 rounded-lg border p-2.5">
          <h4 className="text-sm font-semibold">Permissions</h4>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs">
              <Building2 className="text-muted-foreground h-3 w-3 shrink-0" />
              <span className="font-medium">Vendor:</span>
              <span className="truncate">{employee.vendor.name}</span>
            </div>

            {employee.gate && (
              <div className="flex items-center gap-1.5 text-xs">
                <DoorOpen className="text-muted-foreground h-3 w-3 shrink-0" />
                <span className="font-medium">Gate:</span>
                <span className="truncate">{employee.gate.name}</span>
              </div>
            )}

            {employee.zone && (
              <div className="flex items-center gap-1.5 text-xs">
                <MapPin className="text-muted-foreground h-3 w-3 shrink-0" />
                <span className="font-medium">Zone:</span>
                <span className="truncate">{employee.zone.name}</span>
              </div>
            )}
          </div>

          {/* Working Hours */}
          {employee.workingHours.length > 0 && (
            <div className="space-y-1.5 border-t pt-2">
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <Calendar className="h-3 w-3 shrink-0" />
                <span>Working Hours:</span>
              </div>
              <div className="grid gap-0.5 text-[10px]">
                {employee.workingHours
                  .filter((wh) => wh.isActive)
                  .map((wh, idx) => (
                    <div key={idx} className="flex justify-between gap-2">
                      <span className="text-muted-foreground w-16 shrink-0">
                        {wh.dayOfWeek.slice(0, 3)}
                      </span>
                      <span className="font-mono">
                        {wh.startTime} - {wh.endTime}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Last 3 Activities */}
        {employee.activities.length > 0 && (
          <div className="bg-muted/50 space-y-2 rounded-lg border p-2.5">
            <h4 className="text-sm font-semibold">Recent Activity</h4>
            <div className="space-y-1.5">
              {employee.activities.map((activity) => (
                <div
                  key={activity.id}
                  className="bg-background flex items-center justify-between gap-2 rounded-md border p-1.5 text-xs"
                >
                  <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    {activity.status === "GRANTED" ? (
                      <CheckCircle2 className="h-3 w-3 shrink-0 text-green-600" />
                    ) : (
                      <XCircle className="h-3 w-3 shrink-0 text-red-600" />
                    )}
                    <div className="flex min-w-0 flex-1 items-center gap-1.5">
                      <Badge
                        variant={
                          activity.type === "ENTRY"
                            ? "default"
                            : activity.type === "EXIT"
                              ? "secondary"
                              : "destructive"
                        }
                        className="text-[10px]"
                      >
                        {activity.type}
                      </Badge>
                      {activity.gate && (
                        <span className="text-muted-foreground truncate text-[10px]">
                          @ {activity.gate.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1 text-[10px]">
                    <Clock className="text-muted-foreground h-2.5 w-2.5" />
                    <span className="text-muted-foreground">
                      {new Date(activity.scannedAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            onClick={onGrantAccess}
            disabled={isProcessing}
            className="h-auto flex-col gap-1 py-1"
            size="sm"
          >
            <CheckCircle2 className="h-5 w-5" />
            <span className="text-[10px] font-medium">Entry</span>
          </Button>

          <Button
            onClick={onGrantExit}
            disabled={isProcessing}
            variant="secondary"
            className="h-auto flex-col gap-1 py-1"
            size="sm"
          >
            <LogOut className="h-5 w-5" />
            <span className="text-[10px] font-medium">Exit</span>
          </Button>

          <Button
            onClick={onDenyAccess}
            disabled={isProcessing}
            variant="destructive"
            className="h-auto flex-col gap-1 py-1"
            size="sm"
          >
            <XCircle className="h-5 w-5" />
            <span className="text-[10px] font-medium">Deny</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
