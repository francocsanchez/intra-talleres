import { headers as nextHeaders } from "next/headers";
import { NextResponse } from "next/server";

import {
  getAppRole,
  getCentralSession,
  requireCentralSession,
} from "@/lib/auth/central";

export async function getServerSession() {
  const result = await getCentralSession(await nextHeaders());
  return result.status === "authenticated" ? result.session : null;
}

export async function getRequestSession(headers: Headers) {
  const result = await getCentralSession(headers);
  return result.status === "authenticated" ? result.session : null;
}

export async function getServerAuthResult() {
  return getCentralSession(await nextHeaders());
}

export async function getRequestAuthResult(headers: Headers) {
  return getCentralSession(headers);
}

export async function requireServerSession(pathname = "/") {
  return requireCentralSession(pathname, await nextHeaders());
}

export async function getServerAppRole() {
  const session = await requireServerSession("/");
  return getAppRole(session);
}

export function authErrorResponse(status: 401 | 403) {
  const message =
    status === 403
      ? "Tu usuario no tiene acceso a esta aplicación."
      : "Tu sesión venció o no inició. Volvé a ingresar.";

  return NextResponse.json({ message }, { status });
}
