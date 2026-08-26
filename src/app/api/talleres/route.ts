import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import { createTallerRecord, getTalleres } from "@/lib/data";
import { createTallerSchema } from "@/lib/validation";

export async function GET() {
  try {
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
