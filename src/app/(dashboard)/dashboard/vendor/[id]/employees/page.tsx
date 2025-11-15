import { api } from "@/trpc/server";
import { EmployeeManagement } from "@/components/employee-management";

export default async function VendorEmployeesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch vendor with employees
  const vendor = await api.vendor.getById({ id });

  if (!vendor) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Vendor not found</h1>
          <p className="text-muted-foreground">
            The vendor you are looking for does not exist.
          </p>
        </div>
      </div>
    );
  }

  // Fetch zones and gates for the form
  const [zones, gates] = await Promise.all([
    api.zone.getAll(),
    api.gate.getAll(),
  ]);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Manage Employees</h1>
        <p className="text-muted-foreground">
          Manage employees for {vendor.name}
        </p>
      </div>

      <EmployeeManagement vendor={vendor} zones={zones} gates={gates} />
    </div>
  );
}

