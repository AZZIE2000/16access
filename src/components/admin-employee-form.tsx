"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, User, CreditCard, X, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { UploadButton, useUploadThing } from "@/utils/uploadthing";
import Image from "next/image";
import { ImageCropDialog } from "@/components/image-crop-dialog";

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
  employeeAttachments?: EmployeeAttachment[];
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

  const [formData, setFormData] = useState({
    name: "",
    job: "",
    description: "",
    gateId: null as string | null,
    zoneId: null as string | null,
    profilePhotoUrl: "",
    status: "ACTIVE" as "PENDING" | "ACTIVE" | "SUSPENDED",
  });
  useEffect(() => {
    console.log("Vendor object:", vendor);
    console.log("Vendor gateId:", vendor.gateId);
    console.log("Vendor zoneId:", vendor.zoneId);
    console.log("Form data:", formData);
  }, [vendor, formData]);
  const [idCardUrls, setIdCardUrls] = useState<string[]>([]);

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

  // Populate form data when employee is loaded or when creating
  useEffect(() => {
    if (employee && !isCreate) {
      // Editing existing employee
      const profilePhoto = employee.employeeAttachments?.find(
        (att) => att.type === "PROFILE_PHOTO",
      );
      const idCards =
        employee.employeeAttachments
          ?.filter((att) => att.type === "ID_CARD")
          .map((att) => att.attachment.url) ?? [];

      setFormData({
        name: employee.name,
        job: employee.job,
        description: employee.description ?? "",
        gateId: employee.gateId ?? vendor.gateId,
        zoneId: employee.zoneId ?? vendor.zoneId,
        profilePhotoUrl: profilePhoto?.attachment.url ?? "",
        status: employee.status,
      });

      setIdCardUrls(idCards);
    } else {
      // Creating new employee - set vendor's gate and zone as default
      setFormData({
        gateId: vendor.gateId,
        name: "",
        job: "",
        description: "",
        zoneId: vendor.zoneId,
        profilePhotoUrl: "",
        status: "ACTIVE" as "PENDING" | "ACTIVE" | "SUSPENDED",
      });
    }
  }, [employee, isCreate, vendor, vendor.gateId, vendor.zoneId]);

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
  const handleRemoveIdCard = (index: number) => {
    const urlToRemove = idCardUrls[index];
    if (urlToRemove) {
      deleteFileMutation.mutate({ fileUrl: urlToRemove });
      setIdCardUrls(idCardUrls.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.profilePhotoUrl) {
      toast.error("Please upload a profile photo");
      return;
    }

    const data = {
      vendorId: vendor.id,
      name: formData.name,
      job: formData.job,
      description: formData.description || undefined,
      gateId: formData.gateId || undefined,
      zoneId: formData.zoneId || undefined,
      profilePhotoUrl: formData.profilePhotoUrl,
      idCardUrls: idCardUrls.length > 0 ? idCardUrls : undefined,
      status: formData.status,
    };

    if (isCreate) {
      createMutation.mutate(data);
    } else if (employee) {
      updateMutation.mutate({
        id: employee.id,
        ...data,
        description: formData.description || null,
        gateId: formData.gateId || null,
        zoneId: formData.zoneId || null,
        idCardUrls: idCardUrls.length > 0 ? idCardUrls : null,
      });
    }
  };

  const handleCreateNewVersion = () => {
    if (!employee) return;

    if (!formData.profilePhotoUrl) {
      toast.error("Please upload a profile photo");
      return;
    }

    const data = {
      oldEmployeeId: employee.id,
      name: formData.name,
      job: formData.job,
      description: formData.description || null,
      gateId: formData.gateId || null,
      zoneId: formData.zoneId || null,
      profilePhotoUrl: formData.profilePhotoUrl,
      idCardUrls: idCardUrls.length > 0 ? idCardUrls : null,
      status: formData.status,
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

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Additional notes or description (optional)"
                rows={3}
              />
            </div>

            {/* Zone and Gate */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="zone">Zone</Label>
                <Select
                  value={formData.zoneId ?? undefined}
                  onValueChange={(value) =>
                    setFormData({ ...formData, zoneId: value })
                  }
                >
                  <SelectTrigger id="zone">
                    <SelectValue placeholder="Select a zone (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map((zone) => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  Default: {vendor.zone?.name ?? "Not assigned"}
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="gate">Gate</Label>
                <Select
                  value={formData.gateId ?? undefined}
                  onValueChange={(value) =>
                    setFormData({ ...formData, gateId: value })
                  }
                >
                  <SelectTrigger id="gate">
                    <SelectValue placeholder="Select a gate (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {gates.map((gate) => (
                      <SelectItem key={gate.id} value={gate.id}>
                        {gate.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-muted-foreground text-xs">
                  Default: {vendor.gate?.name ?? "Not assigned"}
                </p>
              </div>
            </div>

            {/* Employee Status */}
            <div className="grid gap-2">
              <Label htmlFor="status">Employee Status</Label>
              <Select
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

            {/* ID Cards Upload (Multiple) */}
            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                ID Cards (ID, Passport, etc.)
                <span className="text-muted-foreground text-xs font-normal">
                  (Optional)
                </span>
              </Label>

              {idCardUrls.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {idCardUrls.map((url, index) => (
                    <div key={index} className="relative w-24 shrink-0">
                      <div className="border-muted-foreground/25 relative aspect-square w-full overflow-hidden rounded-lg border-2 border-dashed">
                        <Image
                          src={url}
                          alt={`ID card ${index + 1}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-6 w-6 p-0"
                        onClick={() => handleRemoveIdCard(index)}
                        disabled={deleteFileMutation.isPending}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                <UploadButton
                  endpoint="imageUploader"
                  onClientUploadComplete={(res) => {
                    if (res?.[0]?.url) {
                      setIdCardUrls([...idCardUrls, res[0].url]);
                      toast.success("ID card uploaded");
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
                      if (ready) return "Add ID Card";
                      return "Getting ready...";
                    },
                  }}
                />
                <span className="text-muted-foreground text-sm">
                  Upload ID cards, passports, or other documents
                </span>
              </div>
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
