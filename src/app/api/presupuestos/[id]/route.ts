import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { getRequestSession, unauthorizedResponse } from "@/lib/auth-session";
import { updatePresupuestoRecord } from "@/lib/data";
import { updatePresupuestoSchema } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getRequestSession(request.headers);

    if (!session) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const payload = updatePresupuestoSchema.parse(await request.json());

    const presupuesto = await updatePresupuestoRecord(id, payload);

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
        { message: error.issues[0]?.message || "Actualización inválida." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { message: "No pudimos actualizar el presupuesto." },
      { status: 500 },
    );
  }
}
