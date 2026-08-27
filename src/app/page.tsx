import { DashboardShell } from "@/components/dashboard-shell";
import { getServerSession } from "@/lib/auth-session";
import { ensureAuthAdmin } from "@/lib/bootstrap-auth";
import { getPresupuestos, getTalleres } from "@/lib/data";
import type { PresupuestoDTO, TallerDTO } from "@/lib/types";
import { redirect } from "next/navigation";

export default async function Home() {
  await ensureAuthAdmin();

  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

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
      currentUserEmail={session.user.email}
      currentUserName={session.user.name}
    />
  );
}
