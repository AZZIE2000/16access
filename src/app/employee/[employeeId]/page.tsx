import { api } from "@/trpc/server";
import { notFound } from "next/navigation";
import { EmployeeAccessCard } from "@/components/employee-access-card";

export default async function PublicEmployeeBadgePage({
  params,
}: {
  params: Promise<{ employeeId: string }>;
}) {
  try {
    // Await params in Next.js 15+
    const { employeeId } = await params;

    // Fetch employee data without authentication
    const employee = await api.employee.getByIdPublic({
      id: employeeId,
    });

    // Fetch all gates to determine if employee has access to all gates
    const gates = await api.gate.getAllPublic();

    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md">
          <EmployeeAccessCard
            employee={employee}
            totalGatesCount={gates.length}
            hideActions={true}
          />
        </div>
      </div>
    );
  } catch (error) {
    notFound();
  }
}
