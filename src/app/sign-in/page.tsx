import { redirect } from "next/navigation";

import { SignInForm } from "@/components/sign-in-form";
import { ensureAuthAdmin } from "@/lib/bootstrap-auth";
import { getServerSession } from "@/lib/auth-session";

const adminEmail =
  process.env.AUTH_ADMIN_EMAIL || "admin@nipponcarsrl.com.ar";

export default async function SignInPage() {
  await ensureAuthAdmin();

  const session = await getServerSession();

  if (session) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen w-full max-w-[1720px] items-center justify-center px-3 py-4 md:px-4 lg:px-5">
        <div className="grid w-full max-w-5xl gap-4 lg:grid-cols-[minmax(0,1.1fr)_420px]">
          <section className="rounded-2xl border border-border/70 bg-secondary/20 p-5 shadow-none">
            <p className="text-[0.68rem] uppercase tracking-[0.28em] text-muted-foreground">
              Acceso restringido
            </p>
            <h1 className="mt-3 font-heading text-4xl tracking-[-0.06em]">
              Presupuestos, talleres y métricas bajo una misma sesión
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
              Esta instancia opera con autenticación local sobre MongoDB y mantiene
              protegido el acceso al dashboard, la carga de presupuestos y la
              configuración operativa.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <InfoTile
                label="Esquema"
                value="Better Auth"
                detail="Email y contraseña"
              />
              <InfoTile
                label="Base de auth"
                value="Mongo local"
                detail="Misma base intra_talleres"
              />
              <InfoTile
                label="Usuario inicial"
                value={adminEmail}
                detail="Sembrado automáticamente"
              />
            </div>
          </section>

          <div className="flex justify-center lg:justify-end">
            <SignInForm defaultEmail={adminEmail} />
          </div>
        </div>
      </div>
    </main>
  );
}

function InfoTile({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-background px-3 py-3">
      <p className="text-[0.68rem] uppercase tracking-[0.28em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-base font-medium">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
