import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { updatePresupuestoEstado } from "@/lib/data";
import { updatePresupuestoEstadoSchema } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const { estado } = updatePresupuestoEstadoSchema.parse(await request.json());

    const presupuesto = await updatePresupuestoEstado(id, estado);

    if (!presupuesto) {
      return NextResponse.json(
        { message: "No encontramos el presupuesto que querés actualizar." },
        { status: 404 },
      );
    }

    return NextResponse.json({ presupuesto });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message || "Estado inválido." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { message: "No pudimos actualizar el estado." },
      { status: 500 },
    );
  }
}
