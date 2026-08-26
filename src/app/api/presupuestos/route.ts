import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  createPresupuestoRecord,
  getPresupuestos,
  getTalleres,
} from "@/lib/data";
import { fetchUnidadByInterno } from "@/lib/sqlserver";
import {
  normalizeCreatePresupuestoPayload,
  presupuestoFiltersSchema,
} from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const filters = presupuestoFiltersSchema.parse({
      estado: request.nextUrl.searchParams.get("estado") || undefined,
      tallerId: request.nextUrl.searchParams.get("tallerId") || undefined,
      dominio: request.nextUrl.searchParams.get("dominio") || undefined,
      interno: request.nextUrl.searchParams.get("interno") || undefined,
    });

    const presupuestos = await getPresupuestos(filters);

    return NextResponse.json({ presupuestos });
  } catch {
    return NextResponse.json(
      { message: "No pudimos listar los presupuestos." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = normalizeCreatePresupuestoPayload(await request.json());
    const [unidad, talleres] = await Promise.all([
      fetchUnidadByInterno(payload.interno),
      getTalleres(),
    ]);

    if (!unidad) {
      return NextResponse.json(
        {
          message:
            "El interno no existe en la base de lectura. Buscá una unidad válida antes de guardar.",
        },
        { status: 400 },
      );
    }

    const taller = talleres.find((item) => item.id === payload.tallerId);

    if (!taller) {
      return NextResponse.json(
        { message: "El taller seleccionado no existe en el catálogo." },
        { status: 400 },
      );
    }

    const presupuesto = await createPresupuestoRecord({
      interno: unidad.interno,
      dominio: unidad.dominio,
      marca: unidad.marca,
      modelo: unidad.modelo,
      km: payload.km,
      costo: payload.costo,
      costoConIva: payload.costoConIva,
      observaciones: payload.observaciones,
      estado: "Pendiente",
      tallerId: payload.tallerId,
      tallerNombre: taller.nombre,
      nroPresupuesto: payload.nroPresupuesto,
      prioridad: payload.prioridad,
      detalle: payload.detalle,
      fechaIngresoTaller: payload.fechaIngresoTaller,
      fechaEgresoTaller: payload.fechaEgresoTaller,
    });

    return NextResponse.json({ presupuesto }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message || "Datos inválidos." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { message: "No pudimos guardar el presupuesto en MongoDB." },
      { status: 500 },
    );
  }
}
