import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard-shell";
import { getDashboardShellData } from "@/lib/app-shell-data";

export default async function ConfiguracionPage() {
  const shellData = await getDashboardShellData("/configuracion");

  if (shellData.currentUserRole !== "admin") {
    redirect("/forbidden");
  }

  return <DashboardShell currentView="configuracion" {...shellData} />;
}
