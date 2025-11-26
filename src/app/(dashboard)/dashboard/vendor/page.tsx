"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Pencil,
  Trash2,
  Copy,
  RefreshCw,
  Users,
  MoreVertical,
} from "lucide-react";
import { toast } from "sonner";

export default function VendorPage() {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<{
    id: string;
    name: string;
    accessToken: string;
  } | null>(null);

  // Fetch vendors
  const { data: vendors, refetch } = api.vendor.getAll.useQuery();

  // Delete mutation
  const deleteMutation = api.vendor.delete.useMutation({
    onSuccess: () => {
      toast.success("Vendor deleted successfully");
      void refetch();
      setDeletingId(null);
    },
    onError: (error) => {
      toast.error(error.message);
      setDeletingId(null);
    },
  });

  // Regenerate token mutation
  const regenerateTokenMutation = api.vendor.regenerateToken.useMutation({
    onSuccess: (data) => {
      toast.success("Access token regenerated successfully");
      void refetch();
      if (selectedVendor) {
        setSelectedVendor({
          ...selectedVendor,
          accessToken: data.accessToken,
        });
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Filter vendors based on search query
  const filteredVendors = useMemo(() => {
    if (!vendors) return [];
    if (!searchQuery.trim()) return vendors;

    const query = searchQuery.toLowerCase();
    return vendors.filter(
      (vendor) =>
        vendor.name.toLowerCase().includes(query) ||
        vendor.description?.toLowerCase().includes(query) ||
        vendor.zones?.some((vz) =>
          vz.zone.name.toLowerCase().includes(query),
        ) ||
        vendor.gates?.some((vg) =>
          vg.gate.name.toLowerCase().includes(query),
        ) ||
        vendor.phoneNumber?.toLowerCase().includes(query),
    );
  }, [vendors, searchQuery]);

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      setDeletingId(id);
      deleteMutation.mutate({ id });
    }
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/vendor/${id}`);
  };

  const handleManageEmployees = (id: string) => {
    router.push(`/dashboard/vendor/${id}/employees`);
  };

  const handleCreate = () => {
    router.push("/dashboard/vendor/create");
  };

  const handleOpenTokenDialog = (vendor: {
    id: string;
    name: string;
    accessToken: string;
  }) => {
    setSelectedVendor(vendor);
    setTokenDialogOpen(true);
  };

  const handleCopyToken = () => {
    if (selectedVendor) {
      const portalUrl = `${window.location.origin}/vendor/${selectedVendor.id}/${selectedVendor.accessToken}`;
      void navigator.clipboard.writeText(portalUrl);
      toast.success("Vendor portal link copied to clipboard");
    }
  };

  const getWhatsAppMessage = (vendorName: string, portalUrl: string) => {
    return `Hello ${vendorName}! 👋

Welcome to our Event Vendor Access Management System.

Please use the link below to access your vendor portal and manage your employees:
${portalUrl}

📋 Instructions:
1. Click the link above to access your portal
2. View your vendor information and current employees
3. Add new employees by clicking "Add Employee"
4. Edit or remove employees as needed

If you have any questions, feel free to contact us.

Thank you!`;
  };

  const handleCopyWhatsAppMessage = () => {
    if (selectedVendor) {
      const portalUrl = `${window.location.origin}/vendor/${selectedVendor.id}/${selectedVendor.accessToken}`;
      const message = getWhatsAppMessage(selectedVendor.name, portalUrl);
      void navigator.clipboard.writeText(message);
      toast.success("WhatsApp message copied to clipboard");
    }
  };

  const handleRegenerateToken = () => {
    if (
      selectedVendor &&
      confirm(
        "Are you sure you want to regenerate the access token? This will invalidate the current vendor portal link.",
      )
    ) {
      regenerateTokenMutation.mutate({ id: selectedVendor.id });
    }
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:gap-6 md:p-6 h-full overflow-x-hidden">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-3xl font-bold">Vendors</h1>
          <p className="text-muted-foreground">
            Manage your event vendors and their access
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Vendor
        </Button>
      </div>

      <Card className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <CardHeader className="shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle>All Vendors</CardTitle>
            <div className="w-full max-w-sm">
              <Input
                placeholder="Search vendors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 min-h-0 overflow-x-hidden p-0">
          {/* Mobile Card View */}
          <div className="space-y-3 md:hidden p-6 overflow-auto h-full">
            {filteredVendors?.map((vendor) => (
              <Card key={vendor.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-base font-semibold">{vendor.name}</h3>
                      {vendor.description && (
                        <p className="text-muted-foreground mt-1 text-sm">
                          {vendor.description}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleManageEmployees(vendor.id)}
                        >
                          <Users className="mr-2 h-4 w-4" />
                          Manage Employees
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleOpenTokenDialog({
                              id: vendor.id,
                              name: vendor.name,
                              accessToken: vendor.accessToken,
                            })
                          }
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Access Token
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(vendor.id)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(vendor.id, vendor.name)}
                          disabled={deletingId === vendor.id}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <div className="font-medium">
                        {vendor.phoneNumber ?? "-"}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Zones:</span>
                      <div className="font-medium">
                        {vendor.zones && vendor.zones.length > 0
                          ? vendor.zones.map((vz) => vz.zone.name).join(", ")
                          : "-"}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Gates:</span>
                      <div className="font-medium">
                        {vendor.gates && vendor.gates.length > 0
                          ? vendor.gates.map((vg) => vg.gate.name).join(", ")
                          : "-"}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Staff:</span>
                      <div className="font-medium">
                        {vendor._count.employees} / {vendor.allowedStaffCount}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            {!filteredVendors?.length && (
              <div className="text-muted-foreground py-8 text-center">
                {searchQuery
                  ? "No vendors found matching your search."
                  : "No vendors found. Create one to get started."}
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block relative max-h-[calc(100vh-20rem)] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-30 bg-background">
                <TableRow>
                  <TableHead className="sticky left-0 z-20 bg-background">Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Gate</TableHead>
                  <TableHead>Allowed Staff</TableHead>
                  <TableHead>Employees</TableHead>
                  <TableHead className="text-right sticky right-0 z-20 bg-background shadow-[-1px_0_0_0_rgba(0,0,0,0.1)]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVendors?.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium sticky left-0 z-20 bg-background">{vendor.name}</TableCell>
                    <TableCell>{vendor.description ?? "-"}</TableCell>
                    <TableCell>{vendor.phoneNumber ?? "-"}</TableCell>
                    <TableCell>
                      {vendor.zones && vendor.zones.length > 0
                        ? vendor.zones.map((vz) => vz.zone.name).join(", ")
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {vendor.gates && vendor.gates.length > 0
                        ? vendor.gates.map((vg) => vg.gate.name).join(", ")
                        : "-"}
                    </TableCell>
                    <TableCell>{vendor.allowedStaffCount}</TableCell>
                    <TableCell>{vendor._count.employees}</TableCell>
                    <TableCell className="text-right sticky right-0 z-20 bg-background shadow-[-1px_0_0_0_rgba(0,0,0,0.1)]">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleManageEmployees(vendor.id)}
                          title="Manage employees"
                        >
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            handleOpenTokenDialog({
                              id: vendor.id,
                              name: vendor.name,
                              accessToken: vendor.accessToken,
                            })
                          }
                          title="Manage access token"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(vendor.id)}
                          title="Edit vendor"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(vendor.id, vendor.name)}
                          disabled={deletingId === vendor.id}
                          title="Delete vendor"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredVendors?.length && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      {searchQuery
                        ? "No vendors found matching your search."
                        : "No vendors found. Create one to get started."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Access Token Dialog */}
      <Dialog open={tokenDialogOpen} onOpenChange={setTokenDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              Vendor Portal Access - {selectedVendor?.name}
            </DialogTitle>
            <DialogDescription>
              Share this portal link with the vendor to allow them to manage
              their employees.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Portal Link Section */}
            <div className="space-y-2">
              <Label htmlFor="portal-link">Vendor Portal Link</Label>
              <div className="flex gap-2">
                <Input
                  id="portal-link"
                  value={
                    selectedVendor
                      ? `${window.location.origin}/vendor/${selectedVendor.id}/${selectedVendor.accessToken}`
                      : ""
                  }
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyToken}
                  title="Copy link"
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* WhatsApp Message Section */}
            <div className="space-y-2">
              <Label htmlFor="whatsapp-message">WhatsApp Message</Label>
              <div className="space-y-2">
                <Textarea
                  id="whatsapp-message"
                  value={
                    selectedVendor
                      ? getWhatsAppMessage(
                        selectedVendor.name,
                        `${window.location.origin}/vendor/${selectedVendor.id}/${selectedVendor.accessToken}`,
                      )
                      : ""
                  }
                  readOnly
                  className="font-mono text-sm"
                  rows={12}
                />
                <Button
                  variant="outline"
                  onClick={handleCopyWhatsAppMessage}
                  className="w-full"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy WhatsApp Message
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-between">
            <Button
              variant="destructive"
              onClick={handleRegenerateToken}
              disabled={regenerateTokenMutation.isPending}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate Token
            </Button>
            <Button variant="outline" onClick={() => setTokenDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
