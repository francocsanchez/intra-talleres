import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { authErrorResponse, getRequestAuthResult } from "@/lib/auth-session";
import {
  fetchUnidadMarcas,
  fetchUnidadModelosByMarca,
} from "@/lib/sqlserver";
import { lookupCatalogoModelosSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const authResult = await getRequestAuthResult(request.headers);

    if (authResult.status !== "authenticated") {
      return authErrorResponse(
        authResult.status === "forbidden" ? 403 : 401,
      );
    }

    const marcaCodigo = request.nextUrl.searchParams.get("marcaCodigo");

    if (!marcaCodigo) {
      const marcas = await fetchUnidadMarcas();
      return NextResponse.json({ marcas });
    }

    const parsed = lookupCatalogoModelosSchema.parse({ marcaCodigo });
    const modelos = await fetchUnidadModelosByMarca(parsed.marcaCodigo);
    return NextResponse.json({ modelos });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message || "Parámetros inválidos." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { message: "No pudimos consultar el catálogo de marcas y modelos." },
      { status: 500 },
    );
  }
}
