"use client";

import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action="/logout" method="post">
      <Button type="submit" variant="outline" size="sm">
        <LogOut className="size-4" />
        Salir
      </Button>
    </form>
  );
}
