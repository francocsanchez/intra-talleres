import { NextRequest, NextResponse } from "next/server";

import { buildCentralLogoutUrl } from "@/lib/auth/central";

export async function GET(request: NextRequest) {
  const returnTo = request.nextUrl.searchParams.get("returnTo") || "/";
  const logoutUrl = buildCentralLogoutUrl(returnTo);

  return new NextResponse(
    `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Cerrando sesion</title>
  </head>
  <body>
    <form id="central-logout-form" method="post" action="${logoutUrl}">
      <noscript>
        <button type="submit">Continuar con cierre de sesion</button>
      </noscript>
    </form>
    <script>
      document.getElementById("central-logout-form")?.submit();
    </script>
  </body>
</html>`,
    {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "no-store",
      },
    },
  );
}

export async function POST(request: NextRequest) {
  const returnTo = request.nextUrl.searchParams.get("returnTo") || "/";
  return NextResponse.redirect(buildCentralLogoutUrl(returnTo), 307);
}
