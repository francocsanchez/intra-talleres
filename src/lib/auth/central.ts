import { redirect } from "next/navigation";

import type { CentralSession } from "@/lib/types";

const CENTRAL_AUTH_URL =
  process.env.CENTRAL_AUTH_URL || "http://localhost:3100";
const CENTRAL_AUTH_PUBLIC_URL =
  process.env.CENTRAL_AUTH_PUBLIC_URL || CENTRAL_AUTH_URL;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3012";
const APP_KEY = process.env.CENTRAL_APP_KEY || "intra-talleres";

export type CentralAuthResult =
  | {
      status: "authenticated";
      session: CentralSession;
    }
  | {
      status: "unauthorized" | "forbidden";
      session: null;
    };

export function hasAppAccess(
  session: CentralSession,
  appKey = APP_KEY,
): boolean {
  return session.access.some((item) => item.appKey === appKey);
}

export function getAppRole(
  session: CentralSession,
  appKey = APP_KEY,
): CentralSession["access"][number]["role"] | null {
  return session.access.find((item) => item.appKey === appKey)?.role ?? null;
}

function buildAppUrl(pathname = "/") {
  try {
    return new URL(pathname, APP_URL).toString();
  } catch {
    return APP_URL;
  }
}

export function buildCentralLoginUrl(pathname = "/") {
  const url = new URL("/login", CENTRAL_AUTH_PUBLIC_URL);
  url.searchParams.set("appKey", APP_KEY);
  url.searchParams.set("returnTo", buildAppUrl(pathname));
  return url.toString();
}

export function buildCentralLogoutUrl(pathname = "/") {
  const url = new URL("/logout", CENTRAL_AUTH_PUBLIC_URL);
  url.searchParams.set("returnTo", buildAppUrl(pathname));
  return url.toString();
}

export function redirectToCentralLogin(pathname = "/"): never {
  redirect(buildCentralLoginUrl(pathname));
}

export function redirectToCentralLogout(pathname = "/"): never {
  redirect(buildCentralLogoutUrl(pathname));
}

export async function getCentralSession(
  sourceHeaders?: Headers,
): Promise<CentralAuthResult> {
  const cookieHeader = sourceHeaders?.get("cookie") ?? "";
  const url = new URL("/api/internal/session", CENTRAL_AUTH_URL);
  url.searchParams.set("appKey", APP_KEY);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      cookie: cookieHeader,
      accept: "application/json",
    },
    cache: "no-store",
  });

  if (response.status === 401) {
    return {
      status: "unauthorized",
      session: null,
    };
  }

  if (response.status === 403) {
    return {
      status: "forbidden",
      session: null,
    };
  }

  if (!response.ok) {
    throw new Error(
      `Auth Central respondió ${response.status} al consultar la sesión.`,
    );
  }

  const session = (await response.json()) as CentralSession;

  if (!session.user.isActive || !hasAppAccess(session)) {
    return {
      status: "forbidden",
      session: null,
    };
  }

  return {
    status: "authenticated",
    session,
  };
}

export async function requireCentralSession(
  pathname = "/",
  sourceHeaders?: Headers,
): Promise<CentralSession> {
  const result = await getCentralSession(sourceHeaders);

  if (result.status === "authenticated") {
    return result.session;
  }

  if (result.status === "unauthorized") {
    redirectToCentralLogin(pathname);
  }

  redirect("/forbidden");
}
