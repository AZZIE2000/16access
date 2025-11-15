"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Trash2, MoreVertical } from "lucide-react";
import { toast } from "sonner";

type ZoneFormData = {
  id?: string;
  name: string;
  description: string | null;
};

type GateFormData = {
  id?: string;
  name: string;
  description: string | null;
};

export default function AreaPage() {
  const [zoneDialogOpen, setZoneDialogOpen] = useState(false);
  const [gateDialogOpen, setGateDialogOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ZoneFormData | null>(null);
  const [editingGate, setEditingGate] = useState<GateFormData | null>(null);

  const [zoneFormData, setZoneFormData] = useState<ZoneFormData>({
    name: "",
    description: "",
  });

  const [gateFormData, setGateFormData] = useState<GateFormData>({
    name: "",
    description: "",
  });

  // Queries
  const { data: zones, refetch: refetchZones } = api.zone.getAll.useQuery();
  const { data: gates, refetch: refetchGates } = api.gate.getAll.useQuery();

  // Zone mutations
  const createZoneMutation = api.zone.create.useMutation({
    onSuccess: () => {
      toast.success("Zone created successfully");
      void refetchZones();
      setZoneDialogOpen(false);
      resetZoneForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateZoneMutation = api.zone.update.useMutation({
    onSuccess: () => {
      toast.success("Zone updated successfully");
      void refetchZones();
      setZoneDialogOpen(false);
      resetZoneForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteZoneMutation = api.zone.delete.useMutation({
    onSuccess: () => {
      toast.success("Zone deleted successfully");
      void refetchZones();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Gate mutations
  const createGateMutation = api.gate.create.useMutation({
    onSuccess: () => {
      toast.success("Gate created successfully");
      void refetchGates();
      setGateDialogOpen(false);
      resetGateForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateGateMutation = api.gate.update.useMutation({
    onSuccess: () => {
      toast.success("Gate updated successfully");
      void refetchGates();
      setGateDialogOpen(false);
      resetGateForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteGateMutation = api.gate.delete.useMutation({
    onSuccess: () => {
      toast.success("Gate deleted successfully");
      void refetchGates();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Zone handlers
  const resetZoneForm = () => {
    setZoneFormData({ name: "", description: "" });
    setEditingZone(null);
  };

  const handleCreateZone = () => {
    setEditingZone(null);
    resetZoneForm();
    setZoneDialogOpen(true);
  };

  const handleEditZone = (zone: ZoneFormData) => {
    setEditingZone(zone);
    setZoneFormData({
      name: zone.name,
      description: zone.description ?? "",
    });
    setZoneDialogOpen(true);
  };

  const handleZoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingZone?.id) {
      updateZoneMutation.mutate({
        id: editingZone.id,
        name: zoneFormData.name,
        description: zoneFormData.description ?? undefined,
      });
    } else {
      createZoneMutation.mutate({
        name: zoneFormData.name,
        description: zoneFormData.description ?? undefined,
      });
    }
  };

  const handleDeleteZone = (id: string) => {
    if (confirm("Are you sure you want to delete this zone?")) {
      deleteZoneMutation.mutate({ id });
    }
  };

  // Gate handlers
  const resetGateForm = () => {
    setGateFormData({ name: "", description: "" });
    setEditingGate(null);
  };

  const handleCreateGate = () => {
    setEditingGate(null);
    resetGateForm();
    setGateDialogOpen(true);
  };

  const handleEditGate = (gate: GateFormData) => {
    setEditingGate(gate);
    setGateFormData({
      name: gate.name,
      description: gate.description ?? "",
    });
    setGateDialogOpen(true);
  };

  const handleGateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGate?.id) {
      updateGateMutation.mutate({
        id: editingGate.id,
        name: gateFormData.name,
        description: gateFormData.description ?? undefined,
      });
    } else {
      createGateMutation.mutate({
        name: gateFormData.name,
        description: gateFormData.description ?? undefined,
      });
    }
  };

  const handleDeleteGate = (id: string) => {
    if (confirm("Are you sure you want to delete this gate?")) {
      deleteGateMutation.mutate({ id });
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Area Management</h1>
        <p className="text-muted-foreground">
          Manage zones and gates for your event
        </p>
      </div>

      <Tabs defaultValue="zones" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="zones">Zones</TabsTrigger>
          <TabsTrigger value="gates">Gates</TabsTrigger>
        </TabsList>

        {/* Zones Tab */}
        <TabsContent value="zones">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Zones</CardTitle>
              <Button onClick={handleCreateZone}>
                <Plus className="mr-2 h-4 w-4" />
                Add Zone
              </Button>
            </CardHeader>
            <CardContent>
              {/* Mobile Card View */}
              <div className="space-y-3 md:hidden">
                {zones?.map((zone) => (
                  <Card key={zone.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold">
                            {zone.name}
                          </h3>
                          {zone.description && (
                            <p className="text-muted-foreground mt-1 text-sm">
                              {zone.description}
                            </p>
                          )}
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
                              onClick={() => handleEditZone(zone)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteZone(zone.id)}
                              disabled={deleteZoneMutation.isPending}
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
                          <span className="text-muted-foreground">
                            Vendors:
                          </span>
                          <div className="font-medium">
                            {zone._count.vendors}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Employees:
                          </span>
                          <div className="font-medium">
                            {zone._count.employees}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                {!zones?.length && (
                  <div className="text-muted-foreground py-8 text-center">
                    No zones found. Create one to get started.
                  </div>
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Vendors</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {zones?.map((zone) => (
                      <TableRow key={zone.id}>
                        <TableCell className="font-medium">
                          {zone.name}
                        </TableCell>
                        <TableCell>{zone.description ?? "-"}</TableCell>
                        <TableCell>{zone._count.vendors}</TableCell>
                        <TableCell>{zone._count.employees}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEditZone(zone)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteZone(zone.id)}
                              disabled={deleteZoneMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!zones?.length && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          No zones found. Create one to get started.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gates Tab */}
        <TabsContent value="gates">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Gates</CardTitle>
              <Button onClick={handleCreateGate}>
                <Plus className="mr-2 h-4 w-4" />
                Add Gate
              </Button>
            </CardHeader>
            <CardContent>
              {/* Mobile Card View */}
              <div className="space-y-3 md:hidden">
                {gates?.map((gate) => (
                  <Card key={gate.id} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold">
                            {gate.name}
                          </h3>
                          {gate.description && (
                            <p className="text-muted-foreground mt-1 text-sm">
                              {gate.description}
                            </p>
                          )}
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
                              onClick={() => handleEditGate(gate)}
                            >
                              <Pencil className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteGate(gate.id)}
                              disabled={deleteGateMutation.isPending}
                              className="text-destructive"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">
                            Vendors:
                          </span>
                          <div className="font-medium">
                            {gate._count.vendors}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Employees:
                          </span>
                          <div className="font-medium">
                            {gate._count.employees}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Activities:
                          </span>
                          <div className="font-medium">
                            {gate._count.activities}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
                {!gates?.length && (
                  <div className="text-muted-foreground py-8 text-center">
                    No gates found. Create one to get started.
                  </div>
                )}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Vendors</TableHead>
                      <TableHead>Employees</TableHead>
                      <TableHead>Activities</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gates?.map((gate) => (
                      <TableRow key={gate.id}>
                        <TableCell className="font-medium">
                          {gate.name}
                        </TableCell>
                        <TableCell>{gate.description ?? "-"}</TableCell>
                        <TableCell>{gate._count.vendors}</TableCell>
                        <TableCell>{gate._count.employees}</TableCell>
                        <TableCell>{gate._count.activities}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEditGate(gate)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDeleteGate(gate.id)}
                              disabled={deleteGateMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!gates?.length && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          No gates found. Create one to get started.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Zone Dialog */}
      <Dialog open={zoneDialogOpen} onOpenChange={setZoneDialogOpen}>
        <DialogContent>
          <form onSubmit={handleZoneSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingZone ? "Edit Zone" : "Create Zone"}
              </DialogTitle>
              <DialogDescription>
                {editingZone
                  ? "Update the zone details below."
                  : "Add a new zone to your event."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="zone-name">Name *</Label>
                <Input
                  id="zone-name"
                  value={zoneFormData.name}
                  onChange={(e) =>
                    setZoneFormData({ ...zoneFormData, name: e.target.value })
                  }
                  placeholder="Enter zone name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="zone-description">Description</Label>
                <Input
                  id="zone-description"
                  value={zoneFormData.description ?? ""}
                  onChange={(e) =>
                    setZoneFormData({
                      ...zoneFormData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter zone description (optional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setZoneDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createZoneMutation.isPending || updateZoneMutation.isPending
                }
              >
                {editingZone ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Gate Dialog */}
      <Dialog open={gateDialogOpen} onOpenChange={setGateDialogOpen}>
        <DialogContent>
          <form onSubmit={handleGateSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingGate ? "Edit Gate" : "Create Gate"}
              </DialogTitle>
              <DialogDescription>
                {editingGate
                  ? "Update the gate details below."
                  : "Add a new gate to your event."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="gate-name">Name *</Label>
                <Input
                  id="gate-name"
                  value={gateFormData.name}
                  onChange={(e) =>
                    setGateFormData({ ...gateFormData, name: e.target.value })
                  }
                  placeholder="Enter gate name"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gate-description">Description</Label>
                <Input
                  id="gate-description"
                  value={gateFormData.description ?? ""}
                  onChange={(e) =>
                    setGateFormData({
                      ...gateFormData,
                      description: e.target.value,
                    })
                  }
                  placeholder="Enter gate description (optional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setGateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  createGateMutation.isPending || updateGateMutation.isPending
                }
              >
                {editingGate ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
