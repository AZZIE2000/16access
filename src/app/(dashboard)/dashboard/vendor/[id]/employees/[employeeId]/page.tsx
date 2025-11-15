import { api } from "@/trpc/server";
import { AdminEmployeeForm } from "@/components/admin-employee-form";

export default async function AdminEmployeeFormPage({
  params,
}: {
  params: Promise<{ id: string; employeeId: string }>;
}) {
  const { id: vendorId, employeeId } = await params;

  const isCreate = employeeId === "create";

  // Fetch vendor
  const vendor = await api.vendor.getById({ id: vendorId });

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

  // Fetch employee if editing
  let employee = null;
  if (!isCreate) {
    employee = await api.employee.getByIdAdmin({ id: employeeId });
  }

  // Fetch zones and gates
  const [zones, gates] = await Promise.all([
    api.zone.getAll(),
    api.gate.getAll(),
  ]);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">
          {isCreate ? "Add New Employee" : "Edit Employee"}
        </h1>
        <p className="text-muted-foreground">
          {isCreate ? "Add a new employee to" : "Update employee for"}{" "}
          {vendor.name}
        </p>
      </div>

      <AdminEmployeeForm
        vendor={vendor}
        employee={employee}
        zones={zones}
        gates={gates}
        isCreate={isCreate}
      />
    </div>
  );
}
