"use client";

import { useState } from "react";
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
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  Users,
  MapPin,
  DoorOpen,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";

export default function VendorPortalPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.vendorId as string;
  const token = params.token as string;

  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch vendor data with employees
  const {
    data: vendor,
    refetch,
    isLoading,
  } = api.employee.getVendorByToken.useQuery({
    token,
  });

  // Delete mutation
  const deleteMutation = api.employee.delete.useMutation({
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

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      setDeletingId(id);
      deleteMutation.mutate({ id, token });
    }
  };

  const handleEdit = (employeeId: string) => {
    router.push(`/vendor/${vendorId}/${token}/${employeeId}`);
  };

  const handleCreate = () => {
    router.push(`/vendor/${vendorId}/${token}/create`);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
          <p className="text-muted-foreground">Loading vendor portal...</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Access Denied</CardTitle>
            <CardDescription>
              Invalid access token. Please check your link and try again.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const currentEmployeeCount = vendor.employees.length;
  const allowedStaffCount = vendor.allowedStaffCount;
  const canAddMore = currentEmployeeCount < allowedStaffCount;

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-7xl space-y-3 p-4 md:p-6 lg:p-8">
        {/* Header Section */}
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-3">
              <Building2 className="text-primary h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
                {vendor.name}
              </h1>
              <p className="text-muted-foreground mt-1">
                Vendor Portal - Employee Management
              </p>
            </div>
          </div>
        </div>

        {/* Vendor Info Cards */}
        <div className="space-y-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Total Employees{" "}
                <div
                  className={`text-xl font-bold ${currentEmployeeCount < allowedStaffCount ? "text-blue-500" : currentEmployeeCount === allowedStaffCount ? "text-green-500" : "text-red-500"}`}
                >
                  {currentEmployeeCount} / {allowedStaffCount}
                </div>
              </CardTitle>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {vendor.description ?? "No description provided"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Employees Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Employees</CardTitle>
                <CardDescription>
                  Manage your employee registrations
                </CardDescription>
              </div>
              <Button
                onClick={handleCreate}
                disabled={!canAddMore}
                title={canAddMore ? "Add new employee" : "Staff limit reached"}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Employee
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {vendor.employees.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <h3 className="mb-2 text-lg font-semibold">No employees yet</h3>
                <p className="text-muted-foreground mb-4">
                  Get started by adding your first employee
                </p>
                <Button onClick={handleCreate} disabled={!canAddMore}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Employee
                </Button>
              </div>
            ) : (
              <>
                {/* Mobile Card View */}
                <div className="space-y-3 md:hidden">
                  {vendor.employees.map((employee) => (
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
                              <DropdownMenuItem
                                onClick={() => handleEdit(employee.id)}
                              >
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
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
                            <span className="text-muted-foreground">
                              Zones:
                            </span>
                            <div className="font-medium">
                              {employee.zones && employee.zones.length > 0
                                ? employee.zones
                                    .map((ez) => ez.zone.name)
                                    .join(", ")
                                : vendor.zones && vendor.zones.length > 0
                                  ? vendor.zones
                                      .map((vz) => vz.zone.name)
                                      .join(", ")
                                  : "-"}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Gates:
                            </span>
                            <div className="font-medium">
                              {employee.gates && employee.gates.length > 0
                                ? employee.gates
                                    .map((eg) => eg.gate.name)
                                    .join(", ")
                                : vendor.gates && vendor.gates.length > 0
                                  ? vendor.gates
                                      .map((vg) => vg.gate.name)
                                      .join(", ")
                                  : "-"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden rounded-md border md:block">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Job/Role</TableHead>
                        <TableHead>Zone</TableHead>
                        <TableHead>Gate</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {vendor.employees.map((employee) => (
                        <TableRow key={employee.id}>
                          <TableCell className="font-medium">
                            {employee.name}
                          </TableCell>
                          <TableCell>{employee.job}</TableCell>
                          <TableCell>
                            {employee.zones && employee.zones.length > 0
                              ? employee.zones
                                  .map((ez) => ez.zone.name)
                                  .join(", ")
                              : vendor.zones && vendor.zones.length > 0
                                ? vendor.zones
                                    .map((vz) => vz.zone.name)
                                    .join(", ")
                                : "-"}
                          </TableCell>
                          <TableCell>
                            {employee.gates && employee.gates.length > 0
                              ? employee.gates
                                  .map((eg) => eg.gate.name)
                                  .join(", ")
                              : vendor.gates && vendor.gates.length > 0
                                ? vendor.gates
                                    .map((vg) => vg.gate.name)
                                    .join(", ")
                                : "-"}
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
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEdit(employee.id)}
                                title="Edit employee"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() =>
                                  handleDelete(employee.id, employee.name)
                                }
                                disabled={deletingId === employee.id}
                                title="Delete employee"
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
    </div>
  );
}
