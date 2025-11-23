"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Building2,
  MapPin,
  DoorOpen,
  Briefcase,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar,
  Edit,
  IdCard,
  AlertCircle,
  Users,
  LogOut,
  LogIn,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/trpc/react";
import { toast } from "sonner";

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

interface EmployeeGate {
  id: string;
  gate: {
    id: string;
    name: string;
  };
}

interface EmployeeZone {
  id: string;
  zone: {
    id: string;
    name: string;
  };
}

interface EmployeeAttachment {
  id: string;
  type: string;
  attachment: {
    id: string;
    url: string;
  };
}

interface AllowedDate {
  id: string;
  date: Date;
}

interface Coworker {
  id: string;
  name: string;
  job: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  profilePhoto?: string;
  lastActivity: Activity | null;
  bypassConcurrentLimit?: boolean;
}

interface VendorGate {
  id: string;
  gate: {
    id: string;
    name: string;
  };
}

interface VendorZone {
  id: string;
  zone: {
    id: string;
    name: string;
  };
}

interface EmployeeData {
  id: string;
  identifier: string;
  name: string;
  job: string;
  nationalId: string;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  bypassConcurrentLimit?: boolean;
  vendor: {
    name: string;
    allowedInCount: number;
    gates?: VendorGate[];
    zones?: VendorZone[];
  };
  gates: EmployeeGate[];
  zones: EmployeeZone[];
  workingHours: WorkingHours[];
  activities: Activity[];
  employeeAttachments?: EmployeeAttachment[];
  allowedDates?: AllowedDate[];
  profilePhoto?: string;
  lastActivity?: Activity | null;
  coworkers?: Coworker[];
}

interface EmployeeScanResultProps {
  employee: EmployeeData;
  currentGateId: string;
  onGrantAccess: () => void;
  onDenyAccess: () => void;
  isProcessing?: boolean;
  isAdmin?: boolean;
}

