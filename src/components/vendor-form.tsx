"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MultiSelect } from "@/components/ui/multi-select";
import { toast } from "sonner";
import { Copy, RefreshCw } from "lucide-react";

type Zone = {
  id: string;
  name: string;
  description: string | null;
};

type Gate = {
  id: string;
  name: string;
  description: string | null;
};

type VendorGate = {
  id: string;
  gateId: string;
  gate: Gate;
};

type VendorZone = {
  id: string;
  zoneId: string;
  zone: Zone;
};

type Vendor = {
  id: string;
  name: string;
  description: string | null;
  phoneNumber: string | null;
  allowedStaffCount: number;
  allowedInCount: number;
  accessToken: string;
  gates: VendorGate[];
  zones: VendorZone[];
};

type VendorFormProps = {
  vendor: Vendor | null;
  zones: Zone[];
  gates: Gate[];
  isCreate: boolean;
};

export function VendorForm({
  vendor,
  zones,
  gates,
  isCreate,
}: VendorFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: vendor?.name ?? "",
    description: vendor?.description ?? "",
    phoneNumber: vendor?.phoneNumber ?? "",
    allowedStaffCount: vendor?.allowedStaffCount ?? 1,
    allowedInCount: vendor?.allowedInCount ?? 0,
    gateIds: vendor?.gates.map((vg) => vg.gateId) ?? [],
    zoneIds: vendor?.zones.map((vz) => vz.zoneId) ?? [],
  });

  const [accessToken, setAccessToken] = useState(vendor?.accessToken ?? "");

  // If not in create mode and no vendor, show error message
  if (!isCreate && !vendor) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <h2 className="mb-2 text-2xl font-bold text-red-600">
              Vendor Not Found
            </h2>
            <p className="text-muted-foreground mb-4">
              The vendor you&apos;re looking for doesn&apos;t exist or has been
              deleted.
            </p>
            <Button onClick={() => router.push("/dashboard/vendor/create")}>
              Create New Vendor
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Create mutation
  const createMutation = api.vendor.create.useMutation({
    onSuccess: (data) => {
      toast.success("Vendor created successfully");
      router.push(`/dashboard/vendor/${data.vendor.id}`);
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Update mutation
  const updateMutation = api.vendor.update.useMutation({
    onSuccess: () => {
      toast.success("Vendor updated successfully");
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Regenerate token mutation
  const regenerateTokenMutation = api.vendor.regenerateToken.useMutation({
    onSuccess: (data) => {
      setAccessToken(data.accessToken);
      toast.success("Access token regenerated successfully");
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name: formData.name,
      description: formData.description || undefined,
      phoneNumber: formData.phoneNumber || undefined,
      allowedStaffCount: formData.allowedStaffCount,
      allowedInCount: formData.allowedInCount,
      gateIds: formData.gateIds.length > 0 ? formData.gateIds : undefined,
      zoneIds: formData.zoneIds.length > 0 ? formData.zoneIds : undefined,
    };

    if (isCreate) {
      createMutation.mutate(data);
    } else if (vendor) {
      updateMutation.mutate({
        id: vendor.id,
        ...data,
        phoneNumber: formData.phoneNumber || null,
      });
    }
  };

  const handleRegenerateToken = () => {
    if (
      vendor &&
      confirm(
        "Are you sure you want to regenerate the access token? This will invalidate the current token.",
      )
    ) {
      regenerateTokenMutation.mutate({ id: vendor.id });
    }
  };

  const handleCopyToken = () => {
    if (vendor) {
      const portalUrl = `${window.location.origin}/vendor/${vendor.id}/${accessToken}`;
      void navigator.clipboard.writeText(portalUrl);
      toast.success("Vendor portal link copied to clipboard");
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Vendor Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Enter vendor name"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enter vendor description (optional)"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <Input
              id="phoneNumber"
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
              placeholder="Enter phone number (optional)"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="allowedStaffCount">Allowed Staff Count *</Label>
            <Input
              id="allowedStaffCount"
              type="number"
              min="1"
              value={formData.allowedStaffCount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  allowedStaffCount: parseInt(e.target.value) || 1,
                })
              }
              placeholder="Enter allowed staff count"
              required
            />
            <p className="text-muted-foreground text-sm">
              Maximum number of employees this vendor can register
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="allowedInCount">
              Allowed In Count (0 = Unlimited)
            </Label>
            <Input
              id="allowedInCount"
              type="number"
              min="0"
              value={formData.allowedInCount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  allowedInCount: parseInt(e.target.value) || 0,
                })
              }
              placeholder="Enter allowed in count (0 for unlimited)"
            />
            <p className="text-muted-foreground text-sm">
              Maximum number of employees allowed in at the same time. Set to 0
              for unlimited access.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Access Assignment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="zones">Zones</Label>
            <MultiSelect
              options={zones.map((zone) => ({
                label: zone.name,
                value: zone.id,
              }))}
              selected={formData.zoneIds}
              onChange={(selected) =>
                setFormData({ ...formData, zoneIds: selected })
              }
              placeholder="Select zones (optional)"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="gates">Gates</Label>
            <MultiSelect
              options={gates.map((gate) => ({
                label: gate.name,
                value: gate.id,
              }))}
              selected={formData.gateIds}
              onChange={(selected) =>
                setFormData({ ...formData, gateIds: selected })
              }
              placeholder="Select gates (optional)"
            />
          </div>
        </CardContent>
      </Card>

      {!isCreate && accessToken && vendor && (
        <Card>
          <CardHeader>
            <CardTitle>Vendor Portal Access</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label>Portal Link</Label>
              <div className="flex gap-2">
                <Input
                  value={`${window.location.origin}/vendor/${vendor.id}/${accessToken}`}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleCopyToken}
                  title="Copy portal link"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={handleRegenerateToken}
                  disabled={regenerateTokenMutation.isPending}
                  title="Regenerate access token"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-muted-foreground text-sm">
                Share this link with the vendor to access their portal and
                manage employees. Click the refresh icon to regenerate and
                invalidate the current link.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading
            ? "Saving..."
            : isCreate
              ? "Create Vendor"
              : "Update Vendor"}
        </Button>
      </div>
    </form>
  );
}
