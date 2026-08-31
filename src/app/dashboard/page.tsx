import { DashboardShell } from "@/components/dashboard-shell";
import { getDashboardShellData } from "@/lib/app-shell-data";

export default async function DashboardPage() {
  const shellData = await getDashboardShellData("/dashboard");

  return <DashboardShell currentView="dashboard" {...shellData} />;
}
