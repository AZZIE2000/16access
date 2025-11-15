import { api } from "@/trpc/server";
import { VendorForm } from "@/components/vendor-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users } from "lucide-react";

export default async function VendorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Check if this is a create page
  const isCreate = id === "create";

  // Fetch zones and gates (always needed)
  const [zones, gates] = await Promise.all([
    api.zone.getAll(),
    api.gate.getAll(),
  ]);

  // Fetch vendor data if editing
  const vendor = await api.vendor.getById({ id });

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            {isCreate ? "Create Vendor" : "Edit Vendor"}
          </h1>
          <p className="text-muted-foreground">
            {isCreate
              ? "Add a new vendor to your event"
              : "Update vendor information"}
          </p>
        </div>
        {!isCreate && vendor && (
          <Link href={`/dashboard/vendor/${id}/employees`}>
            <Button variant="outline">
              <Users className="mr-2 h-4 w-4" />
              Manage Employees
            </Button>
          </Link>
        )}
      </div>

      <VendorForm
        vendor={vendor}
        zones={zones}
        gates={gates}
        isCreate={isCreate}
      />
    </div>
  );
}
