"use client";

import { api } from "@/trpc/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  Ban,
} from "lucide-react";

export function RecentActivitiesTable() {
  const { data: activities, isLoading } = api.activity.getAllRecent.useQuery({
    limit: 20,
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getActivityIcon = (type: string, status: string) => {
    if (status === "DENIED") {
      return <Ban className="h-4 w-4 text-red-500" />;
    }
    if (type === "ENTRY") {
      return <ArrowRight className="h-4 w-4 text-green-500" />;
    }
    if (type === "EXIT") {
      return <ArrowLeft className="h-4 w-4 text-blue-500" />;
    }
    return null;
  };

  const getStatusBadge = (status: string) => {
    if (status === "GRANTED") {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700">
          <CheckCircle2 className="mr-1 h-3 w-3" />
          Granted
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700">
        <XCircle className="mr-1 h-3 w-3" />
        Denied
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    if (type === "ENTRY") {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          Entry
        </Badge>
      );
    }
    if (type === "EXIT") {
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700">
          Exit
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-700">
        {type}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>
            Latest transactions across all gates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
          <CardDescription>
            Latest transactions across all gates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground py-8 text-center">
            No activities recorded yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
        <CardDescription>
          Latest {activities.length} transactions across all gates
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => {
            const profilePhoto = activity.employee.employeeAttachments?.find(
              (att) => att.type === "PROFILE_PHOTO",
            )?.attachment.url;

            return (
              <div
                key={activity.id}
                className="hover:bg-muted/50 flex items-center gap-4 rounded-lg border p-3 transition-colors"
              >
                {/* Activity Icon */}
                <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-full">
                  {getActivityIcon(activity.type, activity.status)}
                </div>

                {/* Employee Avatar */}
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={profilePhoto}
                    alt={activity.employee.name}
                  />
                  <AvatarFallback>
                    {getInitials(activity.employee.name)}
                  </AvatarFallback>
                </Avatar>

                {/* Activity Details */}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{activity.employee.name}</p>
                    {getTypeBadge(activity.type)}
                    {getStatusBadge(activity.status)}
                  </div>
                  <div className="text-muted-foreground flex items-center gap-2 text-sm">
                    <span>{activity.employee.vendor.name}</span>
                    <span>•</span>
                    <span>{activity.gate?.name ?? "No Gate"}</span>
                    <span>•</span>
                    <span>
                      {formatDistanceToNow(new Date(activity.scannedAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  {activity.denialReason && (
                    <p className="text-sm text-red-600">
                      Reason: {activity.denialReason}
                    </p>
                  )}
                </div>

                {/* Scanner Info */}
                {activity.scanner && (
                  <div className="text-muted-foreground hidden text-right text-sm md:block">
                    <p className="font-medium">{activity.scanner.name}</p>
                    <p className="text-xs">Scanner</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
