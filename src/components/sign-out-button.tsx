"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

type SignOutButtonProps = {
  action: string;
};

export function SignOutButton({ action }: SignOutButtonProps) {
  return (
    <form action={action} method="post">
      <Button type="submit" variant="outline" size="sm">
        <LogOut className="size-4" />
        Salir
      </Button>
    </form>
  );
}
