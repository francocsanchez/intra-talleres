import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { authErrorResponse, getRequestAuthResult } from "@/lib/auth-session";
import { deleteTallerRecord, updateTallerRecord } from "@/lib/data";
import { updateTallerSchema } from "@/lib/validation";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await getRequestAuthResult(request.headers);

    if (authResult.status !== "authenticated") {
      return authErrorResponse(
        authResult.status === "forbidden" ? 403 : 401,
      );
    }

    const { id } = await params;
    const payload = updateTallerSchema.parse(await request.json());
    const taller = await updateTallerRecord(id, payload);

    if (!taller) {
      return NextResponse.json(
        { message: "No encontramos el taller." },
        { status: 404 },
      );
    }

    return NextResponse.json({ taller });
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
          error instanceof Error
            ? error.message
            : "No pudimos actualizar el taller.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await getRequestAuthResult(_request.headers);

    if (authResult.status !== "authenticated") {
      return authErrorResponse(
        authResult.status === "forbidden" ? 403 : 401,
      );
    }

    const { id } = await params;
    const deleted = await deleteTallerRecord(id);

    if (!deleted) {
      return NextResponse.json(
        { message: "No encontramos el taller." },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "No pudimos eliminar el taller.",
      },
      { status: 400 },
    );
  }
}
