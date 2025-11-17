"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  CheckCircle2,
  XCircle,
  Clock,
  DoorOpen,
  User,
  Loader2,
  Filter,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export function ActivityHistory() {
  const [selectedGateId, setSelectedGateId] = useState<string | undefined>(
    undefined,
  );
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(
    undefined,
  );

  // Fetch gates for filter
  const { data: gates } = api.gate.getAll.useQuery();

  // Fetch activities
  const { data: activities, isLoading } = api.activity.getRecent.useQuery({
    limit: 100,
    gateId: selectedGateId,
    status:
      selectedStatus === "GRANTED" || selectedStatus === "DENIED"
        ? selectedStatus
        : undefined,
  });

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-3 p-3">
      {/* Header & Filters */}
      <Card>
        <CardHeader className="p-3 pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="h-4 w-4" />
            Activity History
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 p-3 pt-0">
          <div className="grid grid-cols-2 gap-2">
            {/* Gate Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-medium">Gate</label>
              <Select
                value={selectedGateId ?? "all"}
                onValueChange={(value) =>
                  setSelectedGateId(value === "all" ? undefined : value)
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Gates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Gates</SelectItem>
                  {gates?.map((gate) => (
                    <SelectItem key={gate.id} value={gate.id}>
                      {gate.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-1">
              <label className="text-[10px] font-medium">Status</label>
              <Select
                value={selectedStatus ?? "all"}
                onValueChange={(value) =>
                  setSelectedStatus(value === "all" ? undefined : value)
                }
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="GRANTED">Granted</SelectItem>
                  <SelectItem value="DENIED">Denied</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results count */}
          <p className="text-muted-foreground text-[10px]">
            Showing {activities?.length ?? 0} activities
          </p>
        </CardContent>
      </Card>

      {/* Activities List */}
      <div className="space-y-2">
        {activities && activities.length === 0 && (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground text-sm">
                No activities found
              </p>
            </CardContent>
          </Card>
        )}

        {activities?.map((activity) => (
          <Card key={activity.id} className="overflow-hidden">
            <CardContent className="p-2.5">
              <div className="flex gap-2">
                {/* Employee Avatar */}
                <Avatar className="h-12 w-12 shrink-0">
                  <AvatarImage
                    src={
                      activity.employee.employeeAttachments?.find(
                        (att: any) => att.type === "PROFILE_PHOTO",
                      )?.attachment.url
                    }
                    alt={activity.employee.name}
                  />
                  <AvatarFallback className="text-xs">
                    {activity.employee.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* Activity Details */}
                <div className="min-w-0 flex-1 space-y-1">
                  {/* Employee Name & Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate text-sm leading-tight font-semibold">
                        {activity.employee.name}
                      </h3>
                      <p className="text-muted-foreground truncate text-[10px]">
                        {activity.employee.job}
                      </p>
                    </div>
                    {activity.status === "GRANTED" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 shrink-0 text-red-600" />
                    )}
                  </div>

                  {/* Activity Type & Gate */}
                  <div className="flex flex-wrap items-center gap-1.5">
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
                      <div className="flex items-center gap-1 text-[10px]">
                        <DoorOpen className="h-2.5 w-2.5" />
                        <span className="text-muted-foreground">
                          {activity.gate.name}
                        </span>
                      </div>
                    )}

                    {activity.scanner && (
                      <div className="flex items-center gap-1 text-[10px]">
                        <User className="h-2.5 w-2.5" />
                        <span className="text-muted-foreground">
                          {activity.scanner.name}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="flex items-center gap-1 text-[10px]">
                    <Clock className="text-muted-foreground h-2.5 w-2.5" />
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.scannedAt), {
                        addSuffix: true,
                      })}
                    </span>
                    <span className="text-muted-foreground">•</span>
                    <span className="text-muted-foreground">
                      {new Date(activity.scannedAt).toLocaleString()}
                    </span>
                  </div>

                  {/* Denial Reason */}
                  {activity.denialReason && (
                    <div className="bg-destructive/10 rounded-md p-1.5">
                      <p className="text-destructive text-[10px] font-medium">
                        Reason: {activity.denialReason}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
