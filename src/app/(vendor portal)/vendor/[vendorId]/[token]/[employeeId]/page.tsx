"use client";

import { useState, useEffect } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Save,
  Building2,
  Upload,
  X,
  User,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { UploadButton, useUploadThing } from "@/utils/uploadthing";
import Image from "next/image";
import { ImageCropDialog } from "@/components/image-crop-dialog";
import { MultiSelect } from "@/components/ui/multi-select";
import { generateAllowedDateOptions } from "@/lib/allowed-dates";

export default function EmployeeFormPage() {
  const params = useParams();
  const router = useRouter();
  const vendorId = params.vendorId as string;
  const token = params.token as string;
  const employeeId = params.employeeId as string;

  const isCreate = employeeId === "create";

  const [formData, setFormData] = useState({
    name: "",
    job: "",
    nationalId: "",
    profilePhotoUrl: "",
    allowedDates: [] as string[],
  });

  // Generate allowed date options
  const allowedDateOptions = generateAllowedDateOptions();

  // Single ID card URL (required)
  const [idCardUrl, setIdCardUrl] = useState<string>("");

  // Image crop dialog state
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string>("");
  const [isUploadingCroppedImage, setIsUploadingCroppedImage] = useState(false);

  // UploadThing hook
  const { startUpload } = useUploadThing("imageUploader");

  // Fetch unique job titles for this vendor
  const { data: jobTitles = [] } =
    api.employee.getUniqueJobTitlesByToken.useQuery({
      token,
    });

  // Fetch vendor data
  const { data: vendor, isLoading: vendorLoading } =
    api.employee.getVendorByToken.useQuery({
      token,
    });

  // Fetch employee data if editing
  const { data: employee, isLoading: employeeLoading } =
    api.employee.getById.useQuery(
      {
        id: employeeId,
        token,
      },
      {
        enabled: !isCreate,
      },
    );

  // Create mutation
  const createMutation = api.employee.create.useMutation({
    onSuccess: () => {
      toast.success("Employee created successfully");
      router.push(`/vendor/${vendorId}/${token}`);
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  // Update mutation
  const updateMutation = api.employee.update.useMutation({
    onSuccess: () => {
      toast.success("Employee updated successfully");
      router.push(`/vendor/${vendorId}/${token}`);
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

  // Populate form data when employee is loaded
  useEffect(() => {
    if (employee && !isCreate) {
      // Find profile photo and ID cards from attachments
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
        nationalId: employee.nationalId,
        profilePhotoUrl: profilePhoto?.attachment.url ?? "",
        allowedDates:
          employee.allowedDates?.map((ad) => {
            const dateStr = new Date(ad.date).toISOString().split("T")[0];
            return dateStr!;
          }) ?? [],
      });

      setIdCardUrl(idCards[0] ?? "");
    }
  }, [employee, isCreate]);

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
      // Upload the cropped image using UploadThing
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
    // !formData.profilePhotoUrl || !idCardUrl || formData.nationalId.length !== 10
    // Validate profile photo is uploaded
    if (!formData.profilePhotoUrl) {
      toast.error("Please upload a profile photo");
      return;
    }

    // Validate national ID card is uploaded
    if (!idCardUrl) {
      toast.error("Please upload your National ID card");
      return;
    }

    // Use vendor's gates and zones
    const gateIds = vendor?.gates?.map((vg) => vg.gateId) ?? [];
    const zoneIds = vendor?.zones?.map((vz) => vz.zoneId) ?? [];

    const data = {
      token,
      name: formData.name,
      job: formData.job,
      nationalId: formData.nationalId,
      gateIds: gateIds.length > 0 ? gateIds : undefined,
      zoneIds: zoneIds.length > 0 ? zoneIds : undefined,
      profilePhotoUrl: formData.profilePhotoUrl,
      idCardUrls: idCardUrl ? [idCardUrl] : undefined,
      allowedDates:
        formData.allowedDates.length > 0 ? formData.allowedDates : undefined,
    };

    if (isCreate) {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate({
        id: employeeId,
        ...data,
        gateIds: gateIds.length > 0 ? gateIds : null,
        zoneIds: zoneIds.length > 0 ? zoneIds : null,
        profilePhotoUrl: formData.profilePhotoUrl,
        idCardUrls: idCardUrl ? [idCardUrl] : null,
        allowedDates:
          formData.allowedDates.length > 0 ? formData.allowedDates : null,
      });
    }
  };

  const handleBack = () => {
    router.push(`/vendor/${vendorId}/${token}`);
  };

  if (vendorLoading || (!isCreate && employeeLoading)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="border-primary mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"></div>
          <p className="text-muted-foreground">Loading...</p>
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

  if (!isCreate && !employee) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">
              Employee Not Found
            </CardTitle>
            <CardDescription>
              The employee you are looking for does not exist or has been
              deleted.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleBack} className="w-full">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container mx-auto max-w-3xl p-4 md:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Portal
          </Button>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-3">
              <Building2 className="text-primary h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold md:text-3xl">
                {isCreate ? "Add New Employee" : "Edit Employee"}
              </h1>
              <p className="text-muted-foreground">{vendor.name}</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Employee Information</CardTitle>
            <CardDescription>
              {isCreate
                ? "Fill in the details to register a new employee"
                : "Update the employee information below"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Enter employee full name"
                  required
                />
              </div>

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
                  Start typing to see suggestions from previous entries, or
                  enter a new job title
                </p>
              </div>

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

              {/* Profile Photo Upload with Crop */}
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile Photo
                  <span className="text-destructive">*</span>
                </Label>
                <div className="flex items-start gap-4">
                  {formData.profilePhotoUrl ? (
                    <div className="relative w-32 flex-shrink-0">
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
                          document
                            .getElementById("profile-photo-input")
                            ?.click()
                        }
                        disabled={isUploadingCroppedImage}
                      >
                        {isUploadingCroppedImage ? (
                          "Uploading..."
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
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
                  Please upload a clear photo of your National ID card
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
                  <div className="flex items-center gap-2">
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
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant={"success"}
                  disabled={
                    createMutation.isPending ||
                    updateMutation.isPending ||
                    !formData.profilePhotoUrl ||
                    !idCardUrl
                  }
                  className="flex-1"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isCreate ? "Create Employee" : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

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
