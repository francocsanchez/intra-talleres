import { DashboardShell } from "@/components/dashboard-shell";
import { getDashboardShellData } from "@/lib/app-shell-data";
import type { PresupuestoFilters } from "@/lib/types";

type PresupuestosPageProps = {
  searchParams: Promise<{
    estado?: string;
    tallerId?: string;
    dominio?: string;
    interno?: string;
  }>;
};

function normalizeFilter(value?: string) {
  if (!value || value === "all") {
    return undefined;
  }

  return value;
}

export default async function PresupuestosPage({ searchParams }: PresupuestosPageProps) {
  const params = await searchParams;
  const filters: PresupuestoFilters = {
    estado: normalizeFilter(params.estado),
    tallerId: normalizeFilter(params.tallerId),
    dominio: params.dominio?.trim() || undefined,
    interno: params.interno?.trim() || undefined,
  };
  const shellData = await getDashboardShellData("/presupuestos", filters);

  return (
    <DashboardShell
      currentView="presupuestos"
      initialFilters={{
        estado: params.estado || "all",
        tallerId: params.tallerId || "all",
        dominio: params.dominio || "",
        interno: params.interno || "",
      }}
      {...shellData}
    />
  );
}
