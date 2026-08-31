import { buildCentralLogoutUrl, getAppRole } from "@/lib/auth/central";
import { requireServerSession } from "@/lib/auth-session";
import { getPresupuestos, getTalleres } from "@/lib/data";
import type { PresupuestoDTO, PresupuestoFilters, TallerDTO } from "@/lib/types";

export async function getDashboardShellData(
  pathname: string,
  presupuestoFilters?: PresupuestoFilters,
) {
  const session = await requireServerSession(pathname);

  let initialPresupuestos: PresupuestoDTO[] = [];
  let initialTalleres: TallerDTO[] = [];
  let initialError: string | null = null;

  try {
    [initialPresupuestos, initialTalleres] = await Promise.all([
      getPresupuestos(presupuestoFilters),
      getTalleres(),
    ]);
  } catch (error) {
    initialError =
      error instanceof Error
        ? `La app cargó con conectividad incompleta: ${error.message}`
        : "La app cargó con conectividad incompleta.";
  }

  return {
    initialPresupuestos,
    initialTalleres,
    initialError,
    currentUserEmail: session.user.email,
    currentUserName: session.user.name,
    currentUserRole: getAppRole(session) ?? undefined,
    logoutUrl: buildCentralLogoutUrl("/sign-in"),
  };
}
