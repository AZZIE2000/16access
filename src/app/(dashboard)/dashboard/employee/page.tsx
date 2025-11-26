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
  ChevronLeft,
  ChevronRight,
  Link2,
  Copy,
  Check,
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accessCardDialogOpen, setAccessCardDialogOpen] = useState(false);
  const [bulkPrintDialogOpen, setBulkPrintDialogOpen] = useState(false);
  const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false);
  const [badgeLinksDialogOpen, setBadgeLinksDialogOpen] = useState(false);
  const [copyingAll, setCopyingAll] = useState(false);
  const [copiedButtons, setCopiedButtons] = useState<Record<string, boolean>>(
    {},
  );
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

  // Get current user to check if admin
  const { data: currentUser } = api.user.getCurrentUser.useQuery();
  const isAdmin = currentUser?.role === "admin";

  // Fetch all employees with filters and pagination
  const { data, refetch } = api.employee.getAllAdmin.useQuery({
    search: search || undefined,
    status: statusFilter === "ALL" ? undefined : statusFilter,
    vendorId: vendorFilter === "ALL" ? undefined : vendorFilter,
    gateId: gateFilter === "ALL" ? undefined : gateFilter,
    zoneId: zoneFilter === "ALL" ? undefined : zoneFilter,
    page: currentPage,
    pageSize: pageSize,
  });

  const employees = data?.employees ?? [];
  const pagination = data?.pagination;

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

  // Reset to page 1 when filters change
  const handleFilterChange = (
    filterSetter: (value: any) => void,
    value: any,
  ) => {
    filterSetter(value);
    setCurrentPage(1);
    setSelectedEmployees([]);
  };

  const isAllSelected =
    employees.length > 0 && selectedEmployees.length === employees.length;

  return (
    <div className="space-y-6 p-3 md:p-6 h-full flex flex-col overflow-hidden">
      <div className="shrink-0">
        <h1 className="text-3xl font-bold">Employee Management</h1>
        <p className="text-muted-foreground">
          View and manage all employees across all vendors
        </p>
      </div>

      {/* Selection Actions */}
      {selectedEmployees.length > 0 && (
        <Card className="border-primary bg-primary/5 shrink-0">
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBadgeLinksDialogOpen(true)}
              >
                <Link2 className="mr-2 h-4 w-4" />
                Badge Links
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
      <div className="flex flex-col gap-3 shrink-0">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              id="search"
              placeholder="Search by name, job, or vendor..."
              value={search}
              onChange={(e) => handleFilterChange(setSearch, e.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) =>
              handleFilterChange(
                setStatusFilter,
                value as EmployeeStatus | "ALL",
              )
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
            onValueChange={(value) =>
              handleFilterChange(setVendorFilter, value)
            }
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
            onValueChange={(value) => handleFilterChange(setGateFilter, value)}
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
            onValueChange={(value) => handleFilterChange(setZoneFilter, value)}
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
      <Card className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <CardHeader className="shrink-0">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Employees ({pagination?.totalCount ?? 0})</CardTitle>
              <CardDescription>
                {pagination && (
                  <>
                    Showing {(pagination.page - 1) * pagination.pageSize + 1} to{" "}
                    {Math.min(
                      pagination.page * pagination.pageSize,
                      pagination.totalCount,
                    )}{" "}
                    of {pagination.totalCount} employees
                  </>
                )}
              </CardDescription>
            </div>
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) =>
                      Math.min(pagination.totalPages, p + 1),
                    )
                  }
                  disabled={currentPage === pagination.totalPages}
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 overflow-x-hidden p-0">
          <div className="hidden md:block relative max-h-[calc(100vh-30rem)] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-30 bg-background">
                <TableRow>
                  <TableHead className="w-12 sticky left-0 z-20 bg-background">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all employees"
                    />
                  </TableHead>
                  <TableHead className="sticky left-1 z-20 bg-background">Employee</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Gate</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead>Role</TableHead>}
                  <TableHead className="text-right sticky right-0 z-20 bg-background shadow-[-1px_0_0_0_rgba(0,0,0,0.1)]">Actions</TableHead>
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
                        <TableCell className="sticky left-0 z-20 bg-background">
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
                        <TableCell className="sticky left-1 z-20 bg-background">
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
                        {isAdmin && (
                          <TableCell>
                            {employee.bypassConcurrentLimit ? (
                              <Badge
                                variant="outline"
                                className="border-purple-200 bg-purple-50 text-purple-700"
                              >
                                Owner
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        )}
                        <TableCell className="text-right sticky right-0 z-20 bg-background shadow-[-1px_0_0_0_rgba(0,0,0,0.1)]">
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
          <div className="space-y-4 md:hidden p-4 overflow-auto h-full">
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
                          <div className="flex gap-2">
                            {getStatusBadge(employee.status)}
                            {isAdmin && employee.bypassConcurrentLimit && (
                              <Badge
                                variant="outline"
                                className="border-purple-200 bg-purple-50 text-purple-700"
                              >
                                Owner
                              </Badge>
                            )}
                          </div>
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

      {/* Badge Links Dialog */}
      <Dialog
        open={badgeLinksDialogOpen}
        onOpenChange={setBadgeLinksDialogOpen}
      >
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Employee Badge Links</DialogTitle>
            <DialogDescription>
              Share these public links to display employee badges. Each link
              shows the employee's badge without requiring authentication.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {/* Copy All Button */}
            <Card className="border-primary bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Copy All Links</p>
                    <p className="text-muted-foreground text-sm">
                      Copy all employee names with their badge links
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={async () => {
                      setCopyingAll(true);
                      const selectedEmployeesList = employees.filter((e) =>
                        selectedEmployees.includes(e.id),
                      );
                      const allLinks = selectedEmployeesList
                        .map(
                          (emp) =>
                            `${emp.name}: ${typeof window !== "undefined" ? window.location.origin : ""}/employee/${emp.id}`,
                        )
                        .join("\n");
                      await navigator.clipboard.writeText(allLinks);
                      toast.success(
                        `Copied ${selectedEmployeesList.length} employee link${selectedEmployeesList.length !== 1 ? "s" : ""}!`,
                      );
                      // Keep the checkmark visible for 2 seconds
                      setTimeout(() => {
                        setCopyingAll(false);
                      }, 2000);
                    }}
                    disabled={copyingAll}
                    className={
                      copyingAll ? "bg-green-600 hover:bg-green-600" : ""
                    }
                  >
                    {copyingAll ? (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy All
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Individual Employee Links */}
            {employees
              .filter((e) => selectedEmployees.includes(e.id))
              .map((employee) => {
                const badgeUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/employee/${employee.id}`;
                const copyLinkKey = `link-${employee.id}`;
                const copyNameKey = `name-${employee.id}`;

                const handleCopyLink = async () => {
                  setCopiedButtons((prev) => ({
                    ...prev,
                    [copyLinkKey]: true,
                  }));
                  await navigator.clipboard.writeText(badgeUrl);
                  toast.success(`Link copied for ${employee.name}`);
                  setTimeout(() => {
                    setCopiedButtons((prev) => ({
                      ...prev,
                      [copyLinkKey]: false,
                    }));
                  }, 2000);
                };

                const handleCopyNameWithLink = async () => {
                  setCopiedButtons((prev) => ({
                    ...prev,
                    [copyNameKey]: true,
                  }));
                  const textToCopy = `${employee.name}: ${badgeUrl}`;
                  await navigator.clipboard.writeText(textToCopy);
                  toast.success(`Copied name and link for ${employee.name}`);
                  setTimeout(() => {
                    setCopiedButtons((prev) => ({
                      ...prev,
                      [copyNameKey]: false,
                    }));
                  }, 2000);
                };

                return (
                  <Card key={employee.id}>
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{employee.name}</p>
                            <p className="text-muted-foreground text-sm">
                              {employee.job} • {employee.vendor.name}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={badgeUrl}
                            readOnly
                            className="flex-1 text-sm"
                          />
                          <Button
                            size="sm"
                            variant={
                              copiedButtons[copyLinkKey] ? "default" : "outline"
                            }
                            onClick={handleCopyLink}
                            title="Copy link only"
                            disabled={copiedButtons[copyLinkKey]}
                            className={
                              copiedButtons[copyLinkKey]
                                ? "bg-green-600 hover:bg-green-600"
                                : ""
                            }
                          >
                            {copiedButtons[copyLinkKey] ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant={
                              copiedButtons[copyNameKey] ? "default" : "outline"
                            }
                            onClick={handleCopyNameWithLink}
                            title="Copy name with link"
                            disabled={copiedButtons[copyNameKey]}
                            className={
                              copiedButtons[copyNameKey]
                                ? "bg-green-600 hover:bg-green-600"
                                : ""
                            }
                          >
                            {copiedButtons[copyNameKey] ? (
                              <>
                                <Check className="mr-1 h-4 w-4" />
                                Copied
                              </>
                            ) : (
                              <>
                                <Copy className="mr-1 h-4 w-4" />
                                Name
                              </>
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(badgeUrl, "_blank")}
                            title="Open in new tab"
                          >
                            <Link2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setBadgeLinksDialogOpen(false)}
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}