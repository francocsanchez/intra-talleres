import { NextRequest, NextResponse } from "next/server";

import { authErrorResponse, getRequestAuthResult } from "@/lib/auth-session";
import { getPresupuestos } from "@/lib/data";
import { fetchStockSummaryByInternos } from "@/lib/sqlserver";
import type { PresupuestoDTO, StockStage } from "@/lib/types";

function getStockStage(presupuesto: PresupuestoDTO): StockStage | null {
  if (presupuesto.estado === "Aprobado") {
    if (presupuesto.fechaIngresoTaller && presupuesto.fechaEgresoTaller) {
      return "reparado";
    }

    return presupuesto.fechaIngresoTaller ? "enReparacion" : "esperandoIngreso";
  }

  return presupuesto.estado === "Pendiente" ? "analisis" : null;
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await getRequestAuthResult(request.headers);

    if (authResult.status !== "authenticated") {
      return authErrorResponse(authResult.status === "forbidden" ? 403 : 401);
    }

    const yearParam = Number(request.nextUrl.searchParams.get("year"));
    const year = Number.isInteger(yearParam) && yearParam >= 2000 && yearParam <= 2100
      ? yearParam
      : undefined;
    const presupuestos = await getPresupuestos();
    const latestByInterno = new Map<string, PresupuestoDTO>();

    for (const presupuesto of presupuestos) {
      if (presupuesto.esExterno || !presupuesto.interno.trim()) continue;

      const previous = latestByInterno.get(presupuesto.interno);
      const currentDate = new Date(presupuesto.fechaPedido || presupuesto.updatedAt).getTime();
      const previousDate = previous
        ? new Date(previous.fechaPedido || previous.updatedAt).getTime()
        : Number.NEGATIVE_INFINITY;

      if (!previous || currentDate >= previousDate) {
        latestByInterno.set(presupuesto.interno, presupuesto);
      }
    }

    const stagesByInterno = Object.fromEntries(
      Array.from(latestByInterno.entries()).flatMap(([interno, presupuesto]) => {
        const stage = getStockStage(presupuesto);
        return stage ? [[interno, stage]] : [];
      }),
    ) as Record<string, StockStage>;
    const summary = await fetchStockSummaryByInternos(
      Object.keys(stagesByInterno),
      stagesByInterno,
      year,
    );

    return NextResponse.json({ summary });
  } catch {
    return NextResponse.json(
      { message: "No pudimos calcular el resumen de stock desde SIAC." },
      { status: 500 },
    );
  }
}
