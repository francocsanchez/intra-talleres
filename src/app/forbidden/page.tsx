import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { buttonVariants } from "@/components/ui/button";
import { getServerAuthResult } from "@/lib/auth-session";

export default async function ForbiddenPage() {
  const authResult = await getServerAuthResult();

  if (authResult.status === "unauthorized") {
    redirect("/sign-in");
  }

  if (authResult.status === "authenticated") {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-[1720px] items-center justify-center px-3 py-4 md:px-4 lg:px-5">
        <section className="w-full max-w-xl rounded-2xl border border-border/70 bg-background p-5 shadow-none">
          <div className="flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.28em] text-muted-foreground">
            <ShieldAlert className="size-4" />
            Acceso denegado
          </div>
          <h1 className="mt-3 font-heading text-3xl tracking-[-0.05em]">
            Tu sesión central no tiene permisos para ingresar a Intra Talleres
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Auth Central respondió que el usuario está inactivo o no tiene acceso
            a esta aplicación. Pedí la habilitación del `appKey` configurado o
            cerrá sesión para entrar con otra cuenta.
          </p>
          <div className="mt-5 flex gap-2">
            <Link href="/logout" className={buttonVariants({ variant: "default" })}>
              Cerrar sesión central
            </Link>
            <Link href="/" className={buttonVariants({ variant: "outline" })}>
              Reintentar acceso
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
