import { DashboardShell } from "@/components/dashboard-shell";
import { getPresupuestos, getTalleres } from "@/lib/data";
import type { PresupuestoDTO, TallerDTO } from "@/lib/types";

export default async function Home() {
  let initialPresupuestos: PresupuestoDTO[] = [];
  let initialTalleres: TallerDTO[] = [];
  let initialError: string | null = null;

  try {
    [initialPresupuestos, initialTalleres] = await Promise.all([
      getPresupuestos(),
      getTalleres(),
    ]);
  } catch (error) {
    initialError =
      error instanceof Error
        ? `La app cargó con conectividad incompleta: ${error.message}`
        : "La app cargó con conectividad incompleta.";
  }

  return (
    <DashboardShell
      initialPresupuestos={initialPresupuestos}
      initialTalleres={initialTalleres}
      initialError={initialError}
    />
  );
}
