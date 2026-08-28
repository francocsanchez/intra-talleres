"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { LoaderCircle, LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSignOut() {
    startTransition(() => {
      router.push("/logout");
    });
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleSignOut}>
      {isPending ? (
        <LoaderCircle className="size-4 animate-spin" />
      ) : (
        <LogOut className="size-4" />
      )}
      Salir
    </Button>
  );
}
