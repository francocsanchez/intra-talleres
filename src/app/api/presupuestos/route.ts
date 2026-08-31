import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { authErrorResponse, getRequestAuthResult } from "@/lib/auth-session";
import { canManagePresupuestos, getAppRole } from "@/lib/auth/central";
import {
  createPresupuestoRecord,
  getPresupuestos,
  getTalleres,
} from "@/lib/data";
import {
  fetchUnidadByInterno,
  fetchUnidadModeloByMarcaAndCodigo,
} from "@/lib/sqlserver";
import {
  normalizeCreatePresupuestoPayload,
  presupuestoFiltersSchema,
} from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const authResult = await getRequestAuthResult(request.headers);

    if (authResult.status !== "authenticated") {
      return authErrorResponse(
        authResult.status === "forbidden" ? 403 : 401,
      );
    }

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
    const authResult = await getRequestAuthResult(request.headers);

    if (authResult.status !== "authenticated") {
      return authErrorResponse(
        authResult.status === "forbidden" ? 403 : 401,
      );
    }

    if (!canManagePresupuestos(getAppRole(authResult.session))) {
      return NextResponse.json(
        {
          message:
            "El rol viewer solo puede consultar presupuestos y ver observaciones.",
        },
        { status: 403 },
      );
    }

    const payload = normalizeCreatePresupuestoPayload(await request.json());
    const talleres = await getTalleres();

    const taller = talleres.find((item) => item.id === payload.tallerId);

    if (!taller) {
      return NextResponse.json(
        { message: "El taller seleccionado no existe en el catálogo." },
        { status: 400 },
      );
    }

    if (payload.origen === "interno") {
      const unidad = await fetchUnidadByInterno(payload.interno);

      if (!unidad) {
        return NextResponse.json(
          {
            message:
              "El interno no existe en la base de lectura. Buscá una unidad válida antes de guardar.",
          },
          { status: 400 },
        );
      }

      const presupuesto = await createPresupuestoRecord({
        interno: unidad.interno,
        esExterno: false,
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
        fechaPedido: payload.fechaPedido,
        fechaIngresoTaller: payload.fechaIngresoTaller,
        fechaEgresoTaller: payload.fechaEgresoTaller,
      });

      return NextResponse.json({ presupuesto }, { status: 201 });
    }

    const modelo = await fetchUnidadModeloByMarcaAndCodigo(
      payload.marcaCodigo,
      payload.modeloCodigo,
    );

    if (!modelo) {
      return NextResponse.json(
        {
          message:
            "No pudimos validar la marca y el modelo seleccionados para la unidad externa.",
        },
        { status: 400 },
      );
    }

    const presupuesto = await createPresupuestoRecord({
      interno: "",
      esExterno: true,
      dominio: payload.dominio,
      marca: modelo.marca,
      modelo: modelo.modelo,
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
      fechaPedido: payload.fechaPedido,
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