export function EmployeeScanResult({
  employee,
  currentGateId,
  onGrantAccess,
  onDenyAccess,
  isProcessing = false,
  isAdmin = false,
}: EmployeeScanResultProps) {
  // Get effective gates and zones (employee's or vendor's if employee has none)
  const effectiveGates =
    employee.gates.length > 0 ? employee.gates : (employee.vendor.gates ?? []);
  const effectiveZones =
    employee.zones.length > 0 ? employee.zones : (employee.vendor.zones ?? []);

  // Check if employee has access to the current gate
  const hasGateAccess = effectiveGates.some(
    (eg) => eg.gate.id === currentGateId,
  );

  // Check if employee is active
  const isActive = employee.status === "ACTIVE";

  // Check if last activity was ENTRY (employee is currently inside)
  const isCurrentlyInside = employee.lastActivity?.type === "ENTRY";

  // Check if employee is allowed on current date
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const hasDateRestriction =
    employee.allowedDates && employee.allowedDates.length > 0;
  const isAllowedToday =
    !hasDateRestriction ||
    employee.allowedDates!.some(
      (ad) => new Date(ad.date).toISOString().split("T")[0] === today,
    );

  // Check if vendor has reached maximum allowed employees in at the same time
  const hasAllowedInLimit = employee.vendor.allowedInCount > 0;
  // Only count employees without bypass flag when calculating concurrent count
  const currentlyInCount = employee.coworkers
    ? employee.coworkers.filter(
        (c) => c.lastActivity?.type === "ENTRY" && !c.bypassConcurrentLimit,
      ).length + (isCurrentlyInside || employee.bypassConcurrentLimit ? 0 : 1) // Add 1 if current employee is trying to enter and doesn't have bypass
    : 0;
  const isAtMaxCapacity =
    hasAllowedInLimit &&
    !employee.bypassConcurrentLimit && // Skip capacity check if employee has bypass flag
    currentlyInCount > employee.vendor.allowedInCount;

  // Determine if access should be granted
  const shouldGrantAccess =
    isActive && hasGateAccess && isAllowedToday && !isAtMaxCapacity;

  // Get all ID card attachments
  const idCards =
    employee.employeeAttachments?.filter((att) => att.type === "ID_CARD") ?? [];

  // Record exit mutation
  const recordExitMutation = api.activity.recordActivity.useMutation({
    onSuccess: () => {
      toast.success("Exit recorded successfully!");
      window.location.reload();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleExit = (employeeId: string) => {
    recordExitMutation.mutate({
      employeeId,
      gateId: currentGateId,
      type: "EXIT",
      status: "GRANTED",
    });
  };

  return (
    <Card>
      <CardHeader className="">
        <CardTitle className="text-base">Employee Information</CardTitle>
      </CardHeader>

      <CardContent className="space-y-3">
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
            <div className="flex items-center gap-1.5">
              <Badge
                variant={
                  employee.status === "ACTIVE"
                    ? "success"
                    : employee.status === "PENDING"
                      ? "secondary"
                      : "destructive"
                }
                className="text-xs"
              >
                {employee.status}
              </Badge>
              {employee.bypassConcurrentLimit && (
                <Badge
                  variant="outline"
                  className="border-purple-200 bg-purple-50 text-xs text-purple-700"
                >
                  Owner
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Employee Details */}
        <div className="bg-muted/50 space-y-2 rounded-lg border p-2.5">
          <h4 className="text-sm font-semibold">Details</h4>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs">
              <Building2 className="text-muted-foreground h-3 w-3 shrink-0" />
              <span className="font-medium">Vendor:</span>
              <span className="truncate">{employee.vendor.name}</span>
            </div>

            <div className="flex items-center gap-1.5 text-xs">
              <IdCard className="text-muted-foreground h-3 w-3 shrink-0" />
              <span className="font-medium">National ID:</span>
              <span className="font-mono">{employee.nationalId}</span>
            </div>

            {effectiveGates.length > 0 && (
              <div className="flex items-start gap-1.5 text-xs">
                <DoorOpen className="text-muted-foreground mt-0.5 h-3 w-3 shrink-0" />
                <div className="flex-1">
                  <span className="font-medium">Gates:</span>
                  {employee.gates.length === 0 && (
                    <span className="text-muted-foreground ml-1 text-[10px]">
                      (from vendor)
                    </span>
                  )}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {effectiveGates.map((eg) => (
                      <Badge
                        key={eg.id}
                        variant={
                          eg.gate.id === currentGateId ? "success" : "secondary"
                        }
                        className="text-[10px]"
                      >
                        {eg.gate.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {effectiveZones.length > 0 && (
              <div className="flex items-start gap-1.5 text-xs">
                <MapPin className="text-muted-foreground mt-0.5 h-3 w-3 shrink-0" />
                <div className="flex-1">
                  <span className="font-medium">Zones:</span>
                  {employee.zones.length === 0 && (
                    <span className="text-muted-foreground ml-1 text-[10px]">
                      (from vendor)
                    </span>
                  )}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {effectiveZones.map((ez) => (
                      <Badge
                        key={ez.id}
                        variant="secondary"
                        className="text-[10px]"
                      >
                        {ez.zone.name}
                      </Badge>
                    ))}
                  </div>
                </div>
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

          {/* Working Dates */}
          {hasDateRestriction && (
            <div className="space-y-1.5 border-t pt-2">
              <div className="flex items-center gap-1.5 text-xs font-medium">
                <Calendar className="h-3 w-3 shrink-0" />
                <span>Working Dates:</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {employee.allowedDates!.map((ad) => {
                  const date = new Date(ad.date);
                  const dateStr = date.toISOString().split("T")[0];
                  const isToday = dateStr === today;
                  const day = String(date.getDate()).padStart(2, "0");
                  const month = String(date.getMonth() + 1).padStart(2, "0");
                  const dayName = date
                    .toLocaleDateString("en-US", { weekday: "short" })
                    .slice(0, 3);

                  return (
                    <Badge
                      key={ad.id}
                      variant={isToday ? "success" : "secondary"}
                      className="text-[10px]"
                    >
                      {day}/{month} {dayName}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ID Cards */}
        <div className="bg-muted/50 space-y-2 rounded-lg border p-2.5">
          <h4 className="text-sm font-semibold">ID Cards ({idCards.length})</h4>
          {idCards.length > 0 ? (
            <div className="grid grid-cols-2 gap-2">
              {idCards.map((idCard) => (
                <a
                  key={idCard.id}
                  href={idCard.attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-3/2 overflow-hidden rounded-md border bg-white"
                >
                  <img
                    src={idCard.attachment.url}
                    alt="ID Card"
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                </a>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-xs">
              No ID cards uploaded
            </p>
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
                            ? "success"
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

        {/* Access Denial Reason */}
        {!shouldGrantAccess && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <div className="flex-1 space-y-1.5">
                <h4 className="text-sm font-semibold text-red-900">
                  Access Denied
                </h4>
                <ul className="space-y-1 text-xs text-red-700">
                  {!isActive && (
                    <li className="flex items-start gap-1.5">
                      <span className="mt-0.5">•</span>
                      <span>Employee status is not active</span>
                    </li>
                  )}
                  {!hasGateAccess && (
                    <li className="flex items-start gap-1.5">
                      <span className="mt-0.5">•</span>
                      <span>No access permission for this gate</span>
                    </li>
                  )}
                  {!isAllowedToday && (
                    <li className="flex items-start gap-1.5">
                      <span className="mt-0.5">•</span>
                      <span>Not scheduled to work today</span>
                    </li>
                  )}
                  {isAtMaxCapacity && (
                    <li className="flex items-start gap-1.5">
                      <span className="mt-0.5">•</span>
                      <span>
                        Maximum capacity reached (
                        {employee.vendor.allowedInCount} employees allowed in at
                        the same time)
                      </span>
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Coworkers Section */}
        {employee.coworkers && employee.coworkers.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="coworkers" className="border-none">
              <AccordionTrigger className="bg-muted/50 rounded-lg border px-3 py-2 hover:no-underline">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="text-sm font-semibold">
                    Coworkers ({employee.coworkers.length})
                  </span>
                  {employee.vendor.allowedInCount > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Max: {employee.vendor.allowedInCount}
                    </Badge>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-2">
                <div className="space-y-2">
                  {employee.coworkers.map((coworker) => {
                    const coworkerIsIn =
                      coworker.lastActivity?.type === "ENTRY";
                    return (
                      <div
                        key={coworker.id}
                        className="bg-background flex items-center gap-2 rounded-lg border p-2"
                      >
                        <Avatar className="h-10 w-10 shrink-0">
                          <AvatarImage
                            src={coworker.profilePhoto}
                            alt={coworker.name}
                          />
                          <AvatarFallback className="text-xs">
                            {coworker.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {coworker.name}
                          </p>
                          <p className="text-muted-foreground truncate text-xs">
                            {coworker.job}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <Badge
                            variant={coworkerIsIn ? "success" : "secondary"}
                            className="text-xs"
                          >
                            {coworkerIsIn ? "IN" : "OUT"}
                          </Badge>

                          {coworkerIsIn && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 gap-1 px-2"
                              onClick={() => handleExit(coworker.id)}
                              disabled={recordExitMutation.isPending}
                            >
                              <LogOut className="h-3 w-3" />
                              <span className="text-xs">Exit</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Always show Entry button */}
          <Button
            onClick={onGrantAccess}
            disabled={isProcessing || !shouldGrantAccess}
            className="h-auto w-full flex-col gap-1 py-3"
            size="lg"
            variant={shouldGrantAccess ? "success" : "secondary"}
          >
            <LogIn className="h-6 w-6" />
            <span className="text-sm font-medium">
              {shouldGrantAccess ? "Grant Entry" : "Entry (Not Allowed)"}
            </span>
          </Button>

          {/* Show Leave button only if last transaction is ENTRY */}
          {isCurrentlyInside && (
            <Button
              onClick={() => handleExit(employee.id)}
              disabled={recordExitMutation.isPending}
              className="h-auto w-full flex-col gap-1 py-3"
              size="lg"
              variant="outline"
            >
              <LogOut className="h-6 w-6" />
              <span className="text-sm font-medium">Record Exit</span>
            </Button>
          )}

          {/* Deny button for admin */}
          {!shouldGrantAccess && isAdmin && (
            <Button
              onClick={onDenyAccess}
              disabled={isProcessing}
              variant="destructive"
              className="h-auto w-full flex-col gap-1 py-3"
              size="lg"
            >
              <XCircle className="h-6 w-6" />
              <span className="text-sm font-medium">Deny Access</span>
            </Button>
          )}

          {isAdmin && (
            <Link href={`/dashboard/employee`}>
              <Button variant="outline" className="w-full gap-2" size="sm">
                <Edit className="h-4 w-4" />
                Edit Employee
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
