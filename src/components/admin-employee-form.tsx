"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Save, User, CreditCard, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { UploadButton, useUploadThing } from "@/utils/uploadthing";
import Image from "next/image";
import { ImageCropDialog } from "@/components/image-crop-dialog";
import { generateAllowedDateOptions } from "@/lib/allowed-dates";

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

type Attachment = {
  id: string;
  url: string;
};

type EmployeeAttachment = {
  id: string;
  type: string;
  attachment: Attachment;
};

type EmployeeGate = {
  id: string;
  gateId: string;
  gate: Gate;
};

type EmployeeZone = {
  id: string;
  zoneId: string;
  zone: Zone;
};

type AllowedDate = {
  id: string;
  date: Date;
};

type Employee = {
  id: string;
  identifier: string;
  name: string;
  job: string;
  nationalId: string;
  version: number;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  bypassConcurrentLimit?: boolean;
  gates: EmployeeGate[];
  zones: EmployeeZone[];
  employeeAttachments?: EmployeeAttachment[];
  allowedDates?: AllowedDate[];
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
  accessToken: string;
  gates: VendorGate[];
  zones: VendorZone[];
};

type AdminEmployeeFormProps = {
  vendor: Vendor;
  employee: Employee | null;
  zones: Zone[];
  gates: Gate[];
  isCreate: boolean;
};

