import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { getRequestSession, unauthorizedResponse } from "@/lib/auth-session";
import { fetchUnidadByInterno } from "@/lib/sqlserver";
import { lookupUnidadSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const session = await getRequestSession(request.headers);

    if (!session) {
      return unauthorizedResponse();
    }

    const { interno } = lookupUnidadSchema.parse({
      interno: request.nextUrl.searchParams.get("interno") || "",
    });

    const unidad = await fetchUnidadByInterno(interno);

    if (!unidad) {
      return NextResponse.json(
        { message: "No encontramos una unidad para ese interno." },
        { status: 404 },
      );
    }

    return NextResponse.json({ unidad });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message || "Parámetros inválidos." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { message: "No pudimos consultar SQL Server. Revisá la conexión de lectura." },
      { status: 500 },
    );
  }
}
