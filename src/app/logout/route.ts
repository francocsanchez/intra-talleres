import { NextRequest, NextResponse } from "next/server";

import { buildCentralLogoutUrl } from "@/lib/auth/central";

export async function GET(request: NextRequest) {
  const returnTo = request.nextUrl.searchParams.get("returnTo") || "/";
  return NextResponse.redirect(buildCentralLogoutUrl(returnTo));
}