export function AdminEmployeeForm({
  vendor,
  employee,
  zones,
  gates,
  isCreate,
}: AdminEmployeeFormProps) {
  // Fetch unique job titles
  const { data: jobTitles = [] } = api.employee.getUniqueJobTitles.useQuery();

  // Generate allowed date options
  const allowedDateOptions = generateAllowedDateOptions();

  const [formData, setFormData] = useState(() => {
    // Initialize with employee data if editing, otherwise use defaults
    if (employee && !isCreate) {
      const profilePhoto = employee.employeeAttachments?.find(
        (att) => att.type === "PROFILE_PHOTO",
      );
      return {
        name: employee.name,
        job: employee.job,
        nationalId: employee.nationalId,
        gateIds: employee.gates.map((eg) => eg.gateId),
        zoneIds: employee.zones.map((ez) => ez.zoneId),
        profilePhotoUrl: profilePhoto?.attachment.url ?? "",
        status: employee.status,
        allowedDates:
          employee.allowedDates?.map((ad) => {
            const dateStr = new Date(ad.date).toISOString().split("T")[0];
            return dateStr!;
          }) ?? [],
        bypassConcurrentLimit: employee.bypassConcurrentLimit ?? false,
      };
    }
    // Default for new employee
    return {
      name: "",
      job: "",
      nationalId: "",
      gateIds: vendor.gates.map((vg) => vg.gateId),
      zoneIds: vendor.zones.map((vz) => vz.zoneId),
      profilePhotoUrl: "",
      status: "ACTIVE" as "PENDING" | "ACTIVE" | "SUSPENDED",
      allowedDates: [],
      bypassConcurrentLimit: false,
    };
  });

  const [idCardUrl, setIdCardUrl] = useState<string>(() => {
    if (employee && !isCreate) {
      const idCard = employee.employeeAttachments?.find(
        (att) => att.type === "ID_CARD",
      );
      return idCard?.attachment.url ?? "";
    }
    return "";
  });

  // Image crop dialog state
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string>("");
  const [isUploadingCroppedImage, setIsUploadingCroppedImage] = useState(false);

  // UploadThing hook
  const { startUpload } = useUploadThing("imageUploader");

  // Create mutation
  const createMutation = api.employee.createByAdmin.useMutation({
    onSuccess: () => {
      toast.success("Employee created successfully");
      window.location.href = `/dashboard/vendor/${vendor.id}/employees`;
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Update mutation
  const updateMutation = api.employee.updateByAdmin.useMutation({
    onSuccess: () => {
      toast.success("Employee updated successfully");
      window.location.href = `/dashboard/vendor/${vendor.id}/employees`;
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Create new version mutation
  const createVersionMutation = api.employee.createNewVersion.useMutation({
    onSuccess: () => {
      toast.success("New employee version created successfully");
      window.location.href = `/dashboard/vendor/${vendor.id}/employees`;
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Delete file mutation
  const deleteFileMutation = api.employee.deleteFile.useMutation({
    onSuccess: () => {
      toast.success("File deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete file");
      console.error(error);
    },
  });

  // Handle profile photo file selection (before upload)
  const handleProfilePhotoSelect = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setTempImageSrc(reader.result as string);
      setCropDialogOpen(true);
    };
    reader.readAsDataURL(file);
  };

  // Handle cropped image upload
  const handleCroppedImageComplete = async (croppedFile: File) => {
    setIsUploadingCroppedImage(true);
    try {
      const uploadResult = await startUpload([croppedFile]);

      if (!uploadResult || uploadResult.length === 0) {
        throw new Error("Upload failed");
      }

      const uploadedUrl = uploadResult[0]?.url;
      if (!uploadedUrl) {
        throw new Error("No URL returned from upload");
      }

      setFormData((prev) => ({ ...prev, profilePhotoUrl: uploadedUrl }));
      toast.success("Profile photo uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload profile photo");
    } finally {
      setIsUploadingCroppedImage(false);
    }
  };

  // Handle profile photo removal
  const handleRemoveProfilePhoto = () => {
    if (formData.profilePhotoUrl) {
      deleteFileMutation.mutate({ fileUrl: formData.profilePhotoUrl });
      setFormData({ ...formData, profilePhotoUrl: "" });
    }
  };

  // Handle ID card removal
  const handleRemoveIdCard = () => {
    if (idCardUrl) {
      deleteFileMutation.mutate({ fileUrl: idCardUrl });
      setIdCardUrl("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.profilePhotoUrl) {
      toast.error("Please upload a profile photo");
      return;
    }

    // Validate ID card is uploaded
    if (!idCardUrl) {
      toast.error("Please upload the National ID card");
      return;
    }

    const data = {
      vendorId: vendor.id,
      name: formData.name,
      job: formData.job,
      nationalId: formData.nationalId,
      gateIds: formData.gateIds.length > 0 ? formData.gateIds : undefined,
      zoneIds: formData.zoneIds.length > 0 ? formData.zoneIds : undefined,
      profilePhotoUrl: formData.profilePhotoUrl,
      idCardUrls: idCardUrl ? [idCardUrl] : undefined,
      status: formData.status,
      allowedDates:
        formData.allowedDates.length > 0 ? formData.allowedDates : undefined,
      bypassConcurrentLimit: formData.bypassConcurrentLimit,
    };

    if (isCreate) {
      createMutation.mutate(data);
    } else if (employee) {
      updateMutation.mutate({
        id: employee.id,
        ...data,
        gateIds: formData.gateIds.length > 0 ? formData.gateIds : null,
        zoneIds: formData.zoneIds.length > 0 ? formData.zoneIds : null,
        idCardUrls: idCardUrl ? [idCardUrl] : null,
        allowedDates:
          formData.allowedDates.length > 0 ? formData.allowedDates : null,
      });
    }
  };

  const handleCreateNewVersion = () => {
    if (!employee) return;

    if (!formData.profilePhotoUrl) {
      toast.error("Please upload a profile photo");
      return;
    }

    // Validate ID card is uploaded
    if (!idCardUrl) {
      toast.error("Please upload the National ID card");
      return;
    }

    const data = {
      oldEmployeeId: employee.id,
      name: formData.name,
      job: formData.job,
      nationalId: formData.nationalId,
      gateIds: formData.gateIds.length > 0 ? formData.gateIds : null,
      zoneIds: formData.zoneIds.length > 0 ? formData.zoneIds : null,
      profilePhotoUrl: formData.profilePhotoUrl,
      idCardUrls: idCardUrl ? [idCardUrl] : null,
      status: formData.status,
      allowedDates:
        formData.allowedDates.length > 0 ? formData.allowedDates : null,
      bypassConcurrentLimit: formData.bypassConcurrentLimit,
    };

    createVersionMutation.mutate(data);
  };

  const isLoading =
    createMutation.isPending ||
    updateMutation.isPending ||
    createVersionMutation.isPending;

  return (
    <div className="space-y-6">
      <Link href={`/dashboard/vendor/${vendor.id}/employees`}>
        <Button variant="ghost" className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Employees
        </Button>
      </Link>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
            <CardDescription>
              {isCreate
                ? "Add a new employee to the vendor"
                : "Update employee information"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter employee name"
                required
              />
            </div>

            {/* Job */}
            <div className="grid gap-2">
              <Label htmlFor="job">Job Title / Role *</Label>
              <Input
                id="job"
                list="job-titles"
                value={formData.job}
                onChange={(e) =>
                  setFormData({ ...formData, job: e.target.value })
                }
                placeholder="e.g., Security Guard, Technician, Manager"
                required
                autoComplete="off"
              />
              <datalist id="job-titles">
                {jobTitles.map((title) => (
                  <option key={title} value={title} />
                ))}
              </datalist>
              <p className="text-muted-foreground text-xs">
                Start typing to see suggestions from previous entries, or enter
                a new job title
              </p>
            </div>

            {/* National ID */}
            <div className="grid gap-2">
              <Label htmlFor="nationalId">
                National ID <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nationalId"
                value={formData.nationalId}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, nationalId: value });
                }}
                placeholder="National ID"
                required
              />
            </div>

            {/* Working Dates */}
            <div className="grid gap-2">
              <Label htmlFor="allowed-dates">Working Dates</Label>
              <MultiSelect
                options={allowedDateOptions}
                selected={formData.allowedDates}
                onChange={(selected) =>
                  setFormData({ ...formData, allowedDates: selected })
                }
                placeholder="Select dates (leave empty for all dates)..."
              />
              <p className="text-muted-foreground text-xs">
                Leave empty to allow access on all dates
              </p>
            </div>

            {/* Zones and Gates */}
            <div className="grid gap-4 md:grid-cols-2">
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
                <p className="text-muted-foreground text-xs">
                  Default:{" "}
                  {vendor.zones.map((vz) => vz.zone.name).join(", ") ||
                    "Not assigned"}
                </p>
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
                <p className="text-muted-foreground text-xs">
                  Default:{" "}
                  {vendor.gates.map((vg) => vg.gate.name).join(", ") ||
                    "Not assigned"}
                </p>
              </div>
            </div>

            {/* Employee Status */}
            <div className="grid gap-2">
              <Label htmlFor="status">Employee Status</Label>
              <Select
                key={employee?.id ?? "new"}
                value={formData.status}
                onValueChange={(value: "PENDING" | "ACTIVE" | "SUSPENDED") =>
                  setFormData({ ...formData, status: value })
                }
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bypass Concurrent Limit */}
            <div className="flex items-center space-x-2 rounded-lg border p-4">
              <Checkbox
                id="bypassConcurrentLimit"
                checked={formData.bypassConcurrentLimit}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    bypassConcurrentLimit: checked === true,
                  })
                }
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="bypassConcurrentLimit"
                  className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Bypass Concurrent Access Limit
                </Label>
                <p className="text-muted-foreground text-xs">
                  Allow this employee to access even when the vendor&apos;s
                  concurrent limit is reached. They will not be counted towards
                  the limit.
                </p>
              </div>
            </div>

            {/* Profile Photo Upload with Crop */}
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile Photo
                <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-start gap-4">
                {formData.profilePhotoUrl ? (
                  <div className="relative w-32 shrink-0">
                    <div
                      className="border-muted-foreground/25 relative w-full overflow-hidden rounded-lg border-2 border-dashed"
                      style={{ aspectRatio: "3.5 / 4.5" }}
                    >
                      <Image
                        src={formData.profilePhotoUrl}
                        alt="Profile photo"
                        fill
                        className="object-cover"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2"
                      onClick={handleRemoveProfilePhoto}
                      disabled={deleteFileMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="border-muted-foreground/25 flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 text-center">
                    <User className="text-muted-foreground mb-2 h-8 w-8" />
                    <p className="text-muted-foreground mb-3 text-sm">
                      Select a photo to crop and upload
                    </p>
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      id="profile-photo-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleProfilePhotoSelect(file);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        document.getElementById("profile-photo-input")?.click()
                      }
                      disabled={isUploadingCroppedImage}
                    >
                      {isUploadingCroppedImage ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <User className="mr-2 h-4 w-4" />
                          Choose Photo
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* National ID Card Upload (Single, Required) */}
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                National ID Card
                <span className="text-destructive">*</span>
              </Label>
              <p className="text-muted-foreground text-xs">
                Please upload a clear photo of the National ID card
              </p>

              {/* Display uploaded ID card */}
              {idCardUrl && (
                <div className="relative w-32 shrink-0">
                  <div className="border-muted-foreground/25 relative aspect-square w-full overflow-hidden rounded-lg border-2 border-dashed">
                    <Image
                      src={idCardUrl}
                      alt="National ID card"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-2 -right-2 h-6 w-6 p-0"
                    onClick={handleRemoveIdCard}
                    disabled={deleteFileMutation.isPending}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {/* Upload button - only show if no ID card uploaded */}
              {!idCardUrl && (
                <UploadButton
                  endpoint="imageUploader"
                  onClientUploadComplete={(res) => {
                    if (res?.[0]?.url) {
                      setIdCardUrl(res[0].url);
                      toast.success("National ID card uploaded");
                    }
                  }}
                  onUploadError={(error: Error) => {
                    toast.error(`Upload failed: ${error.message}`);
                  }}
                  appearance={{
                    button:
                      "ut-ready:bg-primary ut-uploading:cursor-not-allowed ut-uploading:bg-primary/50 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-sm font-medium rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                    allowedContent: "hidden",
                  }}
                  content={{
                    button({ ready, isUploading }) {
                      if (isUploading) return "Uploading...";
                      if (ready) return "Upload National ID Card";
                      return "Getting ready...";
                    },
                  }}
                />
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={isLoading}>
                <Save className="mr-2 h-4 w-4" />
                {isCreate ? "Create Employee" : "Update Employee"}
              </Button>

              {!isCreate && employee && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCreateNewVersion}
                  disabled={isLoading}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Create New Version
                </Button>
              )}

              <Link href={`/dashboard/vendor/${vendor.id}/employees`}>
                <Button type="button" variant="outline" disabled={isLoading}>
                  Cancel
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Image Crop Dialog */}
      <ImageCropDialog
        open={cropDialogOpen}
        onOpenChange={setCropDialogOpen}
        imageSrc={tempImageSrc}
        onCropComplete={handleCroppedImageComplete}
      />
    </div>
  );
}
