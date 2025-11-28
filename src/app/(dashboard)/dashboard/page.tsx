import { DashboardStats } from "@/components/dashboard-stats";
import { RecentActivitiesTable } from "@/components/recent-activities-table";
import { SignOutAllButton } from "@/components/sign-out-all-button";

export default function Page() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* job leave site */}
          {/* <div className="flex items-center justify-between px-4 lg:px-6">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <SignOutAllButton />
          </div> */}
          <DashboardStats />
          <div className="px-4 lg:px-6">
            <RecentActivitiesTable />
          </div>
        </div>
      </div>
    </div>
  );
}
