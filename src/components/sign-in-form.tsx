"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LoaderCircle, LockKeyhole } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type SignInFormProps = {
  defaultEmail: string;
};

export function SignInForm({ defaultEmail }: SignInFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      try {
        setError(null);

        const response = await fetch("/api/auth/sign-in/email", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
            rememberMe: true,
          }),
        });

        const body = (await response.json().catch(() => ({}))) as {
          message?: string;
        };

        if (!response.ok) {
          throw new Error(body.message || "No pudimos iniciar sesión.");
        }

        router.replace("/");
        router.refresh();
      } catch (submitError) {
        setError(
          submitError instanceof Error
            ? submitError.message
            : "No pudimos iniciar sesión.",
        );
      }
    });
  }

  return (
    <Card className="w-full max-w-md border-border/70 shadow-none">
      <CardHeader className="space-y-3 border-b border-border/70 pb-4">
        <div className="flex items-center gap-2 text-[0.68rem] uppercase tracking-[0.28em] text-muted-foreground">
          <LockKeyhole className="size-4" />
          Acceso operativo
        </div>
        <CardTitle className="font-heading text-3xl tracking-[-0.05em]">
          Ingreso a Intra Talleres
        </CardTitle>
        <CardDescription>
          Accedé con el usuario administrador configurado para esta instancia.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Clave</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error ? (
            <div className="rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? <LoaderCircle className="size-4 animate-spin" /> : null}
            Ingresar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
