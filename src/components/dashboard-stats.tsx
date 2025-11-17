"use client";

import { api } from "@/trpc/react";
import {
  IconTrendingUp,
  IconUsers,
  IconBuilding,
  IconUserCheck,
} from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardStats() {
  const { data: stats, isLoading } = api.activity.getDashboardStats.useQuery();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-3">
      {/* Total Vendors */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Vendors</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats?.totalVendors ?? 0}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconBuilding className="h-4 w-4" />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground line-clamp-1 flex gap-2 font-medium">
            Active vendors in the system
          </div>
        </CardFooter>
      </Card>

      {/* Total Employees */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Employees</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats?.totalEmployees ?? 0}
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <IconUsers className="h-4 w-4" />
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground line-clamp-1 flex gap-2 font-medium">
            Registered employees across all vendors
          </div>
        </CardFooter>
      </Card>

      {/* Employees On-Site */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Currently On-Site</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats?.employeesOnSite ?? 0}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="bg-green-50 text-green-700">
              <IconUserCheck className="h-4 w-4" />
              Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium text-green-600">
            Employees with last entry granted{" "}
            <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Last activity was entry</div>
        </CardFooter>
      </Card>
    </div>
  );
}
