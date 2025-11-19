/**
 * Generate allowed date options for employee access control
 * Date range: November 25, 2025 to December 17, 2025
 */
export function generateAllowedDateOptions() {
  const startDate = new Date("2025-11-25");
  const endDate = new Date("2025-12-17");
  const dates: Array<{ value: string; label: string }> = [];

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split("T")[0]!; // YYYY-MM-DD
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const dayName = d.toLocaleDateString("en-US", { weekday: "long" });

    dates.push({
      value: dateStr,
      label: `${day}/${month} ${dayName}`,
    });
  }

  return dates;
}
