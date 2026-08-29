import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { authErrorResponse, getRequestAuthResult } from "@/lib/auth-session";
import { getAppRole, isAdminRole } from "@/lib/auth/central";
import { createTallerRecord, getTalleres } from "@/lib/data";
import { createTallerSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  try {
    const authResult = await getRequestAuthResult(request.headers);

    if (authResult.status !== "authenticated") {
      return authErrorResponse(
        authResult.status === "forbidden" ? 403 : 401,
      );
    }

    const talleres = await getTalleres();
    return NextResponse.json({ talleres });
  } catch {
    return NextResponse.json(
      { message: "No pudimos listar los talleres." },
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

    if (!isAdminRole(getAppRole(authResult.session))) {
      return NextResponse.json(
        { message: "Solo los usuarios admin pueden gestionar talleres." },
        { status: 403 },
      );
    }

    const payload = createTallerSchema.parse(await request.json());
    const taller = await createTallerRecord(payload);
    return NextResponse.json({ taller }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { message: error.issues[0]?.message || "Datos inválidos." },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "No pudimos crear el taller.",
      },
      { status: 400 },
    );
  }
}
