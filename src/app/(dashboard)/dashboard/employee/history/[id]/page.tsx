"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  DoorOpen,
  User,
  Clock,
  Loader2,
  ArrowRight,
  ArrowLeftIcon,
  Ban,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export default function EmployeeHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;

  // Fetch employee details
  const { data: employee, isLoading: employeeLoading } =
    api.employee.getByIdAdmin.useQuery({
      id: employeeId,
    });

  // Fetch employee activities
  const { data: activities, isLoading: activitiesLoading } =
    api.activity.getByEmployee.useQuery({
      employeeId,
    });

  const isLoading = employeeLoading || activitiesLoading;

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
      return <ArrowLeftIcon className="h-4 w-4 text-blue-500" />;
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

  const profilePhoto = employee?.employeeAttachments?.find(
    (att) => att.type === "PROFILE_PHOTO",
  )?.attachment.url;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Employee not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/dashboard/employee")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Transaction History</h1>
          <p className="text-muted-foreground">
            View all access activities for this employee
          </p>
        </div>
      </div>

      {/* Employee Info Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={profilePhoto} alt={employee.name} />
              <AvatarFallback>{getInitials(employee.name)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">{employee.name}</h2>
              <p className="text-muted-foreground">{employee.job}</p>
              <p className="text-muted-foreground text-sm">
                {employee.vendor?.name}
              </p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground text-sm">Total Activities</p>
              <p className="text-2xl font-bold">{activities?.length ?? 0}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activities List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Activity History
          </CardTitle>
          <CardDescription>
            All entry, exit, and access activities for this employee
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {activities && activities.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-muted-foreground">No activities found</p>
            </div>
          )}

          {activities?.map((activity) => (
            <div
              key={activity.id}
              className="hover:bg-muted/50 flex items-center gap-4 rounded-lg border p-4 transition-colors"
            >
              {/* Activity Icon */}
              <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
                {getActivityIcon(activity.type, activity.status)}
              </div>

              {/* Activity Details */}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  {getTypeBadge(activity.type)}
                  {getStatusBadge(activity.status)}
                </div>
                <div className="text-muted-foreground flex items-center gap-2 text-sm">
                  {activity.gate && (
                    <>
                      <DoorOpen className="h-4 w-4" />
                      <span>{activity.gate.name}</span>
                      <span>•</span>
                    </>
                  )}
                  {activity.scanner && (
                    <>
                      <User className="h-4 w-4" />
                      <span>{activity.scanner.name}</span>
                      <span>•</span>
                    </>
                  )}
                  <Clock className="h-4 w-4" />
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

              {/* Timestamp */}
              <div className="text-muted-foreground text-right text-sm">
                <p>{new Date(activity.scannedAt).toLocaleDateString()}</p>
                <p>{new Date(activity.scannedAt).toLocaleTimeString()}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
