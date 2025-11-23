"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  MapPin,
  DoorOpen,
  CreditCard,
  Printer,
  Download,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { EmployeeAccessCard } from "@/components/employee-access-card";
import { BulkAccessCards } from "@/components/bulk-access-cards";
import { generateAllowedDateOptions } from "@/lib/allowed-dates";

type EmployeeStatus = "PENDING" | "ACTIVE" | "SUSPENDED";

export default function EmployeeManagementPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EmployeeStatus | "ALL">(
    "ALL",
  );
  const [vendorFilter, setVendorFilter] = useState<string>("ALL");
  const [gateFilter, setGateFilter] = useState<string>("ALL");
  const [zoneFilter, setZoneFilter] = useState<string>("ALL");
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accessCardDialogOpen, setAccessCardDialogOpen] = useState(false);
  const [bulkPrintDialogOpen, setBulkPrintDialogOpen] = useState(false);
  const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false);
  const [bulkStatus, setBulkStatus] = useState<EmployeeStatus>("ACTIVE");
  const [editFormData, setEditFormData] = useState({
    name: "",
    job: "",
    nationalId: "",
    status: "ACTIVE" as EmployeeStatus,
    gateIds: [] as string[],
    zoneIds: [] as string[],
    allowedDates: [] as string[],
  });

  // Generate allowed date options
  const allowedDateOptions = generateAllowedDateOptions();

  // Fetch all employees with filters
  const { data: employees = [], refetch } = api.employee.getAllAdmin.useQuery({
    search: search || undefined,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    vendorId: vendorFilter === "ALL" ? undefined : vendorFilter,
    gateId: gateFilter === "ALL" ? undefined : gateFilter,
    zoneId: zoneFilter === "ALL" ? undefined : zoneFilter,
  });

  // Fetch all vendors, gates, and zones for filters
  const { data: vendors = [] } = api.vendor.getAll.useQuery();
  const { data: gates = [] } = api.gate.getAll.useQuery();
  const { data: zones = [] } = api.zone.getAll.useQuery();

  // Update employee mutation
  const updateMutation = api.employee.updateByAdmin.useMutation({
    onSuccess: () => {
      toast.success("Employee updated successfully");
      setEditDialogOpen(false);
      setSelectedEmployee(null);
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Delete employee mutation
  const deleteMutation = api.employee.deleteByAdmin.useMutation({
    onSuccess: () => {
      toast.success("Employee deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedEmployee(null);
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Bulk update status mutation
  const bulkUpdateStatusMutation = api.employee.bulkUpdateStatus.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setBulkStatusDialogOpen(false);
      setSelectedEmployees([]);
      void refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleEdit = (employeeId: string) => {
    const employee = employees.find((e) => e.id === employeeId);
    if (employee) {
      router.push(
        `/dashboard/vendor/${employee.vendorId}/employees/${employeeId}`,
      );
    }
  };

  const handleDelete = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    setDeleteDialogOpen(true);
  };

  const handleUpdateSubmit = () => {
    if (!selectedEmployee) return;

    const employee = employees.find((e) => e.id === selectedEmployee);
    if (!employee) return;

    const profilePhoto = employee.employeeAttachments?.find(
      (att) => att.type === "PROFILE_PHOTO",
    );
    const idCards =
      employee.employeeAttachments
        ?.filter((att) => att.type === "ID_CARD")
        .map((att) => att.attachment.url) ?? [];

    updateMutation.mutate({
      id: selectedEmployee,
      vendorId: employee.vendorId,
      name: editFormData.name,
      job: editFormData.job,
      nationalId: editFormData.nationalId,
      gateIds: editFormData.gateIds.length > 0 ? editFormData.gateIds : null,
      zoneIds: editFormData.zoneIds.length > 0 ? editFormData.zoneIds : null,
      profilePhotoUrl: profilePhoto?.attachment.url ?? "",
      idCardUrls: idCards.length > 0 ? idCards : null,
      status: editFormData.status,
      allowedDates:
        editFormData.allowedDates.length > 0 ? editFormData.allowedDates : null,
    });
  };

  const handleDeleteConfirm = () => {
    if (!selectedEmployee) return;
    deleteMutation.mutate({ id: selectedEmployee });
  };

  const getStatusBadge = (status: EmployeeStatus) => {
    switch (status) {
      case "ACTIVE":
        return (
          <Badge variant="success">
            <CheckCircle className="mr-1 h-3 w-3" />
            Active
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="default">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
      case "SUSPENDED":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Suspended
          </Badge>
        );
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedEmployees(employees.map((e) => e.id));
    } else {
      setSelectedEmployees([]);
    }
  };

  const handleSelectEmployee = (employeeId: string, checked: boolean) => {
    if (checked) {
      setSelectedEmployees([...selectedEmployees, employeeId]);
    } else {
      setSelectedEmployees(selectedEmployees.filter((id) => id !== employeeId));
    }
  };

  const handleBulkStatusUpdate = () => {
    if (selectedEmployees.length === 0) {
      toast.error("Please select at least one employee");
      return;
    }
    bulkUpdateStatusMutation.mutate({
      employeeIds: selectedEmployees,
      status: bulkStatus,
    });
  };

  const handleExportEmployees = () => {
    // Determine which employees to export
    const employeesToExport =
      selectedEmployees.length > 0
        ? employees.filter((e) => selectedEmployees.includes(e.id))
        : employees;

    if (employeesToExport.length === 0) {
      toast.error("No employees to export");
      return;
    }

    // Create CSV content
    const csvHeader = "Name,National ID\n";
    const csvRows = employeesToExport
      .map((emp) => `"${emp.name}","${emp.nationalId}"`)
      .join("\n");
    const csvContent = csvHeader + csvRows;

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `employees_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(
      `Exported ${employeesToExport.length} employee${employeesToExport.length !== 1 ? "s" : ""}`,
    );
  };

  const isAllSelected =
    employees.length > 0 && selectedEmployees.length === employees.length;

  return (
    <div className="space-y-6 p-3 md:p-6">
      <div>
        <h1 className="text-3xl font-bold">Employee Management</h1>
        <p className="text-muted-foreground">
          View and manage all employees across all vendors
        </p>
      </div>

      {/* Selection Actions */}
      {selectedEmployees.length > 0 && (
        <Card className="border-primary bg-primary/5">
          <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={handleSelectAll}
              />
              <span className="font-medium">
                {selectedEmployees.length} employee
                {selectedEmployees.length !== 1 ? "s" : ""} selected
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedEmployees([])}
              >
                Clear Selection
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkStatusDialogOpen(true)}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Change Status
              </Button>
              <Button size="sm" onClick={() => setBulkPrintDialogOpen(true)}>
                <Printer className="mr-2 h-4 w-4" />
                Print Cards
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              id="search"
              placeholder="Search by name, job, or vendor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) =>
              setStatusFilter(value as EmployeeStatus | "ALL")
            }
          >
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={vendorFilter}
            onValueChange={(value) => setVendorFilter(value)}
          >
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Vendor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Vendors</SelectItem>
              {vendors.map((vendor) => (
                <SelectItem key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={gateFilter}
            onValueChange={(value) => setGateFilter(value)}
          >
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Gate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Gates</SelectItem>
              {gates.map((gate) => (
                <SelectItem key={gate.id} value={gate.id}>
                  {gate.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={zoneFilter}
            onValueChange={(value) => setZoneFilter(value)}
          >
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Zone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Zones</SelectItem>
              {zones.map((zone) => (
                <SelectItem key={zone.id} value={zone.id}>
                  {zone.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Export Button */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportEmployees}
            disabled={employees.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Export {selectedEmployees.length > 0 ? "Selected" : "All"} (
            {selectedEmployees.length > 0
              ? selectedEmployees.length
              : employees.length}
            )
          </Button>
        </div>
      </div>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle>Employees ({employees.length})</CardTitle>
          <CardDescription>All employees from all vendors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all employees"
                    />
                  </TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Gate</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      No employees found
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.map((employee) => {
                    const profilePhoto = employee.employeeAttachments?.find(
                      (att) => att.type === "PROFILE_PHOTO",
                    );
                    const isSelected = selectedEmployees.includes(employee.id);
                    return (
                      <TableRow key={employee.id}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleSelectEmployee(
                                employee.id,
                                checked as boolean,
                              )
                            }
                            aria-label={`Select ${employee.name}`}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage
                                src={profilePhoto?.attachment.url}
                                alt={employee.name}
                              />
                              <AvatarFallback>
                                {getInitials(employee.name)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium">{employee.name}</div>
                              <div className="text-muted-foreground text-sm">
                                ID: {employee.identifier.slice(0, 8)}...
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{employee.job}</TableCell>
                        <TableCell>
                          <Link
                            href={`/dashboard/vendor/${employee.vendorId}/employees`}
                            className="hover:underline"
                          >
                            {employee.vendor.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {employee.gates && employee.gates.length > 0 ? (
                            employee.gates.map((eg) => eg.gate.name).join(", ")
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {employee.zones && employee.zones.length > 0 ? (
                            employee.zones.map((ez) => ez.zone.name).join(", ")
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatusBadge(employee.status)}</TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedEmployee(employee.id);
                                  setAccessCardDialogOpen(true);
                                }}
                              >
                                <CreditCard className="mr-2 h-4 w-4" />
                                Access Card
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleEdit(employee.id)}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(employee.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="space-y-4 md:hidden">
            {employees.length === 0 ? (
              <div className="text-muted-foreground text-center">
                No employees found
              </div>
            ) : (
              employees.map((employee) => {
                const profilePhoto = employee.employeeAttachments?.find(
                  (att) => att.type === "PROFILE_PHOTO",
                );
                const isSelected = selectedEmployees.includes(employee.id);
                return (
                  <Card key={employee.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleSelectEmployee(
                                employee.id,
                                checked as boolean,
                              )
                            }
                            aria-label={`Select ${employee.name}`}
                          />
                          <Avatar>
                            <AvatarImage
                              src={profilePhoto?.attachment.url}
                              alt={employee.name}
                            />
                            <AvatarFallback>
                              {getInitials(employee.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{employee.name}</div>
                            <div className="text-muted-foreground text-sm">
                              {employee.job}
                            </div>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedEmployee(employee.id);
                                setAccessCardDialogOpen(true);
                              }}
                            >
                              <CreditCard className="mr-2 h-4 w-4" />
                              Access Card
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleEdit(employee.id)}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(employee.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Building2 className="text-muted-foreground h-4 w-4" />
                          <Link
                            href={`/dashboard/vendor/${employee.vendorId}/employees`}
                            className="hover:underline"
                          >
                            {employee.vendor.name}
                          </Link>
                        </div>
                        {employee.gates && employee.gates.length > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <DoorOpen className="text-muted-foreground h-4 w-4" />
                            <span>
                              {employee.gates
                                .map((eg) => eg.gate.name)
                                .join(", ")}
                            </span>
                          </div>
                        )}
                        {employee.zones && employee.zones.length > 0 && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="text-muted-foreground h-4 w-4" />
                            <span>
                              {employee.zones
                                .map((ez) => ez.zone.name)
                                .join(", ")}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground text-xs">
                            ID: {employee.identifier.slice(0, 8)}...
                          </span>
                          {getStatusBadge(employee.status)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Update employee information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Name *</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, name: e.target.value })
                }
                placeholder="Employee name"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-job">Job Title *</Label>
              <Input
                id="edit-job"
                value={editFormData.job}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, job: e.target.value })
                }
                placeholder="Job title"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-nationalId">National ID *</Label>
              <Input
                id="edit-nationalId"
                value={editFormData.nationalId}
                onChange={(e) => {
                  const value = e.target.value;
                  setEditFormData({
                    ...editFormData,
                    nationalId: value,
                  });
                }}
                placeholder="National ID"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-gates">Gates</Label>
              <MultiSelect
                options={gates.map((gate) => ({
                  label: gate.name,
                  value: gate.id,
                }))}
                selected={editFormData.gateIds}
                onChange={(selected) =>
                  setEditFormData({ ...editFormData, gateIds: selected })
                }
                placeholder="Select gates..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-zones">Zones</Label>
              <MultiSelect
                options={zones.map((zone) => ({
                  label: zone.name,
                  value: zone.id,
                }))}
                selected={editFormData.zoneIds}
                onChange={(selected) =>
                  setEditFormData({ ...editFormData, zoneIds: selected })
                }
                placeholder="Select zones..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-allowed-dates">Working Dates</Label>
              <MultiSelect
                options={allowedDateOptions}
                selected={editFormData.allowedDates}
                onChange={(selected) =>
                  setEditFormData({ ...editFormData, allowedDates: selected })
                }
                placeholder="Select dates (leave empty for all dates)..."
              />
              <p className="text-muted-foreground text-xs">
                Leave empty to allow access on all dates
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-status">Status *</Label>
              <Select
                value={editFormData.status}
                onValueChange={(value) =>
                  setEditFormData({
                    ...editFormData,
                    status: value as EmployeeStatus,
                  })
                }
              >
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateSubmit}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Updating..." : "Update Employee"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Employee</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this employee? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Access Card Dialog */}
      <Dialog
        open={accessCardDialogOpen}
        onOpenChange={setAccessCardDialogOpen}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Employee Access Card</DialogTitle>
            <DialogDescription>
              Download or print the employee access card with QR code
            </DialogDescription>
          </DialogHeader>
          {selectedEmployee && (
            <EmployeeAccessCard
              employee={
                employees.find((e) => e.id === selectedEmployee) ?? {
                  id: "",
                  identifier: "",
                  name: "",
                  job: "",
                  gates: [],
                  zones: [],
                  vendor: null,
                  employeeAttachments: [],
                }
              }
              totalGatesCount={gates.length}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Bulk Print Dialog */}
      <Dialog open={bulkPrintDialogOpen} onOpenChange={setBulkPrintDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Print Access Cards</DialogTitle>
            <DialogDescription>
              Print access cards for all selected employees
            </DialogDescription>
          </DialogHeader>
          <BulkAccessCards
            employees={employees.filter((e) =>
              selectedEmployees.includes(e.id),
            )}
            totalGatesCount={gates.length}
          />
        </DialogContent>
      </Dialog>

      {/* Bulk Status Change Dialog */}
      <Dialog
        open={bulkStatusDialogOpen}
        onOpenChange={setBulkStatusDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Employee Status</DialogTitle>
            <DialogDescription>
              Update the status for {selectedEmployees.length} selected employee
              {selectedEmployees.length !== 1 ? "s" : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulk-status">New Status</Label>
              <Select
                value={bulkStatus}
                onValueChange={(value) =>
                  setBulkStatus(value as EmployeeStatus)
                }
              >
                <SelectTrigger id="bulk-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">
                    <div className="flex items-center">
                      <Clock className="mr-2 h-4 w-4" />
                      Pending
                    </div>
                  </SelectItem>
                  <SelectItem value="ACTIVE">
                    <div className="flex items-center">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Active
                    </div>
                  </SelectItem>
                  <SelectItem value="SUSPENDED">
                    <div className="flex items-center">
                      <XCircle className="mr-2 h-4 w-4" />
                      Suspended
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="bg-muted rounded-lg p-3">
              <p className="text-muted-foreground text-sm">
                This will update the status for all {selectedEmployees.length}{" "}
                selected employees to <strong>{bulkStatus}</strong>.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setBulkStatusDialogOpen(false)}
              disabled={bulkUpdateStatusMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkStatusUpdate}
              disabled={bulkUpdateStatusMutation.isPending}
            >
              {bulkUpdateStatusMutation.isPending
                ? "Updating..."
                : "Update Status"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
