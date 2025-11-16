"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemTitle,
} from "@/components/ui/item";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Pencil, Trash2, Users, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type Zone = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

type Gate = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

type Employee = {
  id: string;
  identifier: string;
  name: string;
  job: string;
  description: string | null;
  version: number;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  gateId: string | null;
  zoneId: string | null;
  gate: Gate | null;
  zone: Zone | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  vendorId: string;
};

type Attachment = {
  id: string;
  url: string;
};

type VendorAttachment = {
  id: string;
  attachment: Attachment;
};

type Vendor = {
  id: string;
  name: string;
  description: string | null;
  phoneNumber: string | null;
  allowedStaffCount: number;
  accessToken: string;
  gateId: string | null;
  zoneId: string | null;
  gate: Gate | null;
  zone: Zone | null;
  employees: Employee[];
  vendorAttachments: VendorAttachment[];
};

type EmployeeManagementProps = {
  vendor: Vendor;
  zones: Zone[];
  gates: Gate[];
};

export function EmployeeManagement({
  vendor: initialVendor,
  zones,
  gates,
}: EmployeeManagementProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch vendor data with employees (for real-time updates)
  const { data: vendor, refetch } = api.vendor.getById.useQuery({
    id: initialVendor.id,
  });

  // Use initialVendor as fallback
  const vendorData = vendor ?? initialVendor;

  // Delete mutation
  const deleteMutation = api.employee.deleteByAdmin.useMutation({
    onSuccess: () => {
      toast.success("Employee deleted successfully");
      void refetch();
      setDeletingId(null);
    },
    onError: (error) => {
      toast.error(error.message);
      setDeletingId(null);
    },
  });

  // Bulk activate mutation
  const bulkActivateMutation = api.employee.bulkActivatePending.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleDelete = (id: string, name: string) => {
    if (
      confirm(
        `Are you sure you want to delete ${name}? This action cannot be undone.`,
      )
    ) {
      setDeletingId(id);
      deleteMutation.mutate({ id });
    }
  };

  const handleBulkActivate = () => {
    if (
      confirm(
        "Are you sure you want to activate all pending employees for this vendor?",
      )
    ) {
      bulkActivateMutation.mutate({ vendorId: vendorData.id });
    }
  };

  const currentEmployeeCount = vendorData?.employees?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Vendor Info Cards */}
      <div className="">
        <Item variant="outline">
          <ItemContent>
            <ItemTitle>Total Employees</ItemTitle>
          </ItemContent>
          <ItemActions>
            <div
              className={`text-xl font-bold ${currentEmployeeCount < vendorData?.allowedStaffCount ? "text-blue-500" : currentEmployeeCount === vendorData?.allowedStaffCount ? "text-green-500" : "text-red-500"}`}
            >
              {currentEmployeeCount} / {vendorData?.allowedStaffCount}
            </div>
          </ItemActions>
        </Item>
      </div>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Employees</CardTitle>
              <CardDescription>
                Manage all employees for this vendor
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {vendorData?.employees.some((e) => e.status === "PENDING") && (
                <Button
                  variant="outline"
                  onClick={handleBulkActivate}
                  disabled={bulkActivateMutation.isPending}
                >
                  {bulkActivateMutation.isPending
                    ? "Activating..."
                    : "Activate All Pending"}
                </Button>
              )}
              <Link
                href={`/dashboard/vendor/${vendorData?.id}/employees/create`}
              >
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Employee
                </Button>
              </Link>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {currentEmployeeCount === 0 ? (
            <div className="py-12 text-center">
              <Users className="text-muted-foreground mx-auto h-12 w-12" />
              <h3 className="mt-4 text-lg font-semibold">No employees yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first employee.
              </p>
              <Link
                href={`/dashboard/vendor/${vendorData?.id}/employees/create`}
              >
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Employee
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="space-y-3 md:hidden">
                {vendorData?.employees.map((employee) => (
                  <Card key={employee.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold">
                            {employee.name}
                          </h3>
                          <p className="text-muted-foreground text-sm">
                            {employee.job}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/vendor/${vendorData.id}/employees/${employee.id}`}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleDelete(employee.id, employee.name)
                              }
                              disabled={deletingId === employee.id}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">v{employee.version}</Badge>
                        {employee.status === "ACTIVE" ? (
                          <Badge variant="default">Active</Badge>
                        ) : employee.status === "SUSPENDED" ? (
                          <Badge variant="destructive">Suspended</Badge>
                        ) : (
                          <Badge variant="secondary">Pending</Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Zone:</span>
                          <div className="font-medium">
                            {employee.zone?.name ??
                              vendorData.zone?.name ??
                              "-"}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Gate:</span>
                          <div className="font-medium">
                            {employee.gate?.name ??
                              vendorData.gate?.name ??
                              "-"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Job</TableHead>
                      <TableHead>Zone</TableHead>
                      <TableHead>Gate</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendorData?.employees.map((employee) => (
                      <TableRow key={employee.id}>
                        <TableCell className="font-medium">
                          {employee.name}
                        </TableCell>
                        <TableCell>{employee.job}</TableCell>
                        <TableCell>
                          {employee.zone?.name ?? vendorData.zone?.name ?? "-"}
                        </TableCell>
                        <TableCell>
                          {employee.gate?.name ?? vendorData.gate?.name ?? "-"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">v{employee.version}</Badge>
                        </TableCell>
                        <TableCell>
                          {employee.status === "ACTIVE" ? (
                            <Badge variant="default">Active</Badge>
                          ) : employee.status === "SUSPENDED" ? (
                            <Badge variant="destructive">Suspended</Badge>
                          ) : (
                            <Badge variant="secondary">Pending</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link
                              href={`/dashboard/vendor/${vendorData.id}/employees/${employee.id}`}
                            >
                              <Button variant="ghost" size="sm">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleDelete(employee.id, employee.name)
                              }
                              disabled={deletingId === employee.id}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
