import { headers as nextHeaders } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";

export async function getServerSession() {
  return auth.api.getSession({
    headers: await nextHeaders(),
  });
}

export async function getRequestSession(headers: Headers) {
  return auth.api.getSession({ headers });
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { message: "Tu sesión venció o no inició. Volvé a ingresar." },
    { status: 401 },
  );
}
